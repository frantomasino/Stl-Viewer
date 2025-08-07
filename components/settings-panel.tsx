"use client"

import { Settings, Sun, Moon, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface Theme {
  isDark: boolean
  backgroundColor: string
}

interface SettingsPanelProps {
  theme: Theme
  onToggleTheme: () => void
  onUpdateBackgroundColor: (color: string) => void
}

export function SettingsPanel({ theme, onToggleTheme, onUpdateBackgroundColor }: SettingsPanelProps) {
  const backgroundColors = ["#667eea", "#764ba2", "#2d3748", "#1a202c", "#2b6cb0", "#065f46", "#7c2d12", "#581c87"]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="p-3 space-y-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Theme</Label>
            <Button variant="outline" size="sm" onClick={onToggleTheme}>
              {theme.isDark ? (
                <>
                  <Sun className="w-4 h-4 mr-2" />
                  Light
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 mr-2" />
                  Dark
                </>
              )}
            </Button>
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center">
              <Palette className="w-4 h-4 mr-2" />
              Background Color
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {backgroundColors.map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                    theme.backgroundColor === color ? "border-gray-900 ring-2 ring-blue-500" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => onUpdateBackgroundColor(color)}
                />
              ))}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
