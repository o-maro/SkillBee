import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Home.module.css'

export const Home = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    if (profile) {
      if (profile.role === 'client') {
        navigate('/dashboard')
      } else {
        navigate('/tasker-dashboard')
      }
    }
  }, [profile, navigate])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.nav}>
          <div className={styles.logo}>SkillBee</div>
          <div className={styles.authLinks}>
            <Link to="/login" className={styles.loginBtn}>Log In</Link>
            <Link to="/signup" className={styles.signupBtn}>Sign Up</Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Welcome to SkillBee</h1>
          <p className={styles.heroSubtitle}>
            Connect with skilled taskers or offer your services. Get things done, or get paid to do them.
          </p>
          <div className={styles.ctaButtons}>
            <Link to="/signup" className={styles.primaryBtn}>
              Get Started
            </Link>
            <Link to="/login" className={styles.secondaryBtn}>
              Log In
            </Link>
          </div>
        </section>

        <section className={styles.features}>
          <div className={styles.featureCard}>
            <h3>For Clients</h3>
            <p>Post tasks and find skilled professionals to get your work done quickly and efficiently.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>For Taskers</h3>
            <p>Offer your skills and services, complete tasks, and earn money on your own schedule.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Secure & Easy</h3>
            <p>Safe transactions, verified profiles, and a seamless experience from booking to completion.</p>
          </div>
        </section>
      </main>
    </div>
  )
}

