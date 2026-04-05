import React, { useMemo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { AppThemeTokens } from "../../theme/AppThemeContext";
import { useAppTheme } from "../../theme/AppThemeContext";
import { stitchFonts } from "../../theme/stitch";

type Props = {
  photoUri: string | null;
  onEstimate: () => void;
  useCustomFonts?: boolean;
};

function createStyles(t: AppThemeTokens) {
  return StyleSheet.create({
    root: { gap: 18 },
    head: { gap: 4 },
    h1: { fontSize: 28, fontWeight: "900", color: t.onSurface, letterSpacing: -0.5 },
    sub: { fontSize: 13, color: t.onSurfaceVariant },
    frame: {
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: t.surfaceContainer,
      minHeight: 240,
      borderWidth: 1,
      borderColor: t.border
    },
    img: { width: "100%", height: 260, resizeMode: "cover" },
    empty: { flex: 1, minHeight: 220, alignItems: "center", justifyContent: "center", gap: 8 },
    emptyTxt: { color: t.onSurfaceVariant },
    cta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 16
    },
    ctaTxt: { color: t.onPrimary, fontWeight: "800", fontSize: 17 }
  });
}

export function StitchCameraScreen({ photoUri, onEstimate, useCustomFonts }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const grad = [theme.primary, theme.primaryContainer] as const;

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text style={[styles.h1, useCustomFonts && { fontFamily: stitchFonts.display }]}>Camera Photo</Text>
        <Text style={[styles.sub, useCustomFonts && { fontFamily: stitchFonts.body }]}>Snap a picture of your meal for AI analysis</Text>
      </View>
      <View style={styles.frame}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.img} />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="image-outline" size={48} color={theme.mutedText} />
            <Text style={[styles.emptyTxt, useCustomFonts && { fontFamily: stitchFonts.body }]}>No photo selected.</Text>
          </View>
        )}
      </View>
      <TouchableOpacity onPress={onEstimate} activeOpacity={0.92} style={{ borderRadius: 999, overflow: "hidden" }}>
        <LinearGradient colors={grad} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.cta}>
          <Ionicons name="sparkles" size={20} color={theme.onPrimary} />
          <Text style={[styles.ctaTxt, useCustomFonts && { fontFamily: stitchFonts.display }]}>Estimate calories</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
