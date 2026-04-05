import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { FoodRecord } from "../../data/foodDatabase";
import type { AppThemeTokens } from "../../theme/AppThemeContext";
import { useAppTheme } from "../../theme/AppThemeContext";
import { mixHex } from "../../lib/themeColors";
import { stitchFonts } from "../../theme/stitch";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  regionOrder: string[];
  regionLabels: Record<string, string>;
  selectedRegion: string;
  onSelectRegion: (id: string) => void;
  foods: FoodRecord[];
  useCustomFonts?: boolean;
  onOpenDetail: (food: FoodRecord) => void;
  onAdd: (food: FoodRecord) => void;
  onAdjustPortion: (foodName: string, delta: number) => void;
  portionValue: (foodName: string) => string;
  onPortionChange: (foodName: string, v: string) => void;
};

function createStyles(t: AppThemeTokens) {
  const badgeBg = mixHex(t.primary, t.background, 0.9);
  return StyleSheet.create({
    root: { gap: 16 },
    hero: { marginBottom: 4 },
    h1: { fontSize: 32, fontWeight: "900", color: t.onSurface, letterSpacing: -0.5 },
    sub: { color: t.onSurfaceVariant, fontSize: 16, marginTop: 4, lineHeight: 22 },
    chipScroll: { gap: 10, paddingBottom: 8 },
    chip: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: t.surfaceContainerHigh
    },
    chipOn: { backgroundColor: t.primary },
    chipTxt: { color: t.onSurfaceVariant, fontWeight: "700", fontSize: 13 },
    chipTxtOn: { color: t.onPrimary },
    card: {
      backgroundColor: t.surfaceContainer,
      borderRadius: 12,
      padding: 16,
      gap: 12
    },
    ph: {
      width: "100%",
      height: 120,
      borderRadius: 8,
      backgroundColor: t.surfaceContainerHighest,
      alignItems: "center",
      justifyContent: "center",
      gap: 6
    },
    phTxt: { fontSize: 9, fontWeight: "800", letterSpacing: 1, color: t.onSurfaceVariant, textTransform: "uppercase" },
    cardBody: { gap: 10 },
    titleRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
    foodTitle: { fontSize: 18, fontWeight: "800", color: t.onSurface },
    portionLine: { fontSize: 12, color: t.onSurfaceVariant, marginTop: 4 },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: badgeBg,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      alignSelf: "flex-start"
    },
    badgeDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: t.primary },
    badgeTxt: { color: t.primary, fontWeight: "800", fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" },
    stats: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingTop: 4 },
    statCol: { minWidth: "22%" },
    statLbl: {
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 0.5,
      color: t.onSurfaceVariant,
      textTransform: "uppercase"
    },
    statVal: { fontSize: 18, fontWeight: "900", color: t.onSurface },
    statUnit: { fontSize: 10, opacity: 0.6, fontWeight: "500" },
    portionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    pbtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: t.surfaceContainerHigh,
      alignItems: "center",
      justifyContent: "center"
    },
    pbtnTxt: { color: t.onSurface, fontWeight: "800" },
    pinput: {
      minWidth: 56,
      backgroundColor: t.surfaceContainerHigh,
      borderRadius: 8,
      paddingVertical: 6,
      textAlign: "center",
      color: t.onSurface,
      fontWeight: "700"
    },
    actions: { flexDirection: "row", gap: 10, marginTop: 4 },
    ghostBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center"
    },
    ghostTxt: { color: t.onSurface, fontWeight: "800", fontSize: 13 },
    addGrad: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10
    },
    addTxt: { color: t.onPrimary, fontWeight: "800", fontSize: 13 }
  });
}

type S = ReturnType<typeof createStyles>;

