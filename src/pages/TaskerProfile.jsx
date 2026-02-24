import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabaseClient'
import { updateTaskerProfile, getTaskerRatings } from '../utils/taskerApi'
import { RatingStars } from '../components/RatingStars'
import { formatCurrency } from '../utils/currency'
import styles from './Profile.module.css'

// Common service types
const SERVICE_TYPES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Carpentry',
  'Painting',
  'Landscaping',
  'Moving',
  'Handyman',
  'Appliance Repair',
  'HVAC',
  'Roofing',
  'Flooring',
]

export const TaskerProfile = () => {
  const { profile, loadProfile, loading: authLoading, user } = useAuth()
  const [taskerData, setTaskerData] = useState(null)
  const [ratings, setRatings] = useState([])
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    services_offered: [],
    hourly_rate: '',
    bio: '',
    address: '',
    is_available: true,
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const loadTaskerData = async () => {
      if (profile) {
        // Load tasker-specific data
        const { data: tasker, error } = await supabase
          .from('taskers')
          .select('*')
          .eq('tasker_id', profile.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading tasker data:', error)
        }

        setTaskerData(tasker)

        // Load ratings
        const { data: ratingsData } = await getTaskerRatings(profile.id)
        setRatings(ratingsData || [])

        setFormData({
          full_name: profile.full_name || '',
          phone: profile.phone || profile.phone_number || '',
          email: profile.email || '',
          services_offered: tasker?.services_offered || [],
          hourly_rate: tasker?.hourly_rate || profile.hourly_rate || '',
          bio: profile.bio || '',
          address: profile.address || '',
          is_available: tasker?.is_available !== false,
        })
        setAvatarUrl(profile.avatar_url || null)
      }
    }

    loadTaskerData()
  }, [profile])

  useEffect(() => {
    if (!profile && user && !authLoading) {
      loadProfile(user.id)
    }
  }, [profile, user, authLoading, loadProfile])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const handleServiceToggle = (service) => {
    setFormData({
      ...formData,
      services_offered: formData.services_offered.includes(service)
        ? formData.services_offered.filter((s) => s !== service)
        : [...formData.services_offered, service],
    })
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !profile) {
      setMessage('Please select a file')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file (JPG, PNG, etc.)')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size must be less than 5MB')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setUploading(true)
    setMessage('')

    // Create preview URL for immediate feedback
    const previewUrl = URL.createObjectURL(file)
    const previousAvatar = avatarUrl
    setAvatarUrl(previewUrl)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = fileName

      console.log('Uploading avatar to:', filePath)

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { 
          cacheControl: '3600',
          upsert: true 
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        // Check if bucket doesn't exist
        if (uploadError.message?.includes('Bucket') || uploadError.message?.includes('bucket')) {
          throw new Error('Storage bucket "avatars" not found. Please create it in Supabase Storage.')
        }
        throw uploadError
      }

      console.log('✅ Upload successful:', uploadData)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const publicUrl = urlData?.publicUrl

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded image')
      }

      console.log('✅ Public URL:', publicUrl)

      // Update profile with avatar URL in users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (updateError) {
        console.error('❌ Update error:', updateError)
        throw updateError
      }

      console.log('✅ Profile updated in database')

      // Revoke preview URL and set actual URL
      URL.revokeObjectURL(previewUrl)
      setAvatarUrl(publicUrl)
      
      // Clear file input immediately
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Set uploading to false immediately after successful upload
      console.log('✅ Setting uploading to false')
      setUploading(false)
      setMessage('Profile picture updated successfully!')
      console.log('✅ Upload complete - UI should update now')
      
      // Reload profile in the background (non-blocking)
      // Don't await this - let it happen in the background
      loadProfile(profile.id).catch((err) => {
        console.error('Error reloading profile after avatar upload:', err)
        // Don't show error to user - upload was successful
      })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      // Revert to previous avatar on error
      setAvatarUrl(previousAvatar)
      URL.revokeObjectURL(previewUrl)
      
      // Provide user-friendly error message
      let errorMessage = 'Failed to upload profile picture. '
      if (error.message?.includes('bucket')) {
        errorMessage += 'Please ensure the "avatars" storage bucket exists in Supabase.'
      } else if (error.message) {
        errorMessage += error.message
      } else {
        errorMessage += 'Please try again.'
      }
      setMessage(errorMessage)
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const updateFields = {
        full_name: formData.full_name,
        phone: formData.phone,
        bio: formData.bio,
        avatar_url: avatarUrl,
        address: formData.address,
        services_offered: formData.services_offered,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        is_available: formData.is_available,
      }

      const { data, error } = await updateTaskerProfile(profile.id, updateFields)
      if (error) throw error

      await loadProfile(profile.id)
      
      // Reload tasker data
      const { data: tasker } = await supabase
        .from('taskers')
        .select('*')
        .eq('tasker_id', profile.id)
        .single()
      setTaskerData(tasker)

      setMessage('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Wait for auth to finish loading
  if (authLoading) {
    return <div className={styles.loading}>Loading...</div>
  }

  // If profile is null after loading, show a message
  if (!profile) {
    return (
      <div className={styles.container}>
        <h1>Tasker Profile</h1>
        <div className={styles.profileCard}>
          <p>Profile not found. Please contact support.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tasker Profile</h1>
        <p className={styles.subtitle}>Manage your professional information</p>
      </div>

      <div className={styles.profileSection}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarContainer}>
            <div className={styles.avatarWrapper}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className={styles.avatar} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {profile.full_name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
              )}
              {uploading && <div className={styles.uploadOverlay}>Uploading...</div>}
            </div>
            <button
              type="button"
              onClick={handleAvatarClick}
              className={styles.avatarButton}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Change Photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
          </div>
          <div className={styles.profileInfo}>
            <h2>{profile.full_name || 'Tasker'}</h2>
            <p className={styles.email}>{profile.email}</p>
            <div className={styles.roleBadge}>
              <span className={styles.roleIcon}>🔧</span>
              Professional Tasker
            </div>
            {(taskerData?.hourly_rate || profile.hourly_rate) && (
              <div className={styles.rateBadge}>
                {formatCurrency(taskerData?.hourly_rate || profile.hourly_rate)}/hour
              </div>
            )}
            {ratings.length > 0 && (
              <div className={styles.ratingBadge}>
                <RatingStars rating={ratings.reduce((sum, r) => sum + (r.score || 0), 0) / ratings.length} />
                <span className={styles.ratingText}>
                  ({ratings.length} {ratings.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.statsSection}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📅</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Member Since</p>
            <p className={styles.statValue}>
              {profile.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })
                : 'N/A'}
            </p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Hourly Rate</p>
            <p className={styles.statValue}>
              {profile.hourly_rate ? formatCurrency(profile.hourly_rate) : 'Not set'}
            </p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🛠️</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Skills</p>
            <p className={styles.statValue}>
              {profile.skills ? profile.skills.split(',').length : 0} listed
            </p>
          </div>
        </div>
      </div>

      <div className={styles.profileCard}>
        <h3 className={styles.sectionTitle}>Professional Information</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="full_name">Full Name</label>
              <input
                id="full_name"
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              disabled
              className={styles.disabled}
              placeholder="Email cannot be changed"
            />
            <small>Email cannot be changed</small>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="hourly_rate">Hourly Rate (UGX)</label>
              <input
                id="hourly_rate"
                type="number"
                name="hourly_rate"
                value={formData.hourly_rate}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="address">Location</label>
              <input
                id="address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your location"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Services Offered</label>
            <div className={styles.servicesGrid}>
              {SERVICE_TYPES.map((service) => (
                <label key={service} className={styles.serviceCheckbox}>
                  <input
                    type="checkbox"
                    checked={formData.services_offered.includes(service)}
                    onChange={() => handleServiceToggle(service)}
                  />
                  <span>{service}</span>
                </label>
              ))}
            </div>
            <small>Select all services you offer</small>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                name="is_available"
                checked={formData.is_available}
                onChange={handleChange}
                className={styles.toggleInput}
              />
              <span className={styles.toggleText}>
                {formData.is_available ? 'Available for new tasks' : 'Not available'}
              </span>
            </label>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="bio">Professional Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="4"
              placeholder="Describe your experience and expertise..."
              maxLength={500}
            />
            <small>{formData.bio.length}/500 characters</small>
          </div>

          <div className={styles.formGroup}>
            <label>Account Type</label>
            <input
              type="text"
              value="Tasker"
              disabled
              className={styles.disabled}
            />
            <small>Role cannot be changed</small>
          </div>

          {message && (
            <div className={message.includes('success') ? styles.success : styles.error}>
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Updating...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {ratings.length > 0 && (
        <div className={styles.profileCard}>
          <h3 className={styles.sectionTitle}>Reviews & Ratings</h3>
          <div className={styles.ratingsList}>
            {ratings.map((rating) => (
              <div key={rating.rating_id || rating.id} className={styles.ratingItem}>
                <div className={styles.ratingHeader}>
                  <RatingStars rating={rating.score} />
                  <span className={styles.ratingDate}>
                    {new Date(rating.created_at).toLocaleDateString()}
                  </span>
                </div>
                {rating.review && (
                  <p className={styles.reviewText}>{rating.review}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
