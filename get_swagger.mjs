const url = process.env.VITE_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.VITE_SUPABASE_ANON_KEY;
fetch(url).then(r => r.json()).then(data => require('fs').writeFileSync('swagger.json', JSON.stringify(data, null, 2)));
