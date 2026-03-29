import React, { useState, useEffect } from 'react'
import { X, Star, CheckCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { submitReview, checkCanReview } from '../utils/reviewsApi'
import { useAuth } from '../context/AuthContext'
import styles from './SubmitReviewModal.module.css'

export const SubmitReviewModal = ({ isOpen, onClose, task }) => {
  const { profile } = useAuth()
  
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)
  const [canReview, setCanReview] = useState(false)

  // Reset state when task changes or modal opens
  useEffect(() => {
    const verifyEligibility = async () => {
      setLoading(true)
      setErrorMsg('')
      try {
        const { data, error } = await checkCanReview(task.id, profile.id)
        if (error) throw error
        
        if (!data.canReview) {
          setErrorMsg(data.reason || 'You are not eligible to review this task.')
          setCanReview(false)
        } else {
          setCanReview(true)
        }
      } catch (err) {
        setErrorMsg(err.message || 'Error checking eligibility to review.')
        setCanReview(false)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen && task && profile) {
      setRating(0)
      setHoverRating(0)
      setReviewText('')
      setErrorMsg('')
      setSuccess(false)
      verifyEligibility()
    }
  }, [isOpen, task, profile])

  const handleSubmit = async () => {
    if (rating === 0) {
      setErrorMsg('Please select a star rating.')
      return
    }
    
    setSubmitting(true)
    setErrorMsg('')
    
    try {
      const { error } = await submitReview(
        task.id,
        task.tasker_id,
        profile.id,
        rating,
        reviewText.trim()
      )
      
      if (error) throw error
      
      setSuccess(true)
      // Automatically close after a small delay
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit the review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    // Only close if they click the backdrop, not the modal itself
    if (e.target.className.includes(styles.backdrop)) {
      onClose()
    }
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        
        <div className={styles.header}>
          <div className={styles.titleInfo}>
            <h2>Leave a Review</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className={styles.body}>
          {loading ? (
            <div className={styles.loadingState}>
              Checking eligibility...
            </div>
          ) : success ? (
            <div className={styles.successState}>
              <CheckCircle size={48} />
              <h3>Review Submitted!</h3>
              <p>Thank you for sharing your experience.</p>
            </div>
          ) : !canReview ? (
            <div className={styles.errorState}>
              <h3>Cannot Review</h3>
              <p>{errorMsg}</p>
            </div>
          ) : (
            <>
              {errorMsg && <div className={styles.errorState} style={{padding: '0.5rem'}}>{errorMsg}</div>}
              
              <div className={styles.ratingSection}>
                <label>Overall Rating</label>
                <div className={styles.stars}>
                  {[1, 2, 3, 4, 5].map((starIndex) => (
                    <button
                      key={starIndex}
                      className={styles.starBtn}
                      onMouseEnter={() => setHoverRating(starIndex)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starIndex)}
                      aria-label={`Rate ${starIndex} stars`}
                    >
                      <Star
                        size={32}
                        className={(hoverRating || rating) >= starIndex ? styles.starFilled : styles.starEmpty}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Written Review (Optional)</label>
                <textarea
                  className={styles.reviewInput}
                  placeholder="Tell others about your experience with this tasker..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  maxLength={1000}
                />
              </div>
            </>
          )}
        </div>

        {!loading && !success && canReview && (
          <div className={styles.footer}>
            <button className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <Button 
              variant="primary" 
              onClick={handleSubmit} 
              disabled={submitting || rating === 0}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
