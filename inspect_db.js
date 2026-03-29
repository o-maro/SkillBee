import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function inspect(table) {
  const { data, error } = await supabase.from(table).select('*').limit(1)
  if (error) {
    console.error(`Error fetching ${table}:`, error.message)
    return
  }
  if (data && data.length > 0) {
    console.log(`Schema for \\"${table}\\":`)
    console.log(Object.keys(data[0]))
  } else {
    console.log(`Table \\"${table}\\" has no data or doesn't exist`)
  }
}

async function run() {
  await inspect('users')
  await inspect('taskers')
  await inspect('bookings')
  await inspect('ratings')
}

run()
