import React, { useMemo } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { AppThemeTokens } from "../../theme/AppThemeContext";
import { useAppTheme } from "../../theme/AppThemeContext";
import { mixHex } from "../../lib/themeColors";
import { stitchFonts } from "../../theme/stitch";

type AccentId = "blue" | "emerald" | "violet" | "rose" | "orange";
type UiPaletteId = "midnight" | "forest" | "ocean" | "graphite" | "sunrise";

type Props = {
  themeMode: "light" | "dark";
  setThemeMode: (m: "light" | "dark") => void;
  accentId: AccentId;
  setAccentId: (id: AccentId) => void;
  accentOrder: AccentId[];
  accentPresets: Record<AccentId, { label: string; light: string; dark: string }>;
  uiPaletteId: UiPaletteId;
  setUiPaletteId: (id: UiPaletteId) => void;
  uiPaletteOrder: UiPaletteId[];
  uiPalettes: Record<UiPaletteId, { label: string; light: { background: string }; dark: { background: string } }>;
  biologicalSex: "man" | "woman" | null;
  setBiologicalSex: (s: "man" | "woman") => void;
  bmiValue: number | null;
  bmrValue: number | null;
  bmiLabel: string;
  onRecalculateCalories: () => void;
  onSignOut?: () => void;
  showSignOut?: boolean;
  useCustomFonts?: boolean;
};

function createStyles(t: AppThemeTokens, themeMode: "light" | "dark") {
  const sexOnBg = mixHex(t.primary, t.background, themeMode === "dark" ? 0.82 : 0.88);
  const glow = mixHex(t.primary, t.background, 0.9);
  return StyleSheet.create({
    root: { gap: 20 },
    sectionHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
    sectionTitle: { fontSize: 20, fontWeight: "800", color: t.onSurface },
    cardLow: {
      backgroundColor: t.surfaceLow,
      borderRadius: 12,
      padding: 18,
      gap: 8
    },
    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
    label: { fontWeight: "600", color: t.onSurface },
    muted: { fontSize: 13, color: t.onSurfaceVariant },
    themeToggle: { flexDirection: "row", backgroundColor: t.surfaceContainerHighest, borderRadius: 999, padding: 4 },
    themeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
    themeBtnOn: { backgroundColor: t.primary },
    themeTxt: { fontSize: 13, fontWeight: "700", color: t.onSurfaceVariant },
    themeTxtOn: { color: t.onPrimary },
    accentRow: { flexDirection: "row", gap: 14, flexWrap: "wrap", paddingTop: 8 },
    paletteBtn: { alignItems: "center", gap: 6, width: 72 },
    swatch: { width: 36, height: 36, borderRadius: 999 },
    swatchOn: { borderWidth: 2, borderColor: t.onSurface },
    bento: { gap: 12 },
    bentoCard: {
      backgroundColor: t.surfaceContainer,
      borderRadius: 12,
      padding: 18,
      gap: 8
    },
    bentoH: { fontSize: 16, fontWeight: "800", color: t.onSurface },
    mutedSm: { fontSize: 11, color: t.onSurfaceVariant },
    fieldLbl: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.5,
      textTransform: "uppercase",
      color: t.onSurfaceVariant,
      marginTop: 8
    },
    sexRow: { flexDirection: "row", gap: 8 },
    sexBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: t.surfaceContainerHigh,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "transparent"
    },
    sexBtnOn: { backgroundColor: sexOnBg, borderWidth: 1 },
    sexTxt: { fontWeight: "800", color: t.onSurfaceVariant, fontSize: 13 },
    sexTxtOn: { color: t.primary },
    italicSm: { fontSize: 10, color: t.onSurfaceVariant, fontStyle: "italic" },
    bentoCardHigh: {
      backgroundColor: t.surfaceContainerHigh,
      borderRadius: 12,
      padding: 18,
      overflow: "hidden",
      gap: 8
    },
    glow: {
      position: "absolute",
      top: -20,
      right: -20,
      width: 100,
      height: 100,
      borderRadius: 999,
      backgroundColor: glow
    },
    bmiRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 8 },
    bmiBig: { fontSize: 48, fontWeight: "900", color: t.primary },
    bmiUnit: { color: t.onSurfaceVariant, fontWeight: "600" },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      marginTop: 4
    },
    statusTxt: { color: t.onPrimaryContainer, fontWeight: "800", fontSize: 11, textTransform: "uppercase" },
    para: { fontSize: 13, color: t.onSurfaceVariant, lineHeight: 20, marginTop: 8 },
    recalc: { paddingVertical: 14, alignItems: "center" },
    recalcTxt: { color: t.onPrimary, fontWeight: "800", fontSize: 14 },
    grid2: { flexDirection: "row", gap: 12 },
    tile: {
      flex: 1,
      backgroundColor: t.surfaceLow,
      borderRadius: 12,
      padding: 16,
      gap: 6
    },
    tileH: { fontWeight: "800", color: t.onSurface, fontSize: 14 },
    tileP: { fontSize: 10, color: t.onSurfaceVariant, lineHeight: 14 },
    signOut: {
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8
    },
    signOutTxt: { fontWeight: "800", fontSize: 15 }
  });
}

