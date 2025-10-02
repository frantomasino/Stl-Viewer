export function About() {
  return (
    <section id="nosotros" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">Sobre Nosotros</h2>
            <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
              <p>
                En LAMBDA 3D nos especializamos en el diseño y la impresión de biomodelos personalizados para
                planificación quirúrgica y maquetas educativas.
              </p>
              <p>
                Nuestra misión es acercar la innovación tecnológica al servicio de la salud y la educación,
                proporcionando herramientas que mejoren la comprensión y precisión en estos campos críticos.
              </p>
              <p>
                Trabajamos con un equipo interdisciplinario de ingenieros, diseñadores y profesionales médicos para
                garantizar la máxima calidad y precisión en cada proyecto.
              </p>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/3] bg-muted rounded-3xl overflow-hidden">
              <img
                src="/img/labo.jpg"
                alt="Laboratorio LAMBDA 3D"
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
  )
}
