import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import ClientLayout from "./ClientLayout"

export const metadata: Metadata = {
  title: "LAMBDA 3D - Innovación 3D para la salud y la educación",
  description:
    "Transformamos la manera en que los profesionales de la salud y los educadores abordan sus problemáticas mediante soluciones innovadoras en biomodelos e impresión 3D.",
  generator: "v0.app",
  keywords: ["biomodelos", "impresión 3D", "salud", "educación", "planificación quirúrgica", "maquetas anatómicas"],
  openGraph: {
    title: "LAMBDA 3D - Innovación 3D para la salud y la educación",
    description: "Soluciones innovadoras en biomodelos e impresión 3D para profesionales de la salud y educadores.",
    type: "website",
    locale: "es_AR",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
