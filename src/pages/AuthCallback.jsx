import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/AuthContext'

export const AuthCallback = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { loadProfile } = useAuth()
  const [status, setStatus] = useState('Verifying your email...')
  const [error, setError] = useState(null)

  // Ensure a profile row exists in users table (created by DB trigger),
  // then, for taskers, update role + verification_status.
  const ensureUserProfileAndTaskerSetup = async (sessionUser) => {
    const roleFromMetadata = sessionUser.user_metadata?.role || 'client'

    let profileData = null
    let attempts = 0
    const maxAttempts = 10

    while (!profileData && attempts < maxAttempts) {
      const { data, error } = await supabase
        .from('users')
        .select('id, role, verification_status')
        .eq('id', sessionUser.id)
        .single()

      if (data && !error) {
        profileData = data
        break
      }

      // If the profile row doesn't exist yet, wait for the trigger to create it
      if (error && error.code === 'PGRST116') {
        attempts++
        await new Promise(resolve => setTimeout(resolve, 300))
        continue
      }

      console.error('Error loading profile during auth callback:', error)
      throw error
    }

    if (!profileData) {
      return null
    }

    // For tasker signups, normalize the profile row
    if (roleFromMetadata === 'tasker') {
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({
          role: 'tasker',
          verification_status: 'pending',
        })
        .eq('id', sessionUser.id)
        .select('id, role, verification_status')
        .single()

      if (updateError) {
        console.error('Error updating tasker profile during auth callback:', updateError)
        throw updateError
      }

      profileData = updated
    }

    // Refresh profile in context (do not navigate from here)
    await loadProfile(sessionUser.id)
    return profileData
  }

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Supabase auth callbacks use hash fragments (#) not query params (?)
        const hashParams = new URLSearchParams(location.hash.substring(1))
        const errorParam = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        // Handle errors from the callback
        if (errorParam) {
          console.error('Auth callback error:', errorParam, errorDescription)
          
          if (errorParam === 'access_denied' && errorDescription?.includes('expired')) {
            setError('Email link has expired. Please sign up again or request a new confirmation email.')
            setStatus('Link Expired')
            
            // Redirect to signup after 3 seconds
            setTimeout(() => {
              navigate('/signup?error=link_expired', { replace: true })
            }, 3000)
            return
          }
          
          setError(errorDescription || 'An error occurred during email verification.')
          setStatus('Verification Failed')
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login?error=verification_failed', { replace: true })
          }, 3000)
          return
        }

        // Handle successful email confirmation
        if (accessToken && refreshToken) {
          setStatus('Email verified successfully! Signing you in...')
          
          // Set the session with the tokens from the callback
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.error('Error setting session:', sessionError)
            setError('Failed to sign you in. Please try logging in manually.')
            setStatus('Sign In Failed')
            setTimeout(() => {
              navigate('/login?error=session_failed', { replace: true })
            }, 3000)
            return
          }

          if (session?.user) {
            // Ensure profile row exists and normalize tasker fields
            const profileData = await ensureUserProfileAndTaskerSetup(session.user)

            if (!profileData) {
              setError('Your account is still being set up. Please try signing in again in a moment.')
              setStatus('Account Setup Incomplete')
              setTimeout(() => {
                navigate('/login?error=profile_missing', { replace: true })
              }, 3000)
              return
            }

            // Let AppGate decide the correct landing route based on profile
            setTimeout(() => {
              navigate('/', { replace: true })
            }, 300)
          } else {
            setError('Session created but no user found. Please try logging in manually.')
            setStatus('Sign In Failed')
            setTimeout(() => {
              navigate('/login?error=no_user', { replace: true })
            }, 3000)
          }
        } else {
          // No tokens in the callback - might be a different type of callback
          // Check if user is already authenticated
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.user) {
            // User is already authenticated, ensure profile exists and normalize tasker fields
            const profileData = await ensureUserProfileAndTaskerSetup(session.user)

            if (!profileData) {
              setError('Your account is still being set up. Please try signing in again in a moment.')
              setStatus('Account Setup Incomplete')
              setTimeout(() => {
                navigate('/login?error=profile_missing', { replace: true })
              }, 3000)
              return
            }

            // Let AppGate decide the correct landing route based on profile
            setTimeout(() => {
              navigate('/', { replace: true })
            }, 300)
          } else {
            setError('No authentication tokens found. Please try signing up again.')
            setStatus('Verification Failed')
            setTimeout(() => {
              navigate('/signup?error=no_tokens', { replace: true })
            }, 3000)
          }
        }
      } catch (err) {
        console.error('Error handling auth callback:', err)
        setError('An unexpected error occurred. Please try again.')
        setStatus('Error')
        setTimeout(() => {
          navigate('/login?error=unexpected', { replace: true })
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [location, navigate, loadProfile])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      backgroundColor: '#f5f5f5',
      textAlign: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        {error ? (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ marginBottom: '1rem', color: '#d32f2f' }}>{status}</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>{error}</p>
            <p style={{ fontSize: '0.9rem', color: '#999' }}>
              Redirecting you in a moment...
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
            <h2 style={{ marginBottom: '1rem' }}>{status}</h2>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '1rem auto'
            }}></div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <p style={{ color: '#666', marginTop: '1rem' }}>
              Please wait while we verify your email and sign you in...
            </p>
          </>
        )}
      </div>
    </div>
  )
}
