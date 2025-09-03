 // components/ui/user-profile.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, LogOut } from "lucide-react"

type UserProfileProps = {
  user?: {
    displayName?: string | null
    email?: string | null
    photoURL?: string | null
  } | null
  handleLogout?: () => void
}

const initialsFrom = (name: string) =>
  (name || "U")
    .trim()
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "U"

export function UserProfile({ user, handleLogout }: UserProfileProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  const [profile, setProfile] = useState({
    name: "Usuario",
    email: "sin-email",
    specialty: "Especialidad",
    institution: "Institución",
    bio: "Perfil médico.",
  })

  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        name: user.displayName || prev.name,
        email: user.email || prev.email,
      }))
    }
  }, [user])

  const handleSaveProfile = () => {
    console.log("[v0] Profile saved:", profile)
    setIsEditingProfile(false)
  }

  const initials = initialsFrom(profile.name)

  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* Botón redondo NEGRO/GRIS con iniciales */}
          <Button
            variant="ghost"
            className="relative h-10 w-10 p-0 rounded-full"
            aria-label="Usuario"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white text-sm font-semibold shadow-md hover:bg-neutral-800">
              {initials}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-80" align="end" forceMount>
          {/* Cabecera */}
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white text-lg font-semibold shadow">
                {initials}
              </span>
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

          {/* Editar perfil */}
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

            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Perfil</DialogTitle>
                <DialogDescription>
                  Actualizá tu información de perfil.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {/* Vista del “avatar” como círculo oscuro con iniciales */}
                <div className="flex items-center justify-center">
                  <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 text-white text-2xl font-semibold shadow">
                    {initials}
                  </span>
                </div>

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
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditingProfile(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveProfile}>Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Cerrar sesión */}
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
  )
}
