import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabaseClient'
import styles from './Profile.module.css'

export const TaskerProfile = () => {
  const { profile, loadProfile, loading: authLoading, user } = useAuth()
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    skills: '',
    hourly_rate: '',
    bio: '',
    address: '',
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        email: profile.email || '',
        skills: profile.skills || '',
        hourly_rate: profile.hourly_rate || '',
        bio: profile.bio || '',
        address: profile.address || '',
      })
      setAvatarUrl(profile.avatar_url || null)
    }
  }, [profile])

  useEffect(() => {
    if (!profile && user && !authLoading) {
      loadProfile(user.id)
    }
  }, [profile, user, authLoading, loadProfile])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size must be less than 5MB')
      return
    }

    setUploading(true)
    setMessage('')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      await loadProfile(profile.id)
      setMessage('Profile picture updated successfully!')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      setMessage('Failed to upload profile picture. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const updateData = {
        full_name: formData.full_name,
        phone: formData.phone,
        skills: formData.skills,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        bio: formData.bio,
        address: formData.address,
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', profile.id)

      if (error) throw error

      await loadProfile(profile.id)
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
            {profile.hourly_rate && (
              <div className={styles.rateBadge}>
                ${profile.hourly_rate}/hour
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
              {profile.hourly_rate ? `$${profile.hourly_rate}` : 'Not set'}
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
              <label htmlFor="hourly_rate">Hourly Rate ($)</label>
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
            <label htmlFor="skills">Skills</label>
            <input
              id="skills"
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g., Plumbing, Electrical, Cleaning (comma-separated)"
            />
            <small>Separate multiple skills with commas</small>
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
    </div>
  )
}
