import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { AppThemeTokens } from "../../theme/AppThemeContext";
import { useAppTheme } from "../../theme/AppThemeContext";
import { mixHex } from "../../lib/themeColors";
import { stitchFonts } from "../../theme/stitch";

type Props = {
  title: string;
  subtitle: string;
  description: string;
  sourceLabel: string;
  imageSlot: React.ReactNode;
  /** Per 100 g (typical food DB basis). */
  caloriesPer100: number;
  proteinGPer100: number;
  carbsGPer100: number;
  fatGPer100: number;
  onBack: () => void;
  onLogToDay?: () => void;
  useCustomFonts?: boolean;
};

function createStyles(t: AppThemeTokens) {
  const cardBg = t.surfaceContainerHigh;
  const barProtein = t.primary;
  const barFat = mixHex(t.tertiary, t.primary, 0.4);
  return StyleSheet.create({
    root: { gap: 0 },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
      paddingHorizontal: 2
    },
    circleBtn: {
      width: 44,
      height: 44,
      borderRadius: 999,
      backgroundColor: t.surfaceContainerHigh,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border
    },
    topBarCenter: {
      flex: 1
    },
    heartBtn: {
      width: 44,
      height: 44,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border
    },
    hero: { gap: 8, marginBottom: 16 },
    h1: {
      fontSize: 28,
      fontWeight: "900",
      color: t.onSurface,
      letterSpacing: -0.6,
      lineHeight: 34
    },
    sub: { fontSize: 15, color: t.onSurfaceVariant, lineHeight: 22 },
    imgWrap: {
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: t.surfaceLow,
      minHeight: 260,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.35,
      shadowRadius: 28,
      elevation: 12
    },
    imgInner: { position: "relative", width: "100%", minHeight: 260 },
    verifiedBadge: {
      position: "absolute",
      bottom: 12,
      left: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: "rgba(0,0,0,0.55)"
    },
    verifiedDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: barProtein },
    verifiedTxt: {
      color: barProtein,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.2,
      textTransform: "uppercase"
    },
    src: {
      fontSize: 12,
      color: t.onSurfaceVariant,
      marginTop: 12,
      lineHeight: 18
    },
    nutrientRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 18,
      alignItems: "stretch"
    },
    calCard: {
      flex: 1,
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      justifyContent: "space-between",
      minHeight: 152
    },
    calIconRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    calBig: { fontSize: 36, fontWeight: "900", color: t.onSurface, letterSpacing: -1 },
    calLbl: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.4,
      color: t.onSurfaceVariant,
      textTransform: "uppercase",
      marginTop: 4
    },
    calSub: { fontSize: 11, color: t.onSurfaceVariant, marginTop: 6 },
    macroCol: { flex: 1, gap: 10 },
    macroCard: {
      flex: 1,
      backgroundColor: cardBg,
      borderRadius: 14,
      paddingVertical: 12,
      paddingLeft: 14,
      paddingRight: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      overflow: "hidden",
      minHeight: 68
    },
    macroTextCol: { flex: 1 },
    macroVal: { fontSize: 20, fontWeight: "900", color: t.onSurface },
    macroLbl: {
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1,
      color: t.onSurfaceVariant,
      textTransform: "uppercase",
      marginTop: 2
    },
    macroAccentBar: { width: 4, alignSelf: "stretch", borderRadius: 2, marginLeft: 8 },
    descSection: { marginTop: 22, gap: 10 },
    descHeading: {
      fontSize: 17,
      fontWeight: "800",
      color: t.onSurface
    },
    body: { fontSize: 14, color: t.onSurfaceVariant, lineHeight: 22 },
    logOuter: { marginTop: 22, borderRadius: 999, overflow: "hidden" },
    logBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 16
    },
    logTxt: { fontWeight: "800", fontSize: 16 }
  });
}

