import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../theme/AppThemeContext";
import { mixHex } from "../../lib/themeColors";
import { stitchFonts } from "../../theme/stitch";

export type StitchNavId = "home" | "plan" | "log" | "camera" | "settings";

type Tab = {
  id: StitchNavId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive?: keyof typeof Ionicons.glyphMap;
  emphasizeCenter?: boolean;
};

const TABS: Tab[] = [
  { id: "home", label: "Home", icon: "home-outline", iconActive: "home" },
  { id: "plan", label: "Plan", icon: "restaurant-outline", iconActive: "restaurant" },
  { id: "log", label: "Log", icon: "add-circle-outline", iconActive: "add-circle", emphasizeCenter: true },
  { id: "camera", label: "Camera", icon: "camera-outline", iconActive: "camera" },
  { id: "settings", label: "Settings", icon: "settings-outline", iconActive: "settings" }
];

type Props = {
  active: StitchNavId | null;
  onSelect: (id: StitchNavId) => void;
  useCustomFonts?: boolean;
};

export function StitchBottomNav({ active, onSelect, useCustomFonts }: Props) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const theme = useAppTheme();
  const inactive = "rgba(148, 163, 184, 0.85)";
  const activeBg = mixHex(theme.primary, theme.background, 0.75);

  // BlurView on Android repaints per-frame as content scrolls behind it which
  // causes noticeable jitter. Use a solid tinted surface there and only enable
  // the live blur on iOS where it is GPU-accelerated.
  const content = (
    <View style={styles.row}>
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const iconName = (isActive ? tab.iconActive ?? tab.icon : tab.icon) as keyof typeof Ionicons.glyphMap;
        const iconSize = tab.emphasizeCenter ? 34 : 24;
        const accentColor = isActive ? theme.primary : inactive;
        const iconColor = tab.emphasizeCenter && !isActive ? theme.primary : accentColor;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.item, isActive && { backgroundColor: activeBg }]}
            onPress={() => {
              if (!isActive) {
                void Haptics.selectionAsync().catch(() => {
                  // Ignore unsupported/disabled haptics.
                });
              }
              onSelect(tab.id);
            }}
            activeOpacity={0.8}
            delayPressIn={0}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            pressRetentionOffset={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons name={iconName} size={iconSize} color={iconColor} />
            <Text
              style={[
                styles.label,
                { color: accentColor },
                useCustomFonts && { fontFamily: stitchFonts.bodyMedium }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (Platform.OS === "ios") {
    return (
      <BlurView intensity={55} tint="dark" style={[styles.wrap, { paddingBottom: bottomPad }]}>
        {content}
      </BlurView>
    );
  }

  return <View style={[styles.wrap, { paddingBottom: bottomPad }]}>{content}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    backgroundColor: Platform.OS === "ios" ? "rgba(49, 57, 77, 0.55)" : "rgba(20, 26, 40, 0.96)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
    paddingTop: 10,
    paddingHorizontal: 6
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center"
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    minWidth: 52
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 2
  }
});
