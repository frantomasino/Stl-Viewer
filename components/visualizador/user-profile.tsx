"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useIsAdminFromUsers } from "@/hooks/useIsAdminFromUsers";
import { GoToAdminLink } from "./UserLinks";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, LogOut, Camera } from "lucide-react";

import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  onAuthStateChanged,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

type UserProfileProps = {
  user?: {
    uid?: string;
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
    providerData?: Array<{ providerId?: string | null }>;
  } | null;
  handleLogout?: () => void;
};

const initialsFrom = (name: string) =>
  (name || "U")
    .trim()
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "U";

const defaultProfile = {
  name: "Usuario",
  email: "sin-email",
  specialty: "Especialidad",
  institution: "Institución",
  bio: "Perfil médico.",
  photo: "" as string,
};

async function downscaleDataURL(
  dataUrl: string,
  maxSide = 512,
  quality = 0.9
): Promise<string> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const s = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * s));
  const h = Math.max(1, Math.round(img.height * s));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return c.toDataURL("image/jpeg", quality);
}

/* ======== validación local de política (ajustá a gusto) ======== */
const PASSWORD_POLICY = {
  minLen: 8,
  requireUpper: true,
  requireLower: true,
  requireNumber: true,
  requireSymbol: true,
};
function validatePassword(p: string): string | null {
  if (p.length < PASSWORD_POLICY.minLen)
    return `Mínimo ${PASSWORD_POLICY.minLen} caracteres.`;
  if (PASSWORD_POLICY.requireUpper && !/[A-Z]/.test(p))
    return "Debe incluir al menos una mayúscula.";
  if (PASSWORD_POLICY.requireLower && !/[a-z]/.test(p))
    return "Debe incluir al menos una minúscula.";
  if (PASSWORD_POLICY.requireNumber && !/[0-9]/.test(p))
    return "Debe incluir al menos un número.";
  if (PASSWORD_POLICY.requireSymbol && !/[^\w\s]/.test(p))
    return "Debe incluir al menos un carácter especial.";
  return null;
}
/* =============================================================== */

