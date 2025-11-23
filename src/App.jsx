import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { RequireAuth } from './components/RequireAuth'
import { RequireRole } from './components/RequireRole'
import { Navbar } from './components/Navbar'
import { Home } from './pages/Home'
import { AppHome } from './pages/AppHome'
import { Signup } from './pages/Signup'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { TaskerDashboard } from './pages/TaskerDashboard'
import { Book } from './pages/Book'
import { Tasks } from './pages/Tasks'
import { Profile } from './pages/Profile'
import { TaskerProfile } from './pages/TaskerProfile'
import { Wallet } from './pages/Wallet'
import { Support } from './pages/Support'
import './App.css'

const AppRoutes = () => {
  const { profile, loading } = useAuth()

  console.log('AppRoutes render - loading:', loading, 'profile:', profile)

  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        color: '#666',
        backgroundColor: '#f5f5f5'
      }}>
        <div>Loading SkillBee...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/app-home"
        element={
          <RequireAuth>
            <Navbar />
            <AppHome />
          </RequireAuth>
        }
      />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['client']}>
              <Navbar />
              <Dashboard />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/tasker-dashboard"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['tasker']}>
              <Navbar />
              <TaskerDashboard />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/book"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['client']}>
              <Navbar />
              <Book />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/tasks"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['client']}>
              <Navbar />
              <Tasks />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/profile"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['client']}>
              <Navbar />
              <Profile />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/tasker-profile"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['tasker']}>
              <Navbar />
              <TaskerProfile />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/wallet"
        element={
          <RequireAuth>
            <Navbar />
            <Wallet />
          </RequireAuth>
        }
      />

      <Route
        path="/support"
        element={
          <RequireAuth>
            <Navbar />
            <Support />
          </RequireAuth>
        }
      />

      <Route
        path="/"
        element={
          profile ? <Navigate to="/app-home" replace /> : <Home />
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
