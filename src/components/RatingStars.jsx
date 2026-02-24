import styles from './RatingStars.module.css'

export const RatingStars = ({ rating, maxRating = 5, size = 'medium' }) => {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className={`${styles.container} ${styles[size]}`}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <span key={`full-${i}`} className={styles.star}>
          ★
        </span>
      ))}
      {hasHalfStar && <span className={`${styles.star} ${styles.halfStar}`}>★</span>}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <span key={`empty-${i}`} className={`${styles.star} ${styles.emptyStar}`}>
          ★
        </span>
      ))}
      {rating && (
        <span className={styles.ratingText}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

