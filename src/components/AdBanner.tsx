import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Constants from "expo-constants";
import { adsAvailable, getBannerAdUnitId, initializeAds } from "../lib/ads";

/**
 * Renders an AdMob banner when the native SDK is available; renders nothing
 * in Expo Go or when ad unit IDs are not configured. Importing the SDK is
 * deferred so Metro never tries to resolve the native module in Expo Go.
 */
type Props = {
  style?: object;
};

export function AdBanner({ style }: Props) {
  const [BannerEl, setBannerEl] = useState<null | { default: React.ComponentType<{ unitId: string; size: string }> ; BannerAdSize: Record<string, string> }>(null);

  useEffect(() => {
    let cancelled = false;
    if (!adsAvailable()) return;
    void (async () => {
      await initializeAds();
      try {
        // @ts-ignore optional dependency loaded only in plugin-enabled native builds
        const mod = (await import("react-native-google-mobile-ads")) as unknown as {
          BannerAd: React.ComponentType<{ unitId: string; size: string }>;
          BannerAdSize: Record<string, string>;
        };
        if (cancelled) return;
        setBannerEl({ default: mod.BannerAd, BannerAdSize: mod.BannerAdSize });
      } catch {
        // SDK not present in this build
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const unitId = getBannerAdUnitId();
  if (!unitId || !BannerEl) return null;

  const Banner = BannerEl.default;
  const size = BannerEl.BannerAdSize?.ANCHORED_ADAPTIVE_BANNER ?? "BANNER";

  return (
    <View style={[{ alignItems: "center", paddingVertical: 8 }, style]}>
      <Banner unitId={unitId} size={size} />
    </View>
  );
}

// Used by analytics/UI gates.
export function isAdsConfigured(): boolean {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
  return Boolean(extra.EXPO_PUBLIC_ADMOB_BANNER_ANDROID || extra.EXPO_PUBLIC_ADMOB_BANNER_IOS);
}
