import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Supabase Client for client-side and server-side utilities
 * (Storage, Auth, Realtime, and Edge Functions)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
