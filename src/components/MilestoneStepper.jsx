import React from 'react'
import styles from './MilestoneStepper.module.css'

// The exact string values enforced deeply inside PostgreSQL structural triggers natively
const STEPS = [
  { id: 'accepted', label: 'Accepted' },
  { id: 'en_route', label: 'En Route' },
  { id: 'arrived', label: 'Arrived' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' }
]

export const MilestoneStepper = ({ currentStatus }) => {
  // Find numeric index comparing the actual backend status strings smoothly
  const currentIndex = STEPS.findIndex(s => s.id === currentStatus)
  // Fallback safely mapped avoiding out of bounds faults
  const activeIndex = currentIndex === -1 ? 0 : currentIndex

  // Determines dynamic CSS assignment structurally calculating past distances globally
  const getStepStatus = (stepIndex) => {
    if (stepIndex < activeIndex) return 'completed'
    if (stepIndex === activeIndex) return 'active'
    return 'pending'
  }

  return (
    <div className={styles.stepperContainer}>
      <div className={styles.horizontalSteps}>
        {STEPS.map((step, index) => {
          const status = getStepStatus(index)
          const isCompleted = status === 'completed'
          
          return (
            <div 
              key={step.id} 
              className={`${styles.stepNode} ${styles[status]}`}
            >
              <div className={styles.circle}>
                {isCompleted ? (
                   <svg viewBox="0 0 24 24" fill="none" className={styles.checkIcon}>
                     <polyline points="20 6 9 17 4 12"></polyline>
                   </svg>
                ) : (
                  <span>{/* Empty dot representing active/pending mathematically */}</span>
                )}
              </div>
              <span className={styles.label}>{step.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
