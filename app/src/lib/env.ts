import Constants from "expo-constants";

type Extra = {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  EXPO_PUBLIC_ENV?: string;
};

function extra(): Extra {
  return (Constants.expoConfig?.extra ?? {}) as Extra;
}

/** Supabase URL + anon key for REST and Edge Functions (never log these). */
export function getSupabaseConfig(): { url: string; anonKey: string } {
  const fromExtra = extra();
  const url =
    (typeof fromExtra.EXPO_PUBLIC_SUPABASE_URL === "string" ? fromExtra.EXPO_PUBLIC_SUPABASE_URL : "") ||
    (typeof process.env.EXPO_PUBLIC_SUPABASE_URL === "string" ? process.env.EXPO_PUBLIC_SUPABASE_URL : "");
  const anonKey =
    (typeof fromExtra.EXPO_PUBLIC_SUPABASE_ANON_KEY === "string" ? fromExtra.EXPO_PUBLIC_SUPABASE_ANON_KEY : "") ||
    (typeof process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY === "string" ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY : "");
  return { url: url.trim(), anonKey: anonKey.trim() };
}

export function assertSupabaseConfigured(): void {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to the project root .env (or app/.env), then restart Expo with a clean cache: npx expo start -c"
    );
  }
}
