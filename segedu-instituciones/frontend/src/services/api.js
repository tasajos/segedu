import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      const method = String(config.method || 'get').toLowerCase();
      const protectedPrefixes = ['/jefe/', '/docente/', '/estudiante/'];
      if (user.rol === 'auditor' && protectedPrefixes.some((prefix) => String(config.url || '').startsWith(prefix)) && !['get', 'head'].includes(method)) {
        return Promise.reject(new Error('El auditor tiene acceso de solo lectura'));
      }
    } catch { /* ignore invalid local session data */ }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