export function StitchFoodDetailScreen({
  title,
  subtitle,
  description,
  sourceLabel,
  imageSlot,
  caloriesPer100,
  proteinGPer100,
  carbsGPer100,
  fatGPer100,
  onBack,
  onLogToDay,
  useCustomFonts
}: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const grad = [theme.primary, theme.primaryContainer] as const;
  const [favorite, setFavorite] = useState(false);

  const cal = Math.round(caloriesPer100);
  const p = Number(proteinGPer100.toFixed(1));
  const c = Number(carbsGPer100.toFixed(1));
  const f = Number(fatGPer100.toFixed(1));
  const barProtein = theme.primary;
  const barFat = mixHex(theme.tertiary, theme.primary, 0.35);

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.circleBtn} onPress={onBack} activeOpacity={0.85} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={theme.primary} />
        </TouchableOpacity>
        <View style={styles.topBarCenter} />
        <TouchableOpacity
          style={[styles.heartBtn, { backgroundColor: favorite ? `${theme.primary}33` : theme.surfaceContainerHigh }]}
          onPress={() => setFavorite((v) => !v)}
          activeOpacity={0.85}
        >
          <Ionicons name={favorite ? "heart" : "heart-outline"} size={22} color={favorite ? theme.primary : theme.mutedText} />
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <Text style={[styles.h1, useCustomFonts && { fontFamily: stitchFonts.display }]}>{title}</Text>
        <Text style={[styles.sub, useCustomFonts && { fontFamily: stitchFonts.body }]}>{subtitle}</Text>
      </View>

      <View style={styles.imgWrap}>
        <View style={styles.imgInner}>
          {imageSlot}
          <View style={styles.verifiedBadge} pointerEvents="none">
            <View style={[styles.verifiedDot, { backgroundColor: barProtein }]} />
            <Text style={styles.verifiedTxt}>Verified nutrients</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.src, useCustomFonts && { fontFamily: stitchFonts.body }]}>{sourceLabel}</Text>

      <View style={styles.nutrientRow}>
        <View style={styles.calCard}>
          <View>
            <View style={styles.calIconRow}>
              <Ionicons name="flash" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.calBig, useCustomFonts && { fontFamily: stitchFonts.display }]}>{cal}</Text>
            <Text style={styles.calLbl}>Calories</Text>
            <Text style={[styles.calSub, useCustomFonts && { fontFamily: stitchFonts.body }]}>
              per 100g · Carbs {c}g
            </Text>
          </View>
        </View>
        <View style={styles.macroCol}>
          <View style={styles.macroCard}>
            <View style={styles.macroTextCol}>
              <Text style={[styles.macroVal, useCustomFonts && { fontFamily: stitchFonts.display }]}>{p}g</Text>
              <Text style={styles.macroLbl}>Protein</Text>
            </View>
            <View style={[styles.macroAccentBar, { backgroundColor: barProtein }]} />
          </View>
          <View style={styles.macroCard}>
            <View style={styles.macroTextCol}>
              <Text style={[styles.macroVal, useCustomFonts && { fontFamily: stitchFonts.display }]}>{f}g</Text>
              <Text style={styles.macroLbl}>Healthy fats</Text>
            </View>
            <View style={[styles.macroAccentBar, { backgroundColor: barFat }]} />
          </View>
        </View>
      </View>

      <View style={styles.descSection}>
        <Text style={[styles.descHeading, useCustomFonts && { fontFamily: stitchFonts.display }]}>Description</Text>
        <Text style={[styles.body, useCustomFonts && { fontFamily: stitchFonts.body }]}>{description}</Text>
      </View>

      {onLogToDay ? (
        <TouchableOpacity onPress={onLogToDay} activeOpacity={0.92} style={styles.logOuter}>
          <LinearGradient colors={grad} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.logBtn}>
            <Ionicons name="add" size={22} color={theme.onPrimary} />
            <Text style={[styles.logTxt, { color: theme.onPrimary }, useCustomFonts && { fontFamily: stitchFonts.display }]}>
              Log to My Day
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
