// v2
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendPort = env.BACKEND_PORT || 5000;
  const backendUrl = `http://127.0.0.1:${backendPort}`;

  const proxyConfig = {
    '/api': {
      target: backendUrl,
      changeOrigin: true
    },
    '/uploads': {
      target: backendUrl,
      changeOrigin: true
    }
  };

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: proxyConfig
    },
    preview: {
      port: 4173,
      proxy: proxyConfig
    }
  };
});
