import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export function ViewerIntro() {
  return (
    <section className="py-24 lg:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance">
            Visualizador 3D
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground text-pretty leading-relaxed">
            Explora nuestros modelos anatómicos en 3D de forma interactiva.
            Perfecto para educación médica y planificación quirúrgica.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl px-8 py-4 text-lg font-medium bg-transparent"
            >
              <Play className="h-5 w-5 mr-2" />
              Ver Demo
            </Button>
            {/* Ajuste en botón primario */}
            <Button
              size="lg"
              asChild
              className="rounded-full px-8 py-4 text-lg font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 focus-visible:ring-[hsl(var(--ring))]"
            >
              <Link
                href="/visualizador"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ingresa a tu cuenta
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="pt-16">
            <div className="aspect-video bg-muted rounded-2xl flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Play className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground">
                  El visualizador 3D estará disponible próximamente
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
