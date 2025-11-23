import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const RequireRole = ({ children, allowedRoles }) => {
  const { profile, loading, user } = useAuth()

  // Wait for auth to finish loading
  if (loading) {
    return <div className="loading">Loading...</div>
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If profile is null after loading is complete, allow access anyway
  // The individual pages can handle the null profile case
  // This prevents infinite loading when profile doesn't exist
  if (!profile) {
    return children
  }

  // Check if user's role is allowed
  if (!allowedRoles.includes(profile.role)) {
    // Redirect to appropriate dashboard based on role
    if (profile.role === 'client') {
      return <Navigate to="/dashboard" replace />
    } else if (profile.role === 'tasker') {
      return <Navigate to="/tasker-dashboard" replace />
    } else {
      // Unknown role, redirect to app-home
      return <Navigate to="/app-home" replace />
    }
  }

  return children
}


