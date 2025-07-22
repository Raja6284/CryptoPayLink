import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

// Admin client for server-side operations with service role key
export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createBrowserClient(supabaseUrl, supabaseServiceRoleKey)
  : null