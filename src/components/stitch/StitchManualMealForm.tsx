import React, { useMemo } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { MealItem, MealType } from "../../types";
import type { AppThemeTokens } from "../../theme/AppThemeContext";
import { useAppTheme } from "../../theme/AppThemeContext";
import { mixHex } from "../../lib/themeColors";
import { stitchFonts } from "../../theme/stitch";

type Props = {
  mealTypes: MealType[];
  mealType: MealType;
  setMealType: (t: MealType) => void;
  mealItems: MealItem[];
  updateItem: (id: string, key: keyof MealItem, value: string) => void;
  displayNumber: (n: number) => string;
  onAddItem: () => void;
  onSave: () => void;
  useCustomFonts?: boolean;
};

function createStyles(t: AppThemeTokens) {
  const glow = mixHex(t.primary, t.background, 0.92);
  return StyleSheet.create({
    sectionLabel: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 2,
      textTransform: "uppercase",
      color: t.onSurfaceVariant,
      marginBottom: 12,
      marginLeft: 4
    },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: t.surfaceContainerHigh
    },
    chipActive: {
      backgroundColor: t.primary,
      shadowColor: t.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 4
    },
    chipTxt: { color: t.onSurfaceVariant, fontWeight: "700", fontSize: 13, textTransform: "lowercase" },
    chipTxtActive: { color: t.onPrimary },
    card: {
      backgroundColor: t.surfaceLow,
      borderRadius: 16,
      padding: 22,
      overflow: "hidden",
      gap: 14
    },
    cardGlow: {
      position: "absolute",
      top: -32,
      right: -32,
      width: 120,
      height: 120,
      borderRadius: 999,
      backgroundColor: glow
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: t.onSurface,
      marginBottom: 6,
      zIndex: 1
    },
    itemBlock: { gap: 10, zIndex: 1 },
    fieldLbl: {
      fontSize: 11,
      fontWeight: "600",
      color: t.onSurfaceVariant,
      marginLeft: 4
    },
    input: {
      backgroundColor: t.surfaceContainer,
      borderRadius: 12,
      padding: 14,
      color: t.onSurface,
      fontSize: 15
    },
    metrics: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10
    },
    metricCell: {
      width: "47%",
      flexGrow: 1,
      gap: 6
    },
    addGhost: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      alignSelf: "flex-start",
      paddingVertical: 8
    },
    addGhostTxt: { color: t.primary, fontWeight: "700", fontSize: 15 },
    saveBtn: {
      paddingVertical: 14,
      alignItems: "center"
    },
    saveTxt: { color: t.onPrimary, fontWeight: "800", fontSize: 16 }
  });
}

export function StitchManualMealForm({
  mealTypes,
  mealType,
  setMealType,
  mealItems,
  updateItem,
  displayNumber,
  onAddItem,
  onSave,
  useCustomFonts
}: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const grad = [theme.primary, theme.primaryContainer] as const;
  const ph = `${theme.mutedText}73`;

  return (
    <View style={{ gap: 20 }}>
      <View>
        <Text style={[styles.sectionLabel, useCustomFonts && { fontFamily: stitchFonts.body }]}>Select Period</Text>
        <View style={styles.chipRow}>
          {mealTypes.map((type) => {
            const active = mealType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setMealType(type)}
                activeOpacity={0.85}
              >
                <Text style={[styles.chipTxt, active && styles.chipTxtActive, useCustomFonts && { fontFamily: stitchFonts.body }]}>
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardGlow} />
        <Text style={[styles.cardTitle, useCustomFonts && { fontFamily: stitchFonts.display }]}>Manual Entry</Text>

        {mealItems.map((item) => (
          <View key={item.id} style={styles.itemBlock}>
            <Text style={[styles.fieldLbl, useCustomFonts && { fontFamily: stitchFonts.body }]}>Food item name</Text>
            <TextInput
              style={[styles.input, useCustomFonts && { fontFamily: stitchFonts.body }]}
              placeholder="e.g. Avocado Toast with Poached Egg"
              placeholderTextColor={ph}
              value={item.name}
              onChangeText={(text) => updateItem(item.id, "name", text)}
            />
            <View style={styles.metrics}>
              {(
                [
                  ["calories", "Calories (kcal)"] as const,
                  ["protein_g", "Protein (g)"] as const,
                  ["carbs_g", "Carbs (g)"] as const,
                  ["fat_g", "Fat (g)"] as const
                ] as const
              ).map(([key, label]) => (
                <View key={key} style={styles.metricCell}>
                  <Text style={[styles.fieldLbl, useCustomFonts && { fontFamily: stitchFonts.body }]}>{label}</Text>
                  <TextInput
                    style={[styles.input, useCustomFonts && { fontFamily: stitchFonts.body }]}
                    placeholder="0"
                    placeholderTextColor={ph}
                    keyboardType="numeric"
                    value={displayNumber(item[key])}
                    onChangeText={(text) => updateItem(item.id, key, text)}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity onPress={onAddItem} style={styles.addGhost} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
          <Text style={[styles.addGhostTxt, useCustomFonts && { fontFamily: stitchFonts.bodySemibold }]}>Add item</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onSave} activeOpacity={0.92} style={{ borderRadius: 999, overflow: "hidden", marginTop: 8 }}>
          <LinearGradient colors={grad} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.saveBtn}>
            <Text style={[styles.saveTxt, useCustomFonts && { fontFamily: stitchFonts.display }]}>Save meal</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
