import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Heart, GraduationCap, Palette, ArrowRight } from "lucide-react"

const services = [
  {
    icon: Heart,
    title: "Biomodelos para planificación quirúrgica",
    description: "Modelos anatómicos precisos para planificar procedimientos con mayor claridad y seguridad.",
  },
  {
    icon: GraduationCap,
    title: "Maquetas anatómicas educativas",
    description: "Piezas didácticas para docentes y estudiantes que facilitan la comprensión anatómica.",
  },
  {
    icon: Palette,
    title: "Diseño 3D personalizado",
    description: "Desarrollo a medida según la necesidad clínica o educativa.",
  },
]

export function Services() {
  return (
    <section id="servicios" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance">Nuestros Servicios</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Soluciones especializadas en impresión 3D para el sector salud y educativo
          </p>
        </div>

        <div className="hidden lg:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 border-0 bg-background flex flex-col"
              >
                <CardHeader className="space-y-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-balance">{service.title}</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col flex-1">
                  <CardDescription className="text-base leading-relaxed mb-4">{service.description}</CardDescription>

                  <div className="mt-auto">
                    <Button variant="ghost" className="p-0 h-auto font-medium text-primary group/btn">
                      Saber más
                      <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="lg:hidden">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
            aria-label="Carrusel de servicios"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {services.map((service, index) => {
                const Icon = service.icon
                return (
                  <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-1/2">
                    <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-background flex flex-col h-full">
                      <CardHeader className="space-y-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl text-balance">{service.title}</CardTitle>
                      </CardHeader>

                      <CardContent className="flex flex-col flex-1">
                        <CardDescription className="text-base leading-relaxed mb-4">
                          {service.description}
                        </CardDescription>

                        <div className="mt-auto">
                          <Button variant="ghost" className="p-0 h-auto font-medium text-primary group/btn">
                            Saber más
                            <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
          <CarouselPrevious className="flex absolute left-2 top-1/2 -translate-y-1/2" aria-label="Anterior" />
          <CarouselNext className="flex absolute right-2 top-1/2 -translate-y-1/2" aria-label="Siguiente" />
          </Carousel>
        </div>
      </div>
    </section>
  )
}
