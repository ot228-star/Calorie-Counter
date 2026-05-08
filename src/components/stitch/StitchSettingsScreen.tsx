import React, { useMemo } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
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
  bmiValue: number | null;
  bmrValue: number | null;
  bmiLabel: string;
  onRecalculateCalories: () => void;
  nickname: string;
  setNickname: (name: string) => void;
  onSaveNickname: () => void;
  onOpenNotifications: () => void;
  onOpenPrivacy: () => void;
  onOpenSupport: () => void;
  onShareApp: () => void;
  onRateApp: () => void;
  onOpenAbout: () => void;
  notificationsHint?: string;
  privacyHint?: string;
  supportHint?: string;
  shareHint?: string;
  rateHint?: string;
  aboutHint?: string;
  onSignOut?: () => void;
  showSignOut?: boolean;
  useCustomFonts?: boolean;
  onOpenPrivacyPolicy?: () => void;
  onOpenTerms?: () => void;
  onExportData?: () => void;
  onDeleteAccount?: () => void;
  showDeleteAccount?: boolean;
};

function createStyles(t: AppThemeTokens) {
  const glow = mixHex(t.primary, t.background, 0.9);
  return StyleSheet.create({
    root: { gap: 20 },
    sectionHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
    sectionTitle: { fontSize: 20, fontWeight: "800", color: t.onSurface },
    profileCard: {
      backgroundColor: t.surfaceLow,
      borderRadius: 12,
      padding: 18,
      gap: 10
    },
    input: {
      backgroundColor: t.surfaceContainer,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      color: t.onSurface,
      fontSize: 15
    },
    saveRow: { alignItems: "flex-end", marginTop: 4 },
    saveBtn: {
      borderRadius: 999,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderWidth: 1
    },
    saveTxt: { fontWeight: "800", fontSize: 13 },
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
    mutedSm: { fontSize: 11, color: t.onSurfaceVariant },
    fieldLbl: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.5,
      textTransform: "uppercase",
      color: t.onSurfaceVariant,
      marginTop: 8
    },
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
    statusTxt: { color: t.primary, fontWeight: "800", fontSize: 11, textTransform: "uppercase" },
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
  bmiValue,
  bmrValue,
  bmiLabel,
  onRecalculateCalories,
  nickname,
  setNickname,
  onSaveNickname,
  onOpenNotifications,
  onOpenPrivacy,
  onOpenSupport,
  onShareApp,
  onRateApp,
  onOpenAbout,
  notificationsHint,
  privacyHint,
  supportHint,
  shareHint,
  rateHint,
  aboutHint,
  onSignOut,
  showSignOut,
  useCustomFonts,
  onOpenPrivacyPolicy,
  onOpenTerms,
  onExportData,
  onDeleteAccount,
  showDeleteAccount
}: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const grad = [theme.primary, theme.primaryContainer] as const;
  const pulse = () => {
    void Haptics.selectionAsync().catch(() => {
      // Ignore unsupported/disabled haptics.
    });
  };

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
        <Ionicons name="person-circle" size={22} color={theme.primary} />
        <Text style={[styles.sectionTitle, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.display }]}>Profile</Text>
      </View>
      <View style={styles.profileCard}>
        <Text style={[styles.label, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.body }]}>Username</Text>
        <TextInput
          style={[styles.input, useCustomFonts && { fontFamily: stitchFonts.body }]}
          placeholder="Set your username"
          placeholderTextColor={`${ui.muted}aa`}
          value={nickname}
          onChangeText={setNickname}
          maxLength={24}
          autoCapitalize="words"
        />
        <View style={styles.saveRow}>
          <TouchableOpacity
            style={[styles.saveBtn, { borderColor: theme.primary, backgroundColor: `${theme.primary}22` }]}
            onPress={() => {
              pulse();
              onSaveNickname();
            }}
            activeOpacity={0.85}
            delayPressIn={0}
          >
            <Text style={[styles.saveTxt, { color: theme.primary }]}>Save username</Text>
          </TouchableOpacity>
        </View>
      </View>

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
                  onPress={() => {
                    if (!on) pulse();
                    setAccentId(id);
                  }}
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
                <TouchableOpacity
                  key={id}
                  onPress={() => {
                    if (!on) pulse();
                    setUiPaletteId(id);
                  }}
                  style={styles.paletteBtn}
                  activeOpacity={0.85}
                >
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
          <Text style={[styles.mutedSm, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>
            Based on onboarding sex: {biologicalSex === "woman" ? "Woman" : biologicalSex === "man" ? "Man" : "Not set"}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: mixHex(theme.primary, theme.background, 0.88) }]}>
            <Ionicons name="checkmark-circle" size={14} color={theme.onPrimaryContainer} />
            <Text style={styles.statusTxt}>{bmiLabel}</Text>
          </View>
          <Text style={[styles.para, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>
            Your BMI informs calorie suggestions alongside your goals.
          </Text>
          <TouchableOpacity
            onPress={() => {
              pulse();
              onRecalculateCalories();
            }}
            activeOpacity={0.92}
            delayPressIn={0}
            style={{ borderRadius: 999, overflow: "hidden", marginTop: 12 }}
          >
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
          onPress={() => {
            pulse();
            onOpenNotifications();
          }}
          activeOpacity={0.85}
          delayPressIn={0}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.tertiary} />
          <Text style={[styles.tileH, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.display }]}>Notifications</Text>
          <Text style={[styles.tileP, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>
            {notificationsHint ?? "Manage reminders and push permissions"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tile, { backgroundColor: ui.card }]}
          onPress={() => {
            pulse();
            onOpenPrivacy();
          }}
          activeOpacity={0.85}
          delayPressIn={0}
        >
          <Ionicons name="lock-closed-outline" size={24} color={theme.primary} />
          <Text style={[styles.tileH, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.display }]}>Privacy</Text>
          <Text style={[styles.tileP, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>
            {privacyHint ?? "Biometric lock and security controls"}
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.tile, { backgroundColor: ui.card }]}
        onPress={() => {
          pulse();
          onOpenSupport();
        }}
        activeOpacity={0.85}
        delayPressIn={0}
      >
        <Ionicons name="mail-outline" size={24} color={theme.primary} />
        <Text style={[styles.tileH, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.display }]}>Support</Text>
        <Text style={[styles.tileP, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>
          {supportHint ?? "Contact support via email"}
        </Text>
      </TouchableOpacity>
      <View style={styles.grid2}>
        <TouchableOpacity
          style={[styles.tile, { backgroundColor: ui.card }]}
          onPress={() => {
            pulse();
            onShareApp();
          }}
          activeOpacity={0.85}
          delayPressIn={0}
        >
          <Ionicons name="share-social-outline" size={24} color={theme.primary} />
          <Text style={[styles.tileH, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.display }]}>Share app</Text>
          <Text style={[styles.tileP, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>
            {shareHint ?? "Send app link to friends"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tile, { backgroundColor: ui.card }]}
          onPress={() => {
            pulse();
            onRateApp();
          }}
          activeOpacity={0.85}
          delayPressIn={0}
        >
          <Ionicons name="star-outline" size={24} color={theme.primary} />
          <Text style={[styles.tileH, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.display }]}>Rate app</Text>
          <Text style={[styles.tileP, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>
            {rateHint ?? "Leave feedback in the store"}
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.tile, { backgroundColor: ui.card }]}
        onPress={() => {
          pulse();
          onOpenAbout();
        }}
        activeOpacity={0.85}
        delayPressIn={0}
      >
        <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
        <Text style={[styles.tileH, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.display }]}>About</Text>
        <Text style={[styles.tileP, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>
          {aboutHint ?? "App version and quick info"}
        </Text>
      </TouchableOpacity>

      <View style={styles.sectionHead}>
        <Ionicons name="document-text-outline" size={22} color={theme.primary} />
        <Text style={[styles.sectionTitle, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.display }]}>Legal & data</Text>
      </View>
      <View style={styles.grid2}>
        {onOpenPrivacyPolicy ? (
          <TouchableOpacity
            style={[styles.tile, { backgroundColor: ui.card }]}
            onPress={() => {
              pulse();
              onOpenPrivacyPolicy();
            }}
            activeOpacity={0.85}
            delayPressIn={0}
          >
            <Ionicons name="shield-checkmark-outline" size={24} color={theme.primary} />
            <Text style={[styles.tileH, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.display }]}>Privacy policy</Text>
            <Text style={[styles.tileP, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>
              How Inertia handles your data
            </Text>
          </TouchableOpacity>
        ) : null}
        {onOpenTerms ? (
          <TouchableOpacity
            style={[styles.tile, { backgroundColor: ui.card }]}
            onPress={() => {
              pulse();
              onOpenTerms();
            }}
            activeOpacity={0.85}
            delayPressIn={0}
          >
            <Ionicons name="reader-outline" size={24} color={theme.primary} />
            <Text style={[styles.tileH, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.display }]}>Terms of service</Text>
            <Text style={[styles.tileP, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>
              Rules for using Inertia
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {onExportData ? (
        <TouchableOpacity
          style={[styles.tile, { backgroundColor: ui.card }]}
          onPress={() => {
            pulse();
            onExportData();
          }}
          activeOpacity={0.85}
          delayPressIn={0}
        >
          <Ionicons name="download-outline" size={24} color={theme.primary} />
          <Text style={[styles.tileH, { color: ui.text }, useCustomFonts && { fontFamily: stitchFonts.display }]}>Export my data</Text>
          <Text style={[styles.tileP, { color: ui.muted }, useCustomFonts && { fontFamily: stitchFonts.body }]}>
            Download a copy of your meals and profile
          </Text>
        </TouchableOpacity>
      ) : null}

      {showSignOut && onSignOut ? (
        <TouchableOpacity
          style={[styles.signOut, { borderColor: theme.danger }]}
          onPress={() => {
            pulse();
            onSignOut();
          }}
          activeOpacity={0.85}
          delayPressIn={0}
        >
          <Text style={[styles.signOutTxt, { color: theme.danger }]}>Sign out</Text>
        </TouchableOpacity>
      ) : null}

      {showDeleteAccount && onDeleteAccount ? (
        <TouchableOpacity
          style={[styles.signOut, { borderColor: theme.danger, backgroundColor: `${theme.danger}11` }]}
          onPress={() => {
            pulse();
            onDeleteAccount();
          }}
          activeOpacity={0.85}
          delayPressIn={0}
        >
          <Text style={[styles.signOutTxt, { color: theme.danger }]}>Delete account</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
