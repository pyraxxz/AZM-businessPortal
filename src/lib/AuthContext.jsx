import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, business } from './api';
import { connectSocket, joinUserRoom, disconnectSocket } from './socket';

/** Open the live socket and join the user's room. Safe to call repeatedly. */
function wireSocket(token, userId) {
  if (!token) return;
  const sock = connectSocket(token);
  if (userId != null) {
    if (sock.connected) joinUserRoom(userId);
    else sock.once('connect', () => joinUserRoom(userId));
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null);
  const [bizProfile, setBizProfile] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [authed, setAuthed]         = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await business.me();
      setBizProfile(data.business || null);
    } catch {
      // 404 = no business profile yet — not an auth error
      setBizProfile(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('biz_token');
    const cached = localStorage.getItem('biz_user');

    if (!token) {
      setLoading(false);
      return;
    }

    // Optimistically restore from cache
    if (cached) {
      try {
        const u = JSON.parse(cached);
        setUser(u); setAuthed(true);
        wireSocket(token, u?.id);
      } catch { /* ignore */ }
    }

    // Verify token by hitting a real protected endpoint
    loadProfile()
      .then(() => {
        if (cached) {
          try {
            const u = JSON.parse(cached);
            setUser(u);
            wireSocket(token, u?.id);
          } catch { /* ignore */ }
        }
        setAuthed(true);
      })
      .catch(() => {
        if (!cached) setAuthed(false);
      })
      .finally(() => setLoading(false));
  }, [loadProfile]);

  const login = useCallback(async (email, password) => {
    const data = await auth.login(email, password);

    const token = data.token || data.accessToken;
    if (!token) {
      throw new Error('Login failed — server did not return a session token.');
    }

    localStorage.setItem('biz_token', token);

    const me = data.user || {};
    localStorage.setItem('biz_user', JSON.stringify(me));
    setUser(me);
    setAuthed(true);

    // Go live: open the socket and join the owner's room.
    wireSocket(token, me?.id);

    await loadProfile();
    return me;
  }, [loadProfile]);

  const logout = useCallback(() => {
    disconnectSocket();
    localStorage.removeItem('biz_token');
    localStorage.removeItem('biz_user');
    setUser(null);
    setBizProfile(null);
    setAuthed(false);
  }, []);

  const refreshProfile = useCallback(() => loadProfile(), [loadProfile]);

  return (
    <AuthContext.Provider value={{ user, bizProfile, loading, authed, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
