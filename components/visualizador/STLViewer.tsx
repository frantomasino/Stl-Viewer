"use client";

import { useEffect, useState, useRef } from "react";
import { Home, Camera, Circle, Square } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProjectIds, getProjectsByIds, type FirebaseProject } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

import ThreeViewer, { ThreeViewerHandle } from "@/components/visualizador/three-viewer";
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

const selectedProject = projects.find((p) => p.name === selectedModel);
const selectedPath = selectedProject?.path; // si querés mantenerlo

useEffect(() => {
  let mounted = true;
  const stop = onAuthStateChanged(auth, async (u) => {
    if (!u || !mounted) { setProjects([]); return; }

    try {
      // 1) ids de proyectos asignados
      const ids = await getUserProjectIds(u.uid);

      // 2) traer los proyectos
      const docs: FirebaseProject[] = await getProjectsByIds(ids);

      // 3) mapear a tu tipo local (name, path, type, date:string)
      const data = docs.map(p => ({
        name: p.name,
        path: p.path,
        type: p.type,
        date: (p.created as any)?.toDate ? (p.created as any).toDate().toISOString() : String(p.created ?? ""),
      }));

      if (mounted) setProjects(data);
    } catch (e) {
      console.error("❌ Error cargando proyectos del usuario:", e);
      if (mounted) setProjects([]);
    }
  });
  return () => { mounted = false; stop(); };
}, []);

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
        <div className="border-b p-3 sm:p-4 flex items-center justify-between ">
          <div className="flex items-center gap-2 sm:gap-3">
            <SidebarTrigger />
            {/* origi outline */}

            {selectedModel && (
              <Badge variant="secondary" className="ml-2">
                Proyecto: {selectedModel}
              </Badge>
            )}

            {/* Grabar / Detener (se pinta rojo al grabar) */}
            {/* <Button
              variant="outline"
              size="sm"
              onClick={handleRecord}
              className={
                isRecording
                  ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                  : ""
              }
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
            </Button> */}

            {/* Home */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewerRef.current?.home?.()}
              title="Reencuadrar el modelo"
            >
              <Home className="w-4 h-4 mr-2" />
              Vista Anterior
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

            <div className="flex items-center gap-2">
              <div id="controls-dock" className="relative" />
            </div>
          </div>
        </div>

        {/* Viewer */}
        <div className="flex-1 relative min-h-0">
          <div id="viewer-root" className="absolute inset-0">
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
                <ThreeViewer
                  ref={viewerRef}
                  modelPath={encodeURI(selectedPath)}
                  projectType={selectedProject.type} 
                />
                
              </>
            ) : (
               <div className="absolute inset-0 flex items-center justify-center">
                   <p className="text-foreground/80 text-lg font-semibold transition-colors text-center md:text-left max-w-[90%]">
                    ⚠️ SELECCIONE UN PROYECTO PARA CONTINUAR
                   </p>
                </div>
              
              )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
