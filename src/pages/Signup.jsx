import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Signup.module.css'

export const Signup = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('client')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const { signUp, profile } = useAuth()
  const navigate = useNavigate()
  const signupRoleRef = useRef(null)

  // Redirect if already logged in or after successful signup
  useEffect(() => {
    if (profile) {
      if (profile.role === 'client') {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/tasker-dashboard', { replace: true })
      }
    } else if (signupSuccess && signupRoleRef.current) {
      // If profile hasn't loaded yet but signup was successful, wait a bit more
      // or redirect based on the role used during signup
      const timeout = setTimeout(() => {
        if (signupRoleRef.current === 'client') {
          navigate('/dashboard', { replace: true })
        } else {
          navigate('/tasker-dashboard', { replace: true })
        }
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [profile, signupSuccess, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setSignupSuccess(false)
    signupRoleRef.current = null

    if (!email || !password || !fullName) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    const additionalData = {
      full_name: fullName,
      phone: phone || null,
    }

    const { user, error: signUpError } = await signUp(email, password, role, additionalData)

    if (signUpError) {
      setError(signUpError.message || 'Failed to sign up')
      setLoading(false)
    } else if (user) {
      // Mark signup as successful and store the role
      signupRoleRef.current = role
      setSignupSuccess(true)
      setLoading(false)
      // Profile will be loaded by AuthProvider, redirect will happen via useEffect
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <p className={styles.heroBadge}>Join SkillBee</p>
          <h1>Create your account</h1>
          <p className={styles.subtitle}>Get matched with trusted taskers or start offering your skills.</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.roleSelection}>
              <button
                type="button"
                className={`${styles.rolePill} ${role === 'client' ? styles.roleActive : ''}`}
                onClick={() => setRole('client')}
              >
                <span>👤</span>
                I need tasks done
              </button>
              <button
                type="button"
                className={`${styles.rolePill} ${role === 'tasker' ? styles.roleActive : ''}`}
                onClick={() => setRole('tasker')}
              >
                <span>🛠️</span>
                I want to do tasks
              </button>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="fullName">Full Name *</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email *</label>
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
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Create password *</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Signing up...' : 'Create account'}
            </button>
          </form>

          <p className={styles.switch}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
      <div className={styles.heroPanel}>
        <div className={styles.heroContent}>
          <h2>Build your home, your way.</h2>
          <p>
            From emergency fixes to weekend refreshes, SkillBee connects you with reliable pros.
            Jump in and start your next project with confidence.
          </p>
        </div>
      </div>
    </div>
  )
}

