import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { SidebarPrefsProvider } from './context/SidebarPrefsContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <SidebarPrefsProvider>
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </SidebarPrefsProvider>
    </ThemeProvider>
  </React.StrictMode>
);
