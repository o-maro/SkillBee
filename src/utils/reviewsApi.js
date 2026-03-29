import { supabase } from './supabaseClient'

/**
 * Submit a review for a completed task
 * @param {string} bookingId - The ID of the completed booking
 * @param {string} taskerId - The ID of the tasker being reviewed
 * @param {string} clientId - The ID of the client leaving the review
 * @param {number} rating - Star rating from 1 to 5
 * @param {string} reviewText - Optional written review
 * @returns {Promise<{data: any, error: any}>}
 */
export const submitReview = async (bookingId, taskerId, clientId, rating, reviewText = '') => {
  try {
    // 1. Check if the user can review (must be completed, and must not have reviewed)
    const canReviewResponse = await checkCanReview(bookingId, clientId)
    
    if (canReviewResponse.error) {
      throw canReviewResponse.error
    }
    
    if (!canReviewResponse.data.canReview) {
      throw new Error(canReviewResponse.data.reason || 'You cannot review this task.')
    }

    // 2. Submit the review
    const { data, error } = await supabase
      .from('ratings')
      .insert({
        booking_id: bookingId,
        tasker_id: taskerId,
        client_id: clientId,
        rating: rating,
        review_text: reviewText
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error submitting review:', error)
    return { data: null, error }
  }
}

/**
 * Get all reviews for a specific tasker
 * @param {string} taskerId - The ID of the tasker
 * @returns {Promise<{data: any[], error: any}>}
 */
export const getTaskerReviews = async (taskerId) => {
  try {
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        client:users (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('tasker_id', taskerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching tasker reviews:', error)
    return { data: null, error }
  }
}

/**
 * Get aggregated review statistics for a tasker
 * Because we use triggers, this just fetches the taskers table directly.
 * If fallback needed (e.g. triggers disabled or before they run), we can query ratings here,
 * but let's rely on the synced columns.
 * @param {string} taskerId - The ID of the tasker
 * @returns {Promise<{data: {rating: number, total_reviews: number, completed_tasks: number}, error: any}>}
 */
export const getTaskerReviewStats = async (taskerId) => {
  try {
    const { data, error } = await supabase
      .from('taskers')
      .select('rating, total_reviews, completed_tasks')
      .eq('tasker_id', taskerId)
      .single()

    if (error) throw error
    
    return { 
      data: {
        rating: data.rating || 0.0,
        total_reviews: data.total_reviews || 0,
        completed_tasks: data.completed_tasks || 0
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Error fetching tasker stats:', error)
    return { data: null, error }
  }
}

/**
 * Check if a client is eligible to review a task
 * @param {string} bookingId - The ID of the booking
 * @param {string} clientId - The ID of the client
 * @returns {Promise<{data: {canReview: boolean, reason?: string}, error: any}>}
 */
export const checkCanReview = async (bookingId, clientId) => {
  try {
    // 1. Verify the booking exists, belongs to client, and is completed
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, client_id')
      .eq('id', bookingId)
      .single()

    if (bookingError) throw bookingError
    
    if (!booking) {
      return { data: { canReview: false, reason: 'Booking not found.' }, error: null }
    }

    if (booking.client_id !== clientId) {
      return { data: { canReview: false, reason: 'You are not the client for this booking.' }, error: null }
    }

    if (booking.status !== 'completed') {
      return { data: { canReview: false, reason: 'You can only review a task after it is marked as completed.' }, error: null }
    }

    // 2. Check if a review already exists
    const { data: existingReview, error: reviewError } = await supabase
      .from('ratings')
      .select('id')
      .eq('booking_id', bookingId)
      .maybeSingle()

    if (reviewError) throw reviewError

    if (existingReview) {
      return { data: { canReview: false, reason: 'You have already reviewed this task.' }, error: null }
    }

    return { data: { canReview: true }, error: null }
  } catch (error) {
    console.error('Error checking review eligibility:', error)
    return { data: null, error }
  }
}
