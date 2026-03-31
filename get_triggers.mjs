import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const run = async () => {
    // try inserting a booking, then querying tasks
    const { data: b } = await supabase.from('bookings').insert({
        client_id: 'dummy',
        service_type: 'cleaning',
        status: 'pending'
    }).select().single();
    
    if (b) {
        const { data: t } = await supabase.from('tasks').select('*');
        console.log("Tasks after booking:", t);
    }
}
run();
