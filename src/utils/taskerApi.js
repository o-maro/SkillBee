import { supabase } from './supabaseClient'

/**
 * Get all bookings assigned to a tasker
 */
export const getTaskerBookings = async (taskerId) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('tasker_id', taskerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching tasker bookings:', error)
    return { data: null, error }
  }
}

/**
 * Get task requests specifically offered to this tasker (client selected them during booking)
 */
export const getOfferedRequests = async (taskerId) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('tasker_id', taskerId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching offered requests:', error)
    return { data: null, error }
  }
}

/**
 * Decline a task that was offered to this tasker (returns it to the open pool)
 */
export const declineTaskRequest = async (bookingId, taskerId) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ tasker_id: null })
      .eq('id', bookingId)
      .eq('tasker_id', taskerId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error declining task request:', error)
    return { data: null, error }
  }
}

/**
 * Get available task requests that match tasker's services (open pool - no tasker selected)
 */
export const getAvailableRequests = async (taskerId) => {
  try {
    // First get tasker's services_offered
    const { data: taskerData, error: taskerError } = await supabase
      .from('taskers')
      .select('services_offered')
      .eq('tasker_id', taskerId)
      .single()

    if (taskerError) throw taskerError

    const servicesOffered = taskerData?.services_offered || []

    // Get all pending bookings with no tasker assigned
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'pending')
      .is('tasker_id', null)
      .order('created_at', { ascending: false })

    if (bookingsError) throw bookingsError

    // If tasker hasn't specified services yet (empty array), show all bookings
    // Otherwise, filter by matching service_type
    const available = servicesOffered.length === 0
      ? (bookings || [])  // Show all if no services specified
      : (bookings || []).filter((booking) =>
          servicesOffered.includes(booking.service_type)
        )

    return { data: available, error: null }
  } catch (error) {
    console.error('Error fetching available requests:', error)
    return { data: null, error }
  }
}

/**
 * Accept a task request
 */
export const acceptTaskRequest = async (bookingId, taskerId) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        tasker_id: taskerId,
        status: 'assigned',
      })
      .eq('id', bookingId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error accepting task request:', error)
    return { data: null, error }
  }
}

/**
 * Get tasker ratings and reviews
 */
export const getTaskerRatings = async (taskerId) => {
  try {
    // Get ratings where tasker_id matches
    // Note: ratings table references task_id from tasks table
    // We'll need to join with bookings to get ratings for this tasker
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('tasker_id', taskerId)
      .eq('status', 'completed')

    if (bookingsError) throw bookingsError

    const bookingIds = bookings?.map((b) => b.id) || []

    if (bookingIds.length === 0) {
      return { data: [], error: null }
    }

    // Get ratings - assuming ratings.task_id can reference bookings.id
    // If your schema uses tasks table, you may need to adjust this
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('*')
      .eq('tasker_id', taskerId)
      .order('created_at', { ascending: false })

    if (ratingsError) throw ratingsError

    return { data: ratings || [], error: null }
  } catch (error) {
    console.error('Error fetching tasker ratings:', error)
    return { data: null, error }
  }
}

/**
 * Get tasker wallet information
 */
export const getTaskerWallet = async (taskerId) => {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', taskerId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
    return { data: data || null, error: null }
  } catch (error) {
    console.error('Error fetching tasker wallet:', error)
    return { data: null, error }
  }
}

/**
 * Get tasker transaction history
 */
export const getTaskerTransactions = async (taskerId) => {
  try {
    // Get wallet first
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('wallet_id')
      .eq('user_id', taskerId)
      .single()

    if (walletError && walletError.code !== 'PGRST116') throw walletError

    if (!wallet) {
      return { data: [], error: null }
    }

    // Get transactions for this wallet
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', wallet.wallet_id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching tasker transactions:', error)
    return { data: null, error }
  }
}

/**
 * Get nearby tasks based on tasker location
 */
export const getNearbyTasks = async (taskerLocation) => {
  try {
    if (!taskerLocation?.latitude || !taskerLocation?.longitude) {
      return { data: [], error: null }
    }

    // Get all pending bookings with location data
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'pending')
      .is('tasker_id', null)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Filter by distance (simple distance calculation)
    // In production, you'd want to use PostGIS or a more sophisticated approach
    const nearby = data?.filter((booking) => {
      if (!booking.latitude || !booking.longitude) return false
      const distance = calculateDistance(
        taskerLocation.latitude,
        taskerLocation.longitude,
        booking.latitude,
        booking.longitude
      )
      return distance <= 50 // Within 50km
    }) || []

    return { data: nearby, error: null }
  } catch (error) {
    console.error('Error fetching nearby tasks:', error)
    return { data: null, error }
  }
}

/**
 * Update tasker profile
 */
export const updateTaskerProfile = async (id, fields) => {
  try {
    // Update users table
    const userFields = {
      full_name: fields.full_name,
      phone_number: fields.phone || fields.phone_number,
      bio: fields.bio,
      avatar_url: fields.avatar_url,
      address: fields.address,
      latitude: fields.latitude,
      longitude: fields.longitude,
    }

    // Remove undefined values
    Object.keys(userFields).forEach((key) => {
      if (userFields[key] === undefined) delete userFields[key]
    })

    const { data: userData, error: userError } = await supabase
      .from('users')
      .update(userFields)
      .eq('id', id)
      .select()
      .single()

    if (userError) throw userError

    // Update taskers table
    const taskerFields = {
      services_offered: fields.services_offered,
      hourly_rate: fields.hourly_rate,
      is_available: fields.is_available,
    }

    // Remove undefined values
    Object.keys(taskerFields).forEach((key) => {
      if (taskerFields[key] === undefined) delete taskerFields[key]
    })

    if (Object.keys(taskerFields).length > 0) {
      const { data: taskerData, error: taskerError } = await supabase
        .from('taskers')
        .upsert({
          tasker_id: id,
          ...taskerFields,
        })
        .select()
        .single()

      if (taskerError) throw taskerError
    }

    return { data: userData, error: null }
  } catch (error) {
    console.error('Error updating tasker profile:', error)
    return { data: null, error }
  }
}

/**
 * Helper function to calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

