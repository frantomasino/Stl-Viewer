"use client";

import { useEffect, useState, useRef } from "react";
import { Home, Camera, Circle, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle"

import ThreeViewer, { ThreeViewerHandle } from "@/components/three-viewer";
import { AppSidebar } from "@/components/ui/app-sidebar";

type Project = {
  name: string;
  path: string;
  type: string;
  date: string;
};

type STLViewerProps = {
  user?: any;
  handleLogout?: () => void;
};

export default function STLViewer({ user, handleLogout }: STLViewerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);

  // Control del visor (Home / Screenshot / Grabar)
  const viewerRef = useRef<ThreeViewerHandle>(null);

  const selectedPath = projects.find((p) => p.name === selectedModel)?.path;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/projects.json");
        const data: Project[] = await res.json();
        if (!mounted) return;
        setProjects(data);
        if (!selectedModel && data.length > 0) {
          setSelectedModel(data[0].name);
        }
      } catch (e) {
        console.error("❌ Error cargando projects.json:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedModel]);

  const handleRecord = async () => {
    if (!viewerRef.current) return;

    if (!isRecording) {
      // Iniciar grabación
      const ok = viewerRef.current.startRecording?.({ fps: 60 });
      if (ok) setIsRecording(true);
      else console.error("No se pudo iniciar la grabación");
    } else {
      // Detener y descargar .webm
      const blob = await viewerRef.current.stopRecording?.();
      setIsRecording(false);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        a.href = url;
        a.download = `grabacion-${ts}.webm`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    }
  };

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

            {selectedModel && (
              <Badge variant="outline" className="ml-2">
                Proyecto: {selectedModel}
              </Badge>
            )}

            {/* Grabar / Detener (se pinta rojo al grabar) */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecord}
              className={isRecording ? "bg-red-600 text-white border-red-600 hover:bg-red-700" : ""}
              title={isRecording ? "Detener grabación" : "Iniciar grabación"}
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 mr-2" /> Detener
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 mr-2" /> Grabar
                </>
              )}
            </Button>


            {/* Home */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewerRef.current?.home?.()}
              title="Reencuadrar el modelo"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>

            {/* Screenshot */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewerRef.current?.takeScreenshot?.()}
              title="Capturar imagen del canvas"
            >
              <Camera className="w-4 h-4 mr-2" />
              Screenshot
            </Button>
              <ThemeToggle />
          </div>
        </div>

        {/* Viewer */}
        <div className="flex-1 relative min-h-0">
          <div className="absolute inset-0">
            {selectedPath ? (
              <>
                {/* Overlay REC sobre el canvas (opcional) */}
                {isRecording && (
                  <div className="absolute top-3 left-3 z-10">
                    <div className="flex items-center gap-2 rounded-full bg-red-600/90 text-white px-3 py-1 text-xs font-semibold shadow animate-pulse">
                      <span className="h-2.5 w-2.5 rounded-full bg-white" />
                      REC
                    </div>
                  </div>
                )}

                {/* Controlamos el visor con ref */}
                <ThreeViewer ref={viewerRef} modelPath={encodeURI(selectedPath)} />
              </>
            ) : (
              <p className="text-white">⚠️ No hay modelo seleccionado</p>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
