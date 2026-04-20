import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { AppThemeTokens } from "../../theme/AppThemeContext";
import { useAppTheme } from "../../theme/AppThemeContext";
import { mixHex } from "../../lib/themeColors";
import { stitchFonts } from "../../theme/stitch";

type MealRow = {
  id: string;
  mealType: string;
  source: string;
  itemCount: number;
  calories: number;
};

type Props = {
  remainingCalories: number;
  targetCalories: number;
  consumedCalories: number;
  mealsLogged: number;
  progress01: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  avgMealCalories: number;
  recentMeals: MealRow[];
  dateLabel: string;
  useCustomFonts?: boolean;
  onQuickLog: () => void;
  onLogBreakfast: () => void;
  onDeleteMeal: (id: string) => void;
};

/** Demo macro targets from `dashboard/code.html` for bar ratios. */
const P_TARGET = 160;
const C_TARGET = 250;
const F_TARGET = 75;

function createStyles(t: AppThemeTokens) {
  const glow = mixHex(t.primary, t.background, 0.88);
  const badgeBg = mixHex(t.primary, t.background, 0.82);
  return StyleSheet.create({
    root: { gap: 22 },
    welcomeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 12
    },
    welcomeText: { flex: 1, gap: 4 },
    h1: {
      color: t.onSurface,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: -0.3
    },
    date: { color: t.onSurfaceVariant, fontSize: 15, fontWeight: "500" },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: badgeBg,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      alignSelf: "flex-start"
    },
    badgeDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: t.primary },
    badgeTxt: { color: t.primary, fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
    heroRow: { gap: 16 },
    heroMain: {
      borderRadius: 16,
      backgroundColor: t.surfaceContainerHigh,
      padding: 22,
      overflow: "hidden"
    },
    heroGlow: {
      position: "absolute",
      top: -40,
      right: -40,
      width: 160,
      height: 160,
      borderRadius: 999,
      backgroundColor: glow
    },
    heroInner: { gap: 20, zIndex: 1 },
    caption: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 2,
      textTransform: "uppercase",
      color: t.onSurfaceVariant
    },
    heroNums: { flexDirection: "row", alignItems: "baseline", gap: 8 },
    heroBig: { fontSize: 56, color: t.text, fontWeight: "900", letterSpacing: -2 },
    heroKcal: { fontSize: 22, color: t.primary, fontWeight: "800" },
    gap24: { gap: 14 },
    progressLabels: { flexDirection: "row", justifyContent: "space-between" },
    mutedSm: { fontSize: 12, fontWeight: "700", color: t.onSurfaceVariant },
    track: {
      height: 10,
      borderRadius: 999,
      backgroundColor: t.surfaceContainerHighest,
      overflow: "hidden"
    },
    fill: { height: "100%", borderRadius: 999 },
    sideCard: {
      borderRadius: 16,
      backgroundColor: t.surfaceLow,
      padding: 20,
      gap: 16
    },
    gapY: { gap: 18 },
    rowLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: 999,
      backgroundColor: t.surfaceContainerHigh,
      alignItems: "center",
      justifyContent: "center"
    },
    rowLabel: { color: t.onSurface, fontWeight: "700", fontSize: 15 },
    rowVal: { fontSize: 18, fontWeight: "800", color: t.onSurface },
    quickLog: {
      marginTop: 4,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 999,
      backgroundColor: t.surfaceContainerHigh
    },
    quickLogTxt: { color: t.primary, fontWeight: "700", fontSize: 15 },
    macroRow: { flexDirection: "row", gap: 10 },
    macroCard: {
      flex: 1,
      backgroundColor: t.surfaceContainer,
      borderRadius: 16,
      padding: 16,
      gap: 10
    },
    macroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    macroLbl: { fontSize: 12, fontWeight: "700", color: t.onSurfaceVariant },
    macroNums: { flexDirection: "row", alignItems: "baseline", gap: 4 },
    macroBig: { fontSize: 28, fontWeight: "900", color: t.onSurface },
    macroSlash: { fontSize: 12, fontWeight: "700", color: t.onSurfaceVariant },
    macroTrack: {
      height: 5,
      borderRadius: 999,
      backgroundColor: t.surfaceContainerHighest,
      overflow: "hidden"
    },
    macroFill: { height: "100%", backgroundColor: t.primary, borderRadius: 999 },
    sectionHead: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 8
    },
    h2: { fontSize: 22, fontWeight: "800", color: t.onSurface },
    sectionMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
    dot: { width: 4, height: 4, borderRadius: 999, backgroundColor: t.outlineVariant },
    link: { color: t.primary, fontSize: 12, fontWeight: "700" },
    empty: {
      backgroundColor: t.surfaceLow,
      borderRadius: 16,
      padding: 36,
      alignItems: "center",
      gap: 12
    },
    emptyIcon: {
      width: 96,
      height: 96,
      borderRadius: 999,
      backgroundColor: t.surfaceContainerHigh,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4
    },
    emptyTitle: { fontSize: 20, fontWeight: "800", color: t.onSurface },
    emptySub: { color: t.onSurfaceVariant, textAlign: "center", maxWidth: 280, lineHeight: 20, fontSize: 14 },
    ctaWrap: { marginTop: 8, borderRadius: 999, overflow: "hidden" },
    ctaBtn: { paddingVertical: 12, paddingHorizontal: 28 },
    ctaTxt: { color: t.onPrimary, fontWeight: "800", fontSize: 15, textAlign: "center" },
    gapY16: { gap: 12 },
    mealCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 14,
      borderRadius: 12,
      backgroundColor: t.surfaceContainer
    },
    mealLeft: { gap: 4, flex: 1 },
    mealTitle: { color: t.onSurface, fontWeight: "700", fontSize: 15 },
    mealSub: { color: t.onSurfaceVariant, fontSize: 12 },
    mealRight: { alignItems: "flex-end", gap: 6 },
    kcal: { fontSize: 17, fontWeight: "900", color: t.onSurface },
    delete: { color: t.primary, fontSize: 13, fontWeight: "700" }
  });
}

