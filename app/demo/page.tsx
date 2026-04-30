import type { Metadata } from "next"
import { ViewerIntro } from "@/components/viewer-intro"

export const metadata: Metadata = {
  title: "Visualizador | LAMBDA 3D",
  description: "Explora nuestros modelos 3D interactivos para educación médica y planificación quirúrgica",
}

export default function VisualizadorPage() {
  return (
    <main className="min-h-screen">
      <ViewerIntro />
      
    </main>
  )
}
