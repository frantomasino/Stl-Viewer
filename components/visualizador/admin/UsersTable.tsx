"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Search, Eye } from "lucide-react"
import { UserRoleBadge } from "./UserRoleSelector"
import type { UserRole } from "@/lib/firebase"
import type { ACL } from "@/lib/acl"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole | string
  department?: string
  status?: "active" | "inactive"
}

export interface Project {
  id: string
  name: string
  description?: string
  status?: string
  owner?: string
  created?: string
  // Legacy fields for backward compatibility
  type?: string
  path?: string
  date?: string
}

interface UsersTableProps {
  users: User[]
  projects: Project[]
  acl: ACL
}

export function UsersTable({ users, projects, acl }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getUserProjectsCount = (userId: string): number => {
    return acl[userId]?.length || 0
  }

  const getUserProjects = (userId: string): Project[] => {
    const userProjectIds = acl[userId] || []
    return projects.filter((project) => userProjectIds.includes(project.id))
  }



  const formatDate = (created: any) => {
    if (!created) return "";
    // Firestore Timestamp
    if (typeof created === "object" && typeof created.toDate === "function") {
      return created.toDate().toLocaleDateString("es-AR");
    }
    // String o número
    const date = new Date(created);
    return isNaN(date.getTime()) ? "" : date.toLocaleDateString("es-AR");
  };

  return (
    <>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Projects Count</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {searchTerm ? "No users found matching your search." : "No users available."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.role === "ADMIN" || user.role === "USER" || user.role === "TRIAL" ? (
                        <UserRoleBadge role={user.role as UserRole} />
                      ) : (
                        <Badge variant="outline">{user.role}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.department || "N/A"}</TableCell>
                    <TableCell>
                      {user.status && (
                        <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getUserProjectsCount(user.id)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
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

      <Sheet open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedUser?.name}</SheetTitle>
            <SheetDescription>User details and project access</SheetDescription>
          </SheetHeader>

          {selectedUser && (
            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <h4 className="font-medium">User Information</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <strong>Email:</strong> {selectedUser.email}
                  </p>
                  <p>
                    <strong>Role:</strong> {selectedUser.role}
                  </p>
                  {selectedUser.department && (
                    <p>
                      <strong>Department:</strong> {selectedUser.department}
                    </p>
                  )}
                  {selectedUser.status && (
                    <p>
                      <strong>Status:</strong> {selectedUser.status}
                    </p>
                  )}
                  <p>
                    <strong>ID:</strong> {selectedUser.id}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Accessible Projects ({getUserProjectsCount(selectedUser.id)})</h4>
                <div className="space-y-2">
                  {getUserProjects(selectedUser.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No projects assigned</p>
                  ) : (
                    getUserProjects(selectedUser.id).map((project) => (
                      <div key={project.id} className="p-3 border rounded-lg">
                        <div className="font-medium text-sm">{project.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {project.description && <div className="mb-1">{project.description}</div>}
                          {project.status && <div className="mr-3">Status: {project.status}</div>}
                          {project.owner && <div className="mr-3">Owner: {project.owner}</div>}
                          {project.created && <div>Created: {formatDate(project.created) }</div>}
                          {project.type && <div className="mr-3">Type: {project.type}</div>}
                          {project.date && <div>Date: {project.date}</div>}
                        </div>
                        {project.path && <div className="text-xs text-muted-foreground mt-1">Path: {project.path}</div>}
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
