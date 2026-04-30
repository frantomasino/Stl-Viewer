import Image from "next/image";
import Link from "next/link";
import { Instagram, Linkedin, ShoppingBag, Box } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2 space-y-4">
            <Image
              src="/logo/lambda3d-logo.svg"
              alt="LAMBDA 3D"
              width={120}
              height={40}
              className="h-14 w-auto brightness-0 invert"
            />

            <p className="text-background/80 leading-relaxed max-w-md">
              Biomodelos anatómicos físicos y digitales para planificación
              quirúrgica, comunicación médica, educación y entrenamiento.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://lambda7.mitiendanube.com/educacion/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Tienda Lambda 3D"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-background/80 transition-colors hover:bg-background/20 hover:text-background"
              >
                <ShoppingBag className="h-5 w-5" />
              </a>

              <a
                href="https://sketchfab.com/lambda3d"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Portfolio 3D en Sketchfab"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-background/80 transition-colors hover:bg-background/20 hover:text-background"
              >
                <Box className="h-5 w-5" />
              </a>

              <a
                href="https://www.instagram.com/lambda3d/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de Lambda 3D"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-background/80 transition-colors hover:bg-background/20 hover:text-background"
              >
                <Instagram className="h-5 w-5" />
              </a>

              <a
                href="https://ar.linkedin.com/company/lambda3d"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn de Lambda 3D"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-background/80 transition-colors hover:bg-background/20 hover:text-background"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-semibold text-background">Servicios</h4>

            <ul className="space-y-2 text-background/80">
              <li>
                <a href="#productos" className="hover:text-background transition-colors">
                  Biomodelos quirúrgicos
                </a>
              </li>

              <li>
                <a href="#productos" className="hover:text-background transition-colors">
                  Segmentación 3D
                </a>
              </li>

              <li>
                <a href="#productos" className="hover:text-background transition-colors">
                  Maquetas educativas
                </a>
              </li>

              <li>
                <a href="#productos" className="hover:text-background transition-colors">
                  Desarrollos personalizados
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-semibold text-background">Empresa</h4>

            <ul className="space-y-2 text-background/80">
              <li>
                <a href="#nosotros" className="hover:text-background transition-colors">
                  Sobre nosotros
                </a>
              </li>

              <li>
                <Link href="/equipo" className="hover:text-background transition-colors">
                  Equipo
                </Link>
              </li>

              <li>
                <a href="#casos" className="hover:text-background transition-colors">
                  Casos clínicos
                </a>
              </li>

              <li>
                <a href="#contacto" className="hover:text-background transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-background/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/60 text-sm">
            © {new Date().getFullYear()} LAMBDA 3D. Todos los derechos
            reservados.
          </p>

          <div className="flex gap-6 text-sm text-background/60">
            <Link
              href="/politica-privacidad"
              className="hover:text-background transition-colors"
            >
              Privacidad
            </Link>

            <Link
              href="/terminos-condiciones"
              className="hover:text-background transition-colors"
            >
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}