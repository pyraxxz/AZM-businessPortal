import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, business, request } from './api';
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

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminBusinesses, setAdminBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);

  const selectBusiness = useCallback(async (bizId) => {
      if (!bizId) {
          setSelectedBusinessId(null);
          setBizProfile(null);
          return;
      }
      try {
          const data = await request(`/api/admin/marketplace-businesses/${bizId}`);
          setBizProfile(data.business);
          setSelectedBusinessId(bizId);
      } catch (e) {
          console.error('Failed to load business:', e);
      }
  }, []);

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
        if (u.role?.toUpperCase() === 'ADMIN') {
            setIsAdmin(true);
            request('/api/admin/marketplace-businesses').then(data => {
                setAdminBusinesses(data.businesses || []);
                const savedBizId = localStorage.getItem('admin_selected_biz');
                if (savedBizId) selectBusiness(savedBizId);
            }).catch(() => {});
        }
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

    if (me.role?.toUpperCase() === 'ADMIN') {
        setIsAdmin(true);
        try {
            const adminData = await request('/api/admin/marketplace-businesses');
            setAdminBusinesses(adminData.businesses || []);
            if (adminData.businesses?.length > 0) {
                const firstBiz = adminData.businesses[0];
                localStorage.setItem('admin_selected_biz', firstBiz.id);
                selectBusiness(firstBiz.id);
            }
        } catch (e) {
            console.error('Failed to load admin businesses:', e);
        }
    } else {
        await loadProfile();
    }
    return me;
  }, [loadProfile]);

  const logout = useCallback(() => {
    disconnectSocket();
    localStorage.removeItem('biz_token');
    localStorage.removeItem('biz_user');
    setUser(null);
    setBizProfile(null);
    setAuthed(false);
    setIsAdmin(false);
    setAdminBusinesses([]);
    setSelectedBusinessId(null);
  }, []);

  const refreshProfile = useCallback(() => loadProfile(), [loadProfile]);

  return (
    <AuthContext.Provider value={{
        user, bizProfile, loading, authed, login, logout, refreshProfile,
        isAdmin, adminBusinesses, selectedBusinessId, selectBusiness
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
