import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgqdbkxzzzwzcavkuith.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncWRia3h6enp3emNhdmt1aXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMzQxMzEsImV4cCI6MjA3ODgxMDEzMX0.0MNA_8VGnYFepFLI4xe1b4v_Mho1Kws3D5JaFfRV3I8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggers() {
  // Query to see if the trigger exists in information_schema
  // But postgres information_schema.triggers needs execution access.
  // We can just test updating a tracking row. Or see if a task_tracking row can be created safely.
  // Let's create a dummy booking to test.
  try {
     const { data: booking, error: bErr} = await supabase.from('bookings').insert({
       client_id: 'dummy',
       service_type: 'test',
       status: 'accepted'
     }).select().single();
     
     if (booking) {
        console.log("Booking created ID", booking.id);
        const { data: track, error: tErr } = await supabase.from('task_tracking').insert({
           booking_id: booking.id,
           tasker_id: 'dummy',
           client_id: 'dummy',
           tracking_status: 'en_route'
        }).select().single();
        console.log("Tracking Insert:", track, tErr);
        
        // Did the booking status change to en_route?
        const { data: updatedB } = await supabase.from('bookings').select('status').eq('id', booking.id).single();
        console.log("Updated Booking Status:", updatedB?.status);
     }
  } catch (e) {
    console.error(e);
  }
}
checkTriggers();
