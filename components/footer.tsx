import Image from "next/image";
import Link from "next/link";
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
              Innovación 3D para la salud y la educación. Transformamos ideas en
              soluciones tangibles mediante biomodelos e impresión 3D.
            </p>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-semibold text-background">Servicios</h4>
            <ul className="space-y-2 text-background/80">
              <li>
                <a
                  href="#servicios"
                  className="hover:text-background transition-colors"
                >
                  Biomodelos quirúrgicos
                </a>
              </li>
              <li>
                <a
                  href="#servicios"
                  className="hover:text-background transition-colors"
                >
                  Maquetas educativas
                </a>
              </li>
              <li>
                <a
                  href="#servicios"
                  className="hover:text-background transition-colors"
                >
                  Desarrollos 3D personalizados
                </a>
              </li>
          <li>
  <a
    href="https://lambda7.mitiendanube.com/educacion/"
    target="_blank"
    rel="noopener noreferrer"
    className="hover:text-background transition-colors"
  >
    Nuestra tienda
  </a>
</li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-semibold text-background">Empresa</h4>
            <ul className="space-y-2 text-background/80">
              <li>
                <a
                  href="#nosotros"
                  className="hover:text-background transition-colors"
                >
                  Sobre nosotros
                </a>
              </li>
              <li>
                <a
                  href="#casos"
                  className="hover:text-background transition-colors"
                >
                  Casos de éxito
                </a>
              </li>
              <li>
                <a
                  href="#contacto"
                  className="hover:text-background transition-colors"
                >
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
