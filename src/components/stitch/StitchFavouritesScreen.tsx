import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { FoodRecord } from "../../data/foodDatabase";
import { useAppTheme } from "../../theme/AppThemeContext";
import { stitchFonts } from "../../theme/stitch";

type Props = {
  favourites: FoodRecord[];
  useCustomFonts?: boolean;
  onOpenDetail: (food: FoodRecord) => void;
  onAdd: (food: FoodRecord) => void;
  onRemove: (foodName: string) => void;
};

export function StitchFavouritesScreen({ favourites, useCustomFonts, onOpenDetail, onAdd, onRemove }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { gap: 14 },
        title: { fontSize: 30, fontWeight: "900", color: theme.onSurface, letterSpacing: -0.5 },
        sub: { color: theme.onSurfaceVariant, fontSize: 14 },
        card: {
          backgroundColor: theme.surfaceContainer,
          borderRadius: 14,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.border,
          padding: 14,
          gap: 10
        },
        row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
        name: { fontSize: 17, fontWeight: "800", color: theme.onSurface, flex: 1 },
        meta: { color: theme.onSurfaceVariant, fontSize: 12 },
        actions: { flexDirection: "row", alignItems: "center", gap: 8 },
        iconBtn: {
          width: 36,
          height: 36,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.surfaceContainerHigh
        },
        empty: {
          backgroundColor: theme.surfaceContainer,
          borderRadius: 14,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.border,
          padding: 24,
          alignItems: "center",
          gap: 8
        },
        emptyText: { color: theme.onSurfaceVariant, textAlign: "center" }
      }),
    [theme]
  );

  return (
    <View style={styles.root}>
      <Text style={[styles.title, useCustomFonts && { fontFamily: stitchFonts.display }]}>Favourites</Text>
      <Text style={[styles.sub, useCustomFonts && { fontFamily: stitchFonts.body }]}>Quick access to meals and foods you love.</Text>

      {favourites.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={28} color={theme.primary} />
          <Text style={[styles.emptyText, useCustomFonts && { fontFamily: stitchFonts.body }]}>
            No favourites yet. Tap the heart on a food detail screen to save it here.
          </Text>
        </View>
      ) : (
        favourites.map((food) => (
          <View key={food.name} style={styles.card}>
            <View style={styles.row}>
              <Text style={[styles.name, useCustomFonts && { fontFamily: stitchFonts.display }]} numberOfLines={2}>
                {food.name}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => onOpenDetail(food)} activeOpacity={0.85}>
                  <Ionicons name="open-outline" size={18} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => onAdd(food)} activeOpacity={0.85}>
                  <Ionicons name="add" size={20} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => onRemove(food.name)} activeOpacity={0.85}>
                  <Ionicons name="heart-dislike" size={18} color={theme.danger} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.meta, useCustomFonts && { fontFamily: stitchFonts.body }]}>
              {food.category} · {food.calories} kcal/100g · P {food.protein_g}g · C {food.carbs_g}g · F {food.fat_g}g
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

