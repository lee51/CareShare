import { createClient } from '@supabase/supabase-js';

const useLocal = process.env.NEXT_PUBLIC_USE_LOCAL_DB === 'true';

const supabaseUrl = useLocal 
  ? process.env.NEXT_PUBLIC_LOCAL_SUPABASE_URL 
  : process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey = useLocal 
  ? process.env.NEXT_PUBLIC_LOCAL_SUPABASE_ANON_KEY 
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'careshare.auth',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: { params: { eventsPerSecond: 10 } }
});
