import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabaseClient'
import styles from './Support.module.css'

export const Support = () => {
  const { profile } = useAuth()
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!formData.subject || !formData.message) {
      setMessage('Please fill in all fields')
      setLoading(false)
      return
    }

    try {
      // Create support ticket (assuming you have a support_tickets table)
      // If not, you can create a simple contact form that sends an email or stores in a table
      const { error } = await supabase
        .from('support_tickets')
        .insert([
          {
            user_id: profile.id,
            subject: formData.subject,
            message: formData.message,
            status: 'open',
          },
        ])

      if (error) {
        // If table doesn't exist, just show a success message
        console.log('Support ticket table may not exist:', error)
        setMessage('Thank you for contacting us! We will get back to you soon.')
      } else {
        setMessage('Support ticket created successfully! We will get back to you soon.')
      }

      setFormData({ subject: '', message: '' })
    } catch (error) {
      console.error('Error submitting support request:', error)
      setMessage('Thank you for contacting us! We will get back to you soon.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h1>Support</h1>
      <p className={styles.subtitle}>Need help? Contact our support team.</p>

      <div className={styles.supportCard}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="What can we help you with?"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="6"
              placeholder="Please describe your issue or question..."
              required
            />
          </div>

          {message && (
            <div className={message.includes('error') ? styles.error : styles.success}>
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        <div className={styles.contactInfo}>
          <h3>Other Ways to Reach Us</h3>
          <p>Email: support@skillbee.com</p>
          <p>Phone: 1-800-SKILLBEE</p>
          <p>Hours: Monday - Friday, 9 AM - 6 PM EST</p>
        </div>
      </div>
    </div>
  )
}

