import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { AppThemeTokens } from "../../theme/AppThemeContext";
import { useAppTheme } from "../../theme/AppThemeContext";
import { mixHex } from "../../lib/themeColors";
import { stitchFonts } from "../../theme/stitch";

type Props = {
  confidence: number;
  useCustomFonts?: boolean;
  mealForm: React.ReactNode;
};

function createStyles(t: AppThemeTokens) {
  const ring = mixHex(t.primary, t.background, 0.78);
  return StyleSheet.create({
    root: { gap: 16 },
    glowOuter: {
      borderRadius: 12,
      padding: 1,
      backgroundColor: ring
    },
    card: {
      backgroundColor: t.surfaceContainerHigh,
      borderRadius: 11,
      padding: 22,
      alignItems: "center",
      gap: 10
    },
    warn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: mixHex(t.danger, t.background, 0.82),
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      marginBottom: 4
    },
    warnTxt: { color: t.danger, fontSize: 11, fontWeight: "700", flex: 1 },
    caption: {
      fontSize: 11,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: t.onSurfaceVariant,
      fontWeight: "700"
    },
    big: { fontSize: 56, fontWeight: "900", color: t.primary, letterSpacing: -2 },
    track: {
      width: "100%",
      height: 10,
      borderRadius: 999,
      backgroundColor: t.surfaceContainerHighest,
      overflow: "hidden"
    },
    fill: { height: "100%", borderRadius: 999 },
    hint: { fontSize: 12, color: t.onSurfaceVariant, textAlign: "center", maxWidth: 280, lineHeight: 18 }
  });
}

export function StitchReviewEstimateScreen({ confidence, useCustomFonts, mealForm }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const pct = Math.round(confidence * 100);
  const low = confidence < 0.7;
  const w = `${pct}%` as const;
  const grad = [theme.primary, theme.primaryContainer] as const;

  return (
    <View style={styles.root}>
      <View style={styles.glowOuter}>
        <View style={styles.card}>
          {low ? (
            <View style={styles.warn}>
              <Ionicons name="warning" size={14} color={theme.danger} />
              <Text style={[styles.warnTxt, useCustomFonts && { fontFamily: stitchFonts.body }]}>
                Low confidence: review is required before saving.
              </Text>
            </View>
          ) : null}
          <Text style={[styles.caption, useCustomFonts && { fontFamily: stitchFonts.body }]}>Confidence Score</Text>
          <Text style={[styles.big, useCustomFonts && { fontFamily: stitchFonts.display }]}>{pct}%</Text>
          <View style={styles.track}>
            <LinearGradient colors={grad} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.fill, { width: w }]} />
          </View>
          <Text style={[styles.hint, useCustomFonts && { fontFamily: stitchFonts.body }]}>
            Review detected items below, then save when you are satisfied.
          </Text>
        </View>
      </View>
      {mealForm}
    </View>
  );
}
