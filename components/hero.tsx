import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export function Hero() {
  return (
    <section id="inicio" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-balance leading-tight">
                Innovación 3D para la{" "}
                <span className="text-primary">salud</span> y la{" "}
                <span className="text-primary">educación</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground text-pretty leading-relaxed">
                Convertimos imágenes médicas en soluciones 3D precisas que
                mejoran la práctica clínica y educativa.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="rounded-2xl px-8 py-4 text-base font-medium group"
              >
                <a href="#contacto" className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Contactanos
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-2xl px-8 py-4 text-base font-medium group bg-transparent"
              >
                <a href="#servicios" className="flex items-center gap-2">
                  Ver casos
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
            </div>
          </div>

          {/* Image/Visual - oculto en mobile */}
          <div className="relative hidden md:block">
            <div className="aspect-[4/3] bg-muted rounded-3xl overflow-hidden">
              <img
                src="/img/torax.jpeg"
                alt="Biomodelo 3D"
                className="w-full h-full object-cover  "
                style={{
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent 0%, black 40%, black 100%)",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskSize: "cover",
                  maskImage:
                    "linear-gradient(to right, transparent 0%, black 45%, black 100%)",
                  maskRepeat: "no-repeat",
                  maskSize: "cover",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
