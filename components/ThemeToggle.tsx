"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme(); // "light" | "dark"
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Cambiar a tema ${isDark ? "claro" : "oscuro"}`}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-[transform,opacity] motion-reduce:transition-none dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-[transform,opacity] motion-reduce:transition-none dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
