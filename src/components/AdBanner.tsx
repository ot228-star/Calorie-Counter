import React, { useEffect, useState } from "react";
import { View } from "react-native";
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
        const importOptional = new Function("m", "return import(m)") as (m: string) => Promise<unknown>;
        const mod = (await importOptional("react-native-google-mobile-ads")) as {
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
