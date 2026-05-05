/** Tiny hex helpers — keeps bundle small vs a color library. */

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function mixHex(a: string, b: string, t: number): string {
  const A = parseHex(a);
  const B = parseHex(b);
  return toHex({
    r: A.r + (B.r - A.r) * t,
    g: A.g + (B.g - A.g) * t,
    b: A.b + (B.b - A.b) * t
  });
}

export function semanticSurfaces(input: {
  mode: "light" | "dark";
  background: string;
  cardBackground: string;
  text: string;
  mutedText: string;
  primary: string;
}): {
  surfaceLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  tertiary: string;
  outlineVariant: string;
} {
  const { mode, background, cardBackground, text, mutedText, primary } = input;
  const lift = mode === "dark" ? 0.12 : 0.08;
  const lift2 = mode === "dark" ? 0.2 : 0.14;
  return {
    surfaceLow: mixHex(background, cardBackground, 0.55),
    surfaceContainer: cardBackground,
    surfaceContainerHigh: mixHex(cardBackground, text, lift),
    surfaceContainerHighest: mixHex(cardBackground, text, lift2),
    onSurface: text,
    onSurfaceVariant: mutedText,
    primaryContainer: mixHex(primary, background, mode === "dark" ? 0.42 : 0.25),
    onPrimaryContainer: mixHex(primary, mode === "dark" ? "#000000" : "#0f172a", 0.72),
    tertiary: mixHex(mixHex(primary, "#22d3ee", 0.35), background, 0.25),
    outlineVariant: mixHex(mutedText, background, 0.45)
  };
}
