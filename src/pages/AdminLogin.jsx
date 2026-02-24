import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './AdminLogin.module.css'

export const AdminLogin = () => {
  const { signIn, loadProfile, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // No auto-redirect - let AppGate and guards handle routing

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoginLoading(true)

    if (!email || !password) {
      setError('Please enter both email and password')
      setLoginLoading(false)
      return
    }

    try {
      const { user, error: signInError } = await signIn(email, password)

      if (signInError) {
        setError(signInError.message || 'Invalid email or password')
        setLoginLoading(false)
        return
      }

      if (user) {
        const userProfile = await loadProfile(user.id)

        if (userProfile?.role === 'admin') {
          navigate('/', { replace: true })
        } else {
          setError('Access denied. Admin credentials required.')
          const { supabase } = await import('../utils/supabaseClient')
          await supabase.auth.signOut()
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred during login. Please try again.')
    } finally {
      setLoginLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>🔐 Admin Login</h1>
          <p className={styles.subtitle}>Sign in to access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@skillbee.com"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={loginLoading} className={styles.submitBtn}>
            {loginLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>Not an admin? <a href="/login">Go to regular login</a></p>
        </div>
      </div>
    </div>
  )
}





