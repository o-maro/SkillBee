import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabaseClient'
import { formatCurrency } from '../utils/currency'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
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

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'in_progress': return 'primary'
      case 'completed': return 'success'
      default: return 'neutral'
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading tasks...</div>
  }

  return (
    <div className={styles.container}>
      <PageHeader 
        title="My Tasks" 
        subtitle="Manage and view the status of all your booked tasks."
      />

      <div className={styles.filtersSection}>
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
      </div>

      {tasks.length === 0 ? (
        <Card className={styles.empty}>
          <p className={styles.emptyText}>No tasks found.</p>
          <Button variant="primary" onClick={() => navigate('/book')}>
            Book a New Task
          </Button>
        </Card>
      ) : (
        <div className={styles.taskList}>
          {tasks.map((task) => (
            <Card key={task.id} hoverable className={styles.taskCard}>
              <div className={styles.taskHeader}>
                <h3>{task.service_type}</h3>
                <Badge variant={getStatusVariant(task.status)}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className={styles.taskDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Budget:</span> 
                  <span className={styles.detailValue}>{formatCurrency(task.budget)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Location:</span> 
                  <span className={styles.detailValue}>{task.location}</span>
                </div>
                {task.tasker_id && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Tasker ID:</span> 
                    <span className={styles.detailValue}>{task.tasker_id}</span>
                  </div>
                )}
                {task.notes && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Notes:</span> 
                    <span className={styles.detailValue}>{task.notes}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Created:</span> 
                  <span className={styles.detailValue}>{new Date(task.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              {task.tasker_id && (
                <div className={styles.taskActions}>
                  <Button
                    variant="primary"
                    className={styles.messageButton}
                    onClick={() => navigate('/messages', { state: { bookingId: task.id } })}
                  >
                    💬 Message Tasker
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

