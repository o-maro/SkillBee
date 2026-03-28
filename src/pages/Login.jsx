import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
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
        <div className={styles.heroOverlay}></div>
        <img 
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=1200" 
          alt="Professional working" 
          className={styles.heroBackground}
        />
        <div className={styles.heroContent}>
          <Badge variant="secondary" className={styles.heroBadge}>Welcome back</Badge>
          <h1>Your next task is waiting</h1>
          <p>
            Log back in to pick up where you left off. Manage bookings, chat with taskers, and keep projects moving securely and efficiently.
          </p>
        </div>
      </div>
      
      <div className={styles.formPanel}>
        <Card className={styles.formCard}>
          <h2>Login</h2>
          <p className={styles.subtitle}>We’ve saved your spot.</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <Input
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your secure password"
              required
            />

            {error && <div className={styles.error}>{error}</div>}

            <Button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>

          <p className={styles.switch}>
            Need an account? <Link to="/signup">Create one</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}

