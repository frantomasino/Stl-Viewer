"use client";

import { useEffect, useState, useRef } from "react";
// import { Circle, Square } from "lucide-react"; // 🔕 Grabación desactivada
import { Home, Camera, MoreHorizontal } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  getUserProjectIds,
  getProjectsByIds,
  type FirebaseProject,
} from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

import ThreeViewer, {
  ThreeViewerHandle,
} from "@/components/visualizador/three-viewer";
import { AppSidebar } from "@/components/ui/app-sidebar";

// shadcn/ui dropdown
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  // const [isRecording, setIsRecording] = useState(false); // 🔕 Grabación desactivada

  const viewerRef = useRef<ThreeViewerHandle>(null);

  const selectedProject = projects.find((p) => p.name === selectedModel);
  const selectedPath = selectedProject?.path;

  useEffect(() => {
    let mounted = true;
    const stop = onAuthStateChanged(auth, async (u) => {
      if (!u || !mounted) {
        setProjects([]);
        return;
      }
      try {
        const ids = await getUserProjectIds(u.uid);
        const docs: FirebaseProject[] = await getProjectsByIds(ids);
        const data = docs.map((p) => ({
          name: p.name,
          path: p.path,
          type: p.type,
          date: (p.created as any)?.toDate
            ? (p.created as any).toDate().toISOString()
            : String(p.created ?? ""),
        }));
        if (mounted) setProjects(data);
      } catch (e) {
        console.error("❌ Error cargando proyectos del usuario:", e);
        if (mounted) setProjects([]);
      }
    });
    return () => {
      mounted = false;
      stop();
    };
  }, []);

  const [loading, setLoading] = useState(false);

  // const handleRecord = async () => { /* 🔕 Grabación desactivada */ };

  return (
    <SidebarProvider>
      <div className={loading ? "opacity-60 pointer-events-none select-none" : ""}>
        <AppSidebar
          projects={projects}
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
          user={user}
          handleLogout={handleLogout}
        />
      </div>

      <SidebarInset className="min-h-0">
        {/* Header */}
        <div className="border-b p-2 sm:p-4 sticky top-0 z-20 bg-background">
          <div className="flex items-start gap-2 sm:items-center sm:gap-3 min-w-0">
            <SidebarTrigger className="shrink-0" />

            <div
              id="top-actions"
              className={`
                w-full min-w-0
                flex items-center gap-2 sm:gap-3
                overflow-visible sm:overflow-x-auto
                whitespace-nowrap
                py-1
                [scrollbar-width:none] [-ms-overflow-style:none]
              `}
            >
              <style jsx global>{`
                @media (min-width: 640px) {
                  #top-actions::-webkit-scrollbar { display: none; }
                }
              `}</style>

              {selectedModel && (
                <Badge
                  variant="secondary"
                  className="ml-1 shrink-0 max-w-[60vw] sm:max-w-none truncate"
                  title={selectedModel}
                >
                  Proyecto: {selectedModel}
                </Badge>
              )}

              {/* ---- MOBILE: menú desplegable con acciones ---- */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="sm:hidden shrink-0"
                    title="Opciones"
                  >
                    <MoreHorizontal className="w-4 h-4 mr-2" />
                    Opciones
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={8} className="w-44">
                  <DropdownMenuItem
                    onClick={() => viewerRef.current?.home?.()}
                    className="cursor-pointer"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Vista Anterior
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Theme toggle dentro del menú (no le pasamos className para evitar warning TS) */}
                  <DropdownMenuItem className="justify-between">
                    Tema
                    <span className="ml-2">
                      <ThemeToggle />
                    </span>
                  </DropdownMenuItem>

                  {/* 🔕 Grabación desactivada
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleRecord} className="cursor-pointer">
                    {isRecording ? (
                      <>
                        <Square className="w-4 h-4 mr-2" /> Detener
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4 mr-2" /> Grabar
                      </>
                    )}
                  </DropdownMenuItem>
                  */}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* ---- DESKTOP: botones visibles como siempre ---- */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => viewerRef.current?.home?.()}
                title="Reencuadrar el modelo"
                className="hidden sm:inline-flex shrink-0"
              >
                <Home className="w-4 h-4 mr-2" />
                Vista Anterior
              </Button>

              {/* Screenshot SOLO desktop */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => viewerRef.current?.takeScreenshot?.()}
                title="Capturar imagen del canvas"
                className="hidden sm:inline-flex shrink-0"
              >
                <Camera className="w-4 h-4 mr-2" />
                Screenshot
              </Button>

              {/* ThemeToggle en desktop en su lugar (visible) */}
              <span className="hidden sm:inline-flex shrink-0">
                <ThemeToggle />
              </span>

              {/* Dock extra */}
              <div className="flex items-center gap-2 shrink-0">
                <div id="controls-dock" className="relative" />
              </div>
            </div>
          </div>
        </div>

        {/* Viewer */}
        <div className="flex-1 relative min-h-0">
          <div id="viewer-root" className="absolute inset-0">
            {selectedPath ? (
              <>
                {/* 🔕 Overlay REC (comentado)
                {isRecording && (
                  <div className="absolute top-3 left-3 z-10">
                    <div className="flex items-center gap-2 rounded-full bg-red-600/90 text-white px-3 py-1 text-xs font-semibold shadow animate-pulse">
                      <span className="h-2.5 w-2.5 rounded-full bg-white" />
                      REC
                    </div>
                  </div>
                )} */}

                <ThreeViewer
                  ref={viewerRef}
                  modelPath={encodeURI(selectedPath)}
                  projectType={selectedProject!.type}
                  onLoadingChange={setLoading}
                />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-foreground/80 text-lg font-semibold transition-colors text-center md:text-left max-w-[90%]">
                  ⚠️ SELECCIONE UN PROYECTO PARA CONTINUAR
                </p>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 z-30 grid place-items-center bg-background/60 backdrop-blur-[1px] pointer-events-auto">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Cargando modelo…</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
