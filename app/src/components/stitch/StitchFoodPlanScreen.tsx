import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { FoodRecord } from "../../data/foodDatabase";
import type { AppThemeTokens } from "../../theme/AppThemeContext";
import { useAppTheme } from "../../theme/AppThemeContext";
import { mixHex } from "../../lib/themeColors";
import { stitchFonts } from "../../theme/stitch";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  foodSearch: string;
  onSearchChange: (q: string) => void;
  foodSource: "cloud" | "local";
  foodLoading: boolean;
  regionOrder: string[];
  regionLabels: Record<string, string>;
  selectedRegion: string;
  onSelectRegion: (id: string) => void;
  foods: FoodRecord[];
  useCustomFonts?: boolean;
  getPlanTagline: (food: FoodRecord) => string;
  renderFoodThumb: (food: FoodRecord) => React.ReactNode;
  onOpenDetail: (food: FoodRecord) => void;
  onAdd: (food: FoodRecord) => void;
  onAdjustPortion: (foodName: string, delta: number) => void;
  portionValue: (foodName: string) => string;
  onPortionChange: (foodName: string, v: string) => void;
};

function createStyles(t: AppThemeTokens) {
  const badgeBg = mixHex(t.primary, t.background, 0.88);
  return StyleSheet.create({
    root: { gap: 12 },
    hero: { marginBottom: 2 },
    h1: { fontSize: 28, fontWeight: "900", color: t.onSurface, letterSpacing: -0.5 },
    sub: { color: t.onSurfaceVariant, fontSize: 14, marginTop: 2 },
    searchWrap: { position: "relative" },
    searchIcon: { position: "absolute", left: 12, top: 11, zIndex: 1 },
    searchInput: {
      backgroundColor: t.surfaceLow,
      borderRadius: 14,
      paddingVertical: 11,
      paddingLeft: 42,
      paddingRight: 12,
      color: t.onSurface,
      fontSize: 15
    },
    chipScroll: { gap: 8, paddingBottom: 4 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: t.surfaceContainerHigh
    },
    chipOn: { backgroundColor: t.primary },
    chipTxt: { color: t.onSurfaceVariant, fontWeight: "700", fontSize: 12 },
    chipTxtOn: { color: t.onPrimary },
    sourceRow: {
      flexDirection: "row",
      backgroundColor: t.surfaceLow,
      padding: 3,
      borderRadius: 999,
      alignSelf: "flex-start",
      gap: 3
    },
    sourcePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
    sourcePillOn: { backgroundColor: t.primaryContainer },
    sourceTxt: { color: t.onSurfaceVariant, fontSize: 11, fontWeight: "700" },
    sourceTxtOn: { color: t.onPrimaryContainer },
    hint: { fontSize: 10, color: t.onSurfaceVariant, opacity: 0.85 },
    muted: { color: t.onSurfaceVariant, fontSize: 13 },
    card: {
      backgroundColor: t.surfaceContainer,
      borderRadius: 10,
      padding: 10,
      gap: 8
    },
    ph: {
      width: "100%",
      height: 88,
      borderRadius: 8,
      backgroundColor: t.surfaceContainerHighest,
      overflow: "hidden"
    },
    titleRow: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "flex-start" },
    foodTitle: { flex: 1, fontSize: 15, fontWeight: "800", color: t.onSurface },
    badge: {
      maxWidth: "46%",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: badgeBg,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999
    },
    badgeDot: { width: 5, height: 5, borderRadius: 999, backgroundColor: t.primary },
    badgeTxt: { color: t.primary, fontWeight: "700", fontSize: 9, letterSpacing: 0.3, flexShrink: 1 },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 2,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.outlineVariant
    },
    statCell: { flex: 1, alignItems: "center" },
    statLbl: { fontSize: 8, fontWeight: "800", letterSpacing: 0.4, color: t.onSurfaceVariant, textTransform: "uppercase" },
    statVal: { fontSize: 13, fontWeight: "900", color: t.onSurface, marginTop: 1 },
    statUnit: { fontSize: 9, opacity: 0.65, fontWeight: "600" },
    actionsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
    ghostBtn: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: t.surfaceContainerHigh
    },
    ghostTxt: { color: t.onSurface, fontWeight: "700", fontSize: 12 },
    portionRow: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
    pbtn: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: t.surfaceContainerHigh,
      alignItems: "center",
      justifyContent: "center"
    },
    pbtnTxt: { color: t.onSurface, fontWeight: "800", fontSize: 15 },
    pinput: {
      minWidth: 44,
      maxWidth: 52,
      backgroundColor: t.surfaceContainerHigh,
      borderRadius: 8,
      paddingVertical: 5,
      textAlign: "center",
      color: t.onSurface,
      fontWeight: "700",
      fontSize: 13
    },
    addGrad: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingVertical: 9,
      paddingHorizontal: 14,
      borderRadius: 999,
      minWidth: 108
    },
    addTxt: { color: t.onPrimary, fontWeight: "800", fontSize: 12 }
  });
}

type RowProps = {
  food: FoodRecord;
  styles: ReturnType<typeof createStyles>;
  theme: AppThemeTokens;
  grad: readonly [string, string];
  useCustomFonts?: boolean;
  tagline: string;
  renderFoodThumb: (food: FoodRecord) => React.ReactNode;
  onOpenDetail: (food: FoodRecord) => void;
  onAdd: (food: FoodRecord) => void;
  onAdjustPortion: (foodName: string, delta: number) => void;
  portionValue: (foodName: string) => string;
  onPortionChange: (foodName: string, v: string) => void;
};

