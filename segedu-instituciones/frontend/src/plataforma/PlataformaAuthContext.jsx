import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from './api';
import { mensajeError } from './utils';

const PlataformaAuthContext = createContext(null);

export function PlataformaAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const logout = useCallback(() => {
    localStorage.removeItem('plataforma_token');
    setUser(null);
    setError('');
  }, []);

  useEffect(() => {
    window.addEventListener('plataforma:sesion-expirada', logout);
    return () => window.removeEventListener('plataforma:sesion-expirada', logout);
  }, [logout]);

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    if (!localStorage.getItem('plataforma_token')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get('/auth/perfil', { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setUser(data);
    }).catch(err => {
      if (!controller.signal.aborted && err.response?.status !== 401) setError(mensajeError(err));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [intento]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('plataforma_token', data.token);
    setUser(data.superadmin);
    setError('');
  };

  return <PlataformaAuthContext.Provider value={{ user, loading, error, login, logout, reintentar: () => setIntento(i => i + 1) }}>{children}</PlataformaAuthContext.Provider>;
}

export const usePlataformaAuth = () => useContext(PlataformaAuthContext);
