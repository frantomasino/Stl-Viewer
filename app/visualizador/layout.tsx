import type { ReactNode } from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme-provider";
// import "@/globals.css";
import TermsConsentGate from "@/components/visualizador/TermsConsentGate"; // 👈 importar
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "Visualizador | LAMBDA 3D",
  description: "Visualizador 3D de modelos anatómicos",
  generator: "v0.dev",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-dvh font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
         <TermsConsentGate> {children}</TermsConsentGate>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
