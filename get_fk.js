const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkFk() {
  const url = process.env.VITE_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.VITE_SUPABASE_ANON_KEY;
  const res = await fetch(url);
  const data = await res.json();
  const ratingsDef = data?.definitions?.ratings || data?.components?.schemas?.ratings;
  console.log(JSON.stringify(ratingsDef, null, 2));
}
checkFk();
