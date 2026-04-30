import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FileText, ScanLine, Eye, PackageCheck } from "lucide-react"

const steps = [
  {
    icon: FileText,
    title: "Recibimos el estudio médico",
    description:
      "Iniciamos a partir de imágenes médicas en formato DICOM provenientes de TC o RM, según la necesidad del caso.",
  },
  {
    icon: ScanLine,
    title: "Segmentamos la anatomía de interés",
    description:
      "Reconstruimos las estructuras relevantes para el objetivo clínico o educativo: hueso, vasos, órganos, lesiones o regiones específicas.",
  },
  {
    icon: Eye,
    title: "Validamos el modelo digital",
    description:
      "Compartimos una vista previa del modelo para revisión antes de avanzar con la impresión o la entrega del archivo final.",
  },
  {
    icon: PackageCheck,
    title: "Entregamos el biomodelo",
    description:
      "Según el proyecto, entregamos el modelo impreso o visualización 3D interactiva en nuestra plataforma.",
  },
]

export function Process() {
  return (
    <section id="proceso" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance">
            ¿Cómo trabajamos?
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Un proceso claro desde el estudio médico hasta la entrega del modelo
            físico o digital.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon

            return (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 border-0 bg-muted/30 flex flex-col"
              >
                <CardHeader className="space-y-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-primary">
                      Paso {index + 1}
                    </p>

                    <CardTitle className="text-xl text-balance">
                      {step.title}
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col flex-1">
                  <CardDescription className="text-base leading-relaxed">
                    {step.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}