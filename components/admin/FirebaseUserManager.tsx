"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react"
import { createUser, updateUser, deleteUser, getUsers, type FirebaseUser, type UserRole } from "@/lib/firebase"
import { UserRoleSelector, UserRoleBadge } from "./UserRoleSelector"

export function FirebaseUserManager() {
  const [users, setUsers] = useState<FirebaseUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<FirebaseUser | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "USER" as UserRole,
    department: "",
    status: "active" as "active" | "inactive",
  })
  const { toast } = useToast()

  const loadUsers = async () => {
    try {
      setLoading(true)
      const fetchedUsers = await getUsers()
      console.log("Usuarios traídos de Firebase:", fetchedUsers) // <-- Agrega esta línea
      setUsers(fetchedUsers)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users from Firebase",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await updateUser(editingUser.id!, formData)
        toast({
          title: "Success",
          description: "User updated successfully",
        })
      } else {
        await createUser(formData)
        toast({
          title: "Success",
          description: "User created successfully",
        })
      }
      setIsDialogOpen(false)
      setEditingUser(null)
      setFormData({ name: "", email: "", role: "USER", department: "", status: "active" })
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingUser ? "update" : "create"} user`,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (user: FirebaseUser) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      await deleteUser(userId)
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Firebase User Management</CardTitle>
            <CardDescription>Manage users stored in Firebase Firestore</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadUsers} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingUser(null)
                    setFormData({ name: "", email: "", role: "USER", department: "", status: "active" })
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                  <DialogDescription>
                    {editingUser ? "Update user information" : "Create a new user in Firebase"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <UserRoleSelector value={formData.role} onChange={(role) => setFormData({ ...formData, role })} />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="submit">{editingUser ? "Update User" : "Create User"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{user.name}</h3>
                    <UserRoleBadge role={user.role} />
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {user.email} • {user.department}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(user.id!)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found. Add your first user to get started.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
