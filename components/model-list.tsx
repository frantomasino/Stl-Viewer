"use client"
import { Trash2, Focus, Edit3, Palette, Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"

interface STLModel {
  id: string
  name: string
  visible: boolean
  color: string
  position: [number, number, number]
  geometry: any
  selected: boolean
  clippingEnabled: boolean
  transparency: number
  boundingBox: any
}

interface ModelListProps {
  models: STLModel[]
  selectedModel: string | null
  editingName: string | null
  theme: { isDark: boolean }
  onToggleVisibility: (modelId: string) => void
  onUpdateColor: (modelId: string, color: string) => void
  onUpdateTransparency: (modelId: string, transparency: number) => void
  onUpdateName: (modelId: string, newName: string) => void
  onSelectModel: (modelId: string) => void
  onToggleClipping: (modelId: string) => void
  onDeleteModel: (modelId: string) => void
  onFocusModel: (modelId: string) => void
  onSetEditingName: (modelId: string | null) => void
}

export function ModelList({
  models,
  selectedModel,
  editingName,
  theme,
  onToggleVisibility,
  onUpdateColor,
  onUpdateTransparency,
  onUpdateName,
  onSelectModel,
  onToggleClipping,
  onDeleteModel,
  onFocusModel,
  onSetEditingName,
}: ModelListProps) {
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"]

  return (
    <div className="space-y-2">
      {models?.map((model) => (
        <Card
          key={model.id}
          className={`p-3 ${model.selected ? "ring-2 ring-blue-500" : ""} ${
            theme?.isDark ? "bg-gray-700 border-gray-600" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 flex-1">
              <Checkbox checked={model.visible} onCheckedChange={() => onToggleVisibility(model.id)} />
              {editingName === model.id ? (
                <Input
                  defaultValue={model.name}
                  className="text-sm h-6"
                  onBlur={(e) => onUpdateName(model.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onUpdateName(model.id, e.currentTarget.value)
                    }
                  }}
                  autoFocus
                />
              ) : (
                <span
                  className={`text-sm font-medium truncate cursor-pointer hover:text-blue-600 ${
                    theme?.isDark ? "text-gray-200" : ""
                  }`}
                  onClick={() => onSelectModel(model.id)}
                >
                  {model.name}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" onClick={() => onSetEditingName(model.id)}>
                <Edit3 className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onFocusModel(model.id)}>
                <Focus className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDeleteModel(model.id)}>
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {/* Color Picker */}
            <div className="flex items-center space-x-2">
              <Palette className="w-4 h-4 text-gray-500" />
              <div className="flex space-x-1">
                {colors.slice(0, 4).map((color) => (
                  <button
                    key={color}
                    className={`w-5 h-5 rounded border-2 ${
                      model.color === color ? "border-gray-900" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => onUpdateColor(model.id, color)}
                  />
                ))}
              </div>
            </div>

            {/* Transparency Control */}
            <div className="space-y-1">
              <div
                className={`flex items-center justify-between text-xs ${
                  theme?.isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <span>Transparency</span>
                <span>{Math.round(model.transparency * 100)}%</span>
              </div>
              <Slider
                value={[model.transparency]}
                onValueChange={([value]) => onUpdateTransparency(model.id, value)}
                min={0.1}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Clipping Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox checked={model.clippingEnabled} onCheckedChange={() => onToggleClipping(model.id)} />
              <Scissors className="w-4 h-4 text-gray-500" />
              <span className={`text-xs ${theme?.isDark ? "text-gray-400" : "text-gray-600"}`}>Enable Clipping</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
