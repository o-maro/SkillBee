import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTaskerBookings, getAvailableRequests, getTaskerWallet } from '../utils/taskerApi'
import styles from './TaskerHome.module.css'

export const TaskerHome = () => {
  const { profile, loading: authLoading } = useAuth()
  const [stats, setStats] = useState({
    activeTasks: 0,
    availableRequests: 0,
    earnings: 0,
    tasksCompleted: 0,
  })
  const [loading, setLoading] = useState(true)

  const loadHomeData = useCallback(async () => {
    if (!profile) {
      setLoading(false)
      return
    }

    try {
      // Get tasker bookings
      const { data: bookings, error: bookingsError } = await getTaskerBookings(profile.id)
      if (bookingsError) throw bookingsError

      // Get available requests
      const { data: available, error: availableError } = await getAvailableRequests(profile.id)
      if (availableError) throw availableError

      // Get wallet for earnings
      const { data: wallet, error: walletError } = await getTaskerWallet(profile.id)
      if (walletError && walletError.code !== 'PGRST116') throw walletError

      const activeTasks = (bookings || []).filter(
        (b) => b.status === 'in_progress' || b.status === 'accepted' || b.status === 'assigned'
      ).length

      const tasksCompleted = (bookings || []).filter((b) => b.status === 'completed').length

      // Calculate earnings from completed tasks
      const earnings = (bookings || [])
        .filter((b) => b.status === 'completed')
        .reduce((sum, b) => sum + (parseFloat(b.budget) || 0), 0)

      setStats({
        activeTasks,
        availableRequests: (available || []).length,
        earnings,
        tasksCompleted,
      })
    } catch (error) {
      console.error('Error loading home data:', error)
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (profile) {
      loadHomeData()
    } else {
      setLoading(false)
    }
  }, [profile, loadHomeData, authLoading])

  if (loading) {
    return <div className={styles.loading}>Loading...</div>
  }

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.heroBadge}>Tasker Home</p>
          <h1>Welcome back, {profile?.full_name || 'Tasker'}!</h1>
          <p>Manage your tasks, track earnings, and grow your business.</p>
        </div>
      </section>

      <section className={styles.quickStats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⚡️</div>
          <div>
            <p className={styles.statLabel}>Active Tasks</p>
            <p className={styles.statValue}>{stats.activeTasks}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📋</div>
          <div>
            <p className={styles.statLabel}>Available Requests</p>
            <p className={styles.statValue}>{stats.availableRequests}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div>
            <p className={styles.statLabel}>Total Earnings</p>
            <p className={styles.statValue}>${stats.earnings.toFixed(2)}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div>
            <p className={styles.statLabel}>Tasks Completed</p>
            <p className={styles.statValue}>{stats.tasksCompleted}</p>
          </div>
        </div>
      </section>

      <section className={styles.shortcuts}>
        <h2 className={styles.shortcutsTitle}>Quick Actions</h2>
        <div className={styles.shortcutsGrid}>
          <Link to="/tasker-dashboard" className={styles.shortcutCard}>
            <div className={styles.shortcutIcon}>📊</div>
            <h3>Dashboard</h3>
            <p>View all your tasks and progress</p>
          </Link>
          <Link to="/task-requests" className={styles.shortcutCard}>
            <div className={styles.shortcutIcon}>🔍</div>
            <h3>Task Requests</h3>
            <p>Browse and accept new tasks</p>
          </Link>
          <Link to="/tasker-map" className={styles.shortcutCard}>
            <div className={styles.shortcutIcon}>🗺️</div>
            <h3>Map View</h3>
            <p>See nearby tasks on the map</p>
          </Link>
          <Link to="/wallet" className={styles.shortcutCard}>
            <div className={styles.shortcutIcon}>💳</div>
            <h3>Wallet</h3>
            <p>Manage your earnings</p>
          </Link>
          <Link to="/tasker-profile" className={styles.shortcutCard}>
            <div className={styles.shortcutIcon}>👤</div>
            <h3>Profile</h3>
            <p>Update your information</p>
          </Link>
        </div>
      </section>
    </div>
  )
}

