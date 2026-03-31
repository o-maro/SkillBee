import React, { useEffect, useState } from 'react'
import { X, Star, MapPin, CheckCircle, MessageSquare } from 'lucide-react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { getTaskerPublicProfile } from '../utils/publicProfileApi'
import { getTaskerReviews } from '../utils/reviewsApi'
import styles from './TaskerDetailModal.module.css'

export const TaskerDetailModal = ({ isOpen, onClose, taskerId, taskerBaseInfo }) => {
  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen || !taskerId) return
    
    // Set initial base info while loading
    setProfile(taskerBaseInfo || null)
    setLoading(true)
    
    const fetchDetails = async () => {
      try {
        const [profileRes, reviewsRes] = await Promise.all([
          getTaskerPublicProfile(taskerId),
          getTaskerReviews(taskerId)
        ])
        
        if (profileRes.data) {
          // Merge with any base info we had
          setProfile(prev => ({ ...prev, ...profileRes.data }))
        }
        
        if (reviewsRes.data) {
          setReviews(reviewsRes.data)
        }
      } catch (err) {
        console.error('Error loading tasker details:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchDetails()
    
    // Lock body scroll when modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, taskerId, taskerBaseInfo])

  if (!isOpen) return null

  // Fallback checks
  const rating = profile?.rating ? profile.rating.toFixed(1) : 'New'
  const completedTasks = profile?.completed_tasks || 0
  const totalReviews = profile?.total_reviews || 0
  const locationStr = profile?.location || profile?.address || 'Location not provided'
  const bioStr = profile?.bio || "This tasker hasn't written a biography yet."
  const serviceCategories = profile?.services_offered?.length > 0 
    ? profile.services_offered.join(', ') 
    : 'General Tasks'

  // Handling backdrop click
  const handleBackdropClick = (e) => {
    if (e.target.className.includes(styles.backdrop)) {
      onClose()
    }
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            {profile?.avatar_url ? (
               <img src={profile.avatar_url} alt="Avatar" className={styles.avatar} />
            ) : (
               <div className={styles.avatarPlaceholder}>
                 {profile?.full_name?.charAt(0) || 'T'}
               </div>
            )}
            <div className={styles.titleInfo}>
              <h2>{profile?.full_name || 'Tasker Details'}</h2>
              <div className={styles.credentialsRow}>
                <span className={styles.serviceTag}><CheckCircle size={14} /> {serviceCategories}</span>
                <span className={styles.location}><MapPin size={14} /> {locationStr}</span>
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className={styles.body}>
          {loading && !profile?.bio ? (
            <div className={styles.loadingSpinner}>Loading details...</div>
          ) : (
            <>
              {/* Highlight Stats Row */}
              <div className={styles.statsRow}>
                <div className={styles.statBox}>
                  <div className={styles.statIcon}><Star size={20} className={styles.starIcon} /></div>
                  <div className={styles.statValues}>
                    <span className={styles.statValue}>{rating}</span>
                    <span className={styles.statLabel}>Average Rating</span>
                  </div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statIcon}><CheckCircle size={20} className={styles.taskIcon} /></div>
                  <div className={styles.statValues}>
                    <span className={styles.statValue}>{completedTasks}</span>
                    <span className={styles.statLabel}>Completed Tasks</span>
                  </div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statIcon}><MessageSquare size={20} className={styles.reviewIcon} /></div>
                  <div className={styles.statValues}>
                    <span className={styles.statValue}>{totalReviews}</span>
                    <span className={styles.statLabel}>Total Reviews</span>
                  </div>
                </div>
              </div>

              {/* About Section */}
              <div className={styles.section}>
                <h3>About Tasker</h3>
                <p className={styles.bioText}>{bioStr}</p>
              </div>

              {/* Reviews Section */}
              <div className={styles.section}>
                <h3>Reviews ({totalReviews})</h3>
                
                {loading && <p className={styles.loadingText}>Loading reviews...</p>}
                
                {!loading && reviews.length === 0 && (
                  <Card className={styles.emptyReviews}>
                    <p>No reviews yet. Be the first to leave a review after your task!</p>
                  </Card>
                )}

                {!loading && reviews.length > 0 && (
                  <div className={styles.reviewsList}>
                    {reviews.map((review) => (
                      <div key={review.rating_id} className={styles.reviewItem}>
                        <div className={styles.reviewHeader}>
                          <span className={styles.reviewerName}>
                            {review.client?.full_name || 'Anonymous User'}
                          </span>
                          <span className={styles.reviewDate}>
                            {new Date(review.created_at).toLocaleDateString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className={styles.stars}>
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={14} 
                              className={i < review.score ? styles.starFilled : styles.starEmpty} 
                            />
                          ))}
                        </div>
                        {review.review && (
                          <p className={styles.reviewText}>{review.review}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
