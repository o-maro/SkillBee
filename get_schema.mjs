import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
async function run() {
  const { data, error } = await supabase.rpc('get_schema_info')
  if (error) console.error(error)
  console.log(data)
}
run()
