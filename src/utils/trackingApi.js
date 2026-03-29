import { supabase } from './supabaseClient'

/**
 * Initialize a new tracking record when a task is officially "accepted".
 * Automatically enforces the state natively inside Postgres.
 * @param {string} bookingId 
 * @param {string} taskerId 
 * @param {string} clientId 
 * @returns {Promise<{data: any, error: any}>}
 */
export const initializeTaskTracking = async (bookingId, taskerId, clientId) => {
  try {
    const { data, error } = await supabase
      .from('task_tracking')
      .insert({
        booking_id: bookingId,
        tasker_id: taskerId,
        client_id: clientId,
        status: 'accepted'
      })
      .select()
      .single()
      
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error initializing tracking logic:', error)
    return { data: null, error }
  }
}

/**
 * Emit a non-destructive ping updating solely the tasker's current physical coordinates
 * Designed specifically not to trigger milestone logical overlaps heavily.
 * @param {string} bookingId 
 * @param {number} lat 
 * @param {number} lng 
 */
export const updateTaskerLocation = async (bookingId, lat, lng) => {
  try {
    const { data, error } = await supabase
      .from('task_tracking')
      .update({
        tasker_lat: lat,
        tasker_lng: lng,
        updated_at: new Date().toISOString()
      })
      .eq('booking_id', bookingId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error pushing tasker ping location:', error)
    return { data: null, error }
  }
}

/**
 * Bump the progress string milestone gracefully. 
 * Due to the PostgreSQL rules created in setup-task-tracking, illegal skips (e.g. accepted -> completed)
 * will organically throw a database-level rejection guarding state integrities transparently.
 * @param {string} bookingId 
 * @param {string} newStatus 'en_route', 'arrived', 'in_progress', 'completed'
 */
export const updateTrackingMilestone = async (bookingId, newStatus) => {
  try {
    const { data, error } = await supabase
      .from('task_tracking')
      .update({
        status: newStatus
      })
      .eq('booking_id', bookingId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error pushing milestone progression marker:', error)
    return { data: null, error }
  }
}

/**
 * Returns the exact snapshot of the current tracking model without WebSockets.
 * @param {string} bookingId 
 */
export const getTaskTrackingState = async (bookingId) => {
  try {
    const { data, error } = await supabase
      .from('task_tracking')
      .select('*')
      .eq('booking_id', bookingId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching tracker snapshot:', error)
    return { data: null, error }
  }
}

/**
 * Initializes a Supabase Realtime Subscription hooked implicitly to structural 
 * ROW updates mapped exactly onto the given tracking booking.
 * Returns the distinct subscription object explicitly allowing seamless teardowns on Unmounts.
 * @param {string} bookingId 
 * @param {Function} onUpdateCallback 
 */
export const subscribeToTaskTracking = (bookingId, onUpdateCallback) => {
  const channel = supabase
    .channel(`tracking_${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'task_tracking',
        filter: `booking_id=eq.${bookingId}`
      },
      (payload) => {
        // Fire external UX hooks safely bypassing the react dom hierarchy
        onUpdateCallback(payload.new)
      }
    )
    .subscribe()

  return channel
}
