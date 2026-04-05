import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { stitchFonts } from "../theme/stitch";

const logoAsset = require("../../assets/logo-mindful-bowl.png");

const textureUri =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBjO0BvIgI81aHXkbEaNIhUK-Iez4ZYQH6DOJVJRfAn89Vrr15MpV6kdl7humjZ20q3_eB5Z-wsUH99sST3AkXoKKc7qz_qa_AG_AasY0hNwYYIVlm2RtKwkngISw-VuWcx0jxIJ8NV7pykNcfWVfrrC2BW8k-3np39uqOMf67cmjNHrEazzvGhjEWkdEEgQfn7xJkzLzRtFR6f8XMcyeP7MTSxuoj6AYHv968VXVvqkqQFWXa2FlG0y--lE3Zy0YCTf3q4LdqUYIU";

export function StitchLoadingScreen({ useCustomFonts = false }: { useCustomFonts?: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.92, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <View style={styles.container}>
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />

      <View style={styles.content}>
        <View style={styles.brandWrap}>
          <View style={styles.outerRing} />
          <Animated.View style={[styles.innerCircle, { transform: [{ scale: pulse }] }]}>
            <ExpoImage source={logoAsset} style={styles.logoImg} contentFit="contain" />
          </Animated.View>
          <View style={styles.orbitRing} />
        </View>

        <View style={styles.textWrap}>
          <Text style={[styles.title, useCustomFonts && { fontFamily: stitchFonts.display }]}>Calorie Counter</Text>
          <View style={styles.loadingWrap}>
            <Text style={[styles.loadingLabel, useCustomFonts && { fontFamily: stitchFonts.bodySemibold }]}>Loading...</Text>
            <Text style={[styles.subtitle, useCustomFonts && { fontFamily: stitchFonts.body }]}>Preparing your digital sanctuary</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </View>

      <Text style={[styles.footer, useCustomFonts && { fontFamily: stitchFonts.bodyMedium }]}>Precision Nutrition • Serenity Track</Text>

      <ExpoImage source={{ uri: textureUri }} style={styles.texture} contentFit="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1325",
    overflow: "hidden"
  },
  glow: {
    position: "absolute",
    width: "58%",
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: "rgba(78, 222, 162, 0.13)"
  },
  glowTop: {
    top: "-12%",
    left: "-12%"
  },
  glowBottom: {
    bottom: "-12%",
    right: "-12%"
  },
  content: {
    width: "100%",
    maxWidth: 360,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 44,
    zIndex: 2
  },
  brandWrap: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center"
  },
  outerRing: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(78, 222, 162, 0.12)"
  },
  innerCircle: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: "rgba(8, 183, 127, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  logoImg: {
    width: 56,
    height: 56
  },
  orbitRing: {
    position: "absolute",
    width: 116,
    height: 116,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(78, 222, 162, 0.08)"
  },
  textWrap: {
    alignItems: "center",
    gap: 14
  },
  title: {
    fontSize: 32,
    color: "#dae2fc",
    fontWeight: "800",
    letterSpacing: -1
  },
  loadingWrap: {
    alignItems: "center",
    gap: 8
  },
  loadingLabel: {
    color: "rgba(78, 222, 162, 0.9)",
    fontSize: 12,
    letterSpacing: 3.8,
    textTransform: "uppercase",
    fontWeight: "700"
  },
  subtitle: {
    color: "rgba(187, 202, 191, 0.62)",
    fontSize: 14
  },
  progressTrack: {
    width: 192,
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#2d3448"
  },
  progressFill: {
    width: "34%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#4edea2"
  },
  footer: {
    position: "absolute",
    bottom: 48,
    color: "rgba(218, 226, 252, 0.2)",
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    zIndex: 2
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    zIndex: 1
  }
});
