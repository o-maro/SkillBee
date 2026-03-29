const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('ratings').select('id').limit(1);
  console.log("Ratings table exists?", !error || error.code !== '42P01', error ? error.message : "Yes");
}
run();
