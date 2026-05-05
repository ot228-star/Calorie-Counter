import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppThemeOptional } from "../../theme/AppThemeContext";
import { stitchFonts } from "../../theme/stitch";

type Props = {
  title: string;
  onBack: () => void;
  useCustomFonts?: boolean;
  right?: React.ReactNode;
  themeMode?: "light" | "dark";
  primaryColor?: string;
  textColor?: string;
};

export function StitchSecondaryHeader({ title, onBack, useCustomFonts, right, themeMode = "dark", primaryColor, textColor }: Props) {
  const insets = useSafeAreaInsets();
  const isLight = themeMode === "light";
  const appTheme = useAppThemeOptional();
  const accent = primaryColor ?? textColor ?? appTheme?.primary ?? "#4edea2";
  const circleBg = appTheme?.surfaceContainerHigh ?? (isLight ? "#e2e8f0" : "#222a3d");
  return (
    <BlurView
      intensity={48}
      tint={isLight ? "light" : "dark"}
      style={[styles.bar, isLight && styles.barLight, { paddingTop: insets.top + 8, paddingBottom: 12 }]}
    >
      <View style={styles.row}>
        <TouchableOpacity style={[styles.circleBtn, { backgroundColor: circleBg }, isLight && styles.circleBtnLight]} onPress={onBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={accent} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor ?? accent }, useCustomFonts && { fontFamily: stitchFonts.display }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.right}>{right}</View>
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
    backgroundColor: "rgba(11, 19, 37, 0.55)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(60, 74, 66, 0.12)"
  },
  barLight: {
    backgroundColor: "rgba(248, 250, 252, 0.82)",
    borderBottomColor: "rgba(15, 23, 42, 0.12)"
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 8
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center"
  },
  circleBtnLight: {
    backgroundColor: "#e2e8f0"
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3
  },
  right: { minWidth: 40, alignItems: "flex-end" }
});
