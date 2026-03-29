import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(process.env.VITE_SUPABASE_URL || 'https://fgqdbkxzzzwzcavkuith.supabase.co', process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncWRia3h6enp3emNhdmt1aXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMzQxMzEsImV4cCI6MjA3ODgxMDEzMX0.0MNA_8VGnYFepFLI4xe1b4v_Mho1Kws3D5JaFfRV3I8');

async function go() {
    const { data: cols, error } = await supabase.from('transactions').select('*').limit(1);
    if(error) console.error(error)
    fs.writeFileSync('db_tx.json', JSON.stringify(cols));
}
go();