function FoodPlanRow({
  food,
  styles,
  theme,
  grad,
  useCustomFonts,
  tagline,
  renderFoodThumb,
  onOpenDetail,
  onAdd,
  onAdjustPortion,
  portionValue,
  onPortionChange
}: RowProps) {
  const [portionOpen, setPortionOpen] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.ph}>{renderFoodThumb(food)}</View>
      <View style={styles.titleRow}>
        <Text style={[styles.foodTitle, useCustomFonts && { fontFamily: stitchFonts.display }]} numberOfLines={2}>
          {food.name}
        </Text>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={[styles.badgeTxt, useCustomFonts && { fontFamily: stitchFonts.body }]} numberOfLines={2}>
            {tagline}
          </Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <Text style={[styles.statLbl, useCustomFonts && { fontFamily: stitchFonts.body }]}>Cal</Text>
          <Text style={[styles.statVal, useCustomFonts && { fontFamily: stitchFonts.display }]}>
            {food.calories}
            <Text style={styles.statUnit}> kcal</Text>
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text style={[styles.statLbl, useCustomFonts && { fontFamily: stitchFonts.body }]}>Protein</Text>
          <Text style={[styles.statVal, useCustomFonts && { fontFamily: stitchFonts.display }]}>
            {food.protein_g}
            <Text style={styles.statUnit}> g</Text>
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text style={[styles.statLbl, useCustomFonts && { fontFamily: stitchFonts.body }]}>Carbs</Text>
          <Text style={[styles.statVal, useCustomFonts && { fontFamily: stitchFonts.display }]}>
            {food.carbs_g}
            <Text style={styles.statUnit}> g</Text>
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text style={[styles.statLbl, useCustomFonts && { fontFamily: stitchFonts.body }]}>Fats</Text>
          <Text style={[styles.statVal, useCustomFonts && { fontFamily: stitchFonts.display }]}>
            {food.fat_g}
            <Text style={styles.statUnit}> g</Text>
          </Text>
        </View>
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.ghostBtn} onPress={() => onOpenDetail(food)} activeOpacity={0.85}>
          <Text style={[styles.ghostTxt, useCustomFonts && { fontFamily: stitchFonts.body }]}>Details</Text>
        </TouchableOpacity>
        {!portionOpen ? (
          <TouchableOpacity
            onPress={() => setPortionOpen(true)}
            activeOpacity={0.9}
            style={{ flex: 1, borderRadius: 999, overflow: "hidden" }}
          >
            <LinearGradient colors={grad} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.addGrad}>
              <Ionicons name="add" size={17} color={theme.onPrimary} />
              <Text style={[styles.addTxt, useCustomFonts && { fontFamily: stitchFonts.body }]}>Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
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
            <TouchableOpacity
              onPress={() => {
                onAdd(food);
                setPortionOpen(false);
              }}
              activeOpacity={0.9}
              style={{ flex: 1, borderRadius: 999, overflow: "hidden" }}
            >
              <LinearGradient colors={grad} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.addGrad}>
                <Ionicons name="checkmark" size={17} color={theme.onPrimary} />
                <Text style={[styles.addTxt, useCustomFonts && { fontFamily: stitchFonts.body }]}>Add</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export function StitchFoodPlanScreen({
  foodSearch,
  onSearchChange,
  foodSource,
  foodLoading,
  regionOrder,
  regionLabels,
  selectedRegion,
  onSelectRegion,
  foods,
  useCustomFonts,
  getPlanTagline,
  renderFoodThumb,
  onOpenDetail,
  onAdd,
  onAdjustPortion,
  portionValue,
  onPortionChange
}: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const grad = [theme.primary, theme.primaryContainer] as const;
  const ph = `${theme.mutedText}73`;

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={[styles.h1, useCustomFonts && { fontFamily: stitchFonts.display }]}>Plan</Text>
        <Text style={[styles.sub, useCustomFonts && { fontFamily: stitchFonts.body }]}>
          Search the catalog and filter by cuisine. One database for macros and photos.
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color={theme.mutedText} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, useCustomFonts && { fontFamily: stitchFonts.body }]}
          placeholder="Search foods, meals, macros..."
          placeholderTextColor={ph}
          value={foodSearch}
          onChangeText={onSearchChange}
        />
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

      <View style={styles.sourceRow}>
        <View style={[styles.sourcePill, foodSource === "cloud" && styles.sourcePillOn]}>
          <Text style={[styles.sourceTxt, foodSource === "cloud" && styles.sourceTxtOn]}>Cloud</Text>
        </View>
        <View style={[styles.sourcePill, foodSource === "local" && styles.sourcePillOn]}>
          <Text style={[styles.sourceTxt, foodSource === "local" && styles.sourceTxtOn]}>Local</Text>
        </View>
      </View>
      <Text style={[styles.hint, useCustomFonts && { fontFamily: stitchFonts.body }]}>Photos only when listed in your Supabase catalog.</Text>

      {foodLoading ? <Text style={[styles.muted, useCustomFonts && { fontFamily: stitchFonts.body }]}>Searching…</Text> : null}
      {!foodLoading && foods.length === 0 ? (
        <Text style={[styles.muted, useCustomFonts && { fontFamily: stitchFonts.body }]}>No foods match.</Text>
      ) : null}

      <View style={{ gap: 10 }}>
        {foods.map((food) => (
          <FoodPlanRow
            key={`${food.category}-${food.name}`}
            food={food}
            styles={styles}
            theme={theme}
            grad={grad}
            useCustomFonts={useCustomFonts}
            tagline={getPlanTagline(food)}
            renderFoodThumb={renderFoodThumb}
            onOpenDetail={onOpenDetail}
            onAdd={onAdd}
            onAdjustPortion={onAdjustPortion}
            portionValue={portionValue}
            onPortionChange={onPortionChange}
          />
        ))}
      </View>
    </View>
  );
}
