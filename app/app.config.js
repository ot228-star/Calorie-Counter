/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

try {
  // Repo root .env (Expo CLI cwd is usually `app/`, so default .env there misses parent)
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
} catch (_) {}
try {
  require("dotenv").config({ path: path.join(__dirname, ".env") });
} catch (_) {}

const appJson = require("./app.json");

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
      EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV ?? "development",
      // Set to "true" only for local UI testing without signing in (skips Supabase session gate).
      EXPO_PUBLIC_AUTH_DISABLED: process.env.EXPO_PUBLIC_AUTH_DISABLED ?? "false",
    },
  },
};
