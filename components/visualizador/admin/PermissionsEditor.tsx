"use client";

import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Search, CheckSquare, Square, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User, Project } from "./UsersTable";
import {
  assignUserToProject,
  unassignUserFromProject,
  replaceUserMemberships,
  db,
} from "@/lib/firebase";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

/**
 * Versión Firebase-only con mejoras móviles tomadas de *PermissionsEditor1.tsx*.
 * - Sin props ACL ni onACLChange.
 * - Conteo de proyectos por usuario y permisos del usuario seleccionado en TIEMPO REAL.
 * - Header y listas adaptadas a móvil (sticky, min-w-0, truncate) sin cambiar la estética base.
 */

interface PermissionsEditorProps {
  users: User[];
  projects: Project[];
}

function getUserUid(u: any): string {
  if (u?.uid && typeof u.uid === "string" && u.uid.length >= 20) return u.uid;
  if (u?.id && typeof u.id === "string" && u.id.length >= 20) return u.id;
  throw new Error(
    "El usuario seleccionado no tiene UID válido. Guardá `uid` o claveá /users por UID."
  );
}

export function PermissionsEditor({ users, projects }: PermissionsEditorProps) {
  const { toast } = useToast();
  const [sortAsc, setSortAsc] = useState(true);
  const [hideInactive, setHideInactive] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // ===== Users (lista + búsqueda) =====
  const [usersList, setUsersList] = useState<User[]>([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as User[];
      setUsersList(list);
    });
    return () => unsub();
  }, []);

  const [userSearchTerm, setUserSearchTerm] = useState("");
  const normalize = (s: unknown) =>
    String(s ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  const filteredUsers = useMemo(() => {
    const q = normalize(userSearchTerm.trim());
    if (!q) return usersList;
    return usersList.filter((u) =>
      [u.name, u.email, u.role].some((f) => normalize(f).includes(q))
    );
  }, [usersList, userSearchTerm]);

  const viewUsers = useMemo(() => {
    let arr = hideInactive
      ? filteredUsers.filter((u) => u.status !== "inactive")
      : [...filteredUsers];

    // inactivos siempre al final, y luego ordenar por nombre asc/desc
    const statusWeight = (u: (typeof arr)[number]) =>
      u.status === "inactive" ? 1 : 0;

    arr.sort((a, b) => {
      const sw = statusWeight(a) - statusWeight(b);
      if (sw !== 0) return sw; // empuja inactivos abajo

      const byName = (a.name ?? "").localeCompare(b.name ?? "", undefined, {
        sensitivity: "base",
      });
      return sortAsc ? byName : -byName;
    });

    return arr;
  }, [filteredUsers, hideInactive, sortAsc]);

  // ===== Projects (lista local actualizable) =====
  const [projList, setProjList] = useState<Project[]>([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "projects"), (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as Project[];
      setProjList(list);
    });
    return () => unsub();
  }, []);

  const [projRefreshing, setProjRefreshing] = useState(false);
  const [usersRefreshing, setUsersRefreshing] = useState(false);
  const loadProjects = async () => {
    setProjRefreshing(true);
    try {
      const snap = await getDocs(collection(db, "projects"));
      const list: Project[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as Project[];
      setProjList(list);
    } finally {
      setProjRefreshing(false);
    }
  };
  const loadUsers = async () => {
    setUsersRefreshing(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const list: User[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as User[];
      setUsersList(list);
    } finally {
      setUsersRefreshing(false);
    }
  };

  // ===== Conteo por usuario (en vivo, chunked) =====
  const [countsByUid, setCountsByUid] = useState<Record<string, number>>({});
  useEffect(() => {
    // Limpio listeners previos
    let unsubs: Array<() => void> = [];
    const chunk = <T,>(arr: T[], size: number): T[][] => {
      const out: T[][] = [];
      for (let i = 0; i < arr.length; i += size)
        out.push(arr.slice(i, i + size));
      return out;
    };

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
    const groups = chunk(uids, 10);

    unsubs = groups.map((ids) => {
      const qy = query(
        collection(db, "memberships"),
        where("userId", "in", ids)
      );
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

    return () => unsubs.forEach((u) => u());
  }, [usersList]);

  // ===== Permisos del usuario seleccionado (en vivo) =====
  const [selectedUserProjectIds, setSelectedUserProjectIds] = useState<
    string[]
  >([]);
  useEffect(() => {
    if (!selectedUser) {
      setSelectedUserProjectIds([]);
      return;
    }
    let unsub: undefined | (() => void);
    try {
      const uid = getUserUid(selectedUser);
      const qy = query(
        collection(db, "memberships"),
        where("userId", "==", uid)
      );
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

  // ===== Acciones =====
  const handleProjectToggle = async (projectId: string, granted: boolean) => {
    if (!selectedUser) return;
    const uid = getUserUid(selectedUser);

    // UI optimista para el contador
    const prevCount = countsByUid[uid] ?? 0;
    setCountsByUid((prev) => ({
      ...prev,
      [uid]: Math.max(0, prevCount + (granted ? 1 : -1)),
    }));

    try {
      if (granted) await assignUserToProject(uid, projectId, "viewer");
      else await unassignUserFromProject(uid, projectId);
    } catch (e) {
      setCountsByUid((prev) => ({ ...prev, [uid]: prevCount }));
      console.error(e);
    }

    const projName =
      projList.find((p) => p.id === projectId)?.name || projectId;
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
    setCountsByUid((prev) => ({ ...prev, [uid]: allIds.length }));
  };

  const handleClearAll = async () => {
    if (!selectedUser) return;
    const uid = getUserUid(selectedUser);
    await replaceUserMemberships(uid, []);
    setCountsByUid((prev) => ({ ...prev, [uid]: 0 }));
  };

  // ===== Refresh =====
  const refreshing = projRefreshing || usersRefreshing;
  const doRefresh = async () => {
    await Promise.all([loadUsers(), loadProjects()]);
  };

  // Primera carga
  useEffect(() => {
    doRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedUserUid = selectedUser ? getUserUid(selectedUser) : null;
  const allProjectsGranted =
    !!selectedUserUid && selectedUserProjectIds.length === projList.length;
  const someProjectsGranted =
    !!selectedUserUid && selectedUserProjectIds.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ===== Users List ===== */}
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Pick a user to manage project access
              </CardDescription>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                onClick={doRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
                className="shrink-0"
                title="Refresh users & projects"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setSortAsc((v) => !v)}
                title={`Ordenar por nombre (${sortAsc ? "A→Z" : "Z→A"})`}
              >
                Ordenar: Nombre {sortAsc ? "A→Z" : "Z→A"}
              </Button>

              {/* Ocultar inactivos */}
              <label className="flex items-center gap-2 text-sm select-none pl-2 pr-3 py-2 border rounded-md">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={hideInactive}
                  onChange={(e) => setHideInactive(e.target.checked)}
                />
                Inactivos
              </label>
            </div>
          </div>

          {/* Buscador sticky en mobile para listas largas */}
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 rounded-md">
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {viewUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {userSearchTerm
                ? "No users found matching your search."
                : "No users available."}
            </p>
          ) : (
            viewUsers.map((user) => {
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
                    selectedUser?.id === user.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{user.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
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

      {/* ===== Projects Permissions ===== */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="mb-2 sm:mb-0">
              {selectedUser
                ? `Projects for ${selectedUser.name}`
                : "Select a user"}
            </CardTitle>

            {selectedUser && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={allProjectsGranted}
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Select All
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={!someProjectsGranted}
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}
          </div>

          {selectedUser && (
            <p className="text-sm text-muted-foreground">
              {selectedUserProjectIds.length} of {projList.length} projects
              allowed
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {!selectedUser ? (
            <p className="text-center text-muted-foreground py-8">
              Select a user from the left to manage their project permissions.
            </p>
          ) : projList.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No projects available.
            </p>
          ) : (
            projList.map((project) => {
              const isGranted = selectedUserProjectIds.includes(project.id);
              return (
                <div
                  key={project.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  <Checkbox
                    id={`project-${project.id}`}
                    checked={isGranted}
                    onCheckedChange={(checked) =>
                      handleProjectToggle(project.id, Boolean(checked))
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`project-${project.id}`}
                      className="font-medium cursor-pointer truncate"
                    >
                      {project.name}
                    </label>
                    <div className="text-sm text-muted-foreground">
                      {project.type && (
                        <span className="mr-3">Type: {project.type}</span>
                      )}
                      {project.created && (
                        <span>
                          Date:{" "}
                          {(() => {
                            const c = project.created as any;
                            if (
                              c &&
                              typeof c === "object" &&
                              typeof (c as any).toDate === "function"
                            )
                              return (c as any)
                                .toDate()
                                .toLocaleDateString("es-AR");
                            const d = new Date(c);
                            return isNaN(d.getTime())
                              ? ""
                              : d.toLocaleDateString("es-AR");
                          })()}
                        </span>
                      )}
                    </div>
                    {/* {project.path && <div className="text-xs text-muted-foreground font-mono break-words">{project.path}</div>} */}
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
