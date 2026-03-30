import { Link, useNavigate } from 'react-router-dom'
import { RatingStars } from './RatingStars'
import { formatCurrency } from '../utils/currency'
import styles from './TaskCard.module.css'

/** Active pipeline: can move work to in_progress from early states. */
const STATUSES_CAN_START = ['accepted', 'assigned']

/** Tasker-side active states where marking complete is appropriate (matches dashboard categorization). */
const STATUSES_CAN_MARK_COMPLETE = ['accepted', 'assigned', 'en_route', 'arrived', 'in_progress']

export const TaskCard = ({
  task,
  showRating = false,
  showActions = false,
  showMessage = false,
  onAccept,
  onDecline,
  onStartInProgress,
  onComplete,
  disabled = false,
}) => {
  const navigate = useNavigate()
  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.serviceType}>{task.service_type || 'Task'}</h3>
          {task.scheduled_date && (
            <p className={styles.scheduledDate}>
              📅 {formatDate(task.scheduled_date)} {formatTime(task.scheduled_date)}
            </p>
          )}
        </div>
        {task.status && (
          <span
            className={`${styles.status} ${styles[task.status] || styles.statusActiveFallback}`}
          >
            {task.status.replace('_', ' ')}
          </span>
        )}
      </div>

      <div className={styles.body}>
        {task.location && (
          <p className={styles.location}>
            📍 {task.location}
          </p>
        )}

        {task.budget && (
          <p className={styles.budget}>
            <strong>Budget:</strong> {formatCurrency(task.budget)}
          </p>
        )}

        {task.description && (
          <p className={styles.description}>{task.description}</p>
        )}

        {task.notes && (
          <p className={styles.notes}>{task.notes}</p>
        )}

        {showRating && task.rating && (
          <div className={styles.rating}>
            <RatingStars rating={task.rating} />
            {task.review && <p className={styles.review}>{task.review}</p>}
          </div>
        )}
      </div>

      {showActions && (
        <div className={styles.actions}>
          {task.status === 'pending' && (
            <>
              {onAccept && (
                <button
                  type="button"
                  onClick={() => onAccept(task.id)}
                  className={styles.acceptBtn}
                  disabled={disabled}
                >
                  Accept Task
                </button>
              )}
              {onDecline && (
                <button
                  type="button"
                  onClick={() => onDecline(task.id)}
                  className={styles.declineBtn}
                  disabled={disabled}
                >
                  Decline
                </button>
              )}
            </>
          )}
          {onStartInProgress &&
            STATUSES_CAN_START.includes(task.status) && (
              <button
                type="button"
                onClick={() => onStartInProgress(task.id)}
                className={styles.startBtn}
                disabled={disabled}
              >
                Start task
              </button>
            )}
          {onComplete && STATUSES_CAN_MARK_COMPLETE.includes(task.status) && (
            <button
              type="button"
              onClick={() => onComplete(task.id)}
              className={styles.completeBtn}
              disabled={disabled}
            >
              Mark Complete
            </button>
          )}
        </div>
      )}

      {showMessage && task.tasker_id && (
        <div className={styles.messageAction}>
          <button
            onClick={() => navigate('/messages', { state: { bookingId: task.id } })}
            className={styles.messageBtn}
          >
            💬 Message Client
          </button>
        </div>
      )}
    </div>
  )
}

