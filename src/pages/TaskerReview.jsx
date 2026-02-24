import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabaseClient'
import { getSignedUrl } from '../utils/storageApi'
import styles from './TaskerReview.module.css'

export const TaskerReview = () => {
  const { profile } = useAuth()
  const { userId } = useParams()
  const navigate = useNavigate()
  const [verification, setVerification] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [idDocumentUrl, setIdDocumentUrl] = useState(null)
  const [passportPhotoUrl, setPassportPhotoUrl] = useState(null)
  const [certificateUrl, setCertificateUrl] = useState(null)
  const [cvUrl, setCvUrl] = useState(null)

  // Redirect if not admin
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      navigate('/admin/login', { replace: true })
    }
  }, [profile, navigate])

  // Load verification data
  useEffect(() => {
    if (profile?.role === 'admin' && userId) {
      loadVerificationData()
    }
  }, [profile, userId])

  const loadVerificationData = async () => {
    try {
      setLoading(true)

      // Load verification record
      const { data: verificationData, error: verificationError } = await supabase
        .from('tasker_verifications')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (verificationError) throw verificationError

      setVerification(verificationData)

      // Load user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      setUser(userData)

      // Load document URLs - pass userId as fallback for incorrect paths
      if (verificationData.id_document_url) {
        try {
          const { data: idDocUrl, error: idDocError } = await getSignedUrl(verificationData.id_document_url, 3600, userId)
          if (idDocError) {
            console.error('Error loading ID document:', idDocError)
          } else {
            setIdDocumentUrl(idDocUrl)
          }
        } catch (err) {
          console.error('Exception loading ID document:', err)
        }
      }

      if (verificationData.passport_photo_url) {
        try {
          const { data: photoUrl, error: photoError } = await getSignedUrl(verificationData.passport_photo_url, 3600, userId)
          if (photoError) {
            console.error('Error loading passport photo:', photoError)
          } else {
            setPassportPhotoUrl(photoUrl)
          }
        } catch (err) {
          console.error('Exception loading passport photo:', err)
        }
      }

      // Load certificate URL if exists
      if (verificationData.certificate_url) {
        try {
          const { data: certUrl, error: certError } = await getSignedUrl(verificationData.certificate_url, 3600, userId)
          if (certError) {
            console.error('Error loading certificate:', certError)
          } else {
            setCertificateUrl(certUrl)
          }
        } catch (err) {
          console.error('Exception loading certificate:', err)
        }
      }

      // Load CV URL if exists
      if (verificationData.cv_url) {
        try {
          const { data: cvUrlData, error: cvError } = await getSignedUrl(verificationData.cv_url, 3600, userId)
          if (cvError) {
            console.error('Error loading CV:', cvError)
          } else {
            setCvUrl(cvUrlData)
          }
        } catch (err) {
          console.error('Exception loading CV:', err)
        }
      }
    } catch (error) {
      console.error('Error loading verification data:', error)
      setError('Failed to load verification data')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this tasker?')) {
      return
    }

    setProcessing(true)
    setError('')

    try {
      // Call the approve function
      const { error: approveError } = await supabase.rpc('approve_tasker', {
        p_user_id: userId,
        p_reviewed_by: profile.id,
      })

      if (approveError) throw approveError

      alert('Tasker approved successfully!')
      navigate('/admin/dashboard')
    } catch (error) {
      console.error('Error approving tasker:', error)
      setError('Failed to approve tasker. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason')
      return
    }

    if (!confirm('Are you sure you want to reject this tasker?')) {
      return
    }

    setProcessing(true)
    setError('')

    try {
      // Call the reject function
      const { error: rejectError } = await supabase.rpc('reject_tasker', {
        p_user_id: userId,
        p_reviewed_by: profile.id,
        p_rejection_reason: rejectionReason.trim(),
      })

      if (rejectError) throw rejectError

      alert('Tasker rejected successfully.')
      navigate('/admin/dashboard')
    } catch (error) {
      console.error('Error rejecting tasker:', error)
      setError('Failed to reject tasker. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading verification data...</div>
      </div>
    )
  }

  if (!verification || !user) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Verification data not found</div>
        <button onClick={() => navigate('/admin/dashboard')} className={styles.backBtn}>
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/admin/dashboard')} className={styles.backBtn}>
          ← Back to Dashboard
        </button>
        <h1>Review Tasker Application</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        <div className={styles.section}>
          <h2>User Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <strong>Full Name:</strong>
              <span>{user.full_name || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <strong>Email:</strong>
              <span>{user.email || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <strong>Phone:</strong>
              <span>{user.phone_number || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <strong>Status:</strong>
              <span className={`${styles.status} ${styles[verification.status]}`}>
                {verification.status}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Service Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <strong>Service Category:</strong>
              <span>{verification.service_category || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <strong>National ID Number:</strong>
              <span>{verification.national_id_number || 'N/A'}</span>
            </div>
            {verification.hourly_rate && (
              <div className={styles.infoItem}>
                <strong>Hourly Rate:</strong>
                <span>UGX {verification.hourly_rate.toLocaleString()}</span>
              </div>
            )}
            {verification.operating_radius && (
              <div className={styles.infoItem}>
                <strong>Operating Radius:</strong>
                <span>{verification.operating_radius} km</span>
              </div>
            )}
          </div>
          {verification.bio && (
            <div className={styles.bio}>
              <strong>Bio:</strong>
              <p>{verification.bio}</p>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h2>Documents</h2>
          <div className={styles.documents}>
            <div className={styles.document}>
              <h3>National ID Document</h3>
              {idDocumentUrl ? (
                <div className={styles.documentPreview}>
                  {idDocumentUrl.includes('.pdf') ? (
                    <iframe src={idDocumentUrl} title="ID Document" className={styles.iframe} />
                  ) : (
                    <img src={idDocumentUrl} alt="ID Document" className={styles.documentImage} />
                  )}
                  <a href={idDocumentUrl} target="_blank" rel="noopener noreferrer" className={styles.viewLink}>
                    View Full Size
                  </a>
                </div>
              ) : (
                <p className={styles.noDocument}>Document not available</p>
              )}
            </div>

            <div className={styles.document}>
              <h3>Passport Photo</h3>
              {passportPhotoUrl ? (
                <div className={styles.documentPreview}>
                  <img src={passportPhotoUrl} alt="Passport Photo" className={styles.documentImage} />
                  <a href={passportPhotoUrl} target="_blank" rel="noopener noreferrer" className={styles.viewLink}>
                    View Full Size
                  </a>
                </div>
              ) : (
                <p className={styles.noDocument}>Photo not available</p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Professional Documents</h2>
          <div className={styles.documents}>
            <div className={styles.document}>
              <h3>Professional Certificate</h3>
              {certificateUrl ? (
                <div className={styles.documentPreview}>
                  {certificateUrl.includes('.pdf') ? (
                    <iframe src={certificateUrl} title="Certificate" className={styles.iframe} />
                  ) : (
                    <img src={certificateUrl} alt="Certificate" className={styles.documentImage} />
                  )}
                  <a href={certificateUrl} target="_blank" rel="noopener noreferrer" className={styles.viewLink}>
                    View Full Size
                  </a>
                </div>
              ) : (
                <p className={styles.noDocument}>No certificate provided</p>
              )}
            </div>

            <div className={styles.document}>
              <h3>CV/Resume</h3>
              {cvUrl ? (
                <div className={styles.documentPreview}>
                  {cvUrl.includes('.pdf') || cvUrl.includes('.doc') ? (
                    <iframe src={cvUrl} title="CV/Resume" className={styles.iframe} />
                  ) : (
                    <img src={cvUrl} alt="CV/Resume" className={styles.documentImage} />
                  )}
                  <a href={cvUrl} target="_blank" rel="noopener noreferrer" className={styles.viewLink}>
                    View Full Size
                  </a>
                </div>
              ) : (
                <p className={styles.noDocument}>No CV/Resume provided</p>
              )}
            </div>
          </div>
        </div>

        {verification.rejection_reason && (
          <div className={styles.section}>
            <h2>Previous Rejection</h2>
            <div className={styles.rejectionBox}>
              <strong>Reason:</strong>
              <p>{verification.rejection_reason}</p>
              {verification.reviewed_at && (
                <p className={styles.reviewedAt}>
                  Rejected on: {new Date(verification.reviewed_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {verification.status !== 'approved' && (
            <button
              onClick={handleApprove}
              disabled={processing}
              className={styles.approveBtn}
            >
              ✅ Approve Tasker
            </button>
          )}

          {verification.status !== 'rejected' && (
            <>
              {!showRejectForm ? (
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={processing}
                  className={styles.rejectBtn}
                >
                  ❌ Reject Tasker
                </button>
              ) : (
                <div className={styles.rejectForm}>
                  <label>
                    Rejection Reason *
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a reason for rejection..."
                      rows="4"
                      className={styles.rejectTextarea}
                    />
                  </label>
                  <div className={styles.rejectActions}>
                    <button
                      onClick={handleReject}
                      disabled={processing || !rejectionReason.trim()}
                      className={styles.confirmRejectBtn}
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectForm(false)
                        setRejectionReason('')
                      }}
                      disabled={processing}
                      className={styles.cancelBtn}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

