// components/ui/user-profile.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useIsAdminFromUsers } from "@/hooks/useIsAdminFromUsers";

import { GoToAdminLink } from "./UserLinks"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, LogOut, Camera } from "lucide-react"

import { db, auth } from "@/lib/firebase" // o "@/lib/firrebase" si tu archivo se llama así
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

type UserProfileProps = {
  user?: {
    uid?: string
    displayName?: string | null
    email?: string | null
    photoURL?: string | null
  } | null
  handleLogout?: () => void
}


const initialsFrom = (name: string) =>
  (name || "U").trim().split(/\s+/).map(n => n[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "U"

const defaultProfile = {
  name: "Usuario",
  email: "sin-email",
  specialty: "Especialidad",
  institution: "Institución",
  bio: "Perfil médico.",
  photo: "" as string,
}

async function downscaleDataURL(dataUrl: string, maxSide = 512, quality = 0.9): Promise<string> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl
  })
  const s = Math.min(1, maxSide / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * s))
  const h = Math.max(1, Math.round(img.height * s))
  const c = document.createElement("canvas"); c.width = w; c.height = h
  c.getContext("2d")!.drawImage(img, 0, 0, w, h)
  return c.toDataURL("image/jpeg", quality)
}

export function UserProfile({ user, handleLogout }: UserProfileProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profile, setProfile] = useState({ ...defaultProfile })
  const [uid, setUid] = useState<string | null>(null)          // ← NUEVO: uid real de Auth
  const [authReady, setAuthReady] = useState(false)            // ← NUEVO: evita leer antes de tiempo
  const initials = initialsFrom(profile.name)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isAdmin, loading: isAdminLoading } = useIsAdminFromUsers();

  // Esperar a que Firebase Auth esté listo y obtener UID
  useEffect(() => {
    const stop = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null)
      setAuthReady(true)
    })
    return () => stop()
  }, [])

  // Cargar perfil desde Firestore SOLO cuando hay uid y authReady
  useEffect(() => {
    if (!authReady || !uid) return
    ;(async () => {
      try {
        const ref = doc(db, "profiles", uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          setProfile(snap.data() as typeof defaultProfile)
        } else {
          // inicial con datos del proveedor
          setProfile({
            ...defaultProfile,
            name: user?.displayName || defaultProfile.name,
            email: user?.email || defaultProfile.email,
            photo: user?.photoURL || "",
          })
        }
      } catch (e) {
        console.error("Error leyendo Firestore:", e)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, uid])

  const handleSaveProfile = async () => {
    if (!uid) { alert("No hay usuario autenticado"); return }

    let photo = profile.photo
    if (photo && photo.length > 900_000) { // defensivo vs límite 1MB
      try { photo = await downscaleDataURL(photo, 512, 0.85) } catch {}
    }

    const ref = doc(db, "profiles", uid)
    const dataToSave = {
      name: profile.name,
      email: profile.email,
      specialty: profile.specialty,
      institution: profile.institution,
      bio: profile.bio,
      photo,
      updatedAt: serverTimestamp(),
    }

    try {
      await setDoc(ref, dataToSave, { merge: true })
      setIsEditingProfile(false)
    } catch (e) {
      console.error("Error guardando en Firestore:", e)
      alert("No se pudo guardar (ver consola).")
    }
  }

  const onPickImage: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0]
    if (!f || !f.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = async () => {
      const original = String(reader.result || "")
      try {
        const reduced = await downscaleDataURL(original, 512, 0.9)
        setProfile(p => ({ ...p, photo: reduced }))
      } catch { setProfile(p => ({ ...p, photo: original })) }
    }
    reader.readAsDataURL(f)
    e.currentTarget.value = ""
  }
  const openPicker = () => fileInputRef.current?.click()
  const clearPhoto = () => setProfile(p => ({ ...p, photo: "" }))

  // Bloqueá el botón Guardar hasta que Auth esté listo
  const saveDisabled = !authReady || !uid

  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 p-0 rounded-full" aria-label="Usuario">
            {profile.photo ? (
              <img src={profile.photo} alt={profile.name} className="inline-block h-10 w-10 rounded-full object-cover shadow-md" />
            ) : (
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white text-sm font-semibold shadow-md hover:bg-neutral-800">
                {initials}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-80" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3">
              {profile.photo ? (
                <img src={profile.photo} alt={profile.name} className="inline-block h-12 w-12 rounded-full object-cover shadow" />
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
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer hover:bg-gray-100">
                <Edit className="mr-2 h-4 w-4" />
                <span>Editar Perfil</span>
              </DropdownMenuItem>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Perfil</DialogTitle>
                <DialogDescription>Actualizá tu información de perfil.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="flex items-center justify-center">
                  <div className="relative">
                    {profile.photo ? (
                      <img src={profile.photo} alt={profile.name} className="h-20 w-20 rounded-full object-cover shadow" />
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
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={onPickImage} className="hidden" />
                  </div>
                </div>

                {profile.photo && (
                  <div className="flex justify-center">
                    <Button variant="outline" type="button" onClick={clearPhoto}>
                      Quitar foto
                    </Button>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="specialty">Especialidad</Label>
                  <Input id="specialty" value={profile.specialty} onChange={(e) => setProfile({ ...profile, specialty: e.target.value })} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="institution">Institución</Label>
                  <Input id="institution" value={profile.institution} onChange={(e) => setProfile({ ...profile, institution: e.target.value })} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditingProfile(false)}>Cancelar</Button>
                <Button onClick={handleSaveProfile} disabled={saveDisabled}>Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>

          {!isAdminLoading &&isAdmin && (
          <DropdownMenuItem className="cursor-pointer hover:bg-gray-100">
            <GoToAdminLink />
          </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:bg-gray-100">
            <LogOut className="mr-2 h-4 w-4 text-red-500" />
            <span className="text-red-500">Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
