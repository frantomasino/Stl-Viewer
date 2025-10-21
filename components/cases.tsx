import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Heart, GraduationCap, Palette, ArrowRight } from "lucide-react";

const cases = [
  {
    title: "Paciente con anomalía del retorno venoso",
    category: "Planificación Quirúrgica",
    description:
      "Biomodelo cardíaco para anticipar complejidad anatómica y planificar con mayor seguridad.",
    image: "/img/corazon.png",
    link: "https://www.linkedin.com/company/lambda3d",
  },
  {
    title: "Kit de células",
    category: "Maqueta educativa",
    description:
      "Maqueta didáctica para clases de biología, utilizada en prácticas universitarias.",
    image: "/img/Celulas.jpg",
    link: "https://www.linkedin.com/posts/lambda3d_impresion3d-tecnologaedayeducaciaejn-cienciaenelaula-activity-7379939679032295424-RzjU?utm_source=share&utm_medium=member_desktop&rcm=ACoAACdyQbkBM6sr9LGyi12IkN6J0HUeZ42_ybg",
  },
  {
    title: "Cordoma en C3",
    category: "Planificación Quirúrgica",
    description:
      "Segmentación y biomodelo vertebral para planificar resección de cordoma en C3.",
    image: "/img/Cordoma.png",
    link: "https://www.linkedin.com/posts/lambda3d_modeladobiomaezdico-segmentaciaejn3d-planificaciaejnquiraeqrgica-activity-7320471831964999680-DsBg?utm_source=share&utm_medium=member_desktop&rcm=ACoAACdyQbkBM6sr9LGyi12IkN6J0HUeZ42_ybg",
  },
];

export function Cases() {
  return (
    <section id="casos" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance">Casos de Éxito</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty" />
        </div>

{/* Desktop / Tablet (grid) */}
<div className="hidden lg:grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
  {cases.map((c, i) => (
    <Card
      key={i}
      className="group overflow-hidden border-0 bg-background hover:shadow-lg transition-all duration-300 flex flex-col h-full min-h-[440px]" // 👈 min-h fija
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={c.image || "/placeholder.svg"}
          alt={c.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <CardContent className="p-6 space-y-3 flex flex-col flex-1 min-h-0"> {/* 👈 min-h-0 ayuda al flex */}
        <div className="text-sm text-primary font-medium">{c.category}</div>
        <h3 className="text-lg font-semibold text-balance">{c.title}</h3>
        <p className="text-sm text-muted-foreground">{c.description}</p>

        <div className="mt-auto pt-2"> {/* 👈 empuja al fondo */}
          <Button asChild variant="ghost" className="p-0 h-auto font-medium text-primary group/btn">
            <a href={c.link} target="_blank" rel="noopener noreferrer">
              Ver más en LinkedIn
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
            aria-label="Carrusel de casos de éxito"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {cases.map((c, i) => (
                <CarouselItem key={i} className="pl-2 md:pl-4 basis-full sm:basis-1/2">
                  <Card className="group overflow-hidden border-0 bg-background hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={c.image || "/placeholder.svg"}
                        alt={c.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <CardContent className="p-6 space-y-3 flex flex-col flex-1">
                      <div className="text-sm text-primary font-medium">{c.category}</div>
                      <h3 className="text-lg font-semibold text-balance">{c.title}</h3>
                      <p className="text-sm text-muted-foreground">{c.description}</p>

                      <div className="mt-auto">
                        <Button
                          asChild
                          variant="ghost"
                          className="p-0 h-auto font-medium text-primary group/btn"
                        >
                          <a href={c.link} target="_blank" rel="noopener noreferrer">
                            Ver más en LinkedIn
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
  );
}
