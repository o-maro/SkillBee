import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTaskerBookings, getTaskerRatings, getAvailableRequests, getOfferedRequests, acceptTaskRequest, declineTaskRequest } from '../utils/taskerApi'
import { TaskCard } from '../components/TaskCard'
import { ActiveTaskTracker } from '../components/ActiveTaskTracker'
import { RatingStars } from '../components/RatingStars'
import { formatCurrency } from '../utils/currency'
import styles from './TaskerHome.module.css'

export const TaskerHome = () => {
  const { profile, loading: authLoading } = useAuth()
  const [upcomingTasks, setUpcomingTasks] = useState([])
  const [inProgressTasks, setInProgressTasks] = useState([])
  const [completedTasks, setCompletedTasks] = useState([])
  const [ratings, setRatings] = useState([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [message, setMessage] = useState('')

  const loadDashboardData = useCallback(async () => {
    if (!profile) {
      setLoading(false)
      return
    }

    try {
      // Get all tasker data
      const [
        { data: bookings, error: bookingsError },
        { data: ratingsData, error: ratingsError },
        { data: available },
        { data: offered },
      ] = await Promise.all([
        getTaskerBookings(profile.id),
        getTaskerRatings(profile.id),
        getAvailableRequests(profile.id),
        getOfferedRequests(profile.id),
      ])

      if (bookingsError) throw bookingsError
      if (ratingsError) throw ratingsError

      setRatings(ratingsData || [])

      // Categorize tasks logically handling tracking strings safely now mapped internally 
      const directPending = (bookings || []).filter(
        (task) =>
          ['pending'].includes(task.status) &&
          task.tasker_id === profile.id
      )

      // Merge offered, available, and direct pending sequentially preserving structural arrays.
      const allUpcoming = [
        ...(offered || []),
        ...(available || []),
        ...directPending
      ].reduce((acc, current) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, [])
      // Both assigned (legacy API) and accepted explicitly mount the ActiveTaskTracker gracefully overting frozen grids
      const inProgressTrackingStates = ['assigned', 'accepted', 'en_route', 'arrived', 'in_progress']
      const inProgress = (bookings || []).filter(
        (task) => inProgressTrackingStates.includes(task.status) && task.tasker_id === profile.id
      )
      const completed = (bookings || []).filter(
        (task) => task.status === 'completed' && task.tasker_id === profile.id
      )

      // Add ratings to completed tasks
      const completedWithRatings = completed.map((task) => {
        const taskRating = (ratingsData || []).find((r) => r.task_id === task.id)
        return {
          ...task,
          rating: taskRating?.score,
          review: taskRating?.review,
        }
      })

      // Calculate total earnings from completed tasks
      const earnings = completed.reduce((sum, task) => {
        return sum + (parseFloat(task.budget) || 0)
      }, 0)

      setUpcomingTasks(allUpcoming)
      setInProgressTasks(inProgress)
      setCompletedTasks(completedWithRatings)
      setTotalEarnings(earnings)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (profile) {
      loadDashboardData()
    } else {
      setLoading(false)
    }
  }, [profile, loadDashboardData, authLoading])

  const handleAccept = async (bookingId) => {
    setProcessing(bookingId)
    setMessage('')
    try {
      const { error } = await acceptTaskRequest(bookingId, profile.id)
      if (error) throw error
      setMessage('Task accepted successfully!')
      await loadDashboardData()
    } catch (error) {
      console.error('Error accepting task:', error)
      setMessage('Failed to accept task. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  const handleDecline = async (bookingId) => {
    setProcessing(bookingId)
    setMessage('')
    try {
      // Resolve direct/offered organically by checking mapping dynamically securely.
      const isDirectOrOffered = upcomingTasks.find(t => t.id === bookingId && t.tasker_id === profile.id)
      if (isDirectOrOffered) {
         const { error } = await declineTaskRequest(bookingId, profile.id)
         if (error) throw error
         setMessage('Task declined.')
         await loadDashboardData()
      } else {
         setUpcomingTasks(prev => prev.filter(t => t.id !== bookingId))
      }
    } catch (error) {
      console.error('Error declining task:', error)
      setMessage('Failed to decline task.')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading...</div>
  }

  // Calculate average rating
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + (r.score || 0), 0) / ratings.length
      : 0

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tasker Home</h1>
        <p className={styles.subtitle}>Welcome back! Manage your tasks and track your progress</p>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>📅</div>
          <div>
            <p className={styles.summaryLabel}>Upcoming Tasks</p>
            <p className={styles.summaryValue}>{upcomingTasks.length}</p>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>⚡️</div>
          <div>
            <p className={styles.summaryLabel}>In Progress</p>
            <p className={styles.summaryValue}>{inProgressTasks.length}</p>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>✅</div>
          <div>
            <p className={styles.summaryLabel}>Completed</p>
            <p className={styles.summaryValue}>{completedTasks.length}</p>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>💰</div>
          <div>
            <p className={styles.summaryLabel}>Total Earnings</p>
            <p className={styles.summaryValue}>{formatCurrency(totalEarnings)}</p>
          </div>
        </div>
      </div>

      <div className={styles.sections}>
        {message && (
          <div className={styles.sectionHeader} style={{ color: message.includes('success') ? 'var(--success-green)' : 'var(--error-red)' }}>
            {message}
          </div>
        )}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Upcoming Tasks</h2>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className={styles.empty}>
              <p>No upcoming tasks scheduled.</p>
            </div>
          ) : (
            <div className={styles.taskGrid}>
              {upcomingTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  showActions={true} 
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  disabled={processing === task.id}
                  showMessage={true} 
                />
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>In Progress</h2>
          </div>
          {inProgressTasks.length === 0 ? (
            <div className={styles.empty}>
              <p>No tasks currently in progress.</p>
            </div>
          ) : (
            <div className={styles.taskGrid}>
              {inProgressTasks.map((task) => (
                <ActiveTaskTracker
                  key={task.id}
                  task={task}
                  profile={profile}
                  onTaskRefreshRequest={loadDashboardData}
                />
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Completed Tasks</h2>
            {avgRating > 0 && (
              <div className={styles.ratingSummary}>
                <RatingStars rating={avgRating} />
                <span className={styles.ratingText}>
                  {avgRating.toFixed(1)} ({ratings.length} reviews)
                </span>
              </div>
            )}
          </div>
          {completedTasks.length === 0 ? (
            <div className={styles.empty}>
              <p>No completed tasks yet.</p>
            </div>
          ) : (
            <div className={styles.taskGrid}>
              {completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showRating={true}
                  showActions={false}
                />
              ))}
            </div>
          )}
          {completedTasks.length > 0 && (
            <div className={styles.earningsSummary}>
              <p>
                <strong>Total Earnings from Completed Tasks:</strong> {formatCurrency(totalEarnings)}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

