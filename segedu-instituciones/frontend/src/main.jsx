import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { InstitucionProvider } from './context/InstitucionContext.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <InstitucionProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </InstitucionProvider>
    </BrowserRouter>
  </React.StrictMode>
);
