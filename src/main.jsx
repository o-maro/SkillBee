import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './context/AuthProvider'   // ✅ IMPORTANT
import { ThemeProvider } from './context/ThemeContext'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found! Make sure index.html has <div id="root"></div>')
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>        {/* ✅ MUST wrap the entire app */}
          <App />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
)
