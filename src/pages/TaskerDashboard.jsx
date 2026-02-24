import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTaskerBookings, getTaskerRatings } from '../utils/taskerApi'
import { TaskCard } from '../components/TaskCard'
import { RatingStars } from '../components/RatingStars'
import { formatCurrency } from '../utils/currency'
import styles from './TaskerDashboard.module.css'

export const TaskerDashboard = () => {
  const { profile, loading: authLoading } = useAuth()
  const [upcomingTasks, setUpcomingTasks] = useState([])
  const [inProgressTasks, setInProgressTasks] = useState([])
  const [completedTasks, setCompletedTasks] = useState([])
  const [ratings, setRatings] = useState([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    if (!profile) {
      setLoading(false)
      return
    }

    try {
      // Get all tasker bookings
      const { data: bookings, error: bookingsError } = await getTaskerBookings(profile.id)
      if (bookingsError) throw bookingsError

      // Get ratings
      const { data: ratingsData, error: ratingsError } = await getTaskerRatings(profile.id)
      if (ratingsError) throw ratingsError

      setRatings(ratingsData || [])

      // Categorize tasks
      const upcoming = (bookings || []).filter(
        (task) =>
          (task.status === 'pending' || task.status === 'accepted' || task.status === 'assigned') &&
          task.tasker_id === profile.id
      )
      const inProgress = (bookings || []).filter(
        (task) => task.status === 'in_progress' && task.tasker_id === profile.id
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

      setUpcomingTasks(upcoming)
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

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const { supabase } = await import('../utils/supabaseClient')
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', taskId)
        .eq('tasker_id', profile.id)

      if (error) throw error
      loadDashboardData()
    } catch (error) {
      console.error('Error updating task status:', error)
      alert('Failed to update task status. Please try again.')
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
        <h1>Tasker Dashboard</h1>
        <p className={styles.subtitle}>Manage your tasks and track your progress</p>
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
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Upcoming / Scheduled Tasks</h2>
            <Link to="/task-requests" className={styles.viewAllLink}>
              View all requests →
            </Link>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className={styles.empty}>
              <p>No upcoming tasks scheduled.</p>
              <Link to="/task-requests" className={styles.emptyLink}>
                Browse available tasks
              </Link>
            </div>
          ) : (
            <div className={styles.taskGrid}>
              {upcomingTasks.map((task) => (
                <TaskCard key={task.id} task={task} showActions={false} showMessage={true} />
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Tasks In Progress</h2>
          </div>
          {inProgressTasks.length === 0 ? (
            <div className={styles.empty}>
              <p>No tasks currently in progress.</p>
            </div>
          ) : (
            <div className={styles.taskGrid}>
              {inProgressTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showActions={true}
                  showMessage={true}
                  onComplete={(id) => updateTaskStatus(id, 'completed')}
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

