import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabaseClient'
import { uploadFile } from '../utils/storageApi'
import styles from './TaskerOnboarding.module.css'

export const TaskerOnboarding = () => {
  const { profile, user, loading: authLoading, loadProfile } = useAuth()
  // Removed unused 'navigate' variable to fix lint error
  const [formData, setFormData] = useState({
    service_category: '',
    national_id_number: '',
    bio: '',
    hourly_rate: '',
    operating_radius: '',
  })
  const [idDocument, setIdDocument] = useState(null)
  const [passportPhoto, setPassportPhoto] = useState(null)
  const [certificate, setCertificate] = useState(null)
  const [cv, setCv] = useState(null)
  const [idDocumentPreview, setIdDocumentPreview] = useState(null)
  const [passportPhotoPreview, setPassportPhotoPreview] = useState(null)
  const [certificatePreview, setCertificatePreview] = useState(null)
  const [existingFilePaths, setExistingFilePaths] = useState({
    id_document_url: null,
    passport_photo_url: null,
    certificate_url: null,
    cv_url: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState({ id: 0, photo: 0, certificate: 0, cv: 0 })

  const checkExistingVerification = useCallback(async () => {
    if (!profile?.id) return

    try {
      const { data, error } = await supabase
        .from('tasker_verifications')
        .select('*')
        .eq('user_id', profile.id)
        .single()

      if (data && !error) {
        // Pre-fill form with existing data
        setFormData({
          service_category: data.service_category || '',
          national_id_number: data.national_id_number || '',
          bio: data.bio || '',
          hourly_rate: data.hourly_rate?.toString() || '',
          operating_radius: data.operating_radius?.toString() || '',
        })

        // Store existing file paths for resubmission
        setExistingFilePaths({
          id_document_url: data.id_document_url || null,
          passport_photo_url: data.passport_photo_url || null,
          certificate_url: data.certificate_url || null,
          cv_url: data.cv_url || null,
        })

        // Load previews if URLs exist
        if (data.id_document_url) {
          try {
            const { data: signedUrl, error: urlError } = await supabase.storage
              .from('tasker-documents')
              .createSignedUrl(data.id_document_url, 3600)
            if (signedUrl && !urlError) {
              setIdDocumentPreview(signedUrl.signedUrl)
            } else if (urlError) {
              console.warn('Error loading ID document preview:', urlError)
            }
          } catch (err) {
            console.error('Error generating signed URL for ID document:', err)
          }
        }

        if (data.passport_photo_url) {
          try {
            const { data: signedUrl, error: urlError } = await supabase.storage
              .from('tasker-documents')
              .createSignedUrl(data.passport_photo_url, 3600)
            if (signedUrl && !urlError) {
              setPassportPhotoPreview(signedUrl.signedUrl)
            } else if (urlError) {
              console.warn('Error loading passport photo preview:', urlError)
            }
          } catch (err) {
            console.error('Error generating signed URL for passport photo:', err)
          }
        }

        // Load certificate preview if exists
        if (data.certificate_url) {
          try {
            const { data: signedUrl, error: urlError } = await supabase.storage
              .from('tasker-documents')
              .createSignedUrl(data.certificate_url, 3600)
            if (signedUrl && !urlError) {
              setCertificatePreview(signedUrl.signedUrl)
            } else if (urlError) {
              console.warn('Error loading certificate preview:', urlError)
            }
          } catch (err) {
            console.error('Error generating signed URL for certificate:', err)
          }
        }

        // If status is rejected, show rejection reason
        if (data.status === 'rejected') {
          setError(`Your application was rejected. Reason: ${data.rejection_reason || 'No reason provided'}. You can resubmit below.`)
        }
      }
    } catch (err) {
      console.error('Error checking existing verification:', err)
    }
  }, [profile])

  // Try to load profile if user exists but profile is null
  useEffect(() => {
    if (!authLoading && user && !profile && loadProfile) {
      console.log('User exists but profile is null, attempting to load profile...')
      loadProfile(user.id).catch((err) => {
        console.error('Failed to load profile:', err)
        setError('Failed to load your profile. Please refresh the page.')
      })
    }
  }, [user, profile, authLoading, loadProfile])

  // Check if verification already exists (no redirects - guards handle routing)
  useEffect(() => {
    if (!authLoading && profile && profile.role === 'tasker') {
      checkExistingVerification()
    }
  }, [profile, authLoading, checkExistingVerification])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    // Clear any previous errors when a new file is selected
    if (error) setError('')

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    // Validate file type based on document type
    if (type === 'cv') {
      const allowedCvTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedCvTypes.includes(file.type)) {
        setError('Invalid file type for CV. Only PDF and Word documents are allowed.')
        return
      }
    } else {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only images (JPEG, PNG) and PDFs are allowed.')
        return
      }
    }

    if (type === 'id_document') {
      setIdDocument(file)
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => setIdDocumentPreview(reader.result)
        reader.readAsDataURL(file)
      } else {
        setIdDocumentPreview(null)
      }
    } else if (type === 'passport_photo') {
      setPassportPhoto(file)
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => setPassportPhotoPreview(reader.result)
        reader.readAsDataURL(file)
      }
    } else if (type === 'certificate') {
      setCertificate(file)
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => setCertificatePreview(reader.result)
        reader.readAsDataURL(file)
      } else {
        setCertificatePreview(null)
      }
    } else if (type === 'cv') {
      setCv(file)
      // CV is usually PDF, no preview needed
      setCertificatePreview(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Check if profile or user exists
    const userId = profile?.id || user?.id
    if (!userId) {
      setError('User session not found. Please log in again.')
      setLoading(false)
      return
    }

    // Validation
    if (!formData.service_category || !formData.national_id_number) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    // Check if required files are uploaded (either new files or existing previews)
    if ((!idDocument && !idDocumentPreview) || (!passportPhoto && !passportPhotoPreview)) {
      setError('Please upload both ID document and passport photo')
      setLoading(false)
      return
    }

    try {
      // Upload required files first (or use existing paths if no new files uploaded)
      // uploadFile returns the file path directly (userId/filename.ext)
      let idDocPath = existingFilePaths.id_document_url
      let photoPath = existingFilePaths.passport_photo_url

      // Upload new ID document if provided
      if (idDocument) {
        setUploadProgress({ id: 25, photo: 0, certificate: 0, cv: 0 })
        const { data: idDocUrl, error: idError } = await uploadFile(
          idDocument,
          userId,
          'id_document'
        )

        if (idError) {
          throw new Error(`Failed to upload ID document: ${idError.message}`)
        }

        idDocPath = idDocUrl
      }

      // Upload new passport photo if provided
      if (passportPhoto) {
        setUploadProgress({ id: idDocument ? 50 : 25, photo: idDocument ? 25 : 25, certificate: 0, cv: 0 })
        const { data: photoUrl, error: photoError } = await uploadFile(
          passportPhoto,
          userId,
          'passport_photo'
        )

        if (photoError) {
          throw new Error(`Failed to upload passport photo: ${photoError.message}`)
        }

        photoPath = photoUrl
      }
      
      // Ensure we have paths for required files
      if (!idDocPath || !photoPath) {
        throw new Error('ID document and passport photo are required')
      }

      // Upload optional professional documents (or use existing paths)
      let certificatePath = existingFilePaths.certificate_url
      let cvPath = existingFilePaths.cv_url

      if (certificate) {
        setUploadProgress({ id: 50, photo: 50, certificate: 25, cv: 0 })
        const { data: certUrl, error: certError } = await uploadFile(
          certificate,
          userId,
          'certificate'
        )

        if (certError) {
          throw new Error(`Failed to upload certificate: ${certError.message}`)
        }

        // uploadFile already returns the correct path format: userId/filename.ext
        certificatePath = certUrl || null
        setUploadProgress({ id: 50, photo: 50, certificate: 50, cv: 0 })
      }

      if (cv) {
        setUploadProgress({ id: 50, photo: 50, certificate: certificate ? 75 : 0, cv: 25 })
        const { data: cvUrl, error: cvError } = await uploadFile(
          cv,
          userId,
          'cv'
        )

        if (cvError) {
          throw new Error(`Failed to upload CV: ${cvError.message}`)
        }

        // uploadFile already returns the correct path format: userId/filename.ext
        cvPath = cvUrl || null
        setUploadProgress({ id: 50, photo: 50, certificate: certificate ? 100 : 0, cv: 50 })
      }

      setUploadProgress({ id: 100, photo: 100, certificate: certificate ? 100 : 0, cv: cv ? 100 : 0 })

      // Create or update verification record
      const verificationData = {
        user_id: userId,
        service_category: formData.service_category,
        national_id_number: formData.national_id_number,
        id_document_url: idDocPath,
        passport_photo_url: photoPath,
        certificate_url: certificatePath,
        cv_url: cvPath,
        bio: formData.bio || null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        operating_radius: formData.operating_radius ? parseFloat(formData.operating_radius) : null,
        status: 'pending',
      }

      const { error: upsertError } = await supabase
        .from('tasker_verifications')
        .upsert(verificationData, {
          onConflict: 'user_id',
        })

      if (upsertError) throw upsertError

      // Update user verification status
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ verification_status: 'pending' })
        .eq('id', userId)

      if (userUpdateError) {
        console.error('Error updating user verification status:', userUpdateError)
        // Don't throw - verification was created successfully
      }

      // Show success message - no redirect, guards will handle routing
      alert('Verification submitted successfully! Your application is under review. You will be notified once approved.')
    } catch (err) {
      console.error('Error submitting verification:', err)
      setError(err.message || 'Failed to submit verification. Please try again.')
    } finally {
      setLoading(false)
      setUploadProgress({ id: 0, photo: 0, certificate: 0, cv: 0 })
    }
  }

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}>Loading your profile...</div>
        </div>
      </div>
    )
  }

  // Show error if no user/profile
  if (!profile && !user) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.error}>
            <p>User session not found. Please <a href="/login">log in</a> again.</p>
          </div>
        </div>
      </div>
    )
  }

  // If user exists but profile is still loading, show loading state
  // This can happen after email confirmation before profile is created
  if (user && !profile) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}>
            <p>Setting up your profile...</p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
              Please wait while we create your tasker account.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // If profile exists but role is not tasker, redirect
  if (profile && profile.role !== 'tasker') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.error}>
            <p>This page is only for taskers. Redirecting...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Tasker Verification</h1>
        <p className={styles.subtitle}>
          Complete your profile to start accepting tasks. All information will be verified by our admin team.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="service_category">
              Service Category * <span className={styles.helpText}>(What services do you offer?)</span>
            </label>
            <select
              id="service_category"
              name="service_category"
              value={formData.service_category}
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
              <option value="handyman">Handyman</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="national_id_number">National ID Number *</label>
            <input
              id="national_id_number"
              type="text"
              name="national_id_number"
              value={formData.national_id_number}
              onChange={handleChange}
              placeholder="Enter your national ID number"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="id_document">
              National ID Document * <span className={styles.helpText}>(Image or PDF, max 10MB)</span>
            </label>
            <input
              id="id_document"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange(e, 'id_document')}
              required={!idDocumentPreview}
            />
            {idDocumentPreview && (
              <div className={styles.preview}>
                <img src={idDocumentPreview} alt="ID Document Preview" />
                <p>Preview of uploaded document</p>
              </div>
            )}
            {idDocument && !idDocumentPreview && (
              <p className={styles.fileName}>{idDocument.name} (PDF)</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="passport_photo">
              Passport-Style Photo * <span className={styles.helpText}>(Clear face photo, max 10MB)</span>
            </label>
            <input
              id="passport_photo"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'passport_photo')}
              required={!passportPhotoPreview}
            />
            {passportPhotoPreview && (
              <div className={styles.preview}>
                <img src={passportPhotoPreview} alt="Passport Photo Preview" />
                <p>Preview of uploaded photo</p>
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="certificate">
              Professional Certificate <span className={styles.helpText}>(Optional - Image or PDF, max 10MB)</span>
            </label>
            <input
              id="certificate"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange(e, 'certificate')}
            />
            {certificatePreview && (
              <div className={styles.preview}>
                <img src={certificatePreview} alt="Certificate Preview" />
                <p>Preview of uploaded certificate</p>
              </div>
            )}
            {certificate && !certificatePreview && (
              <p className={styles.fileName}>{certificate.name} (PDF)</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cv">
              CV/Resume <span className={styles.helpText}>(Optional - PDF or DOC, max 10MB)</span>
            </label>
            <input
              id="cv"
              type="file"
              accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => handleFileChange(e, 'cv')}
            />
            {cv && (
              <p className={styles.fileName}>{cv.name}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="bio">Bio <span className={styles.helpText}>(Optional - Tell clients about yourself)</span></label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="4"
              placeholder="Brief description of your experience and skills..."
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="hourly_rate">Hourly Rate (UGX) <span className={styles.helpText}>(Optional)</span></label>
              <input
                id="hourly_rate"
                type="number"
                name="hourly_rate"
                value={formData.hourly_rate}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="e.g., 50000"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="operating_radius">Operating Radius (km) <span className={styles.helpText}>(Optional)</span></label>
              <input
                id="operating_radius"
                type="number"
                name="operating_radius"
                value={formData.operating_radius}
                onChange={handleChange}
                min="0"
                step="0.1"
                placeholder="e.g., 10"
              />
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {(uploadProgress.id > 0 || uploadProgress.photo > 0 || uploadProgress.certificate > 0 || uploadProgress.cv > 0) && (
            <div className={styles.progress}>
              <p>Uploading files... {Math.round((uploadProgress.id + uploadProgress.photo + uploadProgress.certificate + uploadProgress.cv) / 4)}%</p>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${(uploadProgress.id + uploadProgress.photo + uploadProgress.certificate + uploadProgress.cv) / 4}%` }}
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !profile || !user} 
            className={styles.submitBtn}
            title={!profile || !user ? 'Please wait for your profile to load' : ''}
          >
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </form>
      </div>
    </div>
  )
}

