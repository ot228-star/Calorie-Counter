import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppThemeOptional } from "../../theme/AppThemeContext";
import { stitchFonts } from "../../theme/stitch";

/** Padding to clear fixed `StitchTopBar` (safe area + bar). */
export function stitchScrollPaddingTop(insetsTop: number) {
  return insetsTop + 68;
}

type Props = {
  /** When omitted, the settings icon is hidden (e.g. settings lives in bottom nav). */
  onSettings?: () => void;
  onFavourites: () => void;
  /** Empty until the user sets a nickname — no default label. */
  title?: string;
  useCustomFonts?: boolean;
  themeMode?: "light" | "dark";
  primaryColor?: string;
  textColor?: string;
  settingsActive?: boolean;
  favouritesActive?: boolean;
};

export function StitchTopBar({
  onSettings,
  onFavourites,
  title = "",
  useCustomFonts,
  themeMode = "dark",
  primaryColor,
  textColor,
  settingsActive = false,
  favouritesActive = false
}: Props) {
  const insets = useSafeAreaInsets();
  const isLight = themeMode === "light";
  const appTheme = useAppThemeOptional();
  const accent = primaryColor ?? textColor ?? appTheme?.primary ?? "#4edea2";
  const mutedIcon = isLight ? "#475569" : "#94a3b8";
  const activeBg = appTheme ? `${appTheme.primary}2A` : "rgba(78, 222, 162, 0.16)";
  return (
    <BlurView
      intensity={48}
      tint={isLight ? "light" : "dark"}
      style={[styles.bar, isLight && styles.barLight, { paddingTop: insets.top + 10, paddingBottom: 12 }]}
    >
      <View style={styles.row}>
        {title.trim().length > 0 ? (
          <Text style={[styles.title, { color: textColor ?? accent }, useCustomFonts && { fontFamily: stitchFonts.display }]} numberOfLines={1}>
            {title.trim()}
          </Text>
        ) : (
          <View style={styles.titleSpacer} />
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.iconBtn, favouritesActive && { backgroundColor: activeBg }]}
          onPress={onFavourites}
          activeOpacity={0.75}
          delayPressIn={0}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          pressRetentionOffset={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Ionicons name={favouritesActive ? "heart" : "heart-outline"} size={22} color={favouritesActive ? accent : mutedIcon} />
        </TouchableOpacity>
        {onSettings ? (
          <TouchableOpacity
            style={[styles.iconBtn, settingsActive && { backgroundColor: activeBg }]}
            onPress={onSettings}
            activeOpacity={0.75}
            delayPressIn={0}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            pressRetentionOffset={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons name={settingsActive ? "settings" : "settings-outline"} size={22} color={settingsActive ? accent : mutedIcon} />
          </TouchableOpacity>
        ) : null}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    backgroundColor: "rgba(11, 19, 37, 0.55)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(60, 74, 66, 0.12)"
  },
  barLight: {
    backgroundColor: "rgba(248, 250, 252, 0.82)",
    borderBottomColor: "rgba(15, 23, 42, 0.12)"
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  titleSpacer: {
    minHeight: 22,
    flex: 1
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
    flex: 1
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center"
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  }
});
