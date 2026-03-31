import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testRatingsTable() {
  console.log('Testing if ratings table exists...')
  const { data, error } = await supabase.from('ratings').select('rating_id').limit(1)
  
  if (error) {
    if (error.code === '42P01') {
      console.error('❌ ratings table does not exist. Please run setup-ratings-system.sql in Supabase.')
    } else {
      console.error('❌ Error testing ratings table:', error.message)
    }
    return false
  }
  
  console.log('✅ ratings table exists!')
  
  console.log('Testing if taskers table has total_reviews column...')
  const { data: taskerData, error: taskerError } = await supabase.from('taskers').select('total_reviews').limit(1)
  
  if (taskerError) {
    if (taskerError.code === '42703') {
      console.error('❌ total_reviews column does not exist on taskers table. Please run setup-ratings-system.sql in Supabase.')
    } else {
      console.error('❌ Error testing total_reviews column:', taskerError.message)
    }
    return false
  }
  
  console.log('✅ total_reviews column exists on taskers table!')
  
  console.log('All database requirements are met!')
  return true
}

testRatingsTable()
