import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.rpc('get_function_def', { func_name: 'approve_tasker' })
  console.log('approve_tasker definition:', data || error)

  // Also let's see if we can just create a trigger that forces services_offered matching
}
run()