function Stat({
  styles,
  theme,
  label,
  value,
  unit,
  border,
  useCustomFonts
}: {
  styles: S;
  theme: AppThemeTokens;
  label: string;
  value: string;
  unit: string;
  border?: boolean;
  useCustomFonts?: boolean;
}) {
  return (
    <View style={[styles.statCol, border && { borderLeftWidth: 1, borderLeftColor: theme.border, paddingLeft: 12 }]}>
      <Text style={[styles.statLbl, useCustomFonts && { fontFamily: stitchFonts.body }]}>{label}</Text>
      <Text style={[styles.statVal, useCustomFonts && { fontFamily: stitchFonts.display }]}>
        {value} <Text style={styles.statUnit}>{unit}</Text>
      </Text>
    </View>
  );
}

export function StitchFoodSuggestionsScreen({
  regionOrder,
  regionLabels,
  selectedRegion,
  onSelectRegion,
  foods,
  useCustomFonts,
  onOpenDetail,
  onAdd,
  onAdjustPortion,
  portionValue,
  onPortionChange
}: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const grad = [theme.primary, theme.primaryContainer] as const;

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={[styles.h1, useCustomFonts && { fontFamily: stitchFonts.display }]}>Food suggestions</Text>
        <Text style={[styles.sub, useCustomFonts && { fontFamily: stitchFonts.body }]}>
          Nourishment tailored to your rhythm.
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
        {regionOrder.map((id) => {
          const active = selectedRegion === id;
          return (
            <TouchableOpacity
              key={id}
              style={[styles.chip, active && styles.chipOn]}
              onPress={() => onSelectRegion(id)}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipTxt, active && styles.chipTxtOn, useCustomFonts && { fontFamily: stitchFonts.body }]}>
                {regionLabels[id]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={{ gap: 16 }}>
        {foods.map((food) => (
          <View key={`${food.category}-${food.name}`} style={styles.card}>
            <View style={styles.ph}>
              <Ionicons name="image-outline" size={32} color={theme.mutedText} />
              <Text style={[styles.phTxt, useCustomFonts && { fontFamily: stitchFonts.body }]}>No verified photo yet</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.foodTitle, useCustomFonts && { fontFamily: stitchFonts.display }]}>{food.name}</Text>
                  <Text style={[styles.portionLine, useCustomFonts && { fontFamily: stitchFonts.body }]}>
                    Portion: standard (adjust below)
                  </Text>
                </View>
                <View style={styles.badge}>
                  <View style={styles.badgeDot} />
                  <Text style={[styles.badgeTxt, useCustomFonts && { fontFamily: stitchFonts.body }]}>High Fiber</Text>
                </View>
              </View>
              <View style={styles.stats}>
                <Stat styles={styles} theme={theme} label="Calories" value={`${food.calories}`} unit="kcal" useCustomFonts={useCustomFonts} />
                <Stat styles={styles} theme={theme} label="Protein" value={`${food.protein_g}`} unit="g" useCustomFonts={useCustomFonts} border />
                <Stat styles={styles} theme={theme} label="Carbs" value={`${food.carbs_g}`} unit="g" useCustomFonts={useCustomFonts} border />
                <Stat styles={styles} theme={theme} label="Fats" value={`${food.fat_g}`} unit="g" useCustomFonts={useCustomFonts} border />
              </View>
              <View style={styles.portionRow}>
                <TouchableOpacity style={styles.pbtn} onPress={() => onAdjustPortion(food.name, -0.25)}>
                  <Text style={styles.pbtnTxt}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.pinput}
                  keyboardType="decimal-pad"
                  value={portionValue(food.name)}
                  onChangeText={(v) => onPortionChange(food.name, v)}
                />
                <TouchableOpacity style={styles.pbtn} onPress={() => onAdjustPortion(food.name, 0.25)}>
                  <Text style={styles.pbtnTxt}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.ghostBtn} onPress={() => onOpenDetail(food)} activeOpacity={0.85}>
                <Text style={[styles.ghostTxt, useCustomFonts && { fontFamily: stitchFonts.body }]}>View details</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onAdd(food)} activeOpacity={0.9} style={{ flex: 1, borderRadius: 999, overflow: "hidden" }}>
                <LinearGradient colors={grad} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.addGrad}>
                  <Ionicons name="add" size={18} color={theme.onPrimary} />
                  <Text style={[styles.addTxt, useCustomFonts && { fontFamily: stitchFonts.body }]}>Add</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
