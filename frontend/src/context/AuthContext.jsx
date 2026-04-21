import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docentePendientes, setDocentePendientes] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      try { setUser(JSON.parse(savedUser)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const loadPendingNotifications = async (targetUser = null) => {
    const currentUser = targetUser || user;
    if (!currentUser || currentUser.rol !== 'docente') {
      setDocentePendientes([]);
      return [];
    }

    setNotificationsLoading(true);
    try {
      const { data } = await api.get('/docente/notificaciones/pendientes');
      setDocentePendientes(data);
      return data;
    } finally {
      setNotificationsLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    await loadPendingNotifications(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setDocentePendientes([]);
  };

  const reviewPendingNotifications = async () => {
    if (!docentePendientes.length) return;
    await api.post('/docente/notificaciones/revisar', {
      notification_ids: docentePendientes.map((item) => item.id)
    });
    setDocentePendientes([]);
  };

  useEffect(() => {
    if (user?.rol === 'docente') {
      loadPendingNotifications();
    } else {
      setDocentePendientes([]);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      docentePendientes,
      notificationsLoading,
      loadPendingNotifications,
      reviewPendingNotifications
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
