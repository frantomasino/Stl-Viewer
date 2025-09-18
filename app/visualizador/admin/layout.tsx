// app/admin/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme-provider";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Admin Panel UI",
  description: "Admin panel with user management and Firebase integration",
  generator: "v0.app",
};

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={`font-sans ${GeistSans.variable} ${GeistMono.variable} min-h-dvh`}>
      <Suspense fallback={null}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </Suspense>
    </div>
  );
}
