import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL || 'https://fgqdbkxzzzwzcavkuith.supabase.co', process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncWRia3h6enp3emNhdmt1aXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMzQxMzEsImV4cCI6MjA3ODgxMDEzMX0.0MNA_8VGnYFepFLI4xe1b4v_Mho1Kws3D5JaFfRV3I8');

async function go() {
    const { data, error } = await supabase.rpc('get_schema');
    if (error) {
        // Fallback: manually query columns directly via REST
        console.log("no RPC get_schema");
    }
    const { data: cols } = await supabase.from('bookings').select('*').limit(1);
    console.log(JSON.stringify(cols));
}
go();