export function UserProfile({ user, handleLogout }: UserProfileProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profile, setProfile] = useState({ ...defaultProfile });
  const [uid, setUid] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const initials = initialsFrom(profile.name);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAdmin, loading: isAdminLoading } = useIsAdminFromUsers();

  // ---- activar password (para cuentas que entraron con Google) ----
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [addPassMsg, setAddPassMsg] = useState("");
  const [addPassLoading, setAddPassLoading] = useState(false);
  const [showAddPassForm, setShowAddPassForm] = useState(false);

  // ---- cambiar password (para cuentas que ya tienen provider "password") ----
  const [showChangePassForm, setShowChangePassForm] = useState(false);
  const [currPass, setCurrPass] = useState("");
  const [nextPass, setNextPass] = useState("");
  const [nextPass2, setNextPass2] = useState("");
  const [changeMsg, setChangeMsg] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);

  const hasPasswordProvider = !!user?.providerData?.some(
    (p) => p?.providerId === "password"
  );

  useEffect(() => {
    const stop = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
      setAuthReady(true);
    });
    return () => stop();
  }, []);

  useEffect(() => {
    if (!authReady || !uid) return;
    (async () => {
      try {
        const ref = doc(db, "profiles", uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setProfile(snap.data() as typeof defaultProfile);
        } else {
          setProfile({
            ...defaultProfile,
            name: user?.displayName || defaultProfile.name,
            email: user?.email || defaultProfile.email,
            photo: user?.photoURL || "",
          });
        }
      } catch (e) {
        console.error("Error leyendo Firestore:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, uid]);

  const handleSaveProfile = async () => {
    if (!uid) {
      alert("No hay usuario autenticado");
      return;
    }

    let photo = profile.photo;
    if (photo && photo.length > 900_000) {
      try {
        photo = await downscaleDataURL(photo, 512, 0.85);
      } catch {}
    }

    const ref = doc(db, "profiles", uid);
    const dataToSave = {
      name: profile.name,
      email: profile.email,
      specialty: profile.specialty,
      institution: profile.institution,
      bio: profile.bio,
      photo,
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(ref, dataToSave, { merge: true });
      setIsEditingProfile(false);
    } catch (e) {
      console.error("Error guardando en Firestore:", e);
      alert("No se pudo guardar (ver consola).");
    }
  };

  const onPickImage: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const original = String(reader.result || "");
      try {
        const reduced = await downscaleDataURL(original, 512, 0.9);
        setProfile((p) => ({ ...p, photo: reduced }));
      } catch {
        setProfile((p) => ({ ...p, photo: original }));
      }
    };
    reader.readAsDataURL(f);
    e.currentTarget.value = "";
  };
  const openPicker = () => fileInputRef.current?.click();
  const clearPhoto = () => setProfile((p) => ({ ...p, photo: "" }));

  // ------ activar password (vía linkWithCredential) ------
  async function handleAddPassword() {
    try {
      setAddPassMsg("");
      if (!user?.email) {
        setAddPassMsg("Tu cuenta no tiene un email válido.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setAddPassMsg("Las contraseñas no coinciden.");
        return;
      }
      const policyErr = validatePassword(newPassword);
      if (policyErr) {
        setAddPassMsg(policyErr);
        return;
      }

      setAddPassLoading(true);
      const cred = EmailAuthProvider.credential(user.email, newPassword);
      await linkWithCredential(auth.currentUser!, cred);
      setAddPassMsg(
        "Listo. Ya podés iniciar sesión también con email y contraseña."
      );
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      if (err?.code === "auth/requires-recent-login") {
        try {
          await reauthenticateWithPopup(
            auth.currentUser!,
            new GoogleAuthProvider()
          );
          await handleAddPassword();
          return;
        } catch (e: any) {
          setAddPassMsg(e?.message ?? "No se pudo reautenticar.");
        }
      } else {
        setAddPassMsg(
          err?.message ?? "No se pudo activar el acceso por contraseña."
        );
      }
    } finally {
      setAddPassLoading(false);
    }
  }

  // ------ cambiar password (reauth + updatePassword) ------
  async function handleChangePassword() {
    try {
      setChangeMsg("");
      if (!user?.email) {
        setChangeMsg("No hay email en tu cuenta.");
        return;
      }
      if (nextPass !== nextPass2) {
        setChangeMsg("Las contraseñas nuevas no coinciden.");
        return;
      }
      const policyErr = validatePassword(nextPass);
      if (policyErr) {
        setChangeMsg(policyErr);
        return;
      }

      setChangeLoading(true);

      const cred = EmailAuthProvider.credential(user.email, currPass);
      await reauthenticateWithCredential(auth.currentUser!, cred);

      await updatePassword(auth.currentUser!, nextPass);

      setChangeMsg("Contraseña actualizada correctamente.");
      setCurrPass("");
      setNextPass("");
      setNextPass2("");

      // opción A: dejá el panel abierto
      setShowChangePassForm(false); // ❌ sacalo si querés que se vea al instante

      // opción B: cerralo después de 1.2s
      setTimeout(() => setShowChangePassForm(false), 1200);

      // limpiá el banner después de 3s (opcional)
      setTimeout(() => setChangeMsg(""), 3000);
    } catch (err: any) {
      setChangeMsg(err?.message ?? "No se pudo actualizar la contraseña.");
    } finally {
      setChangeLoading(false);
    }
  }

  const saveDisabled = !authReady || !uid;

  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 p-0 rounded-full"
            aria-label="Usuario"
          >
            {profile.photo ? (
              <img
                src={profile.photo}
                alt={profile.name}
                className="inline-block h-10 w-10 rounded-full object-cover shadow-md"
              />
            ) : (
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white text-sm font-semibold shadow-md hover:bg-neutral-800">
                {initials}
              </span>
            )}
            {/* 🚨 Alerta si no hay password provider */}
            {!hasPasswordProvider && (
               <span
          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center shadow"
          title="Editar perfil - Activar acceso por contraseña"
          aria-label="Requiere contraseña"
        >
                !
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-80" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3">
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt={profile.name}
                  className="inline-block h-12 w-12 rounded-full object-cover shadow"
                />
              ) : (
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white text-lg font-semibold shadow">
                  {initials}
                </span>
              )}
              <div className="flex flex-col">
                <p className="text-sm font-medium">{profile.name}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
                <Badge variant="secondary" className="w-fit mt-1 text-xs">
                  {profile.specialty}
                </Badge>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer hover:bg-gray-100"
              >
                <Edit className="mr-2 h-4 w-4" />
                <span>Editar Perfil</span>
              </DropdownMenuItem>
            </DialogTrigger>

            {/* ← overflow para pantallas chicas */}
            <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Perfil</DialogTitle>
                <DialogDescription>
                  Actualizá tu información de perfil.
                </DialogDescription>
              </DialogHeader>

              {/* ======= TUS CAMPOS DE PERFIL (sin cambios visuales) ======= */}
              <div className="grid gap-4 py-4">
                <div className="flex items-center justify-center">
                  <div className="relative">
                    {profile.photo ? (
                      <img
                        src={profile.photo}
                        alt={profile.name}
                        className="h-20 w-20 rounded-full object-cover shadow"
                      />
                    ) : (
                      <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 text-white text-2xl font-semibold shadow">
                        {initials}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={openPicker}
                      className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-neutral-900 text-white grid place-items-center shadow ring-2 ring-neutral-800 hover:bg-neutral-800"
                      aria-label="Cambiar foto de perfil"
                      title="Cambiar foto"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onPickImage}
                      className="hidden"
                    />
                  </div>
                </div>

                {profile.photo && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={clearPhoto}
                    >
                      Quitar foto
                    </Button>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="specialty">Especialidad</Label>
                  <Input
                    id="specialty"
                    value={profile.specialty}
                    onChange={(e) =>
                      setProfile({ ...profile, specialty: e.target.value })
                    }
                    placeholder="Especialidad"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="institution">Institución</Label>
                  <Input
                    id="institution"
                    value={profile.institution}
                    onChange={(e) =>
                      setProfile({ ...profile, institution: e.target.value })
                    }
                    placeholder="Institución"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                    rows={3}
                    placeholder="Perfil médico"
                  />
                </div>
              </div>

              {/* ======= Sección CONTRASEÑAS ======= */}
              {/* 1) Activar contraseña si NO existe provider password */}
              {!hasPasswordProvider && (
                <div className="mt-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">
                      Activar acceso por contraseña
                    </h4>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowAddPassForm((v) => !v)}
                    >
                      {showAddPassForm ? "Ocultar" : "Definir contraseña"}
                    </Button>
                  </div>

                  {showAddPassForm && (
                    <div className="mt-3 space-y-2">
                      <div className="grid gap-2">
                        <Label htmlFor="new-pass">Nueva contraseña</Label>
                        <Input
                          id="new-pass"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={`Mínimo ${PASSWORD_POLICY.minLen} caracteres`}
                          autoComplete="new-password"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="confirm-pass">
                          Confirmar contraseña
                        </Label>
                        <Input
                          id="confirm-pass"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repetí la contraseña"
                          autoComplete="new-password"
                        />
                      </div>

                      {addPassMsg && (
                        <p
                          className={`text-sm ${
                            addPassMsg.startsWith("Listo")
                              ? "text-emerald-600"
                              : "text-destructive"
                          }`}
                        >
                          {addPassMsg}
                        </p>
                      )}

                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddPassword}
                          disabled={addPassLoading}
                        >
                          {addPassLoading
                            ? "Guardando..."
                            : "Guardar contraseña"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2) Cambiar contraseña si YA existe provider password */}
              {hasPasswordProvider && (
                <div className="mt-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Cambiar contraseña</h4>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowChangePassForm((v) => !v)}
                    >
                      {showChangePassForm ? "Ocultar" : "Cambiar"}
                    </Button>
                  </div>

                  {/* ✅ Mensaje siempre visible aunque cierres el bloque */}
                  {changeMsg && (
                    <p
                      className={`mt-3 rounded border px-3 py-2 text-sm ${
                        changeMsg.includes("correctamente")
                          ? "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-destructive/40 text-destructive bg-destructive/10"
                      }`}
                    >
                      {changeMsg}
                    </p>
                  )}

                  {showChangePassForm && (
                    <div className="mt-3 space-y-2">
                      <div className="grid gap-2">
                        <Label htmlFor="curr-pass">Contraseña actual</Label>
                        <Input
                          id="curr-pass"
                          type="password"
                          value={currPass}
                          onChange={(e) => setCurrPass(e.target.value)}
                          autoComplete="current-password"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="next-pass">Nueva contraseña</Label>
                        <Input
                          id="next-pass"
                          type="password"
                          value={nextPass}
                          onChange={(e) => setNextPass(e.target.value)}
                          placeholder={`Mínimo ${PASSWORD_POLICY.minLen} caracteres`}
                          autoComplete="new-password"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="next-pass2">Confirmar contraseña</Label>
                        <Input
                          id="next-pass2"
                          type="password"
                          value={nextPass2}
                          onChange={(e) => setNextPass2(e.target.value)}
                          placeholder="Repetí la contraseña"
                          autoComplete="new-password"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={handleChangePassword}
                          disabled={changeLoading}
                        >
                          {changeLoading
                            ? "Guardando..."
                            : "Guardar nueva contraseña"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* acciones del diálogo */}
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditingProfile(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveProfile} disabled={saveDisabled}>
                  Guardar
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {!isAdminLoading && isAdmin && (
            <DropdownMenuItem className="cursor-pointer hover:bg-gray-100">
              <GoToAdminLink />
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer hover:bg-gray-100"
          >
            <LogOut className="mr-2 h-4 w-4 text-red-500" />
            <span className="text-red-500">Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
