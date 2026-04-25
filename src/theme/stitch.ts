/**
 * Design tokens aligned with the Stitch Calorie Counter projects
 * (dark emerald surfaces, mint primary #4edea2, Plus Jakarta + Manrope).
 */

type AccentPresetId = "blue" | "emerald" | "violet" | "rose" | "orange";

/** Registered `useFonts` keys — must match @expo-google-fonts package exports. */
export const stitchFonts = {
  display: "PlusJakartaSans_700Bold",
  displaySemibold: "PlusJakartaSans_600SemiBold",
  body: "Manrope_400Regular",
  bodyMedium: "Manrope_500Medium",
  bodySemibold: "Manrope_600SemiBold"
} as const;

export const stitchDark = {
  background: "#060e20",
  cardBackground: "#0b1325",
  text: "#f8fafc",
  mutedText: "#94a3b8",
  border: "rgba(148, 163, 184, 0.18)",
  inputBackground: "#111c33",
  danger: "#f87171",
  success: "#4edea2"
} as const;

/** Text/icon color on top of `theme.primary` fills (mint needs dark text). */
export const onPrimaryByAccent: Record<AccentPresetId, string> = {
  blue: "#ffffff",
  emerald: "#063024",
  violet: "#ffffff",
  rose: "#ffffff",
  orange: "#1c1917"
};
