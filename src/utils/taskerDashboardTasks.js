/**
 * Single pipeline: partition tasker `bookings` rows for TaskerDashboard.
 * Status strings are case-sensitive and match the `bookings.status` column.
 *
 * Completed + payment (future): when `payment_status` or `payment_confirmed` exist on a row,
 * completed work appears under Completed only when payment is satisfied; otherwise it stays In Progress.
 * Rows with neither field (current schema) use `status === 'completed'` only.
 */

const STATUS_CANCELLED = 'cancelled'

const UPCOMING_STATUSES = new Set(['pending'])

const IN_PROGRESS_STATUSES = new Set([
  'accepted',
  'assigned',
  'en_route',
  'arrived',
  'in_progress',
])

/**
 * Whether a booking should appear under Completed on the tasker dashboard.
 * Today: `status === 'completed'` is sufficient (no payment columns).
 * Later: if `payment_status` / `payment_confirmed` are present, they gate the Completed list.
 */
export function qualifiesForCompletedSection(task) {
  if (task == null || task.status !== 'completed') return false

  const hasPaymentStatus = Object.prototype.hasOwnProperty.call(task, 'payment_status')
  const hasPaymentConfirmed = Object.prototype.hasOwnProperty.call(task, 'payment_confirmed')

  if (!hasPaymentStatus && !hasPaymentConfirmed) {
    return true
  }

  if (hasPaymentStatus) {
    return task.payment_status === 'paid'
  }

  if (hasPaymentConfirmed) {
    return task.payment_confirmed === true
  }

  return true
}

/**
 * @param {Array<object>|null|undefined} bookings
 * @returns {{ upcoming: object[], inProgress: object[], completed: object[] }}
 */
export function categorizeTaskerBookings(bookings) {
  const upcoming = []
  const inProgress = []
  const completed = []

  for (const task of bookings || []) {
    const status = task?.status
    if (status == null || typeof status !== 'string') continue
    if (status === STATUS_CANCELLED) continue

    if (status === 'completed') {
      if (qualifiesForCompletedSection(task)) {
        completed.push(task)
      } else {
        inProgress.push(task)
      }
      continue
    }

    if (UPCOMING_STATUSES.has(status)) {
      upcoming.push(task)
      continue
    }

    if (IN_PROGRESS_STATUSES.has(status)) {
      inProgress.push(task)
      continue
    }

    inProgress.push(task)
  }

  return { upcoming, inProgress, completed }
}
