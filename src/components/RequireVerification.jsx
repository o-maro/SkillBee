import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Component to ensure taskers are verified before accessing certain routes
 */
export const RequireVerification = ({ children }) => {
  const { profile, loading, user } = useAuth()

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    return <div className="loading">Loading profile...</div>
  }

  // Only applies to taskers
  if (profile.role === 'tasker') {
    if (profile.verification_status !== 'approved') {
      return <Navigate to="/tasker-onboarding" replace />
    }
  }

  return children
}





