import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabaseClient'
import { formatCurrency } from '../utils/currency'
import styles from './Tasks.module.css'

export const Tasks = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const loadTasks = useCallback(async () => {
    try {
      let query = supabase
        .from('bookings')
        .select('*')
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [profile, filter])

  useEffect(() => {
    if (profile) {
      loadTasks()
    }
  }, [profile, loadTasks])

  if (loading) {
    return <div className={styles.loading}>Loading...</div>
  }

  return (
    <div className={styles.container}>
      <h1>My Tasks</h1>

      <div className={styles.filters}>
        <button
          className={filter === 'all' ? styles.active : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={filter === 'pending' ? styles.active : ''}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button
          className={filter === 'in_progress' ? styles.active : ''}
          onClick={() => setFilter('in_progress')}
        >
          In Progress
        </button>
        <button
          className={filter === 'completed' ? styles.active : ''}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className={styles.empty}>
          <p>No tasks found.</p>
        </div>
      ) : (
        <div className={styles.taskList}>
          {tasks.map((task) => (
            <div key={task.id} className={styles.taskCard}>
              <div className={styles.taskHeader}>
                <h3>{task.service_type}</h3>
                <span className={`${styles.status} ${styles[task.status]}`}>
                  {task.status}
                </span>
              </div>
              <div className={styles.taskDetails}>
                <p><strong>Budget:</strong> {formatCurrency(task.budget)}</p>
                <p><strong>Location:</strong> {task.location}</p>
                {task.tasker_id && (
                  <p><strong>Tasker ID:</strong> {task.tasker_id}</p>
                )}
                {task.notes && (
                  <p><strong>Notes:</strong> {task.notes}</p>
                )}
                <p><strong>Created:</strong> {new Date(task.created_at).toLocaleDateString()}</p>
              </div>
              {task.tasker_id && (
                <div className={styles.taskActions}>
                  <button
                    className={styles.messageButton}
                    onClick={() => navigate('/messages', { state: { bookingId: task.id } })}
                  >
                    💬 Message Tasker
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

