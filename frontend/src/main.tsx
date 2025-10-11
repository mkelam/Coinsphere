import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { PortfolioProvider } from './contexts/PortfolioContext'
import { ToastProvider } from './contexts/ToastContext'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <PortfolioProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </PortfolioProvider>
    </AuthProvider>
  </React.StrictMode>,
)
