import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Login.module.css'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, loadProfile } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { user: signedInUser, error: signInError } = await signIn(email, password)

      if (signInError) {
        setError(signInError.message || 'Failed to log in')
        setLoading(false)
        return
      }

      if (signedInUser) {
        // Explicitly load profile and use result for redirect (avoids race with onAuthStateChange)
        const userProfile = await loadProfile(signedInUser.id)
        
        if (userProfile) {
          if (userProfile.role === 'admin') {
            navigate('/admin/dashboard', { replace: true })
          } else if (userProfile.role === 'tasker') {
            if (userProfile.verification_status === 'approved') {
              navigate('/tasker-dashboard', { replace: true })
            } else {
              navigate('/tasker-onboarding', { replace: true })
            }
          } else {
            navigate('/dashboard', { replace: true })
          }
        } else {
          // Profile not found - AppGate will handle routing
          navigate('/', { replace: true })
        }
        setLoading(false)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.heroPanel}>
        <div className={styles.heroContent}>
          <p className={styles.heroBadge}>Welcome back</p>
          <h1>Your next task is waiting</h1>
          <p>
            Log back in to pick up where you left off. Manage bookings, chat with taskers, and keep projects moving.
          </p>
        </div>
      </div>
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <h2>Login</h2>
          <p className={styles.subtitle}>We’ve saved your spot.</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your secure password"
                required
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className={styles.switch}>
            Need an account? <Link to="/signup">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

