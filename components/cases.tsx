import { Card, CardContent } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

const cases = [
  {
    title: "Paciente con anomalía del retorno venoso",
    category: "Planificación Quirúrgica",
    image: "/img/corazon.png",
  },
  {
    title: "Kit de células",
    category: "Maqueta educativa ",
    image: "/img/Celulas.jpg",
  },
    {
    title: "Cordoma en C3",
    category: "Planificación Quirúrgica",
    image: "/img/Cordoma.png",
  },
  // {
  //   title: "Modelo de columna vertebral",
  //   category: "Educación",
  //   image: "/img/3d-spine-model-for-medical-education.jpg",
  // },

  // {
  //   title: "Modelo de articulación",
  //   category: "Educación",
  //   image: "/img/3d-joint-model-for-orthopedic-education.jpg",
  // },
  // {
  //   title: "Órganos anatómicos",
  //   category: "Educación Médica",
  //   image: "/img/3d-anatomical-organs-for-medical-training.jpg",
  // },
]

export function Cases() {
  return (
    <section id="casos" className="py-24 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance">Casos de Éxito</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Algunos de nuestros proyectos más destacados en biomodelos y educación
          </p>
        </div>

        <div className="hidden lg:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cases.map((case_, index) => (
            <Card
              key={index}
              className="group overflow-hidden border-0 bg-background hover:shadow-lg transition-all duration-300"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={case_.image || "/placeholder.svg"}
                  alt={case_.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-6 space-y-2">
                <div className="text-sm text-primary font-medium">{case_.category}</div>
                <h3 className="text-lg font-semibold text-balance">{case_.title}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:hidden">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
            aria-label="Carrusel de casos de éxito"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {cases.map((case_, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-1/2">
                  <Card className="group overflow-hidden border-0 bg-background hover:shadow-lg transition-all duration-300 h-full">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={case_.image || "/placeholder.svg"}
                        alt={case_.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-6 space-y-2">
                      <div className="text-sm text-primary font-medium">{case_.category}</div>
                      <h3 className="text-lg font-semibold text-balance">{case_.title}</h3>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          <CarouselPrevious className="flex absolute left-2 top-1/2 -translate-y-1/2" aria-label="Anterior" />
          <CarouselNext className="flex absolute right-2 top-1/2 -translate-y-1/2" aria-label="Siguiente" />
          </Carousel>
        </div>
      </div>
    </section>
  )
}
