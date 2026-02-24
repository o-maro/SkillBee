import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const RequireRole = ({ children, allowedRoles, requireVerification = false }) => {
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
    // Redirect to root - AppGate will handle routing based on role and verification status
    return <Navigate to="/" replace />
  }

  // For taskers, check verification status if required
  if (requireVerification && profile.role === 'tasker') {
    if (profile.verification_status !== 'approved') {
      return <Navigate to="/tasker-onboarding" replace />
    }
  }

  return children
}


