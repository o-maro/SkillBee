import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { 
  Home, 
  LayoutDashboard, 
  User, 
  Wallet, 
  MessageSquare, 
  Sun, 
  Moon, 
  LogOut 
} from 'lucide-react'
import styles from './Navbar.module.css'

export const Navbar = () => {
  const { profile, user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        console.error('Sign out error:', error)
      }
    } catch (err) {
      console.error('Exception during sign out:', err)
    }
  }

  // Show navbar if user is authenticated (even if profile is still loading)
  if (!user) return null

  const isClient = profile?.role === 'client'
  const isTasker = profile?.role === 'tasker'

  // Determine correct routes based on role
  const homePath = isClient ? "/app-home" : isTasker ? "/tasker-home" : "/app-home"
  const dashboardPath = isClient ? "/dashboard" : isTasker ? "/tasker-home" : "/dashboard"
  const profilePath = isClient ? "/profile" : isTasker ? "/tasker-profile" : "/profile"
  const walletPath = "/wallet"

  const isActive = (path) => location.pathname === path
  const isHomeActive = isActive('/app-home') || isActive('/tasker-home')
  const isDashboardActive = isActive('/dashboard') || isActive('/tasker-home')
  const isProfileActive = isActive('/profile') || isActive('/tasker-profile')

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to={homePath} className={styles.logo}>
          <span className={styles.logoIcon}>🐝</span>
          SkillBee
        </Link>
        <div className={styles.links}>
          <Link 
            to={homePath} 
            className={`${styles.navLink} ${isHomeActive ? styles.active : ''}`}
          >
            <Home size={18} />
            <span>Home</span>
          </Link>
          <Link 
            to={dashboardPath}
            className={`${styles.navLink} ${isDashboardActive ? styles.active : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          <Link 
            to={profilePath}
            className={`${styles.navLink} ${isProfileActive ? styles.active : ''}`}
          >
            <User size={18} />
            <span>Profile</span>
          </Link>
          <Link 
            to={walletPath}
            className={`${styles.navLink} ${isActive('/wallet') ? styles.active : ''}`}
          >
            <Wallet size={18} />
            <span>Wallet</span>
          </Link>
          <Link 
            to="/messages"
            className={`${styles.navLink} ${isActive('/messages') ? styles.active : ''}`}
          >
            <MessageSquare size={18} />
            <span>Messages</span>
          </Link>
          <button 
            onClick={toggleTheme} 
            className={styles.themeToggle}
            aria-label="Toggle theme"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button onClick={handleSignOut} className={styles.signOutBtn} aria-label="Sign Out">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <LogOut size={16} /> Sign Out
            </span>
          </button>
        </div>
      </div>
    </nav>
  )
}

