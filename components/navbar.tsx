"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { name: "Inicio", href: "#inicio", external: false },
    { name: "Servicios", href: "#servicios", external: false },
    { name: "Casos", href: "#casos", external: false },
    { name: "Nosotros", href: "#nosotros", external: false },
    { name: "Contacto", href: "#contacto", external: false },
        { name: "Contacto", href: "#contacto", external: false },

  ]

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo → que vaya a /demo */}
          <div className="flex-shrink-0">
            <Link href="/demo" aria-label="Ir a Demo">
              <Image
                src="/logo/lambda3d-logo.svg"
                alt="LAMBDA 3D"
                width={120}
                height={40}
                className="h-14 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) =>
                item.href.startsWith("/") ? (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors duration-200"
                  >
                    {item.name}
                  </a>
                )
              )}
            </div>
          </div>

          {/* CTA Desktop → /demo */}
          <div className="hidden md:block">
            <Button asChild className="rounded-2xl px-6 py-3 font-medium">
              <Link href="/demo">Visualizador 3D</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Abrir menú">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-card rounded-lg mt-2 shadow-lg">
              {navItems.map((item) =>
                item.href.startsWith("/") ? (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-card-foreground hover:text-primary block px-3 py-2 text-base font-medium transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-card-foreground hover:text-primary block px-3 py-2 text-base font-medium transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                )
              )}

              {/* CTA Mobile principal → /demo */}
              <div className="pt-2">
                <Button asChild className="w-full rounded-2xl">
                  <Link href="/demo" onClick={() => setIsMenuOpen(false)}>
                    Visualizador 3D
                  </Link>
                </Button>
              </div>

              {/* (Opcional) botón de login aparte */}
              <div className="pt-2">
                <Button asChild variant="outline" className="w-full rounded-2xl">
                  <Link href="/visualizador" onClick={() => setIsMenuOpen(false)}>
                    Ingresar
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
