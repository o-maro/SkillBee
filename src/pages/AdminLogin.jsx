import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
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
      <Card className={styles.card}>
        <div className={styles.header}>
          <Badge variant="danger" className={styles.adminBadge}>Restricted Access</Badge>
          <h1>Admin Portal</h1>
          <p className={styles.subtitle}>Sign in to access the system dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@skillbee.com"
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />

          {error && <div className={styles.error}>{error}</div>}

          <Button type="submit" disabled={loginLoading} className={styles.submitBtn}>
            {loginLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className={styles.footer}>
          <p>Not an admin? <a href="/login">Go to regular login</a></p>
        </div>
      </Card>
    </div>
  )
}





