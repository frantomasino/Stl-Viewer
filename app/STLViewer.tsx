"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
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

  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)

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
        if (!selectedModel && data.length > 0) setSelectedModel(data[0].name)
      } catch (e) {
        console.error("Error cargando projects.json:", e)
      }
    })()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetView = useCallback(() => {
    controlsRef.current?.reset()
  }, [])

  const takeCapture = useCallback(() => {
    if (!canvasEl) return
    const a = document.createElement("a")
    a.download = "capture.png"
    a.href = canvasEl.toDataURL("image/png")
    a.click()
  }, [canvasEl])

  const startRecording = useCallback(() => {
    if (!canvasEl || isRecording) return
    const stream = canvasEl.captureStream(30)
    const mr = new MediaRecorder(stream, { mimeType: "video/webm" })
    chunksRef.current = []
    mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data)
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "grabacion.webm"
      a.click()
      URL.revokeObjectURL(url)
    }
    mr.start()
    mediaRecorderRef.current = mr
    setIsRecording(true)
  }, [canvasEl, isRecording])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setIsRecording(false)
  }, [])

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement, controls: OrbitControls) => {
    setCanvasEl(canvas)
    controlsRef.current = controls
  }, [])

  return (
    <SidebarProvider>
      {/* Sidebar con perfil a la IZQUIERDA */}
      <AppSidebar
        projects={projects}
        selectedModel={selectedModel}
        onModelSelect={setSelectedModel}
        user={user}
        handleLogout={handleLogout}
      />

      {/* Main */}
      <SidebarInset className="min-h-0">
        {/* Top bar */}
        <div className="border-b p-3 sm:p-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2 sm:gap-3">
            <SidebarTrigger />
            <Button variant="outline" size="sm" onClick={resetView}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              if (!isRecording) startRecording()
              else stopRecording()
            }}>
              {isRecording ? <><Square className="w-4 h-4 mr-2" /> Detener</> : <><Circle className="w-4 h-4 mr-2" /> Grabar</>}
            </Button>
            <Button variant="outline" size="sm" onClick={takeCapture}>
              <Camera className="w-4 h-4 mr-2" />
              Captura
            </Button>
            {selectedModel && <Badge variant="outline" className="ml-2">Seleccionado: {selectedModel}</Badge>}
          </div>
        </div>

        {/* Viewer */}
        <div className="flex-1 relative min-h-0">
          <div className="absolute inset-0">
            <ThreeViewer
              modelPath={selectedPath ? encodeURI(selectedPath) : undefined}
              onCanvasReady={handleCanvasReady}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
