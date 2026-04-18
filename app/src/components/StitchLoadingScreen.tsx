import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { stitchFonts } from "../theme/stitch";

const logoAsset = require("../../assets/logo-mindful-bowl.png");

export function StitchLoadingScreen({ useCustomFonts = false }: { useCustomFonts?: boolean }) {
  const pulse = useRef(new Animated.Value(0.92)).current;
  const progress = useRef(new Animated.Value(0.14)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.92, duration: 1400, useNativeDriver: true })
      ])
    );
    const progressAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 0.38, duration: 1600, useNativeDriver: false }),
        Animated.timing(progress, { toValue: 0.52, duration: 1400, useNativeDriver: false }),
        Animated.timing(progress, { toValue: 0.34, duration: 1200, useNativeDriver: false })
      ])
    );
    pulseAnimation.start();
    progressAnimation.start();
    return () => {
      pulseAnimation.stop();
      progressAnimation.stop();
    };
  }, [progress, pulse]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"]
  });

  return (
    <View style={styles.container}>
      <View style={[styles.glow, styles.glowTop]} pointerEvents="none" />
      <View style={[styles.glow, styles.glowBottom]} pointerEvents="none" />
      <View style={styles.topDecorLeft} />
      <View style={styles.topDecorRight} />

      <View style={styles.content}>
        <View style={styles.brandWrap}>
          <View style={styles.outerHalo} />
          <Animated.View style={[styles.innerCircle, { transform: [{ scale: pulse }] }]}>
            <ExpoImage source={logoAsset} style={styles.logoImg} contentFit="contain" />
          </Animated.View>
        </View>

        <View style={styles.textWrap}>
          <Text style={[styles.title, useCustomFonts && { fontFamily: stitchFonts.display }]}>Calorie Counter</Text>
          <Text style={[styles.subtitle, useCustomFonts && { fontFamily: stitchFonts.body }]}>Nourishing your journey...</Text>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={[styles.loadingLabel, useCustomFonts && { fontFamily: stitchFonts.bodySemibold }]}>INITIALIZING SANCTUARY</Text>
        <View style={styles.bottomDecor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020c1e",
    overflow: "hidden"
  },
  glow: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 999,
    backgroundColor: "rgba(70, 232, 168, 0.1)"
  },
  glowTop: {
    top: -140,
    right: -100
  },
  glowBottom: {
    bottom: -140,
    left: -120
  },
  topDecorLeft: {
    position: "absolute",
    top: 36,
    left: 28,
    width: 54,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(164, 180, 214, 0.18)"
  },
  topDecorRight: {
    position: "absolute",
    top: 36,
    right: 28,
    width: 18,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(164, 180, 214, 0.2)"
  },
  content: {
    width: "100%",
    maxWidth: 390,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 26,
    zIndex: 2
  },
  brandWrap: {
    width: 126,
    height: 126,
    alignItems: "center",
    justifyContent: "center"
  },
  outerHalo: {
    position: "absolute",
    width: 116,
    height: 116,
    borderRadius: 999,
    backgroundColor: "rgba(78, 222, 162, 0.12)"
  },
  innerCircle: {
    width: 82,
    height: 82,
    borderRadius: 999,
    backgroundColor: "rgba(12, 192, 142, 0.24)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  logoImg: {
    width: 62,
    height: 62
  },
  textWrap: {
    alignItems: "center",
    gap: 8
  },
  title: {
    fontSize: 50,
    color: "#f2f6ff",
    fontWeight: "900",
    letterSpacing: -1
  },
  subtitle: {
    color: "rgba(182, 195, 221, 0.8)",
    fontSize: 16
  },
  progressTrack: {
    marginTop: 42,
    width: 228,
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(126, 142, 177, 0.28)"
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#4edea2"
  },
  loadingLabel: {
    color: "rgba(164, 179, 207, 0.45)",
    fontSize: 10,
    letterSpacing: 2.6,
    textTransform: "uppercase",
    fontWeight: "700"
  },
  bottomDecor: {
    marginTop: 14,
    width: 106,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(164, 180, 214, 0.2)"
  }
});
