import React, { useMemo } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { FoodRecord } from "../../data/foodDatabase";
import type { AppThemeTokens } from "../../theme/AppThemeContext";
import { useAppTheme } from "../../theme/AppThemeContext";
import { stitchFonts } from "../../theme/stitch";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  foodSearch: string;
  onSearchChange: (q: string) => void;
  foodSource: "cloud" | "local";
  foodLoading: boolean;
  foods: FoodRecord[];
  useCustomFonts?: boolean;
  renderFoodThumb: (food: FoodRecord) => React.ReactNode;
  getDescription: (food: FoodRecord) => string;
  onOpenDetail: (food: FoodRecord) => void;
  onAdd: (food: FoodRecord) => void;
  onAdjustPortion: (foodName: string, delta: number) => void;
  portionValue: (foodName: string) => string;
  onPortionChange: (foodName: string, v: string) => void;
};

function createStyles(t: AppThemeTokens) {
  return StyleSheet.create({
    root: { gap: 16 },
    hero: { marginBottom: 4 },
    h1: { fontSize: 30, fontWeight: "900", color: t.onSurface, letterSpacing: -0.5 },
    sub: { color: t.onSurfaceVariant, fontSize: 15, marginTop: 4 },
    searchWrap: { position: "relative" },
    searchIcon: { position: "absolute", left: 14, top: 15, zIndex: 1 },
    searchInput: {
      backgroundColor: t.surfaceLow,
      borderRadius: 16,
      paddingVertical: 14,
      paddingLeft: 48,
      paddingRight: 16,
      color: t.onSurface,
      fontSize: 16
    },
    sourceRow: {
      flexDirection: "row",
      backgroundColor: t.surfaceLow,
      padding: 4,
      borderRadius: 999,
      alignSelf: "flex-start",
      gap: 4
    },
    sourcePill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999 },
    sourcePillOn: { backgroundColor: t.primaryContainer },
    sourceTxt: { color: t.onSurfaceVariant, fontSize: 12, fontWeight: "700" },
    sourceTxtOn: { color: t.onPrimaryContainer },
    hint: { fontSize: 11, color: t.onSurfaceVariant, opacity: 0.85 },
    muted: { color: t.onSurfaceVariant },
    rowCard: {
      flexDirection: "row",
      gap: 12,
      backgroundColor: t.surfaceContainer,
      borderRadius: 12,
      padding: 12,
      alignItems: "flex-start"
    },
    thumb: { width: 80, height: 80, borderRadius: 8, overflow: "hidden" },
    rowBody: { flex: 1, minWidth: 0, gap: 6 },
    rowTop: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "flex-start" },
    foodName: { flex: 1, color: t.onSurface, fontWeight: "800", fontSize: 15 },
    kcal: { color: t.primary, fontWeight: "800", fontSize: 13 },
    meta: { fontSize: 11, color: t.onSurfaceVariant },
    desc: { fontSize: 11, color: t.onSurfaceVariant, opacity: 0.9 },
    portionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
    pbtn: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: t.surfaceContainerHigh,
      alignItems: "center",
      justifyContent: "center"
    },
    pbtnTxt: { color: t.onSurface, fontWeight: "800" },
    pinput: {
      minWidth: 48,
      borderRadius: 8,
      backgroundColor: t.surfaceContainerHigh,
      color: t.onSurface,
      textAlign: "center",
      paddingVertical: 4,
      fontWeight: "700"
    },
    portionLbl: { fontSize: 11, color: t.onSurfaceVariant },
    links: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
    link: { color: t.primary, fontWeight: "800", fontSize: 12 },
    sep: { color: t.outlineVariant, fontSize: 12 }
  });
}

export function StitchFoodFinderScreen({
  foodSearch,
  onSearchChange,
  foodSource,
  foodLoading,
  foods,
  useCustomFonts,
  renderFoodThumb,
  getDescription,
  onOpenDetail,
  onAdd,
  onAdjustPortion,
  portionValue,
  onPortionChange
}: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const ph = `${theme.mutedText}73`;

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={[styles.h1, useCustomFonts && { fontFamily: stitchFonts.display }]}>Food Finder</Text>
        <Text style={[styles.sub, useCustomFonts && { fontFamily: stitchFonts.body }]}>Search built-in database</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={22} color={theme.mutedText} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, useCustomFonts && { fontFamily: stitchFonts.body }]}
          placeholder="Search meals, foods, macros..."
          placeholderTextColor={ph}
          value={foodSearch}
          onChangeText={onSearchChange}
        />
      </View>

      <View style={styles.sourceRow}>
        <View style={[styles.sourcePill, foodSource === "cloud" && styles.sourcePillOn]}>
          <Text style={[styles.sourceTxt, foodSource === "cloud" && styles.sourceTxtOn]}>Cloud database</Text>
        </View>
        <View style={[styles.sourcePill, foodSource === "local" && styles.sourcePillOn]}>
          <Text style={[styles.sourceTxt, foodSource === "local" && styles.sourceTxtOn]}>Local fallback</Text>
        </View>
      </View>
      <Text style={[styles.hint, useCustomFonts && { fontFamily: stitchFonts.body }]}>
        Active source reflects the last search response.
      </Text>

      {foodLoading ? (
        <Text style={[styles.muted, useCustomFonts && { fontFamily: stitchFonts.body }]}>Searching...</Text>
      ) : null}
      {!foodLoading && foods.length === 0 ? (
        <Text style={[styles.muted, useCustomFonts && { fontFamily: stitchFonts.body }]}>No foods found.</Text>
      ) : null}

      <View style={{ gap: 12 }}>
        {foods.map((food) => (
          <View key={`${food.category}-${food.name}`} style={styles.rowCard}>
            <View style={styles.thumb}>{renderFoodThumb(food)}</View>
            <View style={styles.rowBody}>
              <View style={styles.rowTop}>
                <Text style={[styles.foodName, useCustomFonts && { fontFamily: stitchFonts.display }]} numberOfLines={2}>
                  {food.name}
                </Text>
                <Text style={[styles.kcal, useCustomFonts && { fontFamily: stitchFonts.bodySemibold }]}>{food.calories} kcal</Text>
              </View>
              <Text style={[styles.meta, useCustomFonts && { fontFamily: stitchFonts.body }]}>
                P {food.protein_g}g • C {food.carbs_g}g • F {food.fat_g}g • {food.category}
              </Text>
              <Text style={[styles.desc, useCustomFonts && { fontFamily: stitchFonts.body }]} numberOfLines={2}>
                {getDescription(food)}
              </Text>
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
                <Text style={[styles.portionLbl, useCustomFonts && { fontFamily: stitchFonts.body }]}>portion(s)</Text>
              </View>
              <View style={styles.links}>
                <TouchableOpacity onPress={() => onOpenDetail(food)}>
                  <Text style={styles.link}>View details</Text>
                </TouchableOpacity>
                <Text style={styles.sep}>|</Text>
                <TouchableOpacity onPress={() => onAdd(food)}>
                  <Text style={styles.link}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
