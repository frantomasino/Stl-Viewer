import Link from "next/link";
import {
  ArrowLeft,
  Linkedin,
  Radiation,
  Handshake,
  Cpu,
  Pen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const team = [
  {
    name: "Valeria",
    role: "Fundadora",
    area: "Licenciada en Producción de Bioimágenes",
    image: "/img/equipo/cv_valeria.png",
         imagePosition: "object-[60%_38%]",
    bio: "Profesional vinculada al desarrollo de biomodelos anatómicos aplicados a planificación quirúrgica. Su experiencia en entornos hospitalarios permite orientar cada proyecto a necesidades reales del equipo médico, integrando criterio clínico, segmentación de imágenes médicas y fabricación digital.",
    linkedin: "https://www.linkedin.com/in/valeria-ariata/",
    icon: Radiation,
  },
  {
    name: "Diego Alberto Poggio",
    role: "Médico Veterinario / Técnico en Gestión Ambiental",
    area: "Responsable de gestiones comerciales",
    image: "/img/equipo/diego.jpg",
    bio: "Se encarga de la gestión comercial de Lambda 3D, acompañando el vínculo con clientes, proveedores e instituciones. Su rol está orientado a escuchar necesidades, coordinar consultas y generar oportunidades para acercar nuestras soluciones 3D a profesionales, empresas y espacios educativos.",

    linkedin: "",
    icon: Handshake,
  },
  {
    name: "Malaquías Cerrillo",
    role: "Bioingeniero",
    area: "Diseño y producción",
    image: "/img/equipo/malaquias.jpg",
    bio: "Integra conocimientos técnicos y de diseño para acompañar el desarrollo de soluciones 3D orientadas a salud, educación y comunicación visual de estructuras complejas.",
    linkedin: "https://www.linkedin.com/in/malaqu%C3%ADas-cerrillo-b6553291/",
    icon: Pen,
  },
  {
    name: "Emiliano",
    role: "Bioingeniero",
    area: "Desarrollo tecnológico",
    image: "/img/equipo/cv_emiliano.png",
    imageFit: "object-contain",
     imagePosition: "object-[60%_38%]",
    bio: "Participa en el desarrollo de herramientas digitales, modelado anatómico, visualización 3D y soluciones técnicas para transformar estudios médicos en modelos útiles para salud y educación.",
    linkedin: "https://www.linkedin.com/in/emifyf/",
    icon: Cpu,
  },
];

export default function EquipoPage() {
  return (
    <main className="min-h-screen bg-muted/30">
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <div className="mb-8">
            <Button
              variant="ghost"
              asChild
              className="px-0 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-transparent"
            >
              <Link href="/#nosotros">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="text-center space-y-5 mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              Conocé al equipo de Lambda 3D
            </h1>

            <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
              Combinamos experiencia en salud, diseño, modelado anatómico,
              segmentación de imágenes médicas, desarrollo tecnológico e
              impresión 3D para crear soluciones aplicadas a casos clínicos,
              educación y entrenamiento.
            </p>
          </div>

          {/* Team grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((person) => {
              const Icon = person.icon;

              return (
                <Card
                  key={person.name}
                  className="group border-0 bg-background overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative">
                    <div className="aspect-[4/3] bg-muted overflow-hidden">
                    <img
  src={person.image}
  alt={person.name}
  className={`w-full h-full object-cover ${
    person.imagePosition ?? "object-center"
  } transition-transform duration-300 group-hover:scale-105`}
/>
                    </div>

                    <div className="absolute -bottom-6 left-6 w-12 h-12 rounded-2xl bg-background shadow-md flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>

                  <CardContent className="p-6 pt-10 flex flex-col h-full">
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold leading-tight">
                        {person.name}
                      </h2>

                      <p className="text-sm font-medium text-primary">
                        {person.role}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {person.area}
                      </p>
                    </div>

                    <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                      {person.bio}
                    </p>

                    {person.linkedin && (
                      <div className="mt-5">
                        <Button
                          asChild
                          variant="ghost"
                          className="p-0 h-auto text-primary"
                        >
                          <Link
                            href={person.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Linkedin className="h-4 w-4 mr-2" />
                            Ver LinkedIn
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Bottom institutional note */}
          {/* <div className="mt-16 max-w-4xl mx-auto">
            <Card className="border-0 bg-background">
              <CardContent className="p-6 md:p-8 text-center space-y-3">
                <h3 className="text-2xl font-semibold">
                  Una mirada técnica con criterio clínico
                </h3>

                <p className="text-muted-foreground leading-relaxed">
                  Nuestro equipo trabaja de forma colaborativa para transformar
                  estudios médicos, ideas educativas y necesidades institucionales
                  en modelos 3D claros, útiles y adaptados a cada proyecto.
                </p>
              </CardContent>
            </Card>
          </div> */}
        </div>
      </section>
    </main>
  );
}
