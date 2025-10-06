import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import ClientLayout from "./ClientLayout"
import { ScrollToTopButton } from "@/components/ScrollToTopButton"
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export const metadata: Metadata = {
  title: "LAMBDA 3D",
  description:
    "Transformamos la manera en que los profesionales de la salud y los educadores abordan sus problemáticas mediante soluciones innovadoras en biomodelos e impresión 3D.",
  generator: "FullDev",
  keywords: [
    "biomodelos",
    "impresión 3D",
    "salud",
    "educación",
    "planificación quirúrgica",
    "maquetas anatómicas",
  ],
  openGraph: {
    title: "LAMBDA 3D - Innovación 3D para la salud y la educación",
    description:
      "Soluciones innovadoras en biomodelos e impresión 3D para profesionales de la salud y educadores.",
    type: "website",
    locale: "es_AR",
  },
  // 👇 Iconos  para distintas pantallas
  icons: {
    icon: [
      { url: "/logo/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/logo/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo/favicon.png", type: "image/png" },
    ],
    apple: "/logo/apple-touch-icon.png",
    other: [
      { rel: "android-chrome", url: "/logo/android-chrome-192x192.png", sizes: "192x192" },
      { rel: "android-chrome", url: "/logo/android-chrome-512x512.png", sizes: "512x512" },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
            <body className={`min-h-dvh font-sans ${GeistSans.variable} ${GeistMono.variable}`}>

        <ClientLayout>{children}</ClientLayout>
        <ScrollToTopButton />
      </body>
    </html>
  )
}
