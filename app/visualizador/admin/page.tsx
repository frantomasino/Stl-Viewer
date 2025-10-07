"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/toaster"
import { Users, FolderOpen, Shield } from "lucide-react"
import { UsersTable, type User, type Project } from "@/components/visualizador/admin/UsersTable"
import { ProjectsTable } from "@/components/visualizador/admin/ProjectsTable"
import { PermissionsEditor } from "@/components/visualizador/admin/PermissionsEditor"
import { FirebaseUserManager } from "@/components/visualizador/admin/FirebaseUserManager"
import { FirebaseProjectManager } from "@/components/visualizador/admin/FirebaseProjectManager"
import type { UserRole } from "@/lib/firebase"
import { getUsers, type FirebaseUser } from "@/lib/firebase"
import { getProjects } from "@/lib/firebase"
import {RefreshWeb} from "@/components/visualizador/admin/refreshWeb"
import { HomeButton } from "@/components/visualizador/UserLinks"
import { ThemeToggle } from "@/components/ThemeToggle"


export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)


 const loadData = async () => {
      try {
        const firebaseUsers = await getUsers()
        const firebaseProjects = await getProjects()

        const convertedUsers: User[] = firebaseUsers.map((fbUser: FirebaseUser) => ({
          id: fbUser.id || "",
          name: fbUser.name,
          email: fbUser.email,
          role: fbUser.role,
          department: fbUser.department,
          status: fbUser.status,
        }))
      // Asegura que id siempre sea string
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
      } catch (error) {
        console.error("Error loading Firebase users:", error)
        setUsers([])
        setProjects([])
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
  

    loadData()
  }, [])
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, projects, and access permissions</p>
        </div>
        <div className="flex items-center gap-4">
          <HomeButton />
          {/* <RefreshWeb onRefresh={loadData} loading={loading}/> */}
          <ThemeToggle />
        </div>
      </div>


  


      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
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

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users Management</CardTitle>
              <CardDescription>
                View and manage user accounts. Click on a user to see their project access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTable users={users} projects={projects}  />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Projects Management</CardTitle>
              <CardDescription>View and manage projects. Click on a project to see who has access.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectsTable projects={projects} users={users}  />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Permissions Management</CardTitle>
              <CardDescription>
                Grant or revoke project access for users. Select a user to manage their permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionsEditor users={users} projects={projects} />
            </CardContent>
          </Card>
        </TabsContent>

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
