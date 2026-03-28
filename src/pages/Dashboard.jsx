import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabaseClient'
import { formatCurrency } from '../utils/currency'
import MapView from "../components/MapView";
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import styles from './Dashboard.module.css'

export const Dashboard = () => {
  const { profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
  })
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeUserLocation, setActiveUserLocation] = useState(null);
  const [taskers, setTaskers] = useState([]);

useEffect(() => {
  navigator.geolocation.getCurrentPosition((position) => {
    setActiveUserLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      full_name: "You"
    });
  });
}, []);

useEffect(() => {
  const loadTaskers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, latitude, longitude, role")
      .eq("role", "tasker");

    if (error) {
      console.error("Error loading taskers:", error);
      return;
    }

    // Only keep taskers with location
    const validTaskers = data.filter(
      (t) => t.latitude && t.longitude
    );

    setTaskers(validTaskers);
  };

  loadTaskers();
}, []);

  const loadDashboardData = useCallback(async () => {
    if (!profile) {
      setLoading(false)
      return
    }

    try {
      // Get task statistics
      const { data: tasks, error: tasksError } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', profile.id)

      if (tasksError) throw tasksError

      const total = tasks?.length || 0
      const active = tasks?.filter((t) => t.status === 'pending' || t.status === 'in_progress').length || 0
      const completed = tasks?.filter((t) => t.status === 'completed').length || 0

      setStats({ totalTasks: total, activeTasks: active, completedTasks: completed })

      // Get recent tasks
      const recent = tasks
        ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5) || []

      setRecentTasks(recent)
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

  useEffect(() => {
    if (!profile) return;
  
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
  
        await supabase
          .from("users")
          .update({
            latitude: latitude,
            longitude: longitude
          })
          .eq("id", profile.id);
      });
    }
  }, [profile]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>
  }

  const statHighlights = [
    {
      id: 'total',
      label: 'Total Tasks',
      value: stats.totalTasks,
      icon: '📋',
      accent: styles.statAccentPrimary,
    },
    {
      id: 'active',
      label: 'Active Tasks',
      value: stats.activeTasks,
      icon: '⚡️',
      accent: styles.statAccentAmber,
    },
    {
      id: 'completed',
      label: 'Completed',
      value: stats.completedTasks,
      icon: '✅',
      accent: styles.statAccentGreen,
    },
  ]

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'in_progress': return 'primary'
      case 'completed': return 'success'
      default: return 'neutral'
    }
  }

  return (
    <div className={styles.container}>
      <Card className={styles.hero} style={{ padding: 0 }}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <Badge variant="secondary" className={styles.heroBadge}>Client Dashboard</Badge>
            <h1>Welcome back, {profile?.full_name || 'User'}!</h1>
            <p>
              Track every booking, stay on top of progress, and keep your to‑do list moving.
            </p>
          </div>
          <div className={styles.heroActions}>
            <Button variant="primary" onClick={() => navigate('/book')} className={styles.fullWidth}>
              Book a task
            </Button>
            <Button variant="secondary" onClick={() => navigate('/tasks')} className={styles.fullWidth}>
              View your tasks
            </Button>
          </div>
        </div>
      </Card>

      <section className={styles.statsGrid}>
        {statHighlights.map(({ id, label, value, icon, accent }) => (
          <Card key={id} className={`${styles.statCard} ${accent}`} hoverable>
            <div className={styles.statIcon}>{icon}</div>
            <div>
              <p className={styles.statLabel}>{label}</p>
              <p className={styles.statNumber}>
                {value}
              </p>
            </div>
          </Card>
        ))}
      </section>

      <Card className={styles.mapSection}>
        <div className={styles.mapHeader}>
          <h2>Nearby Taskers</h2>
          <p>Find skilled taskers close to your location.</p>
        </div>

        <MapView
          taskers={taskers}
          activeUserLocation={activeUserLocation}
        />
      </Card>

      <Card className={styles.activitySection}>
        <div className={styles.activityHeader}>
          <div>
            <h2>Recent activity</h2>
            <p>Keep tabs on the latest bookings and task updates.</p>
          </div>
          <Link to="/tasks" className={styles.viewAll}>
            View all tasks →
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <p>
              No tasks yet. <Link to="/book">Get your first task done!</Link>
            </p>
          </div>
        ) : (
          <div className={styles.timeline}>
            {recentTasks.map((task, index) => (
              <div key={task.id} className={styles.timelineItem}>
                <div className={styles.timelineMarker}>
                  <span className={styles.timelineDot} />
                  {index !== recentTasks.length - 1 && <span className={styles.timelineLine} />}
                </div>
                <div className={styles.timelineCard}>
                  <div className={styles.timelineHeader}>
                    <div>
                      <h3>{task.service_type}</h3>
                      <p className={styles.timelineMeta}>
                        {new Date(task.created_at).toLocaleDateString()} • {task.location}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className={styles.timelineBody}>
                    <p>
                      <strong>Budget:</strong> {formatCurrency(task.budget)}
                    </p>
                    {task.notes && (
                      <p className={styles.timelineNotes}>{task.notes}</p>
                    )}
                    {task.tasker_id && (
                      <p className={styles.timelineAssignee}>
                        Assigned to: {task.tasker_id}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

