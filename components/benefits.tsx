import { Users, Target, Wrench } from "lucide-react"

const benefits = [
  {
    icon: Target,
    title: "Precisión y detalle anatómico",
    description: "Segmentaciones de alta fidelidad basadas en imágenes médicas",
  },
  {
    icon: Users,
    title: "Equipo interdisciplinario",
    description: "Trabajo conjunto entre profesionales de salud e ingeniería",
  },
  {
    icon: Wrench,
    title: "Soluciones personalizadas",
    description: "Desarrollo según la necesidad específica del cliente",
  },
]

export function Benefits() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance">En que nos diferenciamos</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Aportamos valor en cada etapa del proceso, desde el diseño hasta la entrega
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div key={index} className="text-center space-y-4 group">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-balance">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
