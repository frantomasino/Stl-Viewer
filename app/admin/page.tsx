"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/toaster"
import { Users, FolderOpen, Shield } from "lucide-react"
import { UsersTable, type User, type Project } from "@/components/admin/UsersTable"
import { ProjectsTable } from "@/components/admin/ProjectsTable"
import { PermissionsEditor } from "@/components/admin/PermissionsEditor"
import { ImportExportACL } from "@/components/admin/ImportExportACL"
import { FirebaseUserManager } from "@/components/admin/FirebaseUserManager"
import { FirebaseProjectManager } from "@/components/admin/FirebaseProjectManager"
import type { UserRole } from "@/lib/firebase"
import { getUsers, type FirebaseUser } from "@/lib/firebase"
import { getProjects } from "@/lib/firebase"
import {RefreshWeb} from "@/components/admin/refreshWeb"
import { HomeButton } from "@/components/UserLinks"
import { ThemeToggle } from "@/components/ThemeToggle"
import { getACL, type ACL } from "@/lib/acl"

const mockUsers: User[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@company.com",
    role: "ADMIN" as UserRole,
    department: "Engineering",
    status: "active",
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@company.com",
    role: "ADMIN" as UserRole,
    department: "Engineering",
    status: "active",
  },
  {
    id: "3",
    name: "Carol Davis",
    email: "carol@company.com",
    role: "USER" as UserRole,
    department: "Design",
    status: "active",
  },
  {
    id: "4",
    name: "David Wilson",
    email: "david@company.com",
    role: "USER" as UserRole,
    department: "Product",
    status: "inactive",
  },
  {
    id: "5",
    name: "Eve Brown",
    email: "eve@company.com",
    role: "TRIAL" as UserRole,
    department: "Engineering",
    status: "active",
  },
  {
    id: "6",
    name: "Frank Taylor",
    email: "frank@company.com",
    role: "USER" as UserRole,
    department: "Engineering",
    status: "active",
  },
  {
    id: "7",
    name: "Grace Lee",
    email: "grace@company.com",
    role: "TRIAL" as UserRole,
    department: "Design",
    status: "active",
  },
  {
    id: "8",
    name: "Henry Martin",
    email: "henry@company.com",
    role: "USER" as UserRole,
    department: "Product",
    status: "active",
  },
  {
    id: "9",
    name: "Irene Walker",
    email: "irene@company.com",
    role: "USER" as UserRole,
    department: "Engineering",
    status: "inactive",
  },
  {
    id: "10",
    name: "Jack Thompson",
    email: "jack@company.com",
    role: "TRIAL" as UserRole,
    department: "Design",
    status: "active",
  },
  {
    id: "11",
    name: "Karen Adams",
    email: "karen@company.com",
    role: "USER" as UserRole,
    department: "Product",
    status: "active",
  },
  {
    id: "12",
    name: "Liam Perez",
    email: "liam@company.com",
    role: "USER" as UserRole,
    department: "Engineering",
    status: "active",
  },
  {
    id: "13",
    name: "Mia Rivera",
    email: "mia@company.com",
    role: "TRIAL" as UserRole,
    department: "Design",
    status: "inactive",
  },
  {
    id: "14",
    name: "Noah Clark",
    email: "noah@company.com",
    role: "USER" as UserRole,
    department: "Engineering",
    status: "active",
  },
  {
    id: "15",
    name: "Olivia Scott",
    email: "olivia@company.com",
    role: "ADMIN" as UserRole,
    department: "Product",
    status: "active",
  },
  {
    id: "16",
    name: "Paul Nguyen",
    email: "paul@company.com",
    role: "USER" as UserRole,
    department: "Engineering",
    status: "active",
  },
  {
    id: "17",
    name: "Quinn Baker",
    email: "quinn@company.com",
    role: "TRIAL" as UserRole,
    department: "Design",
    status: "active",
  },
  {
    id: "18",
    name: "Ruby Patel",
    email: "ruby@company.com",
    role: "USER" as UserRole,
    department: "Engineering",
    status: "inactive",
  },
  {
    id: "19",
    name: "Samuel Ortiz",
    email: "samuel@company.com",
    role: "USER" as UserRole,
    department: "Product",
    status: "active",
  },
  {
    id: "20",
    name: "Tina Chen",
    email: "tina@company.com",
    role: "TRIAL" as UserRole,
    department: "Design",
    status: "active",
  },
]


const mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "Website Redesign",
    description: "Complete overhaul of the company website",
    status: "active",
    owner: "Carol Davis",
    created: "2024-01-15",
  },
  {
    id: "proj-2",
    name: "Mobile App",
    description: "Native mobile application for iOS and Android",
    status: "active",
    owner: "Alice Johnson",
    created: "2024-02-01",
  },
  {
    id: "proj-3",
    name: "API Gateway",
    description: "Centralized API management system",
    status: "completed",
    owner: "Bob Smith",
    created: "2023-12-10",
  },
  {
    id: "proj-4",
    name: "Analytics Dashboard",
    description: "Real-time analytics and reporting dashboard",
    status: "active",
    owner: "David Wilson",
    created: "2024-01-20",
  },
  {
    id: "proj-5",
    name: "User Authentication",
    description: "Single sign-on and user management system",
    status: "planning",
    owner: "Eve Brown",
    created: "2024-03-01",
  },
]

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [acl, setACL] = useState<ACL>({})
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
        setACL(getACL())
      } catch (error) {
        console.error("Error loading Firebase users:", error)
        setUsers([])
        setProjects([])
        setACL(getACL())
      } finally {
        setLoading(false)
      }
    }
  const handleACLChange = (newACL: ACL) => {
    setACL(newACL)
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
          <RefreshWeb onRefresh={loadData} loading={loading}/>
          <ThemeToggle />
          <ImportExportACL onACLChange={handleACLChange} />
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
            Firebase
          </TabsTrigger>
                    <TabsTrigger value="firebase-projects" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Firebase projects
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
              <UsersTable users={users} projects={projects} acl={acl} />
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
              <ProjectsTable projects={projects} users={users} acl={acl} />
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
              <PermissionsEditor users={users} projects={projects} acl={acl} onACLChange={handleACLChange} />
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
