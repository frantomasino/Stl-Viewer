"use client"

import type React from "react"

import { useState } from "react"
import { Download, Upload, Save, FolderOpen, Trash2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface STLModel {
  id: string
  name: string
  visible: boolean
  color: string
  position: [number, number, number]
  selected: boolean
  clippingEnabled: boolean
  transparency: number
  // Note: geometry and boundingBox are excluded from saved configs
}

interface SavedConfiguration {
  id: string
  name: string
  description: string
  timestamp: number
  models: Omit<STLModel, "geometry" | "boundingBox">[]
  theme: {
    isDark: boolean
    backgroundColor: string
  }
  clippingBox: {
    enabled: boolean
    min: { x: number; y: number; z: number }
    max: { x: number; y: number; z: number }
  }
  cameraPosition?: [number, number, number]
  version: string
}

interface ImportExportPanelProps {
  models: STLModel[]
  theme: { isDark: boolean; backgroundColor: string }
  clippingBox: any
  onLoadConfiguration: (config: SavedConfiguration) => void
  onError: (message: string) => void
}

export function ImportExportPanel({
  models,
  theme,
  clippingBox,
  onLoadConfiguration,
  onError,
}: ImportExportPanelProps) {
  const [savedConfigs, setSavedConfigs] = useState<SavedConfiguration[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("stl-viewer-configs")
        return saved ? JSON.parse(saved) : []
      } catch (error) {
        console.error("Error loading saved configurations:", error)
        return []
      }
    }
    return []
  })

  const [configName, setConfigName] = useState("")
  const [configDescription, setConfigDescription] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const saveConfiguration = () => {
    if (!configName.trim()) {
      onError("Please enter a configuration name")
      return
    }

    try {
      const config: SavedConfiguration = {
        id: `config-${Date.now()}`,
        name: configName.trim(),
        description: configDescription.trim(),
        timestamp: Date.now(),
        models: models.map((model) => ({
          id: model.id,
          name: model.name,
          visible: model.visible,
          color: model.color,
          position: model.position,
          selected: model.selected,
          clippingEnabled: model.clippingEnabled,
          transparency: model.transparency,
        })),
        theme: {
          isDark: theme.isDark,
          backgroundColor: theme.backgroundColor,
        },
        clippingBox: {
          enabled: clippingBox.enabled,
          min: {
            x: clippingBox.min?.x || 0,
            y: clippingBox.min?.y || 0,
            z: clippingBox.min?.z || 0,
          },
          max: {
            x: clippingBox.max?.x || 0,
            y: clippingBox.max?.y || 0,
            z: clippingBox.max?.z || 0,
          },
        },
        version: "1.0.0",
      }

      const updatedConfigs = [...savedConfigs, config]
      setSavedConfigs(updatedConfigs)
      localStorage.setItem("stl-viewer-configs", JSON.stringify(updatedConfigs))

      setConfigName("")
      setConfigDescription("")
      setIsDialogOpen(false)

      onError(`Configuration "${config.name}" saved successfully!`)
    } catch (error) {
      onError("Failed to save configuration")
      console.error("Save error:", error)
    }
  }

  const loadConfiguration = (config: SavedConfiguration) => {
    try {
      onLoadConfiguration(config)
      onError(`Configuration "${config.name}" loaded successfully!`)
    } catch (error) {
      onError("Failed to load configuration")
      console.error("Load error:", error)
    }
  }

  const deleteConfiguration = (configId: string) => {
    try {
      const updatedConfigs = savedConfigs.filter((config) => config.id !== configId)
      setSavedConfigs(updatedConfigs)
      localStorage.setItem("stl-viewer-configs", JSON.stringify(updatedConfigs))
      onError("Configuration deleted")
    } catch (error) {
      onError("Failed to delete configuration")
      console.error("Delete error:", error)
    }
  }

  const exportConfiguration = (config: SavedConfiguration) => {
    try {
      const dataStr = JSON.stringify(config, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement("a")
      link.href = url
      link.download = `${config.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      onError("Configuration exported successfully!")
    } catch (error) {
      onError("Failed to export configuration")
      console.error("Export error:", error)
    }
  }

  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string) as SavedConfiguration

        // Validate configuration structure
        if (!config.name || !config.models || !config.theme) {
          throw new Error("Invalid configuration file format")
        }

        // Add imported config to saved configs
        const importedConfig = {
          ...config,
          id: `imported-${Date.now()}`,
          timestamp: Date.now(),
        }

        const updatedConfigs = [...savedConfigs, importedConfig]
        setSavedConfigs(updatedConfigs)
        localStorage.setItem("stl-viewer-configs", JSON.stringify(updatedConfigs))

        onError(`Configuration "${config.name}" imported successfully!`)
      } catch (error) {
        onError("Failed to import configuration - invalid file format")
        console.error("Import error:", error)
      }
    }
    reader.readAsText(file)

    // Reset input
    event.target.value = ""
  }

  const exportCurrentScene = () => {
    try {
      const config: SavedConfiguration = {
        id: `export-${Date.now()}`,
        name: `Scene Export ${new Date().toLocaleDateString()}`,
        description: "Exported scene configuration",
        timestamp: Date.now(),
        models: models.map((model) => ({
          id: model.id,
          name: model.name,
          visible: model.visible,
          color: model.color,
          position: model.position,
          selected: model.selected,
          clippingEnabled: model.clippingEnabled,
          transparency: model.transparency,
        })),
        theme: {
          isDark: theme.isDark,
          backgroundColor: theme.backgroundColor,
        },
        clippingBox: {
          enabled: clippingBox.enabled,
          min: {
            x: clippingBox.min?.x || 0,
            y: clippingBox.min?.y || 0,
            z: clippingBox.min?.z || 0,
          },
          max: {
            x: clippingBox.max?.x || 0,
            y: clippingBox.max?.y || 0,
            z: clippingBox.max?.z || 0,
          },
        },
        version: "1.0.0",
      }

      exportConfiguration(config)
    } catch (error) {
      onError("Failed to export current scene")
      console.error("Export current scene error:", error)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={exportCurrentScene} className="flex-1 bg-transparent">
          <Download className="w-4 h-4 mr-2" />
          Export Scene
        </Button>

        <label className="flex-1">
          <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
            <span>
              <Upload className="w-4 h-4 mr-2" />
              Import Scene
            </span>
          </Button>
          <input type="file" accept=".json" onChange={importConfiguration} className="hidden" />
        </label>
      </div>

      <Separator />

      {/* Save Current Configuration */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="default" size="sm" className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save Current Setup
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Configuration</DialogTitle>
            <DialogDescription>
              Save your current model setup, theme, and clipping settings for later use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="config-name">Configuration Name</Label>
              <Input
                id="config-name"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder="My Awesome Setup"
              />
            </div>
            <div>
              <Label htmlFor="config-description">Description (Optional)</Label>
              <Input
                id="config-description"
                value={configDescription}
                onChange={(e) => setConfigDescription(e.target.value)}
                placeholder="Brief description of this configuration..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveConfiguration}>Save Configuration</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved Configurations */}
      {savedConfigs.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className={`font-medium mb-3 ${theme.isDark ? "text-white" : "text-gray-900"}`}>
              Saved Configurations ({savedConfigs.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {savedConfigs.map((config) => (
                <Card key={config.id} className={`p-3 ${theme.isDark ? "bg-gray-700 border-gray-600" : ""}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h5 className={`font-medium text-sm truncate ${theme.isDark ? "text-white" : "text-gray-900"}`}>
                        {config.name}
                      </h5>
                      {config.description && (
                        <p className={`text-xs mt-1 ${theme.isDark ? "text-gray-400" : "text-gray-600"}`}>
                          {config.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => exportConfiguration(config)}
                        className="h-6 w-6 p-0"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{config.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteConfiguration(config.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {config.models.length} models
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {config.theme.isDark ? "Dark" : "Light"}
                      </Badge>
                    </div>
                    <div className={`flex items-center text-xs ${theme.isDark ? "text-gray-400" : "text-gray-500"}`}>
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(config.timestamp)}
                    </div>
                  </div>

                  <Button variant="outline" size="sm" onClick={() => loadConfiguration(config)} className="w-full">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Load Configuration
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
