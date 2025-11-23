import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import styles from './Navbar.module.css'

export const Navbar = () => {
  const { profile, user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  // Show navbar if user is authenticated (even if profile is still loading)
  if (!user) return null

  const isClient = profile?.role === 'client'
  const isTasker = profile?.role === 'tasker'

  // Determine correct routes based on role
  const dashboardPath = isClient ? "/dashboard" : isTasker ? "/tasker-dashboard" : "/dashboard"
  const profilePath = isClient ? "/profile" : isTasker ? "/tasker-profile" : "/profile"
  const walletPath = "/wallet"

  const isActive = (path) => location.pathname === path
  const isDashboardActive = isActive('/dashboard') || isActive('/tasker-dashboard')
  const isProfileActive = isActive('/profile') || isActive('/tasker-profile')

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/app-home" className={styles.logo}>
          <span className={styles.logoIcon}>🐝</span>
          SkillBee
        </Link>
        <div className={styles.links}>
          <Link 
            to="/app-home" 
            className={`${styles.navLink} ${isActive('/app-home') ? styles.active : ''}`}
          >
            Home
          </Link>
          <Link 
            to={dashboardPath}
            className={`${styles.navLink} ${isDashboardActive ? styles.active : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to={profilePath}
            className={`${styles.navLink} ${isProfileActive ? styles.active : ''}`}
          >
            Profile
          </Link>
          <Link 
            to={walletPath}
            className={`${styles.navLink} ${isActive('/wallet') ? styles.active : ''}`}
          >
            Wallet
          </Link>
          <button 
            onClick={toggleTheme} 
            className={styles.themeToggle}
            aria-label="Toggle theme"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={handleSignOut} className={styles.signOutBtn}>
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}

