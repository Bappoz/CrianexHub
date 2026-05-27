import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
  anonKey: string;
};

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env['SUPABASE_URL'] ?? process.env['PUBLIC_SUPABASE_URL'] ?? '';
  const serviceRoleKey = process.env['SUPABASE_SECRET_KEY'] ?? '';
  const anonKey = process.env['PUBLIC_SUPABASE_PUBLISHABLE_KEY'] ?? '';

  // In CI/test environments we allow default/dummy values so unit tests
  // that mock Supabase behavior can run without failing on missing env vars.
  const isTest = process.env['NODE_ENV'] === 'test';

  if (!url || !serviceRoleKey || !anonKey) {
    if (isTest) {
      return {
        url: url || 'http://localhost:54321',
        serviceRoleKey: serviceRoleKey || 'service_role_test_key',
        anonKey: anonKey || 'anon_test_key',
      };
    }

    throw new Error('Supabase environment variables are not configured');
  }

  return { url, serviceRoleKey, anonKey };
}

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { url, serviceRoleKey } = getSupabaseConfig();

  supabaseClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseClient;
}
