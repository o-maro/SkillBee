import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import styles from './Signup.module.css'

export const Signup = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('client')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

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
      setLoading(false)
      // After successful signup, send user to the root.
      // AppGate + route guards will decide the correct dashboard/onboarding.
      navigate('/', { replace: true })
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.formPanel}>
        <Card className={styles.formCard}>
          <Badge variant="secondary" className={styles.heroBadge}>Join SkillBee</Badge>
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

            <Input
              label="Full Name *"
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              required
            />

            <Input
              label="Email *"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <Input
              label="Phone"
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
            />

            <Input
              label="Create password *"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />

            {error && <div className={styles.error}>{error}</div>}

            <Button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Signing up...' : 'Create account'}
            </Button>
          </form>

          <p className={styles.switch}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </Card>
      </div>
      
      <div className={styles.heroPanel}>
        <div className={styles.heroOverlay}></div>
        <img 
          src="https://images.unsplash.com/photo-1542034057-0744de4e0afc?auto=format&fit=crop&q=80&w=1200" 
          alt="Home design project" 
          className={styles.heroBackground}
        />
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

