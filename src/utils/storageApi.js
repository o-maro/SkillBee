import { supabase } from './supabaseClient'

const BUCKET_NAME = 'tasker-documents'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Upload a file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} userId - The user ID (for folder structure)
 * @param {string} fileType - 'id_document' or 'passport_photo'
 * @returns {Promise<{data: string | null, error: Error | null}>} - URL of uploaded file or error
 */
export const uploadFile = async (file, userId, fileType) => {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        data: null,
        error: new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`),
      }
    }

    // Validate file type based on fileType
    let allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    
    // Allow Word documents for CV
    if (fileType === 'cv') {
      allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    }
    
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = fileType === 'cv' 
        ? 'Invalid file type. Only PDF and Word documents are allowed for CV.'
        : 'Invalid file type. Only images (JPEG, PNG) and PDFs are allowed.'
      return {
        data: null,
        error: new Error(errorMsg),
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = `${fileType}_${timestamp}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Error uploading file:', error)
      return { data: null, error }
    }

    // For private buckets, return the file path
    // Signed URLs will be generated when needed for viewing
    return {
      data: filePath,
      error: null,
    }
  } catch (error) {
    console.error('Exception uploading file:', error)
    return { data: null, error }
  }
}

/**
 * Normalize file path - ensure it's in the correct format
 * @param {string} filePath - The path to normalize
 * @returns {string | null} - Normalized path or null if invalid
 */
const normalizeFilePath = (filePath) => {
  if (!filePath) return null
  
  // Remove any leading/trailing whitespace
  filePath = filePath.trim()
  
  // If it's a full URL, extract the path after tasker-documents/
  if (filePath.startsWith('http')) {
    const match = filePath.match(/tasker-documents\/(.+)/)
    if (match) {
      return match[1]
    }
    // Try to extract path from any URL pattern
    const urlMatch = filePath.match(/\/([^\/]+\/[^\/]+)$/)
    if (urlMatch) {
      return urlMatch[1]
    }
    return null
  }
  
  // If it's already a path (contains / and doesn't start with http), return as is
  if (filePath.includes('/')) {
    return filePath
  }
  
  // If it's just a filename without path, we can't determine the full path
  // This is an error condition - log it
  console.error('File path appears to be just a filename without folder:', filePath)
  console.error('Expected format: userId/filename.ext')
  return null
}

/**
 * Get a signed URL for viewing a file (for admins or the file owner)
 * @param {string} filePath - The path to the file in storage
 * @param {number} expiresIn - Expiry time in seconds (default: 1 hour)
 * @param {string} userId - Optional userId to use as fallback if path is missing prefix
 * @returns {Promise<{data: string | null, error: Error | null}>}
 */
export const getSignedUrl = async (filePath, expiresIn = 3600, userId = null) => {
  try {
    if (!filePath) {
      return { data: null, error: new Error('File path is required') }
    }

    // Normalize the file path
    let normalizedPath = normalizeFilePath(filePath)
    
    // If normalization failed and we have a userId, try to construct the path
    if (!normalizedPath && userId && !filePath.includes('/')) {
      normalizedPath = `${userId}/${filePath}`
      console.log('Constructed path using userId fallback:', normalizedPath)
    }
    
    if (!normalizedPath) {
      return { 
        data: null, 
        error: new Error(`Invalid file path format: ${filePath}. Expected format: userId/filename.ext`) 
      }
    }

    console.log('Generating signed URL for path:', normalizedPath)
    console.log('Original path provided:', filePath)
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(normalizedPath, expiresIn)

    if (error) {
      console.error('Error generating signed URL:', error)
      console.error('Original path:', filePath)
      console.error('Normalized path:', normalizedPath)
      console.error('Bucket:', BUCKET_NAME)
      
      // Try to list files in the bucket to help debug
      const { data: listData } = await supabase.storage
        .from(BUCKET_NAME)
        .list(normalizedPath.split('/')[0] || '', {
          limit: 100,
          offset: 0,
        })
      console.log('Files in user folder:', listData)
      
      return { data: null, error }
    }

    return { data: data.signedUrl, error: null }
  } catch (error) {
    console.error('Exception generating signed URL:', error)
    return { data: null, error }
  }
}

/**
 * Delete a file from storage
 * @param {string} filePath - The path to the file in storage
 * @returns {Promise<{data: boolean, error: Error | null}>}
 */
export const deleteFile = async (filePath) => {
  try {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath])

    if (error) {
      console.error('Error deleting file:', error)
      return { data: false, error }
    }

    return { data: true, error: null }
  } catch (error) {
    console.error('Exception deleting file:', error)
    return { data: false, error }
  }
}

/**
 * Extract file path from full URL
 * @param {string} url - Full URL or path
 * @returns {string} - File path
 */
export const extractFilePath = (url) => {
  if (!url) return null
  // If it's already a path (starts with userId/), return as is
  if (url.includes('/') && !url.startsWith('http')) {
    return url
  }
  // Extract path from URL
  const match = url.match(/tasker-documents\/(.+)/)
  return match ? match[1] : url
}

