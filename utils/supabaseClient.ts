import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  return (import.meta as any).env[key] || '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://jbfuubfrpfpmsblgqgqk.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'sb_publishable_qUX7U8JLqVjAV6CNywnPiw_o81DRvEJ';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'x-application-name': 'rutamax-tms' },
  },
});
