import Constants from "expo-constants";

type Extra = {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  EXPO_PUBLIC_ENV?: string;
  /** When not `"false"`, allow legacy placeholder image hosts for foods without DB URLs. */
  EXPO_PUBLIC_ALLOW_PLACEHOLDER_FOOD_IMAGES?: string;
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

/**
 * Legacy random Unsplash Source + Picsum fallbacks in foodDetails.
 * Default true until the cloud catalog is fully seeded; set EXPO_PUBLIC_ALLOW_PLACEHOLDER_FOOD_IMAGES=false in production.
 */
export function allowPlaceholderFoodImages(): boolean {
  const fromExtra = extra();
  const raw =
    (typeof fromExtra.EXPO_PUBLIC_ALLOW_PLACEHOLDER_FOOD_IMAGES === "string"
      ? fromExtra.EXPO_PUBLIC_ALLOW_PLACEHOLDER_FOOD_IMAGES
      : "") ||
    (typeof process.env.EXPO_PUBLIC_ALLOW_PLACEHOLDER_FOOD_IMAGES === "string"
      ? process.env.EXPO_PUBLIC_ALLOW_PLACEHOLDER_FOOD_IMAGES
      : "");
  if (!raw.trim()) return true;
  return raw.trim().toLowerCase() !== "false";
}

export function assertSupabaseConfigured(): void {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to the project root .env (or app/.env), then restart Expo with a clean cache: npx expo start -c"
    );
  }

  const normalized = url.trim().toLowerCase();
  const looksLikeDashboardUrl = normalized.includes("supabase.com/dashboard/project/");
  const looksLikeProjectApiUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(normalized);

  if (looksLikeDashboardUrl || !looksLikeProjectApiUrl) {
    throw new Error(
      "Invalid EXPO_PUBLIC_SUPABASE_URL. Use your project API URL (for example: https://<project-ref>.supabase.co), not the Supabase dashboard URL."
    );
  }
}
