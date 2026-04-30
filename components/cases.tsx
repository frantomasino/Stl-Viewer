import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const cases = [
  {
    title: "Anomalía del retorno venoso",
    category: "Planificación quirúrgica cardiovascular",
    description:
      "Biomodelo cardíaco desarrollado para comprender una anatomía compleja, anticipar el abordaje quirúrgico y facilitar la comunicación del caso entre el equipo médico.",
    image: "/img/corazon.png",
    sketchfabUrl:
      "https://sketchfab.com/models/5f46fc442a19435592eace05eb35c1b9/embed",
    sketchfabTitle: "Cirugía cardiovascular",
    link: "https://sketchfab.com/3d-models/cirugia-cardiovascular-5f46fc442a19435592eace05eb35c1b9",
  },
  {
    title: "Metástasis en hígado",
    category: "Planificación quirúrgica hepática",
    description:
      "Planificación de hepatectomía para caso de tumor neuroendocrino de la primera porción del duodeno con metástasis hepáticas.",
    image: "/img/Celulas.jpg",
 sketchfabUrl:
    "https://sketchfab.com/models/f0663259a1814c39afb8f66ced713fa7/embed",
  sketchfabTitle: "Metástasis en hígado",
  link: "https://sketchfab.com/3d-models/metastasis-en-higado-f0663259a1814c39afb8f66ced713fa7",
  },
  {
    title: "Cordoma en C3",
    category: "Planificación quirúrgica en columna",
    description:
      "Segmentación anatómica y biomodelo vertebral para analizar la relación de la lesión con estructuras óseas cervicales y acompañar la planificación preoperatoria.",
    image: "/img/Cordoma.png",
    link: "https://www.linkedin.com/posts/lambda3d_modeladobiomaezdico-segmentaciaejn3d-planificaciaejnquiraeqrgica-activity-7320471831964999680-DsBg?utm_source=share&utm_medium=member_desktop&rcm=ACoAACdyQbkBM6sr9LGyi12IkN6J0HUeZ42_ybg",
  },
]

export function Cases() {
  return (
    <section id="casos" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance">
            Casos clínicos
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Aplicaciones reales de biomodelos, segmentación e impresión 3D para
            planificación quirúrgica, comunicación médica y docencia.
          </p>
        </div>

        {/* Desktop / Tablet (grid) */}
        <div className="hidden lg:grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {cases.map((c, i) => (
            <Card
              key={i}
              className="group overflow-hidden border-0 bg-background hover:shadow-lg transition-all duration-300 flex flex-col h-full min-h-[440px]"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                {c.sketchfabUrl ? (
                  <iframe
                    title={c.sketchfabTitle || c.title}
                    src={c.sketchfabUrl}
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; fullscreen; xr-spatial-tracking"
                    className="w-full h-full"
                  />
                ) : (
                  <img
                    src={c.image || "/placeholder.svg"}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
              </div>

              <CardContent className="p-6 space-y-3 flex flex-col flex-1 min-h-0">
                <div className="text-sm text-primary font-medium">
                  {c.category}
                </div>

                <h3 className="text-lg font-semibold text-balance">
                  {c.title}
                </h3>

                <p className="text-sm text-muted-foreground">
                  {c.description}
                </p>

                <div className="mt-auto pt-2">
                  <Button
                    asChild
                    variant="ghost"
                    className="p-0 h-auto font-medium text-primary group/btn"
                  >
                    <a href={c.link} target="_blank" rel="noopener noreferrer">
                      Ver caso
                      <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mobile (carousel) */}
        <div className="lg:hidden">
          <Carousel
            opts={{ align: "start", loop: true }}
            className="w-full"
            aria-label="Carrusel de casos clínicos y educativos"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {cases.map((c, i) => (
                <CarouselItem
                  key={i}
                  className="pl-2 md:pl-4 basis-full sm:basis-1/2"
                >
                  <Card className="group overflow-hidden border-0 bg-background hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      {c.sketchfabUrl ? (
                        <iframe
                          title={c.sketchfabTitle || c.title}
                          src={c.sketchfabUrl}
                          frameBorder="0"
                          allowFullScreen
                          allow="autoplay; fullscreen; xr-spatial-tracking"
                          className="w-full h-full"
                        />
                      ) : (
                        <img
                          src={c.image || "/placeholder.svg"}
                          alt={c.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                    </div>

                    <CardContent className="p-6 space-y-3 flex flex-col flex-1">
                      <div className="text-sm text-primary font-medium">
                        {c.category}
                      </div>

                      <h3 className="text-lg font-semibold text-balance">
                        {c.title}
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        {c.description}
                      </p>

                      <div className="mt-auto">
                        <Button
                          asChild
                          variant="ghost"
                          className="p-0 h-auto font-medium text-primary group/btn"
                        >
                          <a
                            href={c.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Ver caso
                            <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>

            <CarouselPrevious
              className="flex absolute left-2 top-1/2 -translate-y-1/2"
              aria-label="Anterior"
            />
            <CarouselNext
              className="flex absolute right-2 top-1/2 -translate-y-1/2"
              aria-label="Siguiente"
            />
          </Carousel>
        </div>
      </div>
    </section>
  )
}