import AsyncStorage from '@react-native-async-storage/async-storage'
import {createClient} from '@supabase/supabase-js'

const supabaseUrl = 'https://nbsrvsohlsmalhbkgwvm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ic3J2c29obHNtYWxoYmtnd3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NjYyMTksImV4cCI6MjA2ODE0MjIxOX0.HgGYk-9U-GKQzbeTgLByMxFE83rCpw_dH4udSoUjmqk'
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        redirectTo: 'com.fashionapp://auth'
    },
})
