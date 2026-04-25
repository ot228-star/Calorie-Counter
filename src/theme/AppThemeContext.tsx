import React, { createContext, useContext } from "react";

/** Runtime theme from accent + UI palette + light/dark (see `App.tsx` theme useMemo). */
export type AppThemeTokens = {
  mode: "light" | "dark";
  primary: string;
  onPrimary: string;
  /** Darker / secondary stop for gradients and chips */
  primaryContainer: string;
  onPrimaryContainer: string;
  tertiary: string;
  background: string;
  cardBackground: string;
  surfaceLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  text: string;
  mutedText: string;
  onSurface: string;
  onSurfaceVariant: string;
  border: string;
  inputBackground: string;
  outlineVariant: string;
  danger: string;
  success: string;
};

const Ctx = createContext<AppThemeTokens | null>(null);

export function AppThemeProvider({ value, children }: { value: AppThemeTokens; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppTheme(): AppThemeTokens {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return v;
}

/** For leaf components that may render outside the provider in tests. */
export function useAppThemeOptional(): AppThemeTokens | null {
  return useContext(Ctx);
}
