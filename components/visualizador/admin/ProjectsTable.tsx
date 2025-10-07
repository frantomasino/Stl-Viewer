"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Search, Eye } from "lucide-react"
// ❌ quitamos el tipo ACL (no más dependencia de "@/lib/acl")
// import type { ACL } from "@/lib/acl"
import type { User, Project } from "./UsersTable"
import { FirebaseProjectManager } from "./FirebaseProjectManager"
interface ProjectsTableProps {
  projects: Project[]
  users: User[]
  // mantenemos la prop para compatibilidad, pero ya no se usa
}
import { getProjects, db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"

export function ProjectsTable({ projects, users }: ProjectsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const [projRefreshing, setProjRefreshing] = useState(false)
  const [projList, setProjList] = useState<Project[]>(projects)

  const [sortBy, setSortBy] = useState<"name" | "created">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const filteredProjects = projList.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.status?.toLowerCase().includes(searchTerm.toLowerCase()),
  )
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === "name") {
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    } else {
      const dateA = a.created as any
      const dateB = b.created as any
      // se mantiene la lógica original
      return sortOrder === "asc" ? (dateA as number) - (dateB as number) : (dateB as number) - (dateA as number)
    }
  })

  // Si cambian los props desde arriba, sincronizo
  useEffect(() => { setProjList(projects) }, [projects])

  const loadProjects = async () => {
    setProjRefreshing(true)
    try {
      const fresh = await getProjects()
      setProjList(fresh)
    } finally {
      setProjRefreshing(false)
    }
  }

  // 🔄 Viewers por proyecto (Firebase en lugar de ACL)
  const [viewersByProject, setViewersByProject] = useState<Record<string, User[]>>({})

  // Carga de viewers cuando se abre el Sheet de un proyecto
  useEffect(() => {
    const p = selectedProject?.id
    if (!p) return

    let cancelled = false
    ;(async () => {
      try {
        // memberships del proyecto
        const qy = query(collection(db, "memberships"), where("projectId", "==", p))
        const snap = await getDocs(qy)
        const ids = snap.docs.map((d) => String((d.data() as any).userId))
        const idSet = new Set(ids)
        // resolvemos a objetos User tomando la lista provista en props
        const list = users.filter((u) => idSet.has(u.id))
        if (!cancelled) setViewersByProject((prev) => ({ ...prev, [p]: list }))
      } catch (e) {
        if (!cancelled) setViewersByProject((prev) => ({ ...prev, [p]: [] }))
        console.error(e)
      }
    })()

    return () => { cancelled = true }
  }, [selectedProject, users])

  // Mantengo el mismo nombre de helper para no tocar la UI
  const getProjectViewers = (projectId: string): User[] => {
    return viewersByProject[projectId] ?? []
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default"
      case "completed":
        return "secondary"
      case "planning":
        return "outline"
      default:
        return "outline"
    }
  }
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "activo":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "inactivo":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "completado":
        return "bg-[#33809d] text-white"
      case "en progreso":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const formatDate = (created: any) => {
    if (!created) return ""
    // Firestore Timestamp
    if (typeof created === "object" && typeof created.toDate === "function") {
      return created.toDate().toLocaleDateString("es-AR")
    }
    // String o número
    const date = new Date(created)
    return isNaN(date.getTime()) ? "" : date.toLocaleDateString("es-AR")
  }

  useEffect(() => {
    loadProjects() // primera carga al montar la solapa
  }, [])

  useEffect(() => {
    const onFocus = () => loadProjects()
    const onVisible = () => { if (document.visibilityState === "visible") loadProjects() }

    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [])

  return (
    <>
      <div className="space-y-4">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search projects by name, description, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Controles de orden (se mantiene estética) */}
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "created")}
            className="border rounded px-2 py-1 text-sm bg-background"
          >
            <option value="name">Nombre (A-Z)</option>
            <option value="created">Fecha de creación</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-2"
            title={sortOrder === "asc" ? "Ascendente" : "Descendente"}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>

        <div className="border rounded-lgspace-y-2 max-h-[60vh] overflow-y-auto pr-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {searchTerm ? "No projects found matching your search." : "No projects available."}
                  </TableCell>
                </TableRow>
              ) : (
                sortedProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(project.status ?? "unknown")}>
                        {project.status ?? "Sin estado"}
                      </Badge>
                    </TableCell>
                    <TableCell>{project.owner}</TableCell>
                    <TableCell>{formatDate(project.created)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedProject(project)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedProject?.name}</SheetTitle>
            <SheetDescription>Project details and viewer access</SheetDescription>
          </SheetHeader>

          {selectedProject && (
            <div className="mt-6 space-y-6 ">
              <div className="space-y-2">
                <h4 className="font-medium">Project Information</h4>
                <div className="text-sm text-muted-foreground space-y-1 ">
                  <p>
                    <strong>Description:</strong> {selectedProject.description}
                    <p>
                      <strong>Status:</strong>{" "}
                      <Badge className={getStatusBadgeClass(selectedProject.status ?? "unknown")}>
                        {selectedProject.status ?? "Sin estado"}
                      </Badge>
                    </p>
                    <strong>Owner:</strong> {selectedProject.owner}
                  </p>
                  <p>
                    <strong>Created:</strong> {formatDate(selectedProject.created)}
                  </p>
                  <p>
                    <strong>ID:</strong> {selectedProject.id}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Viewers ({getProjectViewers(selectedProject.id).length})</h4>
                <div className="space-y-2">
                  {getProjectViewers(selectedProject.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No users have access to this project</p>
                  ) : (
                    getProjectViewers(selectedProject.id).map((user) => (
                      <div key={user.id} className="p-3 border rounded-lg">
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="mr-3">{user.email}</span>
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
