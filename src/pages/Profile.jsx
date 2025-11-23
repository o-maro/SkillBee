import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabaseClient'
import styles from './Profile.module.css'

const AVATAR_BUCKET = import.meta.env.VITE_SUPABASE_AVATAR_BUCKET || 'avatars'

export const Profile = () => {
  const { profile, loadProfile, loading: authLoading, user } = useAuth()
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
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

    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size must be less than 5MB')
      return
    }

    const previousAvatar = avatarUrl
    const previewUrl = URL.createObjectURL(file)
    setAvatarUrl(previewUrl)
    setUploading(true)
    setMessage('')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = fileName

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      const { data, error: publicUrlError } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(filePath)

      if (publicUrlError) throw publicUrlError

      const publicUrl = data?.publicUrl

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
      setAvatarUrl(previousAvatar)
      const friendlyMessage = error?.message?.toLowerCase().includes('bucket')
        ? 'Profile photos bucket missing. Please create a public "avatars" bucket in Supabase.'
        : error?.message || 'Failed to upload profile picture. Please try again.'
      setMessage(friendlyMessage)
    } finally {
      setUploading(false)
      URL.revokeObjectURL(previewUrl)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          bio: formData.bio,
          address: formData.address,
        })
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
        <h1>My Profile</h1>
        <div className={styles.profileCard}>
          <p>Profile not found. Please contact support.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Profile</h1>
        <p className={styles.subtitle}>Manage your personal information</p>
      </div>

      <div className={styles.profileSection}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarContainer}>
            <div className={styles.avatarWrapper}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className={styles.avatar} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
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
            <h2>{profile.full_name || 'User'}</h2>
            <p className={styles.email}>{profile.email}</p>
            <div className={styles.roleBadge}>
              <span className={styles.roleIcon}>👤</span>
              {profile.role === 'client' ? 'Client' : 'Tasker'}
            </div>
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
          <div className={styles.statIcon}>📧</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Email Verified</p>
            <p className={styles.statValue}>Yes</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📱</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Phone</p>
            <p className={styles.statValue}>{profile.phone || 'Not provided'}</p>
          </div>
        </div>
      </div>

      <div className={styles.profileCard}>
        <h3 className={styles.sectionTitle}>Personal Information</h3>
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

          <div className={styles.formGroup}>
            <label htmlFor="address">Address</label>
            <input
              id="address"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your address"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="4"
              placeholder="Tell us about yourself..."
              maxLength={500}
            />
            <small>{formData.bio.length}/500 characters</small>
          </div>

          <div className={styles.formGroup}>
            <label>Account Type</label>
            <input
              type="text"
              value={profile.role === 'client' ? 'Client' : 'Tasker'}
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


