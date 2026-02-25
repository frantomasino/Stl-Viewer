"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart } from "lucide-react";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "Inicio", href: "#inicio", external: false },
    { name: "Servicios", href: "#servicios", external: false },
    // { name: "Casos", href: "#casos", external: false },
    { name: "Nosotros", href: "#nosotros", external: false },
    { name: "Productos", href: "#productos", external: false },
    { name: "Contacto", href: "#contacto", external: false },
    { name: "Demo", href: "/demo", external: false },
    {
      name: "Tienda",
      href: "https://lambda7.mitiendanube.com/educacion/",
      external: true,
    },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 justify-between">
          {/* Logo a la izquierda */}
          <div className="flex-shrink-0">
            <Link href="/" aria-label="Lambda 3D">
              <Image
                src="/logo/lambda3d-logo.svg"
                alt="LAMBDA 3D"
                width={120}
                height={40}
                className="h-14 w-auto"
              />
            </Link>
          </div>

          {/* NavItems centrados */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="flex items-center space-x-8">
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
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="text-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors duration-200"
                  >
                    {item.name}
                  </a>
                ),
              )}
            </div>
          </div>

          {/* Botón a la derecha */}
          <div className="hidden md:block">
            <Button asChild className="rounded-2xl px-6 py-3 font-medium">
              <Link
                href="/visualizador"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visualizador 3D
              </Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Abrir menú"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-4 pt-4 pb-6 space-y-4 bg-card rounded-lg mt-2 shadow-lg">
              {/* Links principales */}
              <nav className="flex flex-col items-center space-y-3">
                {navItems.map((item) =>
                  item.href.startsWith("/") ? (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-card-foreground hover:text-primary text-lg font-medium transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <a
                      key={item.name}
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className="text-card-foreground hover:text-primary text-lg font-medium transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </a>
                  ),
                )}
              </nav>

              {/* CTA principal */}
              <div className="pt-4">
                <Button
                  asChild
                  className="w-full rounded-2xl py-3 text-base font-semibold"
                >
                  <Link
                    href="/visualizador"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Visualizador 3D
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
