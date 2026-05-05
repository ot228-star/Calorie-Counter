import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type Provider, type Session } from "@supabase/supabase-js";
import { assertSupabaseConfigured, getSupabaseConfig } from "../lib/env";

const { url, anonKey } = getSupabaseConfig();

export const authClient = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // PKCE puts `code` in the query string. Implicit grant puts tokens in the URL hash,
    // which Expo WebBrowser / some OEM browsers drop on return — empty callback.
    flowType: "pkce"
  }
});

export const getSession = async (): Promise<Session | null> => {
  assertSupabaseConfigured();
  const { data, error } = await authClient.auth.getSession();
  if (error) throw error;
  return data.session;
};

export const signInWithEmail = async (email: string, password: string) => {
  assertSupabaseConfigured();
  return authClient.auth.signInWithPassword({ email, password });
};

export const signUpWithEmail = async (email: string, password: string) => {
  assertSupabaseConfigured();
  return authClient.auth.signUp({ email, password });
};

export const requestPasswordReset = async (email: string, redirectTo: string) => {
  assertSupabaseConfigured();
  return authClient.auth.resetPasswordForEmail(email, { redirectTo });
};

export const startOAuth = async (provider: Provider, redirectTo: string) => {
  assertSupabaseConfigured();
  return authClient.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true
    }
  });
};
