"use client"
import * as React from "react"
import { Card } from "@/components/ui/card"
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

export interface Project {
  name: string
  path: string
  type: string
  date: string
}

interface AppSidebarProps {
  projects: Project[]
  selectedModel: string
  onModelSelect: (modelName: string) => void
  user?: any
  handleLogout?: () => void
}

/** Acordeón con animación de altura */
function AccordionSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const [maxH, setMaxH] = React.useState<number>(0)

  // recalcular altura al abrir/cerrar y en resize
  React.useEffect(() => {
    const el = contentRef.current
    if (!el) return
    // medimos el contenido real
    const h = el.scrollHeight
    setMaxH(open ? h : 0)
  }, [open, children])

  React.useEffect(() => {
    const onResize = () => {
      const el = contentRef.current
      if (!el) return
      setMaxH(open ? el.scrollHeight : 0)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [open])

  return (
    <div className="w-full">
      <div
        className="p-4 border-b border-gray-200 cursor-pointer flex items-center justify-between select-none"
        onClick={onToggle}
        role="button"
        aria-expanded={open}
      >
        <h2 className="section">
          {title}
        </h2>
        <span className="text-gray-500 text-xs">{open ? "▲" : "▼"}</span>
      </div>

      <div
        ref={contentRef}
        style={{
          maxHeight: maxH,
          overflow: "hidden",
          transition: "max-height 260ms ease",
        }}
      >
        {/* Wrapper interno para padding del contenido */}
        <div className="p-3">{children}</div>
      </div>
    </div>
  )
}

export function AppSidebar({
  projects,
  selectedModel,
  onModelSelect,
}: AppSidebarProps) {
  // estados de acordeón
  const [openProjects, setOpenProjects] = React.useState(true)
  const [openInstructions, setOpenInstructions] = React.useState(false)

  return (
    <SidebarRoot>
      <SidebarContent>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img
              src="logo.png"
              alt="Lambda 3D"
              style={{ width: "auto", height: "150px" }}
            />
          </div>
        </div>

        {/* PROYECTOS (acordeón) */}
        <SidebarGroup>
          <SidebarGroupContent>
            <AccordionSection
              title="Proyectos"
              open={openProjects}
              onToggle={() => setOpenProjects(v => !v)}
            >
              <div className="space-y-2">
                {projects.map((p, idx) => (
                  <Card
                    key={`${p.path}-${idx}`}
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedModel === p.name
                        ? "bg-cyan-100 border-cyan-300"
                        : "bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => onModelSelect(p.name)}
                  >
                    <div className="font-medium text-gray-800 text-sm">
                      {p.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {p.type} • {p.date}
                    </div>
                  </Card>
                ))}
                {projects.length === 0 && (
                  <div className="text-xs text-gray-500 px-1 py-2">
                    No hay proyectos para mostrar.
                  </div>
                )}
              </div>
            </AccordionSection>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* INSTRUCCIONES (acordeón) */}
        <SidebarGroup>
          <SidebarGroupContent>
            <AccordionSection
              title="Instrucciones"
              open={openInstructions}
              onToggle={() => setOpenInstructions(v => !v)}
            >
              <div className="text-xs text-gray-600 space-y-2">
                <p>• Haz clic en un proyecto para cargarlo</p>
                <p>• Usa el ratón para orbitar alrededor del modelo</p>
                <p>• Usa la rueda del ratón para hacer zoom</p>
                <p>• Haz clic en un modelo para seleccionarlo</p>
                <p>• Usa los controles para modificarlo</p>
              </div>
            </AccordionSection>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </SidebarRoot>
  )
}

export default AppSidebar
