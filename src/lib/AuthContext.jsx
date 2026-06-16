import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, business } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [bizProfile, setBizProfile] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [authed, setAuthed]       = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const { business: biz } = await business.me();
      setBizProfile(biz || null);
    } catch {
      setBizProfile(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('biz_token');
    if (!token) { setLoading(false); return; }

    auth.me()
      .then(async (data) => {
        setUser(data.user || data);
        setAuthed(true);
        await loadProfile();
      })
      .catch(() => {
        localStorage.removeItem('biz_token');
        localStorage.removeItem('biz_user');
        setAuthed(false);
      })
      .finally(() => setLoading(false));
  }, [loadProfile]);

  const login = useCallback(async (email, password) => {
    const data = await auth.login(email, password);
    const token = data.token || data.accessToken;
    if (!token) throw new Error('No token returned from server');
    localStorage.setItem('biz_token', token);
    const me = data.user || data;
    setUser(me);
    setAuthed(true);
    await loadProfile();
    return me;
  }, [loadProfile]);

  const logout = useCallback(() => {
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
