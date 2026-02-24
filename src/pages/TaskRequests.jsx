import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAvailableRequests, getOfferedRequests, acceptTaskRequest, declineTaskRequest } from '../utils/taskerApi'
import { TaskCard } from '../components/TaskCard'
import styles from './TaskRequests.module.css'

export const TaskRequests = () => {
  const { profile, loading: authLoading } = useAuth()
  const [offeredTasks, setOfferedTasks] = useState([])
  const [availableTasks, setAvailableTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [message, setMessage] = useState('')

  const loadRequests = useCallback(async () => {
    if (!profile) {
      setLoading(false)
      return
    }

    try {
      const [{ data: offered }, { data: available, error }] = await Promise.all([
        getOfferedRequests(profile.id),
        getAvailableRequests(profile.id),
      ])
      if (error) throw error
      setOfferedTasks(offered || [])
      setAvailableTasks(available || [])
    } catch (error) {
      console.error('Error loading requests:', error)
      setMessage('Failed to load tasks. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    if (authLoading) return
    if (profile) loadRequests()
    else setLoading(false)
  }, [profile, loadRequests, authLoading])

  const handleAccept = async (bookingId) => {
    setProcessing(bookingId)
    setMessage('')

    try {
      const { error } = await acceptTaskRequest(bookingId, profile.id)
      if (error) throw error

      setMessage('Task accepted successfully!')
      await loadRequests()
    } catch (error) {
      console.error('Error accepting task:', error)
      setMessage('Failed to accept task. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  const handleDecline = async (bookingId, isOffered = false) => {
    if (isOffered) {
      setProcessing(bookingId)
      setMessage('')
      try {
        const { error } = await declineTaskRequest(bookingId, profile.id)
        if (error) throw error
        setMessage('Task declined.')
        await loadRequests()
      } catch (error) {
        console.error('Error declining task:', error)
        setMessage('Failed to decline task. Please try again.')
      } finally {
        setProcessing(null)
      }
    } else {
      setAvailableTasks((prev) => prev.filter((task) => task.id !== bookingId))
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading available tasks...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Available Task Requests</h1>
        <p className={styles.subtitle}>
          Browse and accept tasks that match your services
        </p>
      </div>

      {message && (
        <div className={message.includes('success') ? styles.success : styles.error}>
          {message}
        </div>
      )}

      {offeredTasks.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Offered to you</h2>
          <p className={styles.sectionSubtitle}>
            A client selected you for these tasks. Accept or decline.
          </p>
          <div className={styles.taskGrid}>
            {offeredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                showActions={true}
                onAccept={handleAccept}
                onDecline={(id) => handleDecline(id, true)}
                disabled={processing === task.id}
              />
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {offeredTasks.length > 0 ? 'Browse available tasks' : 'Available task requests'}
        </h2>
        <p className={styles.sectionSubtitle}>
          {offeredTasks.length > 0
            ? 'Tasks open for any tasker to accept'
            : 'Browse and accept tasks that match your services'}
        </p>
        {availableTasks.length === 0 ? (
          <div className={styles.empty}>
            <p>No available tasks at the moment.</p>
            <p className={styles.emptySubtext}>
              Make sure your services are set up in your profile to see matching tasks.
            </p>
          </div>
        ) : (
          <div className={styles.taskGrid}>
            {availableTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                showActions={true}
                onAccept={handleAccept}
                onDecline={(id) => handleDecline(id, false)}
                disabled={processing === task.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

