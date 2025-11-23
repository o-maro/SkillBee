import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Use placeholder values if env vars are missing (for development)
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co'
const finalKey = supabaseAnonKey || 'placeholder-key'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
  console.warn('The app will still run, but authentication features will not work.')
}

let supabase
try {
  supabase = createClient(finalUrl, finalKey)
} catch (error) {
  console.error('Error creating Supabase client:', error)
  // Create a minimal client that won't crash
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key')
}

export { supabase }

