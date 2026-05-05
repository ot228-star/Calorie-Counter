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
  keyIngredients: string[];
  wellnessTip: string;
  imageSlot: React.ReactNode;
  /** Per 100 g (typical food DB basis). */
  caloriesPer100: number;
  proteinGPer100: number;
  carbsGPer100: number;
  fatGPer100: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onBack: () => void;
  onLogToDay?: (servings: number) => void;
  useCustomFonts?: boolean;
};

function createStyles(t: AppThemeTokens) {
  const cardBg = t.surfaceContainerHigh;
  const chipBg = mixHex(t.surfaceContainerHighest, t.background, 0.7);
  return StyleSheet.create({
    root: { gap: 14 },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
    brand: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "800", letterSpacing: -0.2 },
    heartBtn: {
      width: 44,
      height: 44,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border
    },
    hero: { gap: 4 },
    h1: {
      fontSize: 40,
      fontWeight: "900",
      color: t.onSurface,
      letterSpacing: -1.2,
      lineHeight: 44
    },
    sub: { fontSize: 16, color: t.onSurfaceVariant, lineHeight: 22 },
    titleRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 10 },
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
    heroGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 120
    },
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
    verifiedDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: t.primary },
    verifiedTxt: {
      color: t.primary,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.2,
      textTransform: "uppercase"
    },
    src: {
      fontSize: 12,
      color: t.onSurfaceVariant,
      lineHeight: 18
    },
    energyCard: {
      backgroundColor: cardBg,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      padding: 16,
      gap: 10
    },
    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    labelMini: { fontSize: 10, fontWeight: "800", letterSpacing: 1.3, textTransform: "uppercase", color: t.onSurfaceVariant },
    energyBig: { fontSize: 48, fontWeight: "900", letterSpacing: -1.2, color: t.primary },
    energyKcal: { fontSize: 28, color: t.onSurfaceVariant, fontWeight: "600" },
    boltCircle: {
      width: 52,
      height: 52,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: t.primary
    },
    macrosRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "stretch"
    },
    macroCard: {
      flex: 1,
      backgroundColor: cardBg,
      borderRadius: 14,
      padding: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      gap: 6
    },
    macroLbl: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.1,
      color: t.onSurfaceVariant,
      textTransform: "uppercase"
    },
    macroVal: { fontSize: 32, fontWeight: "900", color: t.onSurface, letterSpacing: -0.8 },
    macroBarTrack: { height: 4, borderRadius: 999, backgroundColor: t.surfaceContainerHighest, overflow: "hidden" },
    macroBarFill: { height: "100%", borderRadius: 999 },
    portionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
    servingText: { color: t.onSurfaceVariant, fontSize: 13 },
    stepper: {
      marginTop: 8,
      backgroundColor: cardBg,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      padding: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    stepBtn: { width: 44, height: 44, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceContainer },
    stepMid: { alignItems: "center", gap: 2 },
    stepNum: { fontSize: 34, fontWeight: "900", color: t.onSurface, letterSpacing: -0.8 },
    stepLbl: { fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: "700", color: t.onSurfaceVariant },
    sectionTitle: { fontSize: 28, fontWeight: "800", color: t.onSurface, letterSpacing: -0.4 },
    chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: chipBg
    },
    chipTxt: { color: t.onSurface, fontSize: 13, fontWeight: "600" },
    tipCard: {
      marginTop: 2,
      borderRadius: 16,
      backgroundColor: cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      padding: 14,
      gap: 8
    },
    tipTitle: { color: t.onSurface, fontWeight: "800", fontSize: 16 },
    tipBody: { color: t.onSurfaceVariant, fontSize: 13, lineHeight: 20 },
    descHeading: { fontSize: 22, fontWeight: "800", color: t.onSurface, letterSpacing: -0.3 },
    body: { fontSize: 15, color: t.onSurfaceVariant, lineHeight: 23 },
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
  keyIngredients,
  wellnessTip,
  imageSlot,
  caloriesPer100,
  proteinGPer100,
  carbsGPer100,
  fatGPer100,
  isFavorite = false,
  onToggleFavorite,
  onBack,
  onLogToDay,
  useCustomFonts
}: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const grad = [theme.primary, theme.primaryContainer] as const;
  const [servings, setServings] = useState(1);

  const factor = servings;
  const cal = Math.round(caloriesPer100 * factor);
  const p = Number((proteinGPer100 * factor).toFixed(1));
  const c = Number((carbsGPer100 * factor).toFixed(1));
  const f = Number((fatGPer100 * factor).toFixed(1));
  const maxMacro = Math.max(1, p, c, f);
  const barProtein = theme.primary;
  const barCarb = mixHex(theme.tertiary, theme.primary, 0.7);
  const barFat = mixHex(theme.danger, theme.primary, 0.3);

  const adjustServings = (delta: number) => {
    setServings((prev: number) => Math.max(0.5, Math.min(5, Number((prev + delta).toFixed(1)))));
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.circleBtn} onPress={onBack} activeOpacity={0.85} delayPressIn={0} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.brand, { color: theme.primary }, useCustomFonts && { fontFamily: stitchFonts.display }]}>Inertia</Text>
        <TouchableOpacity
          style={[styles.heartBtn, { backgroundColor: isFavorite ? `${theme.primary}33` : theme.surfaceContainerHigh }]}
          onPress={onToggleFavorite}
          activeOpacity={0.85}
          delayPressIn={0}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          pressRetentionOffset={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? theme.primary : theme.mutedText} />
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <Text style={[styles.sub, useCustomFonts && { fontFamily: stitchFonts.body }]}>Premium meal</Text>
        <View style={styles.titleRow}>
          <Text style={[styles.h1, useCustomFonts && { fontFamily: stitchFonts.display }]} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <Text style={[styles.sub, useCustomFonts && { fontFamily: stitchFonts.body }]}>{subtitle}</Text>
      </View>

      <View style={styles.imgWrap}>
        <View style={styles.imgInner}>
          {imageSlot}
          <LinearGradient colors={["transparent", "rgba(2,6,23,0.85)"]} style={styles.heroGradient} />
          <View style={styles.verifiedBadge} pointerEvents="none">
            <View style={[styles.verifiedDot, { backgroundColor: barProtein }]} />
            <Text style={styles.verifiedTxt}>Verified nutrients</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.src, useCustomFonts && { fontFamily: stitchFonts.body }]}>{sourceLabel}</Text>

      <View style={styles.energyCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.labelMini}>Total energy</Text>
          <View style={styles.boltCircle}>
            <Ionicons name="flash" size={24} color={theme.primary} />
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
          <Text style={[styles.energyBig, useCustomFonts && { fontFamily: stitchFonts.display }]}>{cal}</Text>
          <Text style={styles.energyKcal}>kcal</Text>
        </View>
      </View>

      <View style={styles.macrosRow}>
        {[
          { label: "Protein", value: p, color: barProtein },
          { label: "Carbs", value: c, color: barCarb },
          { label: "Fats", value: f, color: barFat }
        ].map((macro) => (
          <View key={macro.label} style={styles.macroCard}>
            <Text style={styles.macroLbl}>{macro.label}</Text>
            <Text style={[styles.macroVal, useCustomFonts && { fontFamily: stitchFonts.display }]}>{macro.value}g</Text>
            <View style={styles.macroBarTrack}>
              <View style={[styles.macroBarFill, { width: `${Math.min(100, (macro.value / maxMacro) * 100)}%`, backgroundColor: macro.color }]} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.portionRow}>
        <Text style={[styles.descHeading, useCustomFonts && { fontFamily: stitchFonts.display }]}>Portion size</Text>
        <Text style={[styles.servingText, useCustomFonts && { fontFamily: stitchFonts.body }]}>1 serving = 100g</Text>
      </View>
      <View style={styles.stepper}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => adjustServings(-0.5)} activeOpacity={0.8} delayPressIn={0}>
          <Ionicons name="remove" size={22} color={theme.onSurface} />
        </TouchableOpacity>
        <View style={styles.stepMid}>
          <Text style={[styles.stepNum, useCustomFonts && { fontFamily: stitchFonts.display }]}>{servings.toFixed(1)}</Text>
          <Text style={styles.stepLbl}>Servings</Text>
        </View>
        <TouchableOpacity style={[styles.stepBtn, { backgroundColor: `${theme.primary}28` }]} onPress={() => adjustServings(0.5)} activeOpacity={0.8} delayPressIn={0}>
          <Ionicons name="add" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, useCustomFonts && { fontFamily: stitchFonts.display }]}>Key ingredients</Text>
      <View style={styles.chipsWrap}>
        {keyIngredients.slice(0, 6).map((ing) => (
          <View key={ing} style={styles.chip}>
            <Ionicons name="ellipse" size={8} color={theme.primary} />
            <Text style={[styles.chipTxt, useCustomFonts && { fontFamily: stitchFonts.body }]}>{ing}</Text>
          </View>
        ))}
      </View>

      <View style={styles.tipCard}>
        <Text style={[styles.tipTitle, useCustomFonts && { fontFamily: stitchFonts.display }]}>Nutrition tip</Text>
        <Text style={[styles.tipBody, useCustomFonts && { fontFamily: stitchFonts.body }]}>{wellnessTip}</Text>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={[styles.descHeading, useCustomFonts && { fontFamily: stitchFonts.display }]}>Description</Text>
        <Text style={[styles.body, useCustomFonts && { fontFamily: stitchFonts.body }]}>{description}</Text>
      </View>

      {onLogToDay ? (
        <TouchableOpacity onPress={() => onLogToDay(servings)} activeOpacity={0.92} delayPressIn={0} style={styles.logOuter}>
          <LinearGradient colors={grad} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.logBtn}>
            <Ionicons name="add-circle-outline" size={20} color={theme.onPrimary} />
            <Text style={[styles.logTxt, { color: theme.onPrimary }, useCustomFonts && { fontFamily: stitchFonts.display }]}>
              Add to Log
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
