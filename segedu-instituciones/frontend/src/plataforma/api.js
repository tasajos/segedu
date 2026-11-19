import axios from 'axios';

// Sesión independiente: nunca reutilizar el token de una institución.
const api = axios.create({
  baseURL: '/api/plataforma',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('plataforma_token');
  if (token && config.url !== '/auth/login') config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401 && err.config?.url !== '/auth/login') {
    localStorage.removeItem('plataforma_token');
    window.dispatchEvent(new Event('plataforma:sesion-expirada'));
    if (window.location.pathname !== '/login') window.location.replace('/login');
  }
  return Promise.reject(err);
});

export default api;
