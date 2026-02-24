import { supabase } from './supabaseClient'

/**
 * Get all conversations (bookings with messages) for the current user
 */
export const getConversations = async (userId) => {
  try {
    // Get all bookings where user is either client or tasker
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .or(`client_id.eq.${userId},tasker_id.eq.${userId}`)
      .not('tasker_id', 'is', null) // Only bookings with assigned taskers
      .order('created_at', { ascending: false })

    if (bookingsError) throw bookingsError

    // For each booking, get the latest message and unread count
    const conversations = await Promise.all(
      (bookings || []).map(async (booking) => {
        // Get the other user's info
        const otherUserId = booking.client_id === userId ? booking.tasker_id : booking.client_id
        
        const { data: otherUser } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('id', otherUserId)
          .single()

        // Get latest message
        const { data: latestMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('booking_id', booking.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('booking_id', booking.id)
          .eq('receiver_id', userId)
          .eq('read', false)

        return {
          booking,
          otherUser: otherUser || { id: otherUserId, full_name: 'Unknown User' },
          latestMessage,
          unreadCount: unreadCount || 0,
        }
      })
    )

    return { data: conversations, error: null }
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return { data: null, error }
  }
}

/**
 * Get all messages for a specific booking
 */
export const getMessages = async (bookingId) => {
  try {
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })

    if (messagesError) throw messagesError

    // Get sender and receiver info for each message
    if (messages && messages.length > 0) {
      const userIds = [...new Set([...messages.map(m => m.sender_id), ...messages.map(m => m.receiver_id)])]
      
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds)

      const usersMap = (users || []).reduce((acc, user) => {
        acc[user.id] = user
        return acc
      }, {})

      const messagesWithUsers = messages.map(message => ({
        ...message,
        sender: usersMap[message.sender_id] || { id: message.sender_id, full_name: 'Unknown', email: '' },
        receiver: usersMap[message.receiver_id] || { id: message.receiver_id, full_name: 'Unknown', email: '' },
      }))

      return { data: messagesWithUsers, error: null }
    }

    return { data: [], error: null }
  } catch (error) {
    console.error('Error fetching messages:', error)
    return { data: null, error }
  }
}

/**
 * Send a message
 */
export const sendMessage = async (bookingId, senderId, receiverId, content) => {
  try {
    if (!content || !content.trim()) {
      return { data: null, error: { message: 'Message content cannot be empty' } }
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          booking_id: bookingId,
          sender_id: senderId,
          receiver_id: receiverId,
          content: content.trim(),
          read: false,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error sending message:', error)
    return { data: null, error }
  }
}

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (bookingId, userId) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('booking_id', bookingId)
      .eq('receiver_id', userId)
      .eq('read', false)

    if (error) throw error
    return { data: true, error: null }
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return { data: null, error }
  }
}

/**
 * Get booking details with user info
 */
export const getBookingWithUsers = async (bookingId, currentUserId) => {
  try {
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError) throw bookingError

    // Get client info
    const { data: client } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', booking.client_id)
      .single()

    // Get tasker info
    const { data: tasker } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', booking.tasker_id)
      .single()

    const otherUser = booking.client_id === currentUserId ? tasker : client

    return {
      data: {
        booking,
        otherUser: otherUser || { id: booking.tasker_id || booking.client_id, full_name: 'Unknown User' },
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching booking with users:', error)
    return { data: null, error }
  }
}

