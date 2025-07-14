import { createClient } from '@supabase/supabase-js'
//why it is not able to imort from .env.local?
// Ensure that the environment variables are loaded


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey =process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
// Client-side Supabase client with error handling
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Admin client for server-side operations with error handling
export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(
      supabaseUrl, 
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey)
}