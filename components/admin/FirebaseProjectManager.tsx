"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Trash2, RefreshCw, ExternalLink } from "lucide-react";
import {
  createProject,
  updateProject,
  deleteProject,
  getProjects,
  type FirebaseProject,
} from "@/lib/firebase";

export function FirebaseProjectManager() {
  const [projects, setProjects] = useState<FirebaseProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<FirebaseProject | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    owner: "",
    path: "",
    status: "activo",
    type: "",
  });
  const { toast } = useToast();

  const loadProjects = async () => {
    try {
      setLoading(true);
      const fetchedProjects = await getProjects();
      setProjects(fetchedProjects);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load projects from Firebase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await updateProject(editingProject.id!, formData);
        toast({
          title: "Success",
          description: "Project updated successfully",
        });
      } else {
        await createProject(formData);
        toast({
          title: "Success",
          description: "Project created successfully",
        });
      }
      setIsDialogOpen(false);
      setEditingProject(null);
      setFormData({
        name: "",
        description: "",
        owner: "",
        path: "",
        status: "activo",
        type: "",
      });
      loadProjects();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${
          editingProject ? "update" : "create"
        } project`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (project: FirebaseProject) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      owner: project.owner,
      path: project.path,
      status: project.status,
      type: project.type,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await deleteProject(projectId);
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      loadProjects();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "activo":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "inactivo":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "completado":
        return "bg-[#33809d] text-white";
      case "en progreso":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "cardiología":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "neurocirugía":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "neurología":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "oncología":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "pediatría":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      case "traumatología":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";

      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Firebase Project Management</CardTitle>
            <CardDescription>
              Manage projects stored in Firebase Firestore
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadProjects} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingProject(null);
                    setFormData({
                      name: "",
                      description: "",
                      owner: "",
                      path: "",
                      status: "activo",
                      type: "",
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingProject ? "Edit Project" : "Add New Project"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProject
                      ? "Update project information"
                      : "Create a new project in Firebase"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="owner">Owner</Label>
                      <Input
                        id="owner"
                        value={formData.owner}
                        onChange={(e) =>
                          setFormData({ ...formData, owner: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="path">Path (URL)</Label>
                    <Input
                      id="path"
                      type="url"
                      value={formData.path}
                      onChange={(e) =>
                        setFormData({ ...formData, path: e.target.value })
                      }
                      placeholder="https://..."
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Activo">Activo</SelectItem>
                          <SelectItem value="Inactivo">Inactivo</SelectItem>
                          <SelectItem value="En progreso">En progreso</SelectItem>
                          <SelectItem value="Completado">Completado</SelectItem>

                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) =>
                          setFormData({ ...formData, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cardiología">
                            Cardiología
                          </SelectItem>
                          <SelectItem value="Neurocirugía">
                            Neurocirugía
                          </SelectItem>
                          <SelectItem value="Neurología">Neurología</SelectItem>
                          <SelectItem value="Oncología">Oncología</SelectItem>
                          <SelectItem value="Pediatría">Pediatría</SelectItem>
                          <SelectItem value="Traumatología">
                            Traumatología
                          </SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">
                      {editingProject ? "Update Project" : "Create Project"}
                    </Button>
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
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">{project.name}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getTypeColor(
                        project.type
                      )}`}
                    >
                      {project.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {project.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Owner: {project.owner} • Created:{" "}
                    {formatDate(project.created)}
                  </p>
                  {project.path && (
                    <a
                      href={project.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Project
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(project)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(project.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No projects found. Add your first project to get started.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
