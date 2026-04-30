import Link from "next/link"
import { Button } from "@/components/ui/button"

export function About() {
  return (
    <section id="nosotros" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">
              Sobre Lambda 3D
            </h2>

            <div className="space-y-4 text-base md:text-lg leading-relaxed text-muted-foreground">
              <p>
                Lambda 3D nació en la intersección entre la medicina, el diseño
                y la tecnología. Somos un equipo interdisciplinario con
                experiencia en segmentación, modelado e impresión 3D aplicada a
                casos clínicos reales.
              </p>

              <p>
                Parte del equipo desarrolla su trabajo en el{" "}
                <Link
                  href="https://www.hospitalelcruce.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Hospital de Alta Complejidad en Red El Cruce
                </Link>
                , en Florencio Varela, uno de los centros de referencia nacional
                en cirugías de alta complejidad. Ese contexto define cómo
                trabajamos.
              </p>

              <p>
                No solo producimos modelos: diseñamos soluciones a partir de
                estudios de tomografía y resonancia, entendiendo qué necesita
                ver el equipo médico para planificar, comunicar y tomar
                decisiones.
              </p>

              <p>
                También desarrollamos herramientas tridimensionales para
                educación y entrenamiento, con alcance a instituciones,
                profesionales y empresas de todo el país.
              </p>
              <p>
                Trabajamos desde Chivilcoy, Buenos Aires, con alcance a todo el
                país, articulando con instituciones de salud, profesionales y
                empresas para desarrollar soluciones 3D adaptadas a cada
                proyecto.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-2xl">
  <Link href="/equipo">Conocé al equipo</Link>
</Button>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/3] bg-muted rounded-3xl overflow-hidden">
              <img
                src="/img/labo.jpg"
                alt="Laboratorio de Lambda 3D"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
