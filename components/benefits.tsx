import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"

const products = [
  {
    title: "Kit de células",
    description:
      "Set educativo impreso en 3D para enseñanza de biología, anatomía celular y prácticas universitarias. Diseñado para facilitar la comprensión visual y táctil de estructuras complejas.",
    image: "/img/Celulas.jpg",
    link: "https://wa.me/5492346300627?text=Hola%20quiero%20consultar%20por%20el%20Kit%20de%20Células",
  },
  {
    title: "Maqueta anatómica básica",
    description:
      "Modelo anatómico orientado a prácticas médicas, capacitación y enseñanza. Una herramienta didáctica para complementar clases, simulaciones y explicaciones clínicas.",
    image: "/img/craneo.jpeg",
    link: "https://wa.me/5492346300627?text=Hola%20quiero%20consultar%20por%20la%20Maqueta%20Anatómica",
  },
  {
    title: "Biomodelo personalizado",
    description:
      "Modelo anatómico desarrollado a partir de imágenes médicas del paciente. Pensado para planificación quirúrgica, análisis de casos complejos y comunicación con equipos de salud.",
    image: "/img/columna.jpg",
    link: "https://wa.me/5492346300627?text=Hola%20quiero%20consultar%20por%20un%20Biomodelo%20Personalizado",
  },
]

export function Benefits() {
  return (
    <section id="productos" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Productos y servicios
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Soluciones físicas y digitales para educación médica, capacitación y
            planificación clínica. Desarrollamos productos estándar y modelos
            personalizados según la necesidad de cada institución o equipo de
            trabajo.
          </p>
        </div>

        {/* Desktop / Tablet */}
        <div className="hidden lg:grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {products.map((p, i) => (
            <Card
              key={i}
              className="group overflow-hidden border-0 bg-background hover:shadow-lg transition-all duration-300 flex flex-col h-full"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={p.image || "/placeholder.svg"}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <CardContent className="p-6 space-y-3 flex flex-col flex-1">
                <h3 className="text-lg font-semibold text-balance">
                  {p.title}
                </h3>

                <p className="text-sm text-muted-foreground flex-1">
                  {p.description}
                </p>

                <div className="mt-auto">
                  <Button asChild className="w-full">
                    <a href={p.link} target="_blank" rel="noopener noreferrer">
                      Consultar
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
            aria-label="Carrusel de productos"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {products.map((p, i) => (
                <CarouselItem
                  key={i}
                  className="pl-2 md:pl-4 basis-full sm:basis-1/2"
                >
                  <Card className="group overflow-hidden border-0 bg-background hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={p.image || "/placeholder.svg"}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <CardContent className="p-6 space-y-3 flex flex-col flex-1">
                      <h3 className="text-lg font-semibold text-balance">
                        {p.title}
                      </h3>

                      <p className="text-sm text-muted-foreground flex-1">
                        {p.description}
                      </p>

                      <div className="mt-auto">
                        <Button asChild className="w-full">
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Consultar
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