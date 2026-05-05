# Setup Guide

## Prerequisites

- Node 20+
- Expo CLI (through `npx expo`)
- Supabase project

## Supabase

1. Create tables by running `supabase/migrations/001_init.sql`, then `002_food_catalog.sql`, then `003_food_images_and_catalog_meta.sql` for food imagery columns.
2. (Optional) Seed or refresh `public.foods` with `npm run catalog:seed` and execute `supabase/seed/food_catalog_seed.sql`. See [food-catalog.md](./food-catalog.md).
3. Create storage bucket `meal-images`.
4. Deploy edge functions:
   - `estimate-meal`
   - `daily-summary`
   - `analytics-events`
   - `cleanup-images`
5. Configure function secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AI_PROVIDER_API_KEY` (optional at first)
   - `AI_PROVIDER_BASE_URL` (optional at first)

## Google sign-in (Supabase Auth)

1. **Google Cloud Console** (same Google account you use for testing):
   - APIs & Services → OAuth consent screen (configure app name, your email as test user if External).
   - Credentials → Create Credentials → **OAuth client ID** → type **Web application**.
   - Under **Authorized redirect URIs**, add exactly:
     - `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`
   - Save and copy the **Client ID** and **Client secret**.

2. **Supabase Dashboard** → Authentication → Providers → **Google**:
   - Enable the provider.
   - Paste the Web client **Client ID** and **Client secret** from step 1.

3. **Supabase** → Authentication → **URL Configuration** → **Redirect URLs**:
   - Add `caloriecounter://**` (matches `scheme` in `app.json` and Expo AuthSession).
   - Add `exp://**` if you test in **Expo Go** (or add the exact URI printed in Metro when you tap “Continue with Google”: look for `OAuth redirect URI:` in the device/log output).

4. App env: ensure `.env` has valid `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and **do not** set `EXPO_PUBLIC_AUTH_DISABLED=true` while testing sign-in.

5. The app uses **PKCE** (`flowType: "pkce"` in `src/services/auth.ts`) so the OAuth callback carries a `code` in the **query string**. The default implicit flow puts tokens in the **URL hash**, which some in-app browsers omit when returning to the app, leading to “missing access token and code.”

6. Restart Expo after changing `.env`.

## Mobile App

1. `npm install`
2. Set env vars in `.env`.
3. `npm run start`

## Developer Ownership

- Dev A: app screens, UX, and local state.
- Dev B: SQL, edge functions, and analytics.
