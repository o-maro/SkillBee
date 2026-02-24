import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabaseClient'
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getBookingWithUsers,
} from '../utils/messagingApi'
import { formatCurrency } from '../utils/currency'
import styles from './Messages.module.css'

export const Messages = () => {
  const { profile } = useAuth()
  const location = useLocation()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!profile) return

    try {
      const { data, error: convError } = await getConversations(profile.id)
      if (convError) throw convError
      setConversations(data || [])
    } catch (err) {
      console.error('Error loading conversations:', err)
      setError('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [profile])

  // Load messages for selected conversation
  const loadMessages = useCallback(
    async (bookingId) => {
      if (!bookingId) return

      try {
        const { data, error: messagesError } = await getMessages(bookingId)
        if (messagesError) throw messagesError
        setMessages(data || [])

        // Mark messages as read
        if (profile) {
          await markMessagesAsRead(bookingId, profile.id)
          // Refresh conversations to update unread count
          loadConversations()
        }
      } catch (err) {
        console.error('Error loading messages:', err)
        setError('Failed to load messages')
      }
    },
    [profile, loadConversations]
  )

  // Handle conversation selection
  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation)
    await loadMessages(conversation.booking.id)
  }

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || sending) return

    setSending(true)
    setError('')

    try {
      const receiverId =
        selectedConversation.booking.client_id === profile.id
          ? selectedConversation.booking.tasker_id
          : selectedConversation.booking.client_id

      const { data, error: sendError } = await sendMessage(
        selectedConversation.booking.id,
        profile.id,
        receiverId,
        newMessage
      )

      if (sendError) throw sendError

      // Add message to local state
      setMessages((prev) => [...prev, data])
      setNewMessage('')

      // Refresh conversations to update latest message
      loadConversations()
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!selectedConversation) return

    const channel = supabase
      .channel(`messages:${selectedConversation.booking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${selectedConversation.booking.id}`,
        },
        (payload) => {
          // Add new message to state
          setMessages((prev) => [...prev, payload.new])
          // Refresh conversations
          loadConversations()
          // Mark as read if it's for current user
          if (payload.new.receiver_id === profile.id) {
            markMessagesAsRead(selectedConversation.booking.id, profile.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation, profile, loadConversations])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Handle navigation state (when coming from Tasks/TaskerDashboard with bookingId)
  useEffect(() => {
    if (location.state?.bookingId && conversations.length > 0) {
      const conversation = conversations.find(
        (conv) => conv.booking.id === location.state.bookingId
      )
      if (conversation && selectedConversation?.booking.id !== conversation.booking.id) {
        handleSelectConversation(conversation)
        // Clear the state to avoid re-selecting on re-render
        window.history.replaceState({}, document.title)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, conversations])

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading messages...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h1>Messages</h1>

      {conversations.length === 0 ? (
        <div className={styles.empty}>
          <p>No conversations yet.</p>
          <p className={styles.emptySubtext}>
            Start a conversation by selecting a tasker for your booking, or wait for a client to
            select you.
          </p>
        </div>
      ) : (
        <div className={styles.messagesLayout}>
          {/* Conversations List */}
          <div className={styles.conversationsList}>
            <h2>Conversations</h2>
            {conversations.map((conversation) => (
              <div
                key={conversation.booking.id}
                className={`${styles.conversationItem} ${
                  selectedConversation?.booking.id === conversation.booking.id
                    ? styles.active
                    : ''
                }`}
                onClick={() => handleSelectConversation(conversation)}
              >
                <div className={styles.conversationHeader}>
                  <h3>{conversation.otherUser.full_name || 'Unknown User'}</h3>
                  {conversation.unreadCount > 0 && (
                    <span className={styles.unreadBadge}>{conversation.unreadCount}</span>
                  )}
                </div>
                <p className={styles.conversationService}>{conversation.booking.service_type}</p>
                {conversation.latestMessage && (
                  <p className={styles.conversationPreview}>
                    {conversation.latestMessage.content.substring(0, 50)}
                    {conversation.latestMessage.content.length > 50 ? '...' : ''}
                  </p>
                )}
                <p className={styles.conversationTime}>
                  {conversation.latestMessage
                    ? new Date(conversation.latestMessage.created_at).toLocaleDateString()
                    : new Date(conversation.booking.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          {/* Messages Area */}
          <div className={styles.messagesArea}>
            {selectedConversation ? (
              <>
                <div className={styles.messagesHeader}>
                  <div>
                    <h2>{selectedConversation.otherUser.full_name || 'Unknown User'}</h2>
                    <p className={styles.bookingInfo}>
                      {selectedConversation.booking.service_type} •{' '}
                      {formatCurrency(selectedConversation.booking.budget)} •{' '}
                      {selectedConversation.booking.location}
                    </p>
                  </div>
                </div>

                <div className={styles.messagesList} ref={messagesContainerRef}>
                  {messages.length === 0 ? (
                    <div className={styles.emptyMessages}>
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.sender_id === profile.id
                      return (
                        <div
                          key={message.id}
                          className={`${styles.messageItem} ${
                            isOwnMessage ? styles.ownMessage : styles.otherMessage
                          }`}
                        >
                          <div className={styles.messageContent}>
                            <p>{message.content}</p>
                            <span className={styles.messageTime}>
                              {new Date(message.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className={styles.messageForm}>
                  {error && <div className={styles.error}>{error}</div>}
                  <div className={styles.messageInputContainer}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className={styles.messageInput}
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className={styles.sendButton}
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className={styles.noSelection}>
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

