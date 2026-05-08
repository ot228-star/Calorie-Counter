import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Lightweight AdMob wrapper. The native SDK (`react-native-google-mobile-ads`)
 * is loaded dynamically so the app keeps working in Expo Go and in dev builds
 * that don't include the plugin. Real ads only render in a production-style
 * EAS build that has the AdMob plugin configured (see `app.config.js`).
 *
 * Required env vars (set in EAS / .env, not committed):
 *   - EXPO_PUBLIC_ADMOB_ANDROID_APP_ID
 *   - EXPO_PUBLIC_ADMOB_IOS_APP_ID
 *   - EXPO_PUBLIC_ADMOB_BANNER_ANDROID
 *   - EXPO_PUBLIC_ADMOB_BANNER_IOS
 *
 * UMP (User Messaging Platform) consent is requested before any ad load so the
 * app complies with Google's EU/UK consent requirement and CCPA/Apple ATT.
 */

// We don't statically depend on `react-native-google-mobile-ads` because it
// is only present in EAS builds with the AdMob plugin. Use `unknown` here to
// keep the package optional at typecheck time.
type AdsModule = Record<string, unknown>;

let cached: AdsModule | null | undefined;
let initialized = false;

function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

async function importAdsModule(): Promise<AdsModule | null> {
  if (isExpoGo()) return null;
  if (cached !== undefined) return cached;
  try {
    const importOptional = new Function("m", "return import(m)") as (m: string) => Promise<unknown>;
    cached = (await importOptional("react-native-google-mobile-ads")) as AdsModule;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export function getBannerAdUnitId(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
  if (Platform.OS === "ios") return extra.EXPO_PUBLIC_ADMOB_BANNER_IOS ?? "";
  return extra.EXPO_PUBLIC_ADMOB_BANNER_ANDROID ?? "";
}

export function adsAvailable(): boolean {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
  const id = Platform.OS === "ios" ? extra.EXPO_PUBLIC_ADMOB_IOS_APP_ID : extra.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID;
  return Boolean(id) && !isExpoGo();
}

/**
 * Initializes AdMob, requests UMP consent, and (on iOS) requests App Tracking
 * Transparency. Safe to call multiple times - subsequent calls are no-ops.
 */
export async function initializeAds(): Promise<void> {
  if (initialized) return;
  if (!adsAvailable()) return;

  const ads = await importAdsModule();
  if (!ads) return;

  try {
    // 1) Ask UMP for consent. In production this shows the EU consent form.
    const ump = (ads as unknown as { AdsConsent?: { requestInfoUpdate: (cfg?: object) => Promise<unknown>; loadAndShowConsentFormIfRequired: () => Promise<unknown>; } }).AdsConsent;
    if (ump?.requestInfoUpdate) {
      await ump.requestInfoUpdate({});
      await ump.loadAndShowConsentFormIfRequired?.();
    }

    // 2) On iOS, request App Tracking Transparency for personalized ads.
    if (Platform.OS === "ios") {
      try {
        const ttAny = ads as unknown as { requestTrackingPermission?: () => Promise<unknown> };
        await ttAny.requestTrackingPermission?.();
      } catch {
        // user can decline - fine, we fall back to non-personalized ads
      }
    }

    // 3) Initialize the SDK.
    const init = (ads as unknown as { default?: () => { initialize: () => Promise<unknown> } }).default;
    if (init) {
      await init().initialize();
    }
    initialized = true;
  } catch (error) {
    // Never crash the app because of ads.
    if (__DEV__) console.warn("AdMob init failed", error);
  }
}