export function StitchDashboard({
  remainingCalories,
  targetCalories,
  consumedCalories,
  mealsLogged,
  progress01,
  proteinG,
  carbsG,
  fatG,
  avgMealCalories,
  recentMeals,
  dateLabel,
  useCustomFonts,
  onQuickLog,
  onLogBreakfast,
  onDeleteMeal
}: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const pct = Math.round(progress01 * 100);
  const progressWidth = `${Math.min(100, Math.round(progress01 * 100))}%` as const;
  const grad = [theme.primary, theme.primaryContainer] as const;

  return (
    <View style={styles.root}>
      <View style={styles.welcomeRow}>
        <View style={styles.welcomeText}>
          <Text style={[styles.h1, useCustomFonts && { fontFamily: stitchFonts.display }]}>
            Welcome back, Let's hit your goal today.
          </Text>
          <Text style={[styles.date, useCustomFonts && { fontFamily: stitchFonts.body }]}>{dateLabel}</Text>
        </View>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={[styles.badgeTxt, useCustomFonts && { fontFamily: stitchFonts.bodySemibold }]}>{pct}% done</Text>
        </View>
      </View>

      <View style={styles.heroRow}>
        <View style={styles.heroMain}>
          <View style={styles.heroGlow} />
          <View style={styles.heroInner}>
            <Text style={[styles.caption, useCustomFonts && { fontFamily: stitchFonts.body }]}>Remaining daily calories</Text>
            <View style={styles.heroNums}>
              <Text style={[styles.heroBig, useCustomFonts && { fontFamily: stitchFonts.display }]}>{remainingCalories}</Text>
              <Text style={[styles.heroKcal, useCustomFonts && { fontFamily: stitchFonts.display }]}>kcal</Text>
            </View>
            <View style={styles.gap24}>
              <View style={styles.progressLabels}>
                <Text style={[styles.mutedSm, useCustomFonts && { fontFamily: stitchFonts.bodySemibold }]}>Daily Progress</Text>
                <Text style={[styles.mutedSm, { color: theme.onSurface }, useCustomFonts && { fontFamily: stitchFonts.bodySemibold }]}>
                  {consumedCalories.toLocaleString()} / {targetCalories.toLocaleString()} kcal
                </Text>
              </View>
              <View style={styles.track}>
                <LinearGradient colors={grad} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.fill, { width: progressWidth }]} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sideCard}>
          <Text style={[styles.caption, useCustomFonts && { fontFamily: stitchFonts.body }]}>Daily Breakdown</Text>
          <View style={styles.gapY}>
            <Row styles={styles} icon="flag-outline" label="Goal" value={String(targetCalories)} accent />
            <Row styles={styles} icon="restaurant-outline" label="Food" value={String(consumedCalories)} accent />
            <Row styles={styles} icon="cube-outline" label="Meals" value={String(mealsLogged)} />
          </View>
          <TouchableOpacity style={styles.quickLog} onPress={onQuickLog} activeOpacity={0.85} delayPressIn={0}>
            <Ionicons name="add" size={22} color={theme.primary} />
            <Text style={[styles.quickLogTxt, useCustomFonts && { fontFamily: stitchFonts.bodySemibold }]}>Quick Log</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.macroRow}>
        <MacroCard styles={styles} theme={theme} label="Protein" value={proteinG} target={P_TARGET} icon="restaurant" useCustomFonts={useCustomFonts} />
        <MacroCard styles={styles} theme={theme} label="Carbs" value={carbsG} target={C_TARGET} icon="leaf-outline" useCustomFonts={useCustomFonts} />
        <MacroCard styles={styles} theme={theme} label="Fat" value={fatG} target={F_TARGET} icon="water-outline" useCustomFonts={useCustomFonts} />
      </View>

      <View style={styles.sectionHead}>
        <Text style={[styles.h2, useCustomFonts && { fontFamily: stitchFonts.display }]}>Recent meals</Text>
        <View style={styles.sectionMeta}>
          <Text style={[styles.mutedSm, useCustomFonts && { fontFamily: stitchFonts.bodySemibold }]}>Avg {avgMealCalories} kcal</Text>
          <View style={styles.dot} />
          <Text style={[styles.link, useCustomFonts && { fontFamily: stitchFonts.bodySemibold }]}>View History</Text>
        </View>
      </View>

      {recentMeals.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="restaurant-outline" size={40} color={theme.mutedText} />
          </View>
          <Text style={[styles.emptyTitle, useCustomFonts && { fontFamily: stitchFonts.display }]}>No meals saved yet.</Text>
          <Text style={[styles.emptySub, useCustomFonts && { fontFamily: stitchFonts.body }]}>
            Start by logging your first meal of the day.
          </Text>
          <TouchableOpacity onPress={onLogBreakfast} activeOpacity={0.9} style={styles.ctaWrap} delayPressIn={0}>
            <LinearGradient colors={grad} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.ctaBtn}>
              <Text style={[styles.ctaTxt, useCustomFonts && { fontFamily: stitchFonts.display }]}>Log My Breakfast</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.gapY16}>
          {recentMeals.map((m) => (
            <View key={m.id} style={styles.mealCard}>
              <View style={styles.mealLeft}>
                <Text style={[styles.mealTitle, useCustomFonts && { fontFamily: stitchFonts.bodySemibold }]}>
                  {m.mealType[0].toUpperCase() + m.mealType.slice(1)} • {m.source}
                </Text>
                <Text style={[styles.mealSub, useCustomFonts && { fontFamily: stitchFonts.body }]}>{m.itemCount} item(s)</Text>
              </View>
              <View style={styles.mealRight}>
                <Text style={[styles.kcal, useCustomFonts && { fontFamily: stitchFonts.display }]}>{m.calories}</Text>
                <TouchableOpacity onPress={() => onDeleteMeal(m.id)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} delayPressIn={0} activeOpacity={0.7}>
                  <Text style={[styles.delete, useCustomFonts && { fontFamily: stitchFonts.bodySemibold }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

type DS = ReturnType<typeof createStyles>;

function Row({
  styles,
  icon,
  label,
  value,
  accent
}: {
  styles: DS;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accent?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.rowLine}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>
          <Ionicons name={icon} size={20} color={theme.primary} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={[styles.rowVal, accent && { color: theme.primary }]}>{value}</Text>
    </View>
  );
}

function MacroCard({
  styles,
  theme,
  label,
  value,
  target,
  icon,
  useCustomFonts
}: {
  styles: DS;
  theme: AppThemeTokens;
  label: string;
  value: number;
  target: number;
  icon: keyof typeof Ionicons.glyphMap;
  useCustomFonts?: boolean;
}) {
  const w = `${Math.min(100, Math.round((value / target) * 100))}%` as const;
  return (
    <View style={styles.macroCard}>
      <View style={styles.macroTop}>
        <Text style={[styles.macroLbl, useCustomFonts && { fontFamily: stitchFonts.bodySemibold }]}>{label}</Text>
        <Ionicons name={icon} size={22} color={theme.primary} />
      </View>
      <View style={styles.macroNums}>
        <Text style={[styles.macroBig, useCustomFonts && { fontFamily: stitchFonts.display }]}>{value}</Text>
        <Text style={[styles.macroSlash, useCustomFonts && { fontFamily: stitchFonts.bodySemibold }]}>/ {target}g</Text>
      </View>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: w }]} />
      </View>
    </View>
  );
}
