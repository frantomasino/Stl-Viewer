"use client"

import { useEffect, useState, useRef } from "react"
import { RotateCcw, Circle, Square, Camera } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

import ThreeViewer from "@/components/three-viewer"
import { AppSidebar } from "@/components/ui/app-sidebar"

type Project = {
  name: string
  path: string
  type: string
  date: string
}

type STLViewerProps = {
  user?: any
  handleLogout?: () => void
}

export default function STLViewer({ user, handleLogout }: STLViewerProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")

  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const selectedPath = projects.find((p) => p.name === selectedModel)?.path

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch("/projects.json")
        const data: Project[] = await res.json()
        if (!mounted) return
        setProjects(data)
        if (!selectedModel && data.length > 0) {
          setSelectedModel(data[0].name)
        }
      } catch (e) {
        console.error("❌ Error cargando projects.json:", e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [selectedModel])

  return (
    <SidebarProvider>
      <AppSidebar
        projects={projects}
        selectedModel={selectedModel}
        onModelSelect={setSelectedModel}
        user={user}
        handleLogout={handleLogout}
      />

     <SidebarInset className="min-h-0">
  <div className="border-b p-3 sm:p-4 flex items-center justify-between bg-white">
    <div className="flex items-center gap-2 sm:gap-3">
      <SidebarTrigger />
      <Button variant="outline" size="sm">
        <Circle className="w-4 h-4 mr-2" /> Grabar
      </Button>
      {selectedModel && (
        <Badge variant="outline" className="ml-2">
          Seleccionado: {selectedModel}
        </Badge>
      )}
    </div>
  </div>

  {/* Viewer */}
  <div className="flex-1 relative min-h-0">
    <div className="absolute inset-0">
      {selectedPath ? (
        <>
          {console.log("➡️ Enviando al visor:", selectedPath)}
          <ThreeViewer modelPath={encodeURI(selectedPath)} />
        </>
      ) : (
        <p className="text-white">⚠️ No hay modelo seleccionado</p>
      )}
    </div>
  </div>
</SidebarInset>

    </SidebarProvider>
  )
}
