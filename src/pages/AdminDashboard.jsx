import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabaseClient'
import { getSignedUrl } from '../utils/storageApi'
import styles from './AdminDashboard.module.css'

export const AdminDashboard = () => {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [expandedCard, setExpandedCard] = useState(null)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  })

  /* ===============================
     Load Applications (Memoized)
  =============================== */
  const loadApplications = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      let query = supabase
        .from('tasker_verifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data: verifications, error: verificationsError } = await query
      if (verificationsError) throw verificationsError

      const enrichedApplications = await Promise.all(
        (verifications || []).map(async (verification) => {
          const { data: user } = await supabase
            .from('users')
            .select('id, full_name, email, phone_number')
            .eq('id', verification.user_id)
            .single()

          const documents = {
            idDocument: null,
            passportPhoto: null,
            certificate: null,
            cv: null,
          }

          const docMap = {
            id_document_url: 'idDocument',
            passport_photo_url: 'passportPhoto',
            certificate_url: 'certificate',
            cv_url: 'cv',
          }

          for (const key in docMap) {
            if (verification[key]) {
              try {
                const { data } = await getSignedUrl(
                  verification[key],
                  3600,
                  verification.user_id
                )
                documents[docMap[key]] = data
              } catch {
                documents[docMap[key]] = null
              }
            }
          }

          return {
            ...verification,
            user: user || null,
            documents,
          }
        })
      )

      setApplications(enrichedApplications)

      const { data: allStatuses } = await supabase
        .from('tasker_verifications')
        .select('status')

      if (allStatuses) {
        setStats({
          pending: allStatuses.filter(v => v.status === 'pending').length,
          approved: allStatuses.filter(v => v.status === 'approved').length,
          rejected: allStatuses.filter(v => v.status === 'rejected').length,
        })
      }
    } catch (err) {
      console.error('Admin dashboard load error:', err)
      setError('Failed to load applications. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [filter])

  /* ===============================
     Auth Guard
  =============================== */
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      navigate('/admin/login', { replace: true })
    }
  }, [profile, navigate])

  /* ===============================
     Fetch Data
  =============================== */
  useEffect(() => {
    if (profile?.role === 'admin') {
      loadApplications()
    }
  }, [profile, filter, loadApplications])

  /* ===============================
     Helpers
  =============================== */
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

  const toggleCardExpansion = (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    setExpandedCard(prev => (prev === id ? null : id))
  }

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'N/A'

  /* ===============================
     Loading State
  =============================== */
  if (loading && applications.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading applications…</div>
      </div>
    )
  }

  /* ===============================
     Render
  =============================== */
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Admin Dashboard</h1>
          <p className={styles.subtitle}>Manage tasker verifications</p>
        </div>
        <button onClick={handleSignOut} className={styles.signOutBtn}>
          Sign Out
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.stats}>
        {['pending', 'approved', 'rejected'].map(status => (
          <div key={status} className={styles.statCard}>
            <div className={styles.statIcon}>
              {status === 'pending' ? '⏳' : status === 'approved' ? '✅' : '❌'}
            </div>
            <div>
              <p className={styles.statLabel}>{status}</p>
              <p className={styles.statValue}>{stats[status]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.filters}>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            className={filter === f ? styles.active : ''}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && ` (${stats[f]})`}
          </button>
        ))}
      </div>

      {applications.length === 0 ? (
        <div className={styles.empty}>
          <p>No {filter !== 'all' ? filter : ''} applications found.</p>
        </div>
      ) : (
        <div className={styles.applicationsList}>
          {applications.map(app => (
            <div key={app.id} className={styles.applicationCard}>
              <Link to={`/admin/review/${app.user_id}`} className={styles.cardLink}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3>{app.user?.full_name || 'Unknown User'}</h3>
                    <p className={styles.email}>{app.user?.email || 'No email'}</p>
                  </div>
                  <span className={`${styles.status} ${styles[app.status]}`}>
                    {app.status}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <p><strong>Service:</strong> {app.service_category || 'N/A'}</p>
                  <p><strong>National ID:</strong> {app.national_id_number || 'N/A'}</p>
                  <p><strong>Submitted:</strong> {formatDate(app.created_at)}</p>
                </div>
              </Link>

              <div className={styles.documentsSection}>
                <button
                  onClick={(e) => toggleCardExpansion(app.id, e)}
                  className={styles.toggleDocumentsBtn}
                >
                  {expandedCard === app.id ? '▼ Hide Documents' : '▶ View Documents'}
                </button>

                {expandedCard === app.id && (
                  <div className={styles.documentsGrid}>
                    {Object.entries(app.documents).map(([key, url]) => (
                      <div key={key} className={styles.documentItem}>
                        <h4>{key.replace(/([A-Z])/g, ' $1')}</h4>
                        {url ? (
                          <>
                            {url.endsWith('.pdf') || url.endsWith('.doc') ? (
                              <iframe src={url} title={key} className={styles.documentIframe} />
                            ) : (
                              <img src={url} alt={key} className={styles.documentThumbnail} />
                            )}
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.viewDocLink}
                            >
                              View Full Size
                            </a>
                          </>
                        ) : (
                          <p className={styles.noDoc}>Not provided</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
