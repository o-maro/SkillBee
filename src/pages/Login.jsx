import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Login.module.css'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, profile, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const justLoggedInRef = useRef(false)
  const timeoutRef = useRef(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  // Redirect if already logged in or after successful login
  useEffect(() => {
    // If user exists and auth is done loading, navigate
    // We navigate even if profile is null - RequireAuth will handle auth check
    if (user && !authLoading && justLoggedInRef.current) {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      // Reset the ref flag - loading will be cleared by timeout or on unmount
      justLoggedInRef.current = false
      navigate('/app-home', { replace: true })
    } else if (profile && user && !justLoggedInRef.current) {
      // If already logged in (not from this login), redirect
      navigate('/app-home', { replace: true })
    }
  }, [profile, user, authLoading, navigate])  

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    justLoggedInRef.current = true

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    try {
      const { user: signedInUser, error: signInError } = await signIn(email, password)

      if (signInError) {
        setError(signInError.message || 'Failed to log in')
        setLoading(false)
        justLoggedInRef.current = false
        return
      }

      if (signedInUser) {
        // Profile will be loaded by AuthProvider's signIn function and onAuthStateChange
        // The useEffect above will handle redirect when authLoading becomes false
        // Set a timeout as fallback in case something goes wrong
        timeoutRef.current = setTimeout(() => {
          if (justLoggedInRef.current) {
            // If still waiting after 5 seconds, redirect anyway
            // The RequireAuth component will handle authentication check
            navigate('/app-home', { replace: true })
            setLoading(false)
            justLoggedInRef.current = false
            timeoutRef.current = null
          }
        }, 5000)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
      justLoggedInRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
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

