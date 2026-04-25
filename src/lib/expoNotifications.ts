import Constants from "expo-constants";

/**
 * Remote push and full notification APIs are not available in Expo Go (SDK 53+).
 * Avoid static `import "expo-notifications"` so Metro never loads the native module there.
 */
export function shouldSkipExpoNotifications(): boolean {
  return Constants.appOwnership === "expo";
}

type ExpoNotifications = typeof import("expo-notifications");

let cached: ExpoNotifications | null | undefined;

/** Returns the module in dev/production builds; returns null in Expo Go without importing. */
export async function importExpoNotifications(): Promise<ExpoNotifications | null> {
  if (shouldSkipExpoNotifications()) return null;
  if (cached !== undefined) return cached;
  try {
    cached = await import("expo-notifications");
    return cached;
  } catch {
    cached = null;
    return null;
  }
}
