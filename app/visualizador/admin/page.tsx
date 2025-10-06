"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/toaster"
import { Users, FolderOpen, Shield } from "lucide-react"
import { UsersTable, type User, type Project } from "@/components/visualizador/admin/UsersTable"
import { ProjectsTable } from "@/components/visualizador/admin/ProjectsTable"
import { PermissionsEditor } from "@/components/visualizador/admin/PermissionsEditor"
import { ImportExportACL } from "@/components/visualizador/admin/ImportExportACL"
import { FirebaseUserManager } from "@/components/visualizador/admin/FirebaseUserManager"
import { FirebaseProjectManager } from "@/components/visualizador/admin/FirebaseProjectManager"
import type { UserRole } from "@/lib/firebase"
import { getUsers, type FirebaseUser, getProjects } from "@/lib/firebase"
import { HomeButton } from "@/components/visualizador/UserLinks"
import { ThemeToggle } from "@/components/ThemeToggle"
import { getACL, type ACL } from "@/lib/acl"

// shadcn/ui Select (móvil)
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [acl, setACL] = useState<ACL>({})
  const [loading, setLoading] = useState(true)

  // pestaña compartida por Tabs (desktop) y Select (mobile)
  const [tab, setTab] = useState<
    "users" | "projects" | "permissions" | "firebase-users" | "firebase-projects"
  >("users")

  const loadData = async () => {
    try {
      const firebaseUsers = await getUsers()
      const firebaseProjects = await getProjects()

      const convertedUsers: User[] = firebaseUsers.map((fbUser: FirebaseUser) => ({
        id: fbUser.id || "",
        name: fbUser.name,
        email: fbUser.email,
        role: fbUser.role as UserRole,
        department: fbUser.department,
        status: fbUser.status,
      }))

      const convertedProjects: Project[] = firebaseProjects.map((proj: any) => ({
        id: proj.id ?? "",
        name: proj.name ?? "",
        path: proj.path ?? "",
        type: proj.type ?? "",
        status: proj.status ?? "",
        owner: proj.owner ?? "",
        description: proj.description ?? "",
        created: proj.created ?? "",
      }))

      setUsers(convertedUsers)
      setProjects(convertedProjects)
      setACL(getACL())
    } catch (error) {
      console.error("Error loading Firebase users/projects:", error)
      setUsers([])
      setProjects([])
      setACL(getACL())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Al cambiar de pestaña en mobile: scrolleo arriba y quito foco (cierra select/teclado)
  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.innerWidth >= 640) return // solo mobile
    try {
      window.scrollTo({ top: 0, behavior: "smooth" })
      const el = document.activeElement as HTMLElement | null
      el?.blur?.()
    } catch {}
  }, [tab])

  const handleACLChange = (newACL: ACL) => setACL(newACL)

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading admin panel...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, projects, and access permissions</p>
        </div>
        <div className="flex items-center gap-4">
          <HomeButton />
          <ThemeToggle />
          <ImportExportACL onACLChange={handleACLChange} />
        </div>
      </div>

      {/* Tabs + Select móvil */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="space-y-6">
        {/* MOBILE: selector compacto y sticky bajo el header */}
        <div className="sm:hidden sticky top-2 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-xl">
          <Select value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <SelectTrigger
              aria-label="Select section"
              className="h-10 text-sm rounded-xl border-muted-foreground/20 shadow-sm focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent align="start" className="rounded-xl">
              <SelectItem value="users">Users</SelectItem>
              <SelectItem value="projects">Projects</SelectItem>
              <SelectItem value="permissions">Permissions</SelectItem>
              <SelectItem value="firebase-users">User Editor</SelectItem>
              <SelectItem value="firebase-projects">Projects Editor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* DESKTOP: tabs originales */}
        <TabsList className="hidden sm:grid w-full grid-cols-5 rounded-xl">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="firebase-users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Editor
          </TabsTrigger>
          <TabsTrigger value="firebase-projects" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Projects Editor
          </TabsTrigger>
        </TabsList>

        {/* USERS */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users Management</CardTitle>
              <CardDescription>
                View and manage user accounts. Click on a user to see their project access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTable users={users} projects={projects} acl={acl} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROJECTS */}
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Projects Management</CardTitle>
              <CardDescription>
                View and manage projects. Click on a project to see who has access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectsTable projects={projects} users={users} acl={acl} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERMISSIONS */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Permissions Management</CardTitle>
              <CardDescription>
                Grant or revoke project access for users. Select a user to manage their permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-hidden sm:overflow-visible">
                <PermissionsEditor users={users} projects={projects} acl={acl} onACLChange={setACL} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Firestore managers */}
        <TabsContent value="firebase-users">
          <FirebaseUserManager />
        </TabsContent>

        <TabsContent value="firebase-projects">
          <FirebaseProjectManager />
        </TabsContent>
      </Tabs>

      <Toaster />
    </div>
  )
}
