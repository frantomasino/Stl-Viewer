"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { UserRole } from "@/lib/firebase"

interface UserRoleSelectorProps {
  value: UserRole
  onChange: (role: UserRole) => void
  disabled?: boolean
}

const roleColors = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  USER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  TRIAL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
}


export function UserRoleSelector({ value, onChange, disabled }: UserRoleSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-32">
        <SelectValue>
          <Badge className={roleColors[value]} variant="secondary">
            {value}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ADMIN">
          <Badge className={roleColors.ADMIN} variant="secondary">
            ADMIN
          </Badge>
        </SelectItem>
        <SelectItem value="USER">
          <Badge className={roleColors.USER} variant="secondary">
            USER
          </Badge>
        </SelectItem>
        <SelectItem value="TRIAL">
          <Badge className={roleColors.TRIAL} variant="secondary">
            TRIAL
          </Badge>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

export function UserRoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge className={roleColors[role]} variant="secondary">
      {role}
    </Badge>
  )
}
