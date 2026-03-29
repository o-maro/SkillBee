import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabaseClient'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { TaskerDetailModal } from '../components/TaskerDetailModal'
import { getBatchTaskerStats } from '../utils/publicProfileApi'
import { Star, MapPin } from 'lucide-react'
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
  const [detailModalTaskerId, setDetailModalTaskerId] = useState(null)

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

      // Fetch additional stats seamlessly
      if (data && data.length > 0) {
        const taskerIds = data.map(t => t.id)
        const statsRes = await getBatchTaskerStats(taskerIds)
        
        if (statsRes.data && statsRes.data.length > 0) {
          // Merge stats into data
          const statsMap = statsRes.data.reduce((acc, curr) => {
            acc[curr.tasker_id] = curr
            return acc
          }, {})
          
          data.forEach(t => {
            if (statsMap[t.id]) {
               t.completed_tasks = statsMap[t.id].completed_tasks
               t.total_reviews = statsMap[t.id].total_reviews
               // Override rating gracefully in case accurate trigger computed a fresh average
               t.rating = statsMap[t.id].rating
               t.address = statsMap[t.id].address
            }
          })
        }
      }

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
        // When a tasker is selected, create as pending so they can accept/decline
        status: 'pending',
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
      <PageHeader 
        title="Book a Task" 
        subtitle="Tell us what you need help with and we'll match you with the best Taskers available."
      />

      <Card className={styles.formCard}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="service_type">Service Type *</label>
            <select
              id="service_type"
              name="service_type"
              value={formData.service_type}
              onChange={handleChange}
              required
              className={styles.select}
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

          <div className={styles.formRow}>
            <Input
              label="Budget ($) *"
              id="budget"
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />

            <Input
              label="Location *"
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
              className={styles.textarea}
            />
          </div>

          <div className={styles.searchSection}>
            <Button
              variant="secondary"
              type="button"
              onClick={searchTaskers}
              disabled={searching || !formData.location}
              className={styles.searchBtn}
            >
              {searching ? 'Searching...' : 'Find Available Taskers'}
            </Button>
          </div>

          {availableTaskers.length > 0 && (
            <div className={styles.taskersList}>
              <h3>Available Taskers</h3>
              <div className={styles.taskerGrid}>
                {availableTaskers.map((tasker) => (
                  <Card
                    key={tasker.id}
                    hoverable
                    className={`${styles.taskerCard} ${selectedTasker === tasker.id ? styles.selected : ''}`}
                    onClick={() => setSelectedTasker(tasker.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.taskerCardContent}>
                      <div className={styles.taskerMain}>
                         <div className={styles.taskerHeaderRow}>
                           <h4 className={styles.taskerName}>{tasker.full_name || 'Tasker'}</h4>
                           {tasker.services_offered && tasker.services_offered.length > 0 && (
                             <span className={styles.taskerServiceTag}>
                               {tasker.services_offered[0]}
                             </span>
                           )}
                         </div>
                         <div className={styles.taskerLocationWrapper}>
                           <MapPin size={14} className={styles.locationIcon} />
                           <p className={styles.taskerDetail}>
                             {tasker.address || 'Location not provided'}
                             <span className={styles.distanceBadge}>
                               {tasker.distance !== null && tasker.distance !== undefined 
                                 ? ` — ${tasker.distance.toFixed(2)} km away` 
                                 : ''}
                             </span>
                           </p>
                         </div>
                         
                         {/* compact stats view */}
                         <div className={styles.compactStats}>
                           <span className={styles.ratingBadge}>
                             <Star size={14} className={styles.starIcon} fill="currentColor" /> 
                             {tasker.rating ? tasker.rating.toFixed(1) : 'New'}
                           </span>
                           {tasker.completed_tasks > 0 && (
                             <span className={styles.tasksCompletedBadge}>
                               • {tasker.completed_tasks} {tasker.completed_tasks === 1 ? 'task' : 'tasks'}
                             </span>
                           )}
                         </div>
                      </div>

                      <div className={styles.taskerActions}>
                        <button
                          type="button"
                          className={styles.moreInfoBtn}
                          onClick={(e) => {
                            e.stopPropagation()
                            setDetailModalTaskerId(tasker.id)
                          }}
                        >
                          More info
                        </button>
                        {selectedTasker === tasker.id && (
                          <span className={styles.checkmark}>✓</span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading} 
            className={styles.submitBtn}
          >
            {loading ? 'Creating Booking...' : 'Create Booking'}
          </Button>
        </form>
      </Card>
      
      <TaskerDetailModal 
        isOpen={!!detailModalTaskerId} 
        onClose={() => setDetailModalTaskerId(null)} 
        taskerId={detailModalTaskerId}
        taskerBaseInfo={availableTaskers.find(t => t.id === detailModalTaskerId)}
      />
    </div>
  )
}

