import React from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { STITCH, STITCH_IMAGES } from "../../theme/stitchTokens";
import { stitchFonts } from "../../theme/stitch";

type Props = {
  authMode: "login" | "signup";
  setAuthMode: (m: "login" | "signup") => void;
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  authError: string | null;
  authInfo: string | null;
  authBusy: boolean;
  onEmailAuth: () => void;
  onForgotPassword: () => void;
  onGoogle: () => void;
  onFacebook: () => void;
  useCustomFonts?: boolean;
};

export function StitchAuthScreen({
  authMode,
  setAuthMode,
  email,
  password,
  setEmail,
  setPassword,
  authError,
  authInfo,
  authBusy,
  onEmailAuth,
  onForgotPassword,
  onGoogle,
  onFacebook,
  useCustomFonts
}: Props) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.hero}>
        <LinearGradient colors={["rgba(78,222,162,0.15)", "rgba(68,216,241,0.08)"]} style={styles.heroIconGrad}>
          <Image source={require("../../../assets/logo-calorie-counter.png")} style={styles.heroLogo} contentFit="contain" />
        </LinearGradient>
        <Text style={[styles.brand, useCustomFonts && { fontFamily: stitchFonts.display }]}>Inertia</Text>
        <Text style={[styles.tag, useCustomFonts && { fontFamily: stitchFonts.body }]}>Track calories with photos</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, authMode === "login" && styles.toggleOn]}
            onPress={() => setAuthMode("login")}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.toggleTxt,
                authMode === "login" ? { color: STITCH.primary } : { color: STITCH.onSurfaceVariant }
              ]}
            >
              Log In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, authMode === "signup" && styles.toggleOn]}
            onPress={() => setAuthMode("signup")}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.toggleTxt,
                authMode === "signup" ? { color: STITCH.primary } : { color: STITCH.onSurfaceVariant }
              ]}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, useCustomFonts && { fontFamily: stitchFonts.body }]}>Email</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={[styles.input, useCustomFonts && { fontFamily: stitchFonts.body }]}
              placeholder="hello@example.com"
              placeholderTextColor="rgba(134, 148, 138, 0.45)"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Ionicons name="mail-outline" size={20} color="rgba(134, 148, 138, 0.45)" style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.pwRow}>
            <Text style={[styles.label, useCustomFonts && { fontFamily: stitchFonts.body }]}>Password</Text>
            <TouchableOpacity onPress={onForgotPassword} hitSlop={12}>
              <Text style={[styles.forgot, useCustomFonts && { fontFamily: stitchFonts.body }]}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputWrap}>
            <TextInput
              style={[styles.input, useCustomFonts && { fontFamily: stitchFonts.body }]}
              placeholder="••••••••••••"
              placeholderTextColor="rgba(134, 148, 138, 0.45)"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Ionicons name="lock-closed-outline" size={20} color="rgba(134, 148, 138, 0.45)" style={styles.inputIcon} />
          </View>
          {authMode === "signup" ? (
            <Text style={[styles.hint, useCustomFonts && { fontFamily: stitchFonts.body }]}>
              Use 8+ characters for password.
            </Text>
          ) : null}
        </View>

        {authError ? <Text style={styles.err}>{authError}</Text> : null}
        {authInfo ? <Text style={styles.info}>{authInfo}</Text> : null}

        <TouchableOpacity
          onPress={onEmailAuth}
          disabled={authBusy}
          activeOpacity={0.92}
          style={styles.ctaOuter}
        >
          <LinearGradient
            colors={[STITCH.primary, STITCH.primaryContainer]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.cta, authBusy && { opacity: 0.6 }]}
          >
            <Text style={[styles.ctaTxt, useCustomFonts && { fontFamily: stitchFonts.display }]}>
              {authBusy ? "Please wait..." : authMode === "signup" ? "Create account" : "Continue"}
            </Text>
            {!authBusy ? <Ionicons name="arrow-forward" size={22} color={STITCH.onPrimary} /> : null}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.divLine} />
          <Text style={[styles.divTxt, useCustomFonts && { fontFamily: stitchFonts.body }]}>Or continue with</Text>
          <View style={styles.divLine} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn} onPress={onGoogle} activeOpacity={0.85}>
            <Image source={{ uri: STITCH_IMAGES.googleLogo }} style={styles.socialIcon} />
            <Text style={[styles.socialLbl, useCustomFonts && { fontFamily: stitchFonts.body }]}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} onPress={onFacebook} activeOpacity={0.85}>
            <Ionicons name="logo-facebook" size={22} color="#1877F2" />
            <Text style={[styles.socialLbl, useCustomFonts && { fontFamily: stitchFonts.body }]}>Facebook</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.terms, useCustomFonts && { fontFamily: stitchFonts.body }]}>
        By continuing, you agree to our <Text style={styles.termsBold}>Terms of Service</Text>
      </Text>

      <View style={styles.blob1} />
      <View style={styles.blob2} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: STITCH.surface },
  scrollContent: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 48,
    justifyContent: "center",
    flexGrow: 1
  },
  hero: { alignItems: "center", marginBottom: 36 },
  heroIconGrad: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden"
  },
  heroLogo: {
    width: 72,
    height: 72
  },
  brand: {
    color: STITCH.onSurface,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 8
  },
  tag: { color: STITCH.onSurfaceVariant, fontSize: 17 },
  card: {
    backgroundColor: STITCH.surfaceContainer,
    borderRadius: 16,
    padding: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 12
  },
  toggle: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 999,
    backgroundColor: STITCH.surfaceLow,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "rgba(60, 74, 66, 0.1)"
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center"
  },
  toggleOn: {
    backgroundColor: STITCH.surfaceContainerHigh,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2
  },
  toggleTxt: { fontSize: 13, fontWeight: "700" },
  field: { marginBottom: 18 },
  label: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: STITCH.onSurfaceVariant,
    marginBottom: 8,
    marginLeft: 4
  },
  pwRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 },
  forgot: { color: "rgba(78, 222, 162, 0.85)", fontSize: 11, fontWeight: "600" },
  inputWrap: { position: "relative" },
  input: {
    backgroundColor: STITCH.surfaceLow,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    paddingRight: 44,
    color: STITCH.onSurface,
    fontSize: 16
  },
  inputIcon: { position: "absolute", right: 16, top: "50%", marginTop: -10 },
  hint: { fontSize: 11, color: "rgba(187, 202, 191, 0.6)", fontStyle: "italic", marginTop: 6, marginLeft: 4 },
  err: { color: STITCH.error, marginBottom: 8, fontWeight: "600" },
  info: { color: STITCH.primary, marginBottom: 8, fontWeight: "600" },
  ctaOuter: { borderRadius: 999, overflow: "hidden", marginTop: 4 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16
  },
  ctaTxt: { color: STITCH.onPrimary, fontWeight: "800", fontSize: 17 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 26 },
  divLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "rgba(60, 74, 66, 0.12)" },
  divTxt: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(187, 202, 191, 0.4)",
    paddingHorizontal: 8,
    backgroundColor: STITCH.surfaceContainer
  },
  socialRow: { flexDirection: "row", gap: 12 },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: STITCH.surfaceLow,
    borderWidth: 1,
    borderColor: "rgba(60, 74, 66, 0.06)"
  },
  socialIcon: { width: 20, height: 20 },
  socialLbl: { color: STITCH.onSurface, fontWeight: "700", fontSize: 13 },
  terms: {
    textAlign: "center",
    marginTop: 28,
    color: STITCH.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 20
  },
  termsBold: { color: STITCH.onSurface, fontWeight: "700", textDecorationLine: "underline" },
  blob1: {
    position: "absolute",
    top: "-8%",
    left: "-8%",
    width: "45%",
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: "rgba(78, 222, 162, 0.05)",
    zIndex: -1
  },
  blob2: {
    position: "absolute",
    bottom: "-4%",
    right: "-4%",
    width: "38%",
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: "rgba(68, 216, 241, 0.05)",
    zIndex: -1
  }
});