export function StitchSettingsScreen({
  themeMode,
  setThemeMode,
  accentId,
  setAccentId,
  accentOrder,
  accentPresets,
  uiPaletteId,
  setUiPaletteId,
  uiPaletteOrder,
  uiPalettes,
  biologicalSex,
  setBiologicalSex,
  bmiValue,
  bmrValue,
  bmiLabel,
  onRecalculateCalories,
  onSignOut,
  showSignOut,
  useCustomFonts
}: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme, themeMode), [theme, themeMode]);
  const grad = [theme.primary, theme.primaryContainer] as const;

  const ui = {
    cardLow: theme.cardBackground,
    card: theme.inputBackground,
    cardHigh: theme.cardBackground,
    text: theme.text,
    muted: theme.mutedText,
    border: theme.border
  };

  return (
    <View style={styles.root}>
      <View style={styles.sectionHead}>
        <Ionicons name="color-palette" size={22} color={theme.primary} />
        <Text style={[styles.sectionTitle, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.display }]}>Appearance</Text>
      </View>
      <View style={[styles.cardLow, { backgroundColor: ui.cardLow }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.label, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.body }]}>Theme mode</Text>
          <View style={[styles.themeToggle, { backgroundColor: theme.surfaceContainerHighest }]}>
            <TouchableOpacity
              style={[styles.themeBtn, themeMode === "light" && [styles.themeBtnOn, { backgroundColor: theme.primary }]]}
              onPress={() => setThemeMode("light")}
            >
              <Text style={[styles.themeTxt, { color: ui.muted }, themeMode === "light" && [styles.themeTxtOn, { color: theme.onPrimary }]]}>Light</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeBtn, themeMode === "dark" && [styles.themeBtnOn, { backgroundColor: theme.primary }]]}
              onPress={() => setThemeMode("dark")}
            >
              <Text style={[styles.themeTxt, { color: ui.muted }, themeMode === "dark" && [styles.themeTxtOn, { color: theme.onPrimary }]]}>Dark</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ gap: 8, marginTop: 12 }}>
          <Text style={[styles.label, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.body }]}>Accent color helper</Text>
          <Text style={[styles.muted, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>Changes icon/button color theme</Text>
          <View style={styles.accentRow}>
            {accentOrder.map((id) => {
              const p = accentPresets[id];
              const on = id === accentId;
              const c = themeMode === "dark" ? p.dark : p.light;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.swatch, { backgroundColor: c }, on && styles.swatchOn]}
                  onPress={() => setAccentId(id)}
                />
              );
            })}
          </View>
        </View>
        <View style={{ gap: 8, marginTop: 12 }}>
          <Text style={[styles.label, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.body }]}>UI palette</Text>
          <Text style={[styles.muted, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>Adjusts background/surface/text colors app-wide.</Text>
          <View style={styles.accentRow}>
            {uiPaletteOrder.map((id) => {
              const on = id === uiPaletteId;
              const swatch = themeMode === "dark" ? uiPalettes[id].dark.background : uiPalettes[id].light.background;
              return (
                <TouchableOpacity key={id} onPress={() => setUiPaletteId(id)} style={styles.paletteBtn} activeOpacity={0.85}>
                  <View style={[styles.swatch, { backgroundColor: swatch }, on && styles.swatchOn]} />
                  <Text style={[styles.mutedSm, { color: on ? theme.primary : ui.muted }]}>{uiPalettes[id].label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.sectionHead}>
        <Ionicons name="calculator" size={22} color={theme.primary} />
        <Text style={[styles.sectionTitle, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.display }]}>BMI calculator</Text>
      </View>
      <View style={styles.bento}>
        <View style={[styles.bentoCard, { backgroundColor: ui.card }]}>
          <Text style={[styles.bentoH, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.display }]}>Enter body data…</Text>
          <Text style={[styles.mutedSm, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>Used to refine your daily goals</Text>
          <Text style={[styles.fieldLbl, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>Sex</Text>
          <View style={styles.sexRow}>
            <TouchableOpacity
              style={[styles.sexBtn, { backgroundColor: ui.cardLow }, biologicalSex === "man" && [styles.sexBtnOn, { borderColor: theme.primary }]]}
              onPress={() => setBiologicalSex("man")}
            >
              <Text style={[styles.sexTxt, { color: ui.muted }, biologicalSex === "man" && [styles.sexTxtOn, { color: theme.primary }]]}>Man</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sexBtn, { backgroundColor: ui.cardLow }, biologicalSex === "woman" && [styles.sexBtnOn, { borderColor: theme.primary }]]}
              onPress={() => setBiologicalSex("woman")}
            >
              <Text style={[styles.sexTxt, { color: ui.muted }, biologicalSex === "woman" && [styles.sexTxtOn, { color: theme.primary }]]}>Woman</Text>
            </TouchableOpacity>
          </View>
          {biologicalSex ? null : (
            <Text style={[styles.italicSm, { color: ui.muted }]}>Optional: choose sex for more accurate calorie estimation.</Text>
          )}
        </View>
        <View style={[styles.bentoCardHigh, { backgroundColor: ui.cardLow }]}>
          <View style={styles.glow} />
          <Text style={[styles.fieldLbl, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>BMI result / Status</Text>
          <View style={styles.bmiRow}>
            <Text style={[styles.bmiBig, useCustomFonts && { fontFamily: stitchFonts.display }]}>
              {bmiValue != null ? String(bmiValue) : "--"}
            </Text>
            <Text style={[styles.bmiUnit, { color: ui.muted }]}>kg/m²</Text>
          </View>
          <Text style={[styles.mutedSm, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>
            BMR: {bmrValue ?? "--"} kcal/day
          </Text>
          <View style={[styles.statusPill, { backgroundColor: mixHex(theme.primary, theme.background, 0.88) }]}>
            <Ionicons name="checkmark-circle" size={14} color={theme.onPrimaryContainer} />
            <Text style={styles.statusTxt}>{bmiLabel}</Text>
          </View>
          <Text style={[styles.para, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>
            Your BMI informs calorie suggestions alongside your goals.
          </Text>
          <TouchableOpacity onPress={onRecalculateCalories} activeOpacity={0.92} style={{ borderRadius: 999, overflow: "hidden", marginTop: 12 }}>
            <LinearGradient colors={grad} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.recalc}>
              <Text style={[styles.recalcTxt, useCustomFonts && { fontFamily: stitchFonts.display }]}>
                Recalculate suggested calories
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.grid2}>
        <TouchableOpacity
          style={[styles.tile, { backgroundColor: ui.card }]}
          onPress={() => Alert.alert("Notifications", "Coming soon.")}
          activeOpacity={0.85}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.tertiary} />
          <Text style={[styles.tileH, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.display }]}>Notifications</Text>
          <Text style={[styles.tileP, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>
            Gentle nudges for hydration and steps
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tile, { backgroundColor: ui.card }]} onPress={() => Alert.alert("Privacy", "Coming soon.")} activeOpacity={0.85}>
          <Ionicons name="lock-closed-outline" size={24} color={theme.primary} />
          <Text style={[styles.tileH, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.display }]}>Privacy</Text>
          <Text style={[styles.tileP, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>Biometric lock and data encryption</Text>
        </TouchableOpacity>
      </View>

      {showSignOut && onSignOut ? (
        <TouchableOpacity style={[styles.signOut, { borderColor: theme.danger }]} onPress={onSignOut} activeOpacity={0.85}>
          <Text style={[styles.signOutTxt, { color: theme.danger }]}>Sign out</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
