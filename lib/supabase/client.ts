import { createClient } from '@supabase/supabase-js';

/**
 * Get Supabase URL from environment variables
 */
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
  }
  return url;
}

/**
 * Get Supabase service role key for server-side operations
 * This key has elevated privileges and should only be used server-side
 */
function getSupabaseServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  }
  return key;
}

/**
 * Get Supabase anon key for client-side operations
 */
function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required');
  }
  return key;
}

/**
 * Create a Supabase client for server-side operations
 * Uses service role key for elevated privileges
 */
export function createSupabaseServerClient() {
  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseServiceKey();

    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (error) {
    console.error('Failed to create Supabase server client:', error);
    throw error;
  }
}

/**
 * Create a Supabase client for client-side operations
 * Uses anon key - relies on RLS policies for security
 */
export function createSupabaseClient() {
  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseAnonKey();

    return createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw error;
  }
}

