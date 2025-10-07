"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, CheckSquare, Square, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User, Project } from "./UsersTable";
import {
  assignUserToProject,
  unassignUserFromProject,
  replaceUserMemberships,
  db,
} from "@/lib/firebase";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";

/**
 * IMPORTANTE (paridad con tus otros componentes):
 * - Sin prop `acl` ni `onACLChange`.
 * - Todo se lee/escribe desde Firestore: `projects` y `memberships`.
 * - Para la lista de usuarios mostramos un conteo real (memberships por usuario).
 * - Para el usuario seleccionado sus permisos se escuchan en tiempo real (onSnapshot).
 */

interface PermissionsEditorProps {
  users: User[];
  projects: Project[]; // lista inicial (se re-sincroniza con loadProjects)
}

function getUserUid(u: any): string {
  // preferí campo uid (guardado al primer login)
  if (u?.uid && typeof u.uid === "string" && u.uid.length >= 20) return u.uid;
  // si /users está claveado por UID, id ya es el uid
  if (u?.id && typeof u.id === "string" && u.id.length >= 20) return u.id;
  throw new Error(
    "El usuario seleccionado no tiene UID válido. Guardá `uid` o claveá /users por UID."
  );
}

export function PermissionsEditor({ users, projects }: PermissionsEditorProps) {
  const [usersList, setUsersList] = useState<User[]>(users);
  useEffect(() => setUsersList(users), [users]);
  const { toast } = useToast();

  // UI / búsqueda
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const filteredUsers = useMemo(() => {
    const q = userSearchTerm.trim().toLowerCase();
    if (!q) return usersList;
    return usersList.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [usersList, userSearchTerm]);

  // Estado de selección
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Proyectos
  const [projRefreshing, setProjRefreshing] = useState(false);
  const [usersRefreshing, setUsersRefreshing] = useState(false);
  const loadUsers = async () => {
    setUsersRefreshing(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const list: User[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as User[];
      setUsersList(list);
    } finally {
      setUsersRefreshing(false);
    }
  };
  const [projList, setProjList] = useState<Project[]>(projects);
  useEffect(() => setProjList(projects), [projects]);

  const loadProjects = async () => {
    setProjRefreshing(true);
    try {
      const snap = await getDocs(collection(db, "projects"));
      const list: Project[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Project[];
      setProjList(list);
    } finally {
      setProjRefreshing(false);
    }
  };

  // Conteo por usuario (para los badges de la lista de usuarios)
  const [countsByUid, setCountsByUid] = useState<Record<string, number>>({});
  const [countsRefreshing, setCountsRefreshing] = useState(false);

  // Live counts por usuario (tiempo real, en chunks de 10 uids para cumplir la restricción de Firestore "in")
  const [countsUnsubs, setCountsUnsubs] = useState<(() => void)[]>([]);
  const chunk = <T,>(arr: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };
  useEffect(() => {
    // Limpio listeners previos
    countsUnsubs.forEach((u) => u());

    const uids = usersList
      .map((u) => {
        try {
          return getUserUid(u);
        } catch {
          return u.id as string;
        }
      })
      .filter(Boolean);

    if (uids.length === 0) return;

    const chunks = chunk(uids, 10);
    const unsubs = chunks.map((ids) => {
      const qy = query(collection(db, "memberships"), where("userId", "in", ids));
      return onSnapshot(qy, (snap) => {
        const partial: Record<string, number> = {};
        ids.forEach((id) => (partial[id] = 0));
        snap.forEach((d) => {
          const uid = String((d.data() as any).userId);
          partial[uid] = (partial[uid] ?? 0) + 1;
        });
        setCountsByUid((prev) => ({ ...prev, ...partial }));
      });
    });

    setCountsUnsubs(unsubs);
    return () => unsubs.forEach((u) => u());
  }, [usersList]);

  const loadCounts = async () => {
    setCountsRefreshing(true);
    try {
      const snap = await getDocs(collection(db, "memberships"));
      const counts: Record<string, number> = {};
      snap.forEach((d) => {
        const data = d.data() as any;
        const uid = String(data.userId);
        counts[uid] = (counts[uid] ?? 0) + 1;
      });
      setCountsByUid(counts);
    } finally {
      setCountsRefreshing(false);
    }
  };

  // Permisos del usuario seleccionado (IDs de proyectos concedidos) en tiempo real
  const [selectedUserProjectIds, setSelectedUserProjectIds] = useState<string[]>([]);
  useEffect(() => {
    if (!selectedUser) {
      setSelectedUserProjectIds([]);
      return;
    }
    let unsub: undefined | (() => void);
    try {
      const uid = getUserUid(selectedUser);
      const qy = query(collection(db, "memberships"), where("userId", "==", uid));
      unsub = onSnapshot(qy, (snap) => {
        const ids = snap.docs.map((d) => String((d.data() as any).projectId));
        setSelectedUserProjectIds(ids);
      });
    } catch (e) {
      console.error(e);
      setSelectedUserProjectIds([]);
    }
    return () => {
      if (unsub) unsub();
    };
  }, [selectedUser]);

  // Acciones de escritura
  const handleProjectToggle = async (projectId: string, granted: boolean) => {
    if (!selectedUser) return;
    const uid = getUserUid(selectedUser);

    // Optimistic UI: actualizo el contador local al instante
    const prevCount = countsByUid[uid] ?? 0;
    setCountsByUid((prev) => ({
      ...prev,
      [uid]: Math.max(0, prevCount + (granted ? 1 : -1)),
    }));

    try {
      if (granted) await assignUserToProject(uid, projectId, "viewer");
      else await unassignUserFromProject(uid, projectId);
    } catch (e) {
      // Revierto el contador si falló la escritura
      setCountsByUid((prev) => ({ ...prev, [uid]: prevCount }));
      console.error(e);
    }

    const projName = projList.find((p) => p.id === projectId)?.name || projectId;
    toast({
      title: "Access Updated",
      description: `${granted ? "Granted" : "Revoked"} access to ${projName}`,
    });
  };

  const handleSelectAll = async () => {
    if (!selectedUser) return;
    const uid = getUserUid(selectedUser);
    const allIds = projList.map((p) => p.id);
    await replaceUserMemberships(uid, allIds);
    // Actualizo contador local inmediatamente
    setCountsByUid((prev) => ({ ...prev, [uid]: allIds.length }));
  };

  const handleClearAll = async () => {
    if (!selectedUser) return;
    const uid = getUserUid(selectedUser);
    await replaceUserMemberships(uid, []);
    // Actualizo contador local inmediatamente
    setCountsByUid((prev) => ({ ...prev, [uid]: 0 }));
  };

  // Formato de fecha amigable (acepta Timestamp o string/number)
  const formatDate = (created: any) => {
    if (!created) return "";
    if (typeof created === "object" && typeof created.toDate === "function") {
      return created.toDate().toLocaleDateString("es-AR");
    }
    const date = new Date(created);
    return isNaN(date.getTime()) ? "" : date.toLocaleDateString("es-AR");
  };

  // Refresh combinado (proyectos + conteos)
  const refreshing = projRefreshing || countsRefreshing || usersRefreshing;
  const doRefresh = async () => {
    await Promise.all([loadUsers(), loadProjects(), loadCounts()]);
  };

  // Cargar al montar
  useEffect(() => {
    doRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedUserUid = selectedUser ? getUserUid(selectedUser) : null;
  const allProjectsGranted = !!selectedUserUid && selectedUserProjectIds.length === projList.length;
  const someProjectsGranted = !!selectedUserUid && selectedUserProjectIds.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Users List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users</CardTitle>
            <Button onClick={doRefresh} variant="outline" size="sm" disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
              const uid = (() => {
                try {
                  return getUserUid(user);
                } catch {
                  return user.id; // si no es UID válido, mostramos 0 sin romper
                }
              })();
              const count = countsByUid[uid] ?? 0;
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
              );
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
              {selectedUserProjectIds.length} of {projList.length} projects allowed
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {!selectedUser ? (
            <p className="text-center text-muted-foreground py-8">
              Select a user from the left to manage their project permissions.
            </p>
          ) : projList.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No projects available.</p>
          ) : (
            projList.map((project) => {
              const isGranted = selectedUserProjectIds.includes(project.id);
              return (
                <div key={project.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={`project-${project.id}`}
                    checked={isGranted}
                    onCheckedChange={(checked) => handleProjectToggle(project.id, Boolean(checked))}
                  />
                  <div className="flex-1 min-w-0">
                    <label htmlFor={`project-${project.id}`} className="font-medium cursor-pointer">
                      {project.name}
                    </label>
                    <div className="text-sm text-muted-foreground">
                      {project.type && <span className="mr-3">Type: {project.type}</span>}
                      {project.created && <span>Date: {formatDate(project.created)}</span>}
                    </div>
                    {project.path && (
                      <div className="text-xs text-muted-foreground font-mono break-words">{project.path}</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
