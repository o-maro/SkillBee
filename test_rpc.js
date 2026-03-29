import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testRPC() {
    const { data, error } = await supabase.rpc('match_taskers_by_proximity', {
        client_location: '123 Fake St',
        service_type: 'cleaning'
    })
    console.log(data)
}
testRPC()
