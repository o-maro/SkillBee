const url = process.env.VITE_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.VITE_SUPABASE_ANON_KEY;
fetch(url).then(r => r.json()).then(data => console.log(JSON.stringify(data, null, 2).substring(0, 1000)));
