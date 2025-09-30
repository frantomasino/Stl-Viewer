import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"

export function Hero() {
  return (
    <section id="inicio" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-balance leading-tight">
                Innovación 3D para la <span className="text-primary">salud</span> y la{" "}
                <span className="text-primary">educación</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground text-pretty leading-relaxed">
                Transformamos la manera en que los profesionales de la salud y los educadores abordan sus problemáticas
                mediante soluciones innovadoras en biomodelos e impresión 3D.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="rounded-2xl px-8 py-4 text-base font-medium group">
                <a href="#servicios" className="flex items-center gap-2">
                  Conocé más
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-2xl px-8 py-4 text-base font-medium group bg-transparent"
              >
                <a href="#contacto" className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Contactanos
                </a>
              </Button>
            </div>
          </div>

          {/* Image/Visual - oculto en mobile */}
          <div className="relative hidden md:block">
            <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-8 flex items-center justify-center">
              <div className="w-full h-full bg-muted rounded-2xl flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
                    <div className="w-12 h-12 bg-primary rounded-full"></div>
                  </div>
                  <p className="text-muted-foreground font-medium">Biomodelo 3D</p>
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
