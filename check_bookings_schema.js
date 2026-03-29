import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgqdbkxzzzwzcavkuith.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncWRia3h6enp3emNhdmt1aXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMzQxMzEsImV4cCI6MjA3ODgxMDEzMX0.0MNA_8VGnYFepFLI4xe1b4v_Mho1Kws3D5JaFfRV3I8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('bookings').select('*').limit(1);
  console.log('Error:', error?.message || error);
  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    console.log('Data:', data);
  }
}
check();
