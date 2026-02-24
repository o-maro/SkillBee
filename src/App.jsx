import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { RequireAuth } from './components/RequireAuth'
import { RequireRole } from './components/RequireRole'
import { RequireVerification } from './components/RequireVerification'
import { Navbar } from './components/Navbar'
import { Home } from './pages/Home'
import { AppHome } from './pages/AppHome'
import { Signup } from './pages/Signup'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { TaskerDashboard } from './pages/TaskerDashboard'
import { TaskerHome } from './pages/TaskerHome'
import { TaskRequests } from './pages/TaskRequests'
import { TaskerWallet } from './pages/TaskerWallet'
import { TaskerOnboarding } from './pages/TaskerOnboarding'
import { Book } from './pages/Book'
import { Tasks } from './pages/Tasks'
import { Profile } from './pages/Profile'
import { TaskerProfile } from './pages/TaskerProfile'
import { Wallet } from './pages/Wallet'
import { Support } from './pages/Support'
import { Messages } from './pages/Messages'
import { AdminLogin } from './pages/AdminLogin'
import { AdminDashboard } from './pages/AdminDashboard'
import { TaskerReview } from './pages/TaskerReview'
import { AuthCallback } from './pages/AuthCallback'
import './App.css'

// Central gate that decides what happens when landing on "/"
const AppGate = () => {
  const { user, profile, loading } = useAuth()

  // While auth state is loading, show a lightweight spinner
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

  // No authenticated user: show public landing page
  if (!user || !profile) {
    return <Home />
  }

  const role = profile.role
  const verificationStatus = profile.verification_status

  // Admin default route
  if (role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  // Tasker routing based on verification status
  if (role === 'tasker') {
    if (verificationStatus !== 'approved') {
      return <Navigate to="/tasker-onboarding" replace />
    }
    return <Navigate to="/tasker-dashboard" replace />
  }

  // Client (and any other fallback roles) go to client dashboard
  return <Navigate to="/dashboard" replace />
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route
        path="/admin/dashboard"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['admin']}>
              <AdminDashboard />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/admin/review/:userId"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['admin']}>
              <TaskerReview />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/app-home"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['client']}>
              <Navbar />
              <AppHome />
            </RequireRole>
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
        path="/tasker-home"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['tasker']}>
              <Navbar />
              <TaskerHome />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/tasker-dashboard"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['tasker']}>
              <RequireVerification>
                <Navbar />
                <TaskerDashboard />
              </RequireVerification>
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/task-requests"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['tasker']}>
              <Navbar />
              <TaskRequests />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/tasker-onboarding"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['tasker']}>
              <Navbar />
              <TaskerOnboarding />
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
        path="/tasker-wallet"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={['tasker']}>
              <Navbar />
              <TaskerWallet />
            </RequireRole>
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
        path="/messages"
        element={
          <RequireAuth>
            <Navbar />
            <Messages />
          </RequireAuth>
        }
      />

      <Route path="/" element={<AppGate />} />
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
