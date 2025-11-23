import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabaseClient'
import styles from './Book.module.css'

export const Book = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    service_type: '',
    budget: '',
    location: '',
    notes: '',
  })
  const [availableTaskers, setAvailableTaskers] = useState([])
  const [selectedTasker, setSelectedTasker] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const searchTaskers = async () => {
    if (!formData.location) {
      setError('Please enter a location to search for taskers')
      return
    }

    setSearching(true)
    setError('')

    try {
      // Call the RPC function to match taskers by proximity
      const { data, error: rpcError } = await supabase.rpc('match_taskers_by_proximity', {
        client_location: formData.location,
        service_type: formData.service_type || null,
      })

      if (rpcError) throw rpcError

      setAvailableTaskers(data || [])
      if (data && data.length === 0) {
        setError('No available taskers found for this location')
      }
    } catch (err) {
      console.error('Error searching taskers:', err)
      setError('Failed to search for taskers. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.service_type || !formData.budget || !formData.location) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      const bookingData = {
        client_id: profile.id,
        service_type: formData.service_type,
        budget: parseFloat(formData.budget),
        location: formData.location,
        notes: formData.notes || null,
        status: selectedTasker ? 'assigned' : 'pending',
        tasker_id: selectedTasker || null,
      }

      const { error: insertError } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single()

      if (insertError) throw insertError

      navigate('/tasks')
    } catch (err) {
      console.error('Error creating booking:', err)
      setError(err.message || 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h1>Book a Task</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="service_type">Service Type *</label>
          <select
            id="service_type"
            name="service_type"
            value={formData.service_type}
            onChange={handleChange}
            required
          >
            <option value="">Select a service</option>
            <option value="cleaning">Cleaning</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="carpentry">Carpentry</option>
            <option value="painting">Painting</option>
            <option value="gardening">Gardening</option>
            <option value="moving">Moving</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="budget">Budget ($) *</label>
          <input
            id="budget"
            type="number"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="location">Location *</label>
          <input
            id="location"
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Enter your address or location"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
            placeholder="Additional details about the task..."
          />
        </div>

        <div className={styles.searchSection}>
          <button
            type="button"
            onClick={searchTaskers}
            disabled={searching || !formData.location}
            className={styles.searchBtn}
          >
            {searching ? 'Searching...' : 'Find Available Taskers'}
          </button>
        </div>

        {availableTaskers.length > 0 && (
          <div className={styles.taskersList}>
            <h3>Available Taskers</h3>
            {availableTaskers.map((tasker) => (
              <div
                key={tasker.id}
                className={`${styles.taskerCard} ${
                  selectedTasker === tasker.id ? styles.selected : ''
                }`}
                onClick={() => setSelectedTasker(tasker.id)}
              >
                <div>
                  <h4>{tasker.full_name || 'Tasker'}</h4>
                  <p>Distance: {tasker.distance ? `${tasker.distance.toFixed(2)} km` : 'N/A'}</p>
                  {tasker.rating && <p>Rating: {tasker.rating}/5</p>}
                </div>
                {selectedTasker === tasker.id && (
                  <span className={styles.checkmark}>✓</span>
                )}
              </div>
            ))}
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Creating Booking...' : 'Create Booking'}
        </button>
      </form>
    </div>
  )
}

