import { supabase } from './supabaseClient'

/**
 * Fetch public profile details for a tasker including bio, reviews count, location and completed tasks
 * @param {string} taskerId 
 */
export const getTaskerPublicProfile = async (taskerId) => {
  try {
    // We can query users and taskers
    // For simplicity we can just make two queries or join if we have foreign keys on users/taskers
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('full_name, bio, location:address, avatar_url')
      .eq('id', taskerId)
      .single()

    if (userError) throw userError

    // Taskers table has stats
    const { data: taskerData, error: taskerError } = await supabase
      .from('taskers')
      .select('rating, total_reviews, completed_tasks, services_offered')
      .eq('tasker_id', taskerId)
      .single()

    if (taskerError && taskerError.code !== 'PGRST116') throw taskerError

    return { 
      data: {
        ...userData,
        rating: taskerData?.rating || 0.0,
        total_reviews: taskerData?.total_reviews || 0,
        completed_tasks: taskerData?.completed_tasks || 0,
        services_offered: taskerData?.services_offered || []
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Error fetching tasker public profile:', error)
    return { data: null, error }
  }
}

/**
 * Get stats for an array of taskers efficiently 
 * @param {string[]} taskerIds 
 */
export const getBatchTaskerStats = async (taskerIds) => {
  if (!taskerIds || taskerIds.length === 0) return { data: [], error: null }
  
  try {
    const { data, error } = await supabase
      .from('taskers')
      .select('tasker_id, rating, total_reviews, completed_tasks, users(address)')
      .in('tasker_id', taskerIds)

    if (error) throw error
    
    // Flatten the users.address out to top-level for conveniences
    const processedData = (data || []).map(row => ({
      ...row,
      address: row.users?.address || null
    }))
    
    return { data: processedData, error: null }
  } catch (error) {
    console.error('Error fetching batch tasker stats:', error)
    return { data: [], error }
  }
}
