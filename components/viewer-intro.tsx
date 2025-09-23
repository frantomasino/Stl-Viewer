import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight,ArrowLeft, Play } from "lucide-react";

export function ViewerIntro() {
  return (
    <section className="py-24 lg:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Botón regresar arriba a la izquierda */}
        <div className="mb-8">
          <Button
            variant="outline"
            asChild
            className="rounded-full px-6 py-2 text-sm font-medium"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
        </div>




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
              Ver Demo a
            </Button>
            {/* Ajuste en botón primario
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
            </Button> */}
          </div>

<div className="aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-lg">
  <iframe
    className="w-full h-full"
    src="/vid/vid1.mp4"
    title="Video demo"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  ></iframe>
</div>
        </div>
      </div>
    </section>
  );
}
