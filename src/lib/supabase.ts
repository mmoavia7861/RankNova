import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const publishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
const validUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url);

export const SUPABASE_CONFIGURED = validUrl && Boolean(publishableKey);

// Never throw while importing this module. Until Supabase is configured, the
// public homepage and browser-only tools must still render without a blank page.
export const supabase: SupabaseClient | null = SUPABASE_CONFIGURED
  ? createClient(url.replace(/\/$/, ''), publishableKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
    })
  : null;

export function getSupabase(): SupabaseClient {
  if (!supabase) throw new Error('RankNova database is not configured yet. Contact the website owner.');
  return supabase;
}

export async function signInWithGoogle(): Promise<void> {
  const client = getSupabase();
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.href.split('#')[0]
    }
  });
  if (error) throw error;
}

export async function isOwnerUser(user: User | null | undefined): Promise<boolean> {
  if (!user || !supabase) return false;
  const { data, error } = await supabase.from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  return !error && Boolean(data);
}

export function requireRows<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data == null) throw new Error('Database returned no data.');
  return data;
}
