"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
  useTheme as useNextTheme,
} from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // tip: en el layout usá attribute="class" y, si querés, defaultTheme="system"
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

// Re-export del hook oficial (sin contexto propio)
export const useTheme = useNextTheme;
