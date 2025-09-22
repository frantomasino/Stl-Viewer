"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, CheckSquare, Square, RefreshCw } from "lucide-react"
import { grant, revoke, setAll, clearAll, type ACL } from "@/lib/acl"
import { useToast } from "@/hooks/use-toast"
import type { User, Project } from "./UsersTable"
import { assignUserToProject, unassignUserFromProject, replaceUserMemberships } from "@/lib/firebase"

// 🔽 leer colecciones directamente (sin helpers nuevos)
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"

interface PermissionsEditorProps {
  users: User[]
  projects: Project[]
  acl: ACL
  onACLChange: (acl: ACL) => void
}

function getUserUid(u: any): string {
  // preferí campo uid (guardado al primer login)
  if (u?.uid && typeof u.uid === "string" && u.uid.length >= 20) return u.uid
  // si /users está claveado por UID, id ya es el uid
  if (u?.id && typeof u.id === "string" && u.id.length >= 20) return u.id
  throw new Error("El usuario seleccionado no tiene UID válido. Guardá `uid` o claveá /users por UID.")
}

export function PermissionsEditor({ users, projects, acl, onACLChange }: PermissionsEditorProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  // === REFRESH: leer ACL desde Firestore (colección memberships) ===
  const loadACL = async () => {
    setRefreshing(true)
    try {
      const snap = await getDocs(collection(db, "memberships"))
      const fresh: ACL = {}
      snap.forEach((d) => {
        const data = d.data() as any
        const uid = String(data.userId)
        const pid = String(data.projectId)
        if (!fresh[uid]) fresh[uid] = []
        fresh[uid].push(pid)
      })
      onACLChange(fresh)
    } finally {
      setRefreshing(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase()),
  )

  // ACL helpers con UID real
  const getUserProjectIdsByUid = (uid: string): string[] => {
    return acl[uid] || []
  }
  const isProjectGrantedByUid = (uid: string, projectId: string): boolean => {
    return getUserProjectIdsByUid(uid).includes(projectId)
  }

  const handleProjectToggle = async (projectId: string, granted: boolean) => {
    if (!selectedUser) return
    const uid = getUserUid(selectedUser)

    // 1) Persistir
    if (granted) await assignUserToProject(uid, projectId, "viewer")
    else await unassignUserFromProject(uid, projectId)

    // 2) Optimista: actualizar ACL local (el Refresh lo confirmará si querés)
    const newACL = granted ? grant(uid, projectId) : revoke(uid, projectId)
    onACLChange(newACL)

    toast({
      title: "Access Updated",
      description: `${granted ? "Granted" : "Revoked"} access to ${projects.find((p) => p.id === projectId)?.name}`,
    })
  }

  const handleSelectAll = async () => {
    if (!selectedUser) return
    const uid = getUserUid(selectedUser)
    const allIds = projects.map((p) => p.id)

    await replaceUserMemberships(uid, allIds)

    const newACL = setAll(uid, allIds)
    onACLChange(newACL)
  }

  const handleClearAll = async () => {
    if (!selectedUser) return
    const uid = getUserUid(selectedUser)

    await replaceUserMemberships(uid, [])

    const newACL = clearAll(uid)
    onACLChange(newACL)
  }

  const formatDate = (created: any) => {
    if (!created) return ""
    if (typeof created === "object" && typeof created.toDate === "function") {
      return created.toDate().toLocaleDateString("es-AR")
    }
    const date = new Date(created)
    return isNaN(date.getTime()) ? "" : date.toLocaleDateString("es-AR")
  }

  const selectedUserUid = selectedUser ? getUserUid(selectedUser) : null
  const selectedUserProjectIds = selectedUserUid ? getUserProjectIdsByUid(selectedUserUid) : []
  const allProjectsGranted = !!selectedUserUid && selectedUserProjectIds.length === projects.length
  const someProjectsGranted = !!selectedUserUid && selectedUserProjectIds.length > 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Users List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users</CardTitle>
            <Button onClick={loadACL} variant="outline" size="sm" disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
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
            filteredUsers.map((user) => {
              const uid = getUserUid(user)
              const count = getUserProjectIdsByUid(uid).length
              return (
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
                      <Badge variant="secondary">{count} projects</Badge>
                    </div>
                  </div>
                </div>
              )
            })
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
              const isGranted = !!selectedUserUid && isProjectGrantedByUid(selectedUserUid, project.id)
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
                      <span>Date: {formatDate(project.created)}</span>
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
