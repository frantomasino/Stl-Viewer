"use client";

import type React from "react";

import { useState, useEffect ,useMemo} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, RefreshCw, Search } from "lucide-react";
import {
  // createUser,
  updateUser,
  deleteUser,
  getUsers,
  type FirebaseUser,
  type UserRole,
} from "@/lib/firebase";
import { UserRoleSelector, UserRoleBadge } from "./UserRoleSelector";

export function FirebaseUserManager() {
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<FirebaseUser | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "USER" as UserRole,
    department: "",
    status: "active" as "active" | "inactive",
  });
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users from Firebase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateUser(editingUser.id!, formData);
        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        // await createUser(formData);
        toast({
          title: "Success",
          description: "User created successfully",
        });
      }
      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        role: "USER",
        department: "",
        status: "active",
      });
      loadUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingUser ? "update" : "create"} user`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (user: FirebaseUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteUser(userId);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      loadUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  // búsqueda normalizada (sin tildes) – mantiene la lógica original y añade robustez del "1"
  const norm = (s: unknown) =>
    String(s ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  const filteredUsers = useMemo(() => {
    const q = norm(searchTerm.trim());
    if (!q) return users; // si no hay búsqueda, devuelve todo
    return users.filter((u) =>
      [u.name, u.email, u.department, u.role, u.status].some((field) =>
        norm(field).includes(q)
      )
    );
  }, [users, searchTerm]);

  return (
    <Card>
      {/* ===== Header adaptable a móvil (tomado del "1", sin cambiar estilos visuales) ===== */}
      <CardHeader className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-balance leading-tight">
              Firebase User Management
            </CardTitle>
            <CardDescription className="text-pretty">
              Manage users stored in Firebase Firestore
            </CardDescription>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-end">
            <Button onClick={loadUsers} variant="outline" size="sm" className="shrink-0">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                {/* Mantengo deshabilitado Add User como en el base para no romper nada */}
                <span />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? "Edit User" : "Add New User"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUser
                      ? "Update user information"
                      : "Create a new user in Firebase"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <UserRoleSelector
                      value={formData.role}
                      onChange={(role) => setFormData({ ...formData, role })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "inactive") =>
                        setFormData({ ...formData, status: value })
                      }
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
                    <Button type="submit">
                      {editingUser ? "Update User" : "Create User"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      {/* ===== Buscador ===== */}
      <div className="max-w-2xl w-full mx-auto px-4">
        <div className="relative  mb-6  ">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* ===== Lista ===== */}
      <div className=" w-full max-h-[60vh] overflow-y-auto pr-1 space-y-2">
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-medium truncate">{user.name}</h3>
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
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email} • {user.department}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found. Add your first user to get started.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
