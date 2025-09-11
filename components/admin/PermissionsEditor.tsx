"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, CheckSquare, Square } from "lucide-react"
import { grant, revoke, setAll, clearAll, type ACL } from "@/lib/acl"
import { useToast } from "@/hooks/use-toast"
import type { User, Project } from "./UsersTable"

interface PermissionsEditorProps {
  users: User[]
  projects: Project[]
  acl: ACL
  onACLChange: (acl: ACL) => void
}

export function PermissionsEditor({ users, projects, acl, onACLChange }: PermissionsEditorProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const { toast } = useToast()

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase()),
  )

  const getUserProjectIds = (userId: string): string[] => {
    return acl[userId] || []
  }

  const isProjectGranted = (userId: string, projectId: string): boolean => {
    return getUserProjectIds(userId).includes(projectId)
  }

  const handleProjectToggle = (projectId: string, granted: boolean) => {
    if (!selectedUser) return

    const newACL = granted ? grant(selectedUser.id, projectId) : revoke(selectedUser.id, projectId)

    onACLChange(newACL)

    toast({
      title: "Access Updated",
      description: `${granted ? "Granted" : "Revoked"} access to ${projects.find((p) => p.id === projectId)?.name}`,
    })
  }

  const handleSelectAll = () => {
    if (!selectedUser) return

    const allProjectIds = projects.map((p) => p.id)
    const newACL = setAll(selectedUser.id, allProjectIds)
    onACLChange(newACL)

    toast({
      title: "Access Updated",
      description: "Granted access to all projects",
    })
  }

  const handleClearAll = () => {
    if (!selectedUser) return

    const newACL = clearAll(selectedUser.id)
    onACLChange(newACL)

    toast({
      title: "Access Updated",
      description: "Cleared all project access",
    })
  }

  const selectedUserProjectIds = selectedUser ? getUserProjectIds(selectedUser.id) : []
  const allProjectsGranted = selectedUser && selectedUserProjectIds.length === projects.length
  const someProjectsGranted = selectedUser && selectedUserProjectIds.length > 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {userSearchTerm ? "No users found matching your search." : "No users available."}
            </p>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedUser?.id === user.id ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{user.role}</Badge>
                    <Badge variant="secondary">{getUserProjectIds(user.id).length} projects</Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Projects Permissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{selectedUser ? `Projects for ${selectedUser.name}` : "Select a user"}</CardTitle>
            {selectedUser && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={allProjectsGranted}>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearAll} disabled={!someProjectsGranted}>
                  <Square className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
          {selectedUser && (
            <p className="text-sm text-muted-foreground">
              {selectedUserProjectIds.length} of {projects.length} projects allowed
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {!selectedUser ? (
            <p className="text-center text-muted-foreground py-8">
              Select a user from the left to manage their project permissions.
            </p>
          ) : projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No projects available.</p>
          ) : (
            projects.map((project) => {
              const isGranted = isProjectGranted(selectedUser.id, project.id)

              return (
                <div key={project.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={`project-${project.id}`}
                    checked={isGranted}
                    onCheckedChange={(checked) => handleProjectToggle(project.id, checked as boolean)}
                  />
                  <div className="flex-1 min-w-0">
                    <label htmlFor={`project-${project.id}`} className="font-medium cursor-pointer">
                      {project.name}
                    </label>
                    <div className="text-sm text-muted-foreground">
                      <span className="mr-3">Type: {project.type}</span>
                      <span>Date: {new Date(project.date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{project.path}</div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
