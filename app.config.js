const path = require("path");

try {
  // Repo root .env (Expo CLI cwd is usually `app/`, so default .env there misses parent)
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
} catch {}
try {
  require("dotenv").config({ path: path.join(__dirname, ".env") });
} catch {}

const pr = require("./src/lib/permissionRationale.json");

const baseExpoConfig = {
  name: "Inertia",
  slug: "calorie-counter",
  scheme: "caloriecounter",
  version: "1.0.0",
  orientation: "portrait",
  platforms: ["ios", "android"],
  icon: "./assets/logo-calorie-counter.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/logo-calorie-counter.png",
    resizeMode: "contain",
    backgroundColor: "#0a1628"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    bundleIdentifier: "com.ot228star.caloriecounter",
    buildNumber: "1",
    supportsTablet: false,
    config: {
      usesNonExemptEncryption: false
    },
    infoPlist: {
      NSCameraUsageDescription: pr.camera,
      NSPhotoLibraryUsageDescription: pr.photoLibrary,
      NSFaceIDUsageDescription: pr.biometrics,
      NSUserNotificationsUsageDescription: pr.notifications,
      NSUserTrackingUsageDescription: pr.appTracking,
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    package: "com.ot228star.caloriecounter",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/logo-calorie-counter.png",
      backgroundColor: "#0a1628"
    },
    permissions: [
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "READ_MEDIA_IMAGES",
      "POST_NOTIFICATIONS",
      "USE_BIOMETRIC",
      "USE_FINGERPRINT",
      "VIBRATE",
      "INTERNET",
      "com.google.android.gms.permission.AD_ID"
    ],
    blockedPermissions: [
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.RECORD_AUDIO"
    ]
  },
  plugins: [
    [
      "expo-camera",
      {
        cameraPermission: pr.camera,
        recordAudioAndroid: false
      }
    ],
    [
      "expo-image-picker",
      {
        photosPermission: pr.photoLibrary,
        cameraPermission: pr.camera
      }
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/logo-calorie-counter.png",
        color: "#0a1628"
      }
    ],
    [
      "expo-local-authentication",
      {
        faceIDPermission: pr.biometrics
      }
    ]
  ]
};

const basePlugins = baseExpoConfig.plugins ?? [];
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
            userTrackingUsageDescription: pr.appTracking,
            skAdNetworkItems: []
          }
        ]
      ]
    : [];

module.exports = {
  expo: {
    ...baseExpoConfig,
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
