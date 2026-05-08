const path = require("path");

try {
  // Repo root .env (Expo CLI cwd is usually `app/`, so default .env there misses parent)
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
} catch {}
try {
  require("dotenv").config({ path: path.join(__dirname, ".env") });
} catch {}

const appJson = require("./app.json");

const basePlugins = appJson.expo.plugins ?? [];
const sdk55RequiredPlugins = ["expo-font", "expo-web-browser"];

// Conditionally include AdMob plugin only when env IDs are present so dev builds
// without AdMob keys still build cleanly.
const admobAndroidId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID;
const admobIosId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;
const adMobPlugin =
  admobAndroidId && admobIosId
    ? [
        [
          "react-native-google-mobile-ads",
          {
            androidAppId: admobAndroidId,
            iosAppId: admobIosId,
            userTrackingUsageDescription:
              "Inertia asks for permission to deliver more relevant ads. Declining still shows non-personalized ads.",
            skAdNetworkItems: []
          }
        ]
      ]
    : [];

module.exports = {
  expo: {
    ...appJson.expo,
    plugins: [...new Set([...basePlugins, ...sdk55RequiredPlugins]), ...adMobPlugin],
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
      EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV ?? "development",
      // Set to "true" only for local UI testing without signing in (skips Supabase session gate).
      EXPO_PUBLIC_AUTH_DISABLED: process.env.EXPO_PUBLIC_AUTH_DISABLED ?? "false",
      // Set to "false" after `public.foods` rows include image_url so production never uses random placeholder hosts.
      EXPO_PUBLIC_ALLOW_PLACEHOLDER_FOOD_IMAGES: process.env.EXPO_PUBLIC_ALLOW_PLACEHOLDER_FOOD_IMAGES ?? "true",
      EXPO_PUBLIC_ADMOB_ANDROID_APP_ID: admobAndroidId ?? "",
      EXPO_PUBLIC_ADMOB_IOS_APP_ID: admobIosId ?? "",
      EXPO_PUBLIC_ADMOB_BANNER_ANDROID: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID ?? "",
      EXPO_PUBLIC_ADMOB_BANNER_IOS: process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS ?? "",
      EXPO_PUBLIC_PRIVACY_POLICY_URL:
        process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? "https://ot228-star.github.io/Calorie-Counter/privacy",
      EXPO_PUBLIC_TERMS_URL:
        process.env.EXPO_PUBLIC_TERMS_URL ?? "https://ot228-star.github.io/Calorie-Counter/terms",
      EXPO_PUBLIC_SUPPORT_EMAIL:
        process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? "strive.fitness.contact@gmail.com"
    }
  }
};
