import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabaseClient'
import { formatCurrency } from '../utils/currency'
import styles from './AppHome.module.css'

const featuredServices = [
  {
    icon: '🪠',
    title: 'Plumbing',
    description: 'Fix leaks, unclog drains, and keep everything flowing smoothly.',
  },
  {
    icon: '🧹',
    title: 'Cleaning',
    description: 'Deep cleans, move-out refreshes, and weekly housekeeping.',
  },
  {
    icon: '🔧',
    title: 'Handyman',
    description: 'Furniture assembly, minor repairs, mounting TVs, and more.',
  },
  {
    icon: '💡',
    title: 'Electrical',
    description: 'Install fixtures, troubleshoot wiring, and handle quick fixes.',
  },
  {
    icon: '🎨',
    title: 'Painting',
    description: 'Fresh coats for rooms, accent walls, exterior touch-ups.',
  },
  {
    icon: '🚚',
    title: 'Moving Help',
    description: 'Heavy lifting, packing, and loading assistance on demand.',
  },
]

export const AppHome = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  
  // Safe fallbacks for auth context
  const profile = auth?.profile || null
  const authLoading = auth?.loading || false
  
  const [tasks, setTasks] = useState([])
  const [filteredTasks, setFilteredTasks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, in_progress, completed

  // Debug logging
  console.log('Auth values:', auth)
  console.log('Profile:', profile, 'Auth Loading:', authLoading)
  console.log('Component state:', { loading, tasks: tasks.length, filteredTasks: filteredTasks.length })

  const isClient = profile?.role === 'client'
  const isTasker = profile?.role === 'tasker'
  const userName = profile?.full_name || 'User'

  // No redirects - guards handle routing

  const loadTasks = useCallback(async () => {
    if (!profile) {
      console.log('No profile, skipping task load')
      setLoading(false)
      return
    }

    try {
      console.log('Loading tasks for profile:', profile)
      const isClientRole = profile.role === 'client'
      const isTaskerRole = profile.role === 'tasker'
      let query

      if (isClientRole) {
        // For clients: show all available tasks (pending tasks from all clients)
        query = supabase
          .from('bookings')
          .select('*')
          .eq('status', 'pending')
          .is('tasker_id', null)
          .order('created_at', { ascending: false })
      } else if (isTaskerRole) {
        // For taskers: show available tasks they can accept (pending, not assigned)
        query = supabase
          .from('bookings')
          .select('*')
          .eq('status', 'pending')
          .is('tasker_id', null)
          .order('created_at', { ascending: false })
      } else {
        console.log('Unknown role:', profile.role)
        setLoading(false)
        return
      }

      const { data, error } = await query
      console.log('Tasks query result:', { data, error })

      if (error) throw error
      setTasks(data || [])
      setFilteredTasks(data || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    console.log('Auth loading:', authLoading, 'Profile:', profile)
    
    if (authLoading) {
      setLoading(true)
      return
    }
    
    if (!profile) {
      setLoading(false)
      setTasks([])
      return
    }
    
    loadTasks()
  }, [profile, authLoading, loadTasks])

  // Filter tasks based on search query and status filter
  useEffect(() => {
    let filtered = [...tasks]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (task) =>
          task.service_type?.toLowerCase().includes(query) ||
          task.location?.toLowerCase().includes(query) ||
          task.notes?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter((task) => task.status === filter)
    }

    setFilteredTasks(filtered)
  }, [searchQuery, filter, tasks])

  const handleAcceptTask = async (taskId) => {
    if (!isTasker) return

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          tasker_id: profile.id,
          status: 'assigned',
        })
        .eq('id', taskId)

      if (error) throw error
      loadTasks()
    } catch (error) {
      console.error('Error accepting task:', error)
      alert('Failed to accept task. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading tasks...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Temporary debug info - you can remove this later */}
      <div style={{
        background: '#f8f9fa', 
        padding: '12px', 
        marginBottom: '20px', 
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <strong>Debug Info:</strong><br />
        Auth Loading: {authLoading ? 'Yes' : 'No'}<br />
        Profile: {profile ? `Exists (role: ${profile.role})` : 'None'}<br />
        Tasks Count: {tasks.length}<br />
        Filtered Tasks Count: {filteredTasks.length}<br />
        Search Query: "{searchQuery}"<br />
        Filter: {filter}
      </div>

      <div className={styles.header}>
        <div>
          <h1>Welcome back, {userName}!</h1>
          <p className={styles.subtitle}>
            {isClient
              ? 'Get your first task done with trusted local pros'
              : 'Find tasks that match your skills'}
          </p>
        </div>
        {isClient && (
          <Link to="/book" className={styles.bookBtn}>
            Book a Task
          </Link>
        )}
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search tasks by service type, location, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

        <div className={styles.filters}>
          <button
            className={filter === 'all' ? styles.activeFilter : styles.filterBtn}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'pending' ? styles.activeFilter : styles.filterBtn}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          {isTasker && (
            <>
              <button
                className={filter === 'assigned' ? styles.activeFilter : styles.filterBtn}
                onClick={() => setFilter('assigned')}
              >
                Assigned
              </button>
              <button
                className={filter === 'in_progress' ? styles.activeFilter : styles.filterBtn}
                onClick={() => setFilter('in_progress')}
              >
                In Progress
              </button>
            </>
          )}
          <button
            className={filter === 'completed' ? styles.activeFilter : styles.filterBtn}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>
      </div>

      {isClient && (
        <section className={styles.servicesSection}>
          <div className={styles.servicesHeader}>
            <div>
              <h2>Popular services on SkillBee</h2>
              <p>From emergency repairs to weekend refreshes, we have you covered.</p>
            </div>
            <Link to="/book" className={styles.servicesCta}>
              Explore services
            </Link>
          </div>
          <div className={styles.serviceGrid}>
            {featuredServices.map((service) => (
              <div key={service.title} className={styles.serviceCard}>
                <div className={styles.serviceIcon}>{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className={styles.tasksSection}>
        <div className={styles.sectionHeader}>
          <h2>
            {isClient ? 'Available Tasks' : 'Tasks Available for You'}
            {filteredTasks.length > 0 && (
              <span className={styles.taskCount}>({filteredTasks.length})</span>
            )}
          </h2>
        </div>

        {filteredTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              {searchQuery
                ? 'No tasks match your search. Try different keywords.'
                : isClient
                ? 'No tasks available at the moment. Let us help you get your first task done!'
                : 'No tasks available at the moment. Check back later!'}
            </p>
            {isClient && !searchQuery && (
              <Link to="/book" className={styles.emptyAction}>
                Get Your First Task Done
              </Link>
            )}
          </div>
        ) : (
          <div className={styles.taskGrid}>
            {filteredTasks.map((task) => (
              <div key={task.id} className={styles.taskCard}>
                <div className={styles.taskHeader}>
                  <h3>{task.service_type}</h3>
                  <span className={styles.budget}>{formatCurrency(task.budget)}</span>
                </div>
                <div className={styles.taskDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>📍 Location:</span>
                    <span className={styles.detailValue}>{task.location}</span>
                  </div>
                  {task.notes && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>📝 Notes:</span>
                      <span className={styles.detailValue}>{task.notes}</span>
                    </div>
                  )}
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>📅 Posted:</span>
                    <span className={styles.detailValue}>
                      {new Date(task.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className={styles.taskFooter}>
                  <span className={`${styles.status} ${styles[task.status]}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  {isTasker && task.status === 'pending' && !task.tasker_id && (
                    <button
                      onClick={() => handleAcceptTask(task.id)}
                      className={styles.acceptBtn}
                    >
                      Accept Task
                    </button>
                  )}
                  {isClient && (
                    <Link to={`/tasks`} className={styles.viewBtn}>
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}