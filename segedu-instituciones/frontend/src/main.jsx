import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import ContextoApp from './ContextoApp.jsx';
import './styles/global.css';
import { DialogProvider } from './components/dialog/DialogProvider.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <DialogProvider>
        <ContextoApp />
      </DialogProvider>
    </BrowserRouter>
  </React.StrictMode>
);
