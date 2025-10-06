"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, Search } from "lucide-react";

export type ACL = Record<string, string[]>; // userId -> projectIds

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  status?: string;
};

type Project = {
  id: string;
  name: string;
  description?: string;
  status?: string;
  owner?: string;
  created?: string | number | Date;
  type?: string;
};

type Props = {
  users: User[];
  projects: Project[];
  acl: ACL;
  onACLChange: (acl: ACL) => void;
};

export function PermissionsEditor({ users, projects, acl, onACLChange }: Props) {
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    const norm = (s: unknown) =>
      String(s ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
    const nQ = norm(q);
    return users.filter((u) =>
      [u.name, u.email, u.department, u.role, u.status].some((f) =>
        norm(f).includes(nQ)
      )
    );
  }, [users, query]);

  const selectedUser = selectedUserId
    ? users.find((u) => u.id === selectedUserId) || null
    : null;

  const userProjects = new Set(selectedUserId ? acl[selectedUserId] ?? [] : []);

  const toggleProject = (projectId: string, checked: boolean | string) => {
    if (!selectedUserId) return;
    const next = new Set(userProjects);
    if (checked) next.add(projectId);
    else next.delete(projectId);
    onACLChange({
      ...acl,
      [selectedUserId]: Array.from(next),
    });
  };

  const grantAll = () => {
    if (!selectedUserId) return;
    onACLChange({
      ...acl,
      [selectedUserId]: projects.map((p) => p.id),
    });
  };

  const revokeAll = () => {
    if (!selectedUserId) return;
    onACLChange({
      ...acl,
      [selectedUserId]: [],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions Management</CardTitle>
        <CardDescription>
          Grant or revoke project access for users. Select a user to manage their permissions.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ---- Panel izquierdo: lista de usuarios ---- */}
        <div className="min-h-[360px] max-h-[60vh] sm:max-h-[70vh] overflow-hidden rounded-lg border">
          {/* Header sticky */}
          <div className="sticky top-0 z-10 bg-card border-b p-3 flex items-center justify-between">
            <h3 className="font-semibold">Users</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoadingUsers(true);
                setTimeout(() => setLoadingUsers(false), 600);
              }}
              disabled={loadingUsers}
              className="shrink-0"
              title="Refresh users"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loadingUsers ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {/* Buscador */}
          <div className="px-3 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(60vh-112px)] sm:max-h-[calc(70vh-112px)]">
            {filteredUsers.map((u) => {
              const total = acl[u.id]?.length ?? 0;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`w-full text-left p-3 rounded-lg border hover:bg-accent transition ${
                    selectedUserId === u.id
                      ? "ring-2 ring-primary/40 border-primary/40"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{u.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {u.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {u.role && <Badge variant="secondary">{u.role}</Badge>}
                      <Badge variant="outline">
                        {total} project{total === 1 ? "" : "s"}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="text-center text-muted-foreground py-10 text-sm">
                No users found.
              </div>
            )}
          </div>
        </div>

        {/* ---- Panel derecho: permisos ---- */}
        <div className="min-h-[360px] max-h-[60vh] sm:max-h-[70vh] overflow-hidden rounded-lg border">
          {/* Header (ajustado para mobile) */}
          <div className="sticky top-0 z-10 bg-card border-b p-3">
            {selectedUser ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold leading-tight truncate">
                      Projects for {selectedUser.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedUser.email}
                    </p>
                  </div>

                  {/* en mobile separamos con mt-2; en desktop queda alineado */}
                  <div className="flex items-center gap-2 mt-2 sm:mt-0 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={grantAll}
                      disabled={!selectedUser}
                      className="whitespace-nowrap"
                    >
                      Select All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={revokeAll}
                      disabled={!selectedUser}
                      className="whitespace-nowrap"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground pt-2">
                  {userProjects.size} of {projects.length} projects allowed
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Select a user to manage their permissions.
              </div>
            )}
          </div>

          {/* Lista de proyectos */}
          <div className="p-3 overflow-y-auto max-h-[calc(60vh-72px)] sm:max-h-[calc(70vh-72px)] space-y-2">
            {projects.map((p) => {
              const checked = selectedUser ? userProjects.has(p.id) : false;
              return (
                <label
                  key={p.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${
                    checked ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    {p.type && (
                      <div className="text-xs text-muted-foreground truncate">
                        {p.type}
                      </div>
                    )}
                  </div>

                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => toggleProject(p.id, v)}
                    disabled={!selectedUser}
                  />
                </label>
              );
            })}

            {projects.length === 0 && (
              <div className="text-center text-muted-foreground py-10 text-sm">
                No projects loaded.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PermissionsEditor;
