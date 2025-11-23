import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabaseClient'
import styles from './TaskerDashboard.module.css'

export const TaskerDashboard = () => {
  const { profile, loading: authLoading } = useAuth()
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
  })
  const [availableTasks, setAvailableTasks] = useState([])
  const [myTasks, setMyTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    if (!profile) {
      setLoading(false)
      return
    }

    try {
      // Get my assigned tasks
      const { data: assignedTasks, error: assignedError } = await supabase
        .from('bookings')
        .select('*')
        .eq('tasker_id', profile.id)
        .order('created_at', { ascending: false })

      if (assignedError) throw assignedError

      // Get available tasks (pending, not assigned to anyone)
      const { data: available, error: availableError } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'pending')
        .is('tasker_id', null)
        .order('created_at', { ascending: false })
        .limit(10)

      if (availableError) throw availableError

      const total = assignedTasks?.length || 0
      const pending = assignedTasks?.filter((t) => t.status === 'pending').length || 0
      const active = assignedTasks?.filter((t) => t.status === 'in_progress').length || 0
      const completed = assignedTasks?.filter((t) => t.status === 'completed').length || 0

      setStats({ totalTasks: total, pendingTasks: pending, activeTasks: active, completedTasks: completed })
      setAvailableTasks(available || [])
      setMyTasks(assignedTasks?.slice(0, 5) || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    // Wait for auth to finish loading before trying to load dashboard data
    if (authLoading) {
      return
    }
    
    if (profile) {
      loadDashboardData()
    } else {
      // If auth is done loading but profile is null, stop loading
      setLoading(false)
    }
  }, [profile, loadDashboardData, authLoading])

  const acceptTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          tasker_id: profile.id,
          status: 'assigned',
        })
        .eq('id', taskId)

      if (error) throw error
      loadDashboardData()
    } catch (error) {
      console.error('Error accepting task:', error)
      alert('Failed to accept task. Please try again.')
    }
  }

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Welcome back, {profile?.full_name || 'Tasker'}!</h1>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3>Total Tasks</h3>
          <p className={styles.statNumber}>{stats.totalTasks}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Pending</h3>
          <p className={styles.statNumber}>{stats.pendingTasks}</p>
        </div>
        <div className={styles.statCard}>
          <h3>In Progress</h3>
          <p className={styles.statNumber}>{stats.activeTasks}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Completed</h3>
          <p className={styles.statNumber}>{stats.completedTasks}</p>
        </div>
      </div>

      <div className={styles.sections}>
        <div className={styles.section}>
          <h2>Available Tasks</h2>
          {availableTasks.length === 0 ? (
            <p className={styles.empty}>No available tasks at the moment.</p>
          ) : (
            <div className={styles.taskList}>
              {availableTasks.map((task) => (
                <div key={task.id} className={styles.taskCard}>
                  <div className={styles.taskHeader}>
                    <h3>{task.service_type}</h3>
                    <span className={styles.budget}>${task.budget}</span>
                  </div>
                  <p className={styles.location}>📍 {task.location}</p>
                  {task.notes && <p className={styles.notes}>{task.notes}</p>}
                  <button
                    onClick={() => acceptTask(task.id)}
                    className={styles.acceptBtn}
                  >
                    Accept Task
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h2>My Tasks</h2>
          {myTasks.length === 0 ? (
            <p className={styles.empty}>You haven't accepted any tasks yet.</p>
          ) : (
            <div className={styles.taskList}>
              {myTasks.map((task) => (
                <div key={task.id} className={styles.taskCard}>
                  <div className={styles.taskHeader}>
                    <h3>{task.service_type}</h3>
                    <span className={`${styles.status} ${styles[task.status]}`}>
                      {task.status}
                    </span>
                  </div>
                  <p className={styles.budget}>Budget: ${task.budget}</p>
                  <p className={styles.location}>📍 {task.location}</p>
                  <div className={styles.actions}>
                    {task.status === 'assigned' && (
                      <>
                        <button
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                          className={styles.actionBtn}
                        >
                          Start Task
                        </button>
                        <button
                          onClick={() => updateTaskStatus(task.id, 'pending')}
                          className={styles.declineBtn}
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'completed')}
                        className={styles.completeBtn}
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

