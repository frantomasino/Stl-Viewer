"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { UserProfile } from "@/components/ui/user-profile" // <-- IMPORTA AQUÍ

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

export function AppSidebar({
  projects,
  selectedModel,
  onModelSelect,
  user,
  handleLogout,
}: AppSidebarProps) {
  return (
    <SidebarRoot>
  <SidebarContent>
    {/* Logo   */}
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-full"></div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">LAM3DA</h1>
      </div>
    </div>

    {/* Proyectos  */}
    <SidebarGroup>
      <SidebarGroupContent>
        {/* Encabezado custom */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-cyan-600 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-500 rounded-full" />
            Proyectos
          </h2>
        </div>

        {/* Lista */}
        <div className="p-3 space-y-2">
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
              <div className="font-medium text-gray-800 text-sm">{p.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {p.type} • {p.date}
              </div>
            </Card>
          ))}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>

     {/* Instrucciones */}
<SidebarGroup>
  <SidebarGroupContent>
    {/* Encabezado   */}
    <div className="p-4 border-b border-gray-200">
      <h2 className="text-sm font-semibold text-cyan-600 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-cyan-500 rounded-full" />
        Instrucciones
      </h2>
    </div>

    {/* Contenido */}
    <div className="p-4 text-xs text-gray-600 space-y-2">
      <p>• Haz clic en un proyecto para cargarlo</p>
      <p>• Usa el ratón para orbitar alrededor del modelo</p>
      <p>• Usa la rueda del ratón para hacer zoom</p>
      <p>• Haz clic en un mesh para seleccionarlo</p>
      <p>• Usa los controles para modificar</p>
    </div>
  </SidebarGroupContent>
</SidebarGroup>

  </SidebarContent>
</SidebarRoot>

  )
}

export default AppSidebar
