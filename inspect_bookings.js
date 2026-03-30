import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function inspect() {
  const { data, error } = await supabase.from('bookings').select('*').limit(1)
  if (error) console.error(error)
  else if (data.length > 0) console.log(Object.keys(data[0]))
  else console.log("No bookings found")
}
inspect()
