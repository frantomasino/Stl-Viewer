"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, Grid, Html } from "@react-three/drei"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader"
import { type BufferGeometry, Vector3, Box3, Plane, type Group, type Mesh } from "three"
import {
  Upload,
  RotateCcw,
  Palette,
  Scissors,
  Settings,
  Menu,
  Trash2,
  Focus,
  Edit3,
  Sun,
  Moon,
  Map,
  MapPinOffIcon as MapOff,
  AlertTriangle,
  X,
  Save,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImportExportPanel } from "../components/import-export-panel"

interface STLModel {
  id: string
  name: string
  visible: boolean
  color: string
  position: [number, number, number]
  geometry: BufferGeometry | null
  selected: boolean
  clippingEnabled: boolean
  transparency: number
  boundingBox: Box3 | null
}

interface ClippingBox {
  enabled: boolean
  min: Vector3
  max: Vector3
}

interface Theme {
  isDark: boolean
  backgroundColor: string
}

interface ErrorInfo {
  id: string
  message: string
  timestamp: number
}

// Error Boundary Component
function ErrorBoundary({ children, onError }: { children: React.ReactNode; onError: (error: string) => void }) {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      onError(`Runtime Error: ${event.message}`)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      onError(`Promise Rejection: ${event.reason}`)
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [onError])

  return <>{children}</>
}

// Fixed Minimap component (positioned relative to screen, not 3D scene)
function FixedMinimap({ showMinimap }: { showMinimap: boolean }) {
  const { camera } = useThree()
  const groupRef = useRef<Group>(null)

  useFrame(() => {
    if (groupRef.current && camera) {
      try {
        groupRef.current.quaternion.copy(camera.quaternion)
      } catch (error) {
        console.error("Minimap update error:", error)
      }
    }
  })

  if (!showMinimap) return null

  return (
    <Html
      position={[0, 0, 0]}
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 border border-white/30">
        <Canvas style={{ width: 120, height: 120 }}>
          <ambientLight intensity={0.6} />
          <group ref={groupRef}>
            <axesHelper args={[2.5]} />
            <Html position={[3, 0, 0]} style={{ color: "#ff4444", fontSize: "16px", fontWeight: "bold" }}>
              X
            </Html>
            <Html position={[0, 3, 0]} style={{ color: "#44ff44", fontSize: "16px", fontWeight: "bold" }}>
              Y
            </Html>
            <Html position={[0, 0, 3]} style={{ color: "#4444ff", fontSize: "16px", fontWeight: "bold" }}>
              Z
            </Html>
          </group>
        </Canvas>
      </div>
    </Html>
  )
}

// Interactive Clipping Box with better error handling
function InteractiveClippingBox({
  clippingBox,
  onUpdate,
  models,
}: {
  clippingBox: ClippingBox
  onUpdate: (box: ClippingBox) => void
  models: STLModel[]
}) {
  if (!clippingBox?.enabled) return null

  try {
    const clippingModels = models?.filter((m) => m?.clippingEnabled && m?.visible && m?.geometry) || []
    if (clippingModels.length === 0) return null

    if (!clippingBox.min || !clippingBox.max) return null

    const size = new Vector3().subVectors(clippingBox.max, clippingBox.min)
    const center = new Vector3().addVectors(clippingBox.min, clippingBox.max).multiplyScalar(0.5)

    if (size.x <= 0 || size.y <= 0 || size.z <= 0) {
      return null
    }

    return (
      <group>
        <mesh position={center}>
          <boxGeometry args={[Math.abs(size.x), Math.abs(size.y), Math.abs(size.z)]} />
          <meshBasicMaterial color="yellow" wireframe transparent opacity={0.8} />
        </mesh>

        {[
          { pos: [clippingBox.max.x, center.y, center.z], color: "red" },
          { pos: [clippingBox.min.x, center.y, center.z], color: "red" },
          { pos: [center.x, clippingBox.max.y, center.z], color: "green" },
          { pos: [center.x, clippingBox.min.y, center.z], color: "green" },
          { pos: [center.x, center.y, clippingBox.max.z], color: "blue" },
          { pos: [center.x, center.y, clippingBox.min.z], color: "blue" },
        ].map((handle, index) => (
          <mesh key={index} position={handle.pos as [number, number, number]}>
            <sphereGeometry args={[0.4]} />
            <meshBasicMaterial color={handle.color} />
          </mesh>
        ))}
      </group>
    )
  } catch (error) {
    console.error("Error rendering clipping box:", error)
    return null
  }
}

// Optimized STL Model Component with proper ground orientation
function STLModelMesh({ model, clippingBox }: { model: STLModel; clippingBox: ClippingBox }) {
  const meshRef = useRef<Mesh>(null)

  if (!model?.visible || !model?.geometry) return null

  let clippingPlanes: Plane[] = []

  try {
    if (model.clippingEnabled && clippingBox?.enabled && clippingBox.min && clippingBox.max) {
      clippingPlanes = [
        new Plane(new Vector3(1, 0, 0), -clippingBox.min.x),
        new Plane(new Vector3(-1, 0, 0), clippingBox.max.x),
        new Plane(new Vector3(0, 1, 0), -clippingBox.min.y),
        new Plane(new Vector3(0, -1, 0), clippingBox.max.y),
        new Plane(new Vector3(0, 0, 1), -clippingBox.min.z),
        new Plane(new Vector3(0, 0, -1), clippingBox.max.z),
      ]
    }
  } catch (error) {
    console.error("Error creating clipping planes:", error)
    clippingPlanes = []
  }

  return (
    <mesh
      ref={meshRef}
      position={model.position}
      geometry={model.geometry}
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      <meshStandardMaterial
        color={model.color}
        clippingPlanes={clippingPlanes}
        clipShadows={true}
        side={2}
        transparent={model.transparency < 1}
        opacity={model.transparency}
      />
      {model.selected && <meshBasicMaterial color={model.color} wireframe={true} transparent={true} opacity={0.3} />}
    </mesh>
  )
}

// Camera controller
function CameraController({ focusTarget }: { focusTarget: Vector3 | null }) {
  const { camera, controls } = useThree()

  useEffect(() => {
    if (focusTarget && controls) {
      try {
        controls.target.copy(focusTarget)
        controls.update()
      } catch (error) {
        console.error("Error updating camera controls:", error)
      }
    }
  }, [focusTarget, controls, camera])

  return null
}

// Enhanced 3D Scene with larger ground grid
function Scene({
  models,
  clippingBox,
  focusTarget,
  controlsRef,
  theme,
  onClippingBoxUpdate,
  showMinimap,
}: {
  models: STLModel[]
  clippingBox: ClippingBox
  focusTarget: Vector3 | null
  controlsRef: React.MutableRefObject<any>
  theme: Theme
  onClippingBoxUpdate: (box: ClippingBox) => void
  showMinimap: boolean
}) {
  return (
    <>
      <ambientLight intensity={theme?.isDark ? 0.3 : 0.4} />
      <directionalLight position={[20, 20, 10]} intensity={theme?.isDark ? 0.8 : 1} />
      <pointLight position={[-20, -20, -10]} intensity={theme?.isDark ? 0.4 : 0.5} />

      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        dampingFactor={0.08}
        enableDamping={true}
        maxDistance={200}
        minDistance={3}
        rotateSpeed={0.6}
        panSpeed={1.2}
        zoomSpeed={1.2}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        minAzimuthAngle={Number.NEGATIVE_INFINITY}
        maxAzimuthAngle={Number.POSITIVE_INFINITY}
      />

      {/* Enhanced ground grid - much larger and more visible */}
      <Grid
        args={[100, 100]} // Increased from 40x40 to 100x100
        position={[0, 0, 0]} // Moved to Y=0 (ground level)
        cellSize={1} // Smaller cells for more detail
        cellThickness={0.6}
        cellColor={theme?.isDark ? "#4b5563" : "#6b7280"}
        sectionSize={5} // Every 5th line is thicker
        sectionThickness={1.2}
        sectionColor={theme?.isDark ? "#374151" : "#374151"}
        fadeDistance={80} // Increased fade distance
        fadeStrength={1}
      />

      <Environment preset={theme?.isDark ? "night" : "studio"} />

      <CameraController focusTarget={focusTarget} />
      <FixedMinimap showMinimap={showMinimap} />
      <InteractiveClippingBox clippingBox={clippingBox} onUpdate={onClippingBoxUpdate} models={models} />

      {models?.map((model) => (
        <STLModelMesh key={model.id} model={model} clippingBox={clippingBox} />
      ))}
    </>
  )
}

export default function STLViewer() {
  const [models, setModels] = useState<STLModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [clippingBox, setClippingBox] = useState<ClippingBox>({
    enabled: false,
    min: new Vector3(-5, -5, -5),
    max: new Vector3(5, 5, 5),
  })
  const [isDragging, setIsDragging] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [focusTarget, setFocusTarget] = useState<Vector3 | null>(null)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [showMinimap, setShowMinimap] = useState(true)
  const [theme, setTheme] = useState<Theme>({ isDark: false, backgroundColor: "#667eea" })
  const [errors, setErrors] = useState<ErrorInfo[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const controlsRef = useRef<any>(null)
  const [showImportExport, setShowImportExport] = useState(false)

  // Error handling function
  const addError = useCallback((message: string) => {
    const newError: ErrorInfo = {
      id: `error-${Date.now()}`,
      message,
      timestamp: Date.now(),
    }
    setErrors((prev) => [...prev, newError])

    // Auto-remove error after 10 seconds
    setTimeout(() => {
      setErrors((prev) => prev.filter((error) => error.id !== newError.id))
    }, 10000)
  }, [])

  const removeError = useCallback((errorId: string) => {
    setErrors((prev) => prev.filter((error) => error.id !== errorId))
  }, [])

  const updateBackgroundColor = (color: string) => {
    if (!color) return
    try {
      setTheme((prev) => ({ ...prev, backgroundColor: color }))
    } catch (error) {
      addError("Error updating background color")
    }
  }

  const loadConfiguration = useCallback(
    (config: any) => {
      try {
        // Clear existing models first
        setModels([])
        setSelectedModel(null)
        setClippingBox({
          enabled: false,
          min: new Vector3(-5, -5, -5),
          max: new Vector3(5, 5, 5),
        })

        // Apply theme settings
        setTheme({
          isDark: config.theme.isDark,
          backgroundColor: config.theme.backgroundColor,
        })

        // Apply clipping box settings
        if (config.clippingBox) {
          setClippingBox({
            enabled: config.clippingBox.enabled,
            min: new Vector3(config.clippingBox.min.x, config.clippingBox.min.y, config.clippingBox.min.z),
            max: new Vector3(config.clippingBox.max.x, config.clippingBox.max.y, config.clippingBox.max.z),
          })
        }

        // Note: Models will need to be re-uploaded as we don't save geometry data
        addError(`Configuration loaded! Please re-upload your STL files to restore the 3D models.`)
      } catch (error) {
        addError("Error loading configuration")
        console.error("Load configuration error:", error)
      }
    },
    [addError],
  )

  // Enhanced file upload with proper model orientation
  const handleFileUpload = useCallback(
    (files: FileList | null) => {
      if (!files) return

      Array.from(files).forEach((file, index) => {
        if (file?.name?.toLowerCase().endsWith(".stl")) {
          const reader = new FileReader()
          reader.onload = (e) => {
            if (e.target?.result) {
              try {
                const loader = new STLLoader()
                const geometry = loader.parse(e.target.result as ArrayBuffer)

                if (!geometry) {
                  addError(`Failed to parse STL file: ${file.name}`)
                  return
                }

                geometry.computeBoundingBox()
                geometry.computeVertexNormals()

                if (!geometry.boundingBox) {
                  addError(`No bounding box found for: ${file.name}`)
                  return
                }

                const boundingBox = geometry.boundingBox
                const center = boundingBox.getCenter(new Vector3())
                const size = boundingBox.getSize(new Vector3())

                // Center the geometry
                geometry.translate(-center.x, -center.y, -center.z)

                geometry.rotateX(-Math.PI / 2)

                // Recalcular bounding box tras la rotación
                geometry.computeBoundingBox()
                geometry.computeVertexNormals()

                // Volver a centrar en base al nuevo bounding box
                if (geometry.boundingBox) {
                  const rotatedCenter = geometry.boundingBox.getCenter(new Vector3())
                  const rotatedMinY = geometry.boundingBox.min.y
                  geometry.translate(-rotatedCenter.x, -rotatedCenter.y, -rotatedCenter.z)
                  geometry.translate(0, -rotatedMinY, 0)
                }

                // Scale if too large
                const maxSize = Math.max(size.x, size.y, size.z)
                if (maxSize > 15) {
                  const scale = 15 / maxSize
                  geometry.scale(scale, scale, scale)
                }

                const positionAttribute = geometry.attributes.position
                if (positionAttribute && positionAttribute.count > 50000) {
                  addError(`Large model detected: ${file.name} (${positionAttribute.count} vertices)`)
                }

                const newModel: STLModel = {
                  id: `model-${Date.now()}-${index}`,
                  name: file.name,
                  visible: true,
                  color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                  position: [index * 10, 0, 0], // Increased spacing
                  geometry: geometry,
                  selected: false,
                  clippingEnabled: false,
                  transparency: 1,
                  boundingBox: new Box3().setFromBufferAttribute(geometry.attributes.position),
                }
                setModels((prev) => [...prev, newModel])
              } catch (error) {
                const errorMessage = `Error loading ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`
                addError(errorMessage)
                console.error("STL parsing error:", error)
              }
            }
          }
          reader.readAsArrayBuffer(file)
        }
      })
    },
    [addError],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      try {
        if (e.dataTransfer?.files) {
          handleFileUpload(e.dataTransfer.files)
        }
      } catch (error) {
        addError("Error handling file drop")
      }
    },
    [handleFileUpload, addError],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const toggleModelVisibility = (modelId: string) => {
    if (!modelId) return
    try {
      setModels((prev) => prev.map((model) => (model.id === modelId ? { ...model, visible: !model.visible } : model)))
    } catch (error) {
      addError("Error toggling model visibility")
    }
  }

  const updateModelColor = (modelId: string, color: string) => {
    if (!modelId || !color) return
    try {
      setModels((prev) => prev.map((model) => (model.id === modelId ? { ...model, color } : model)))
    } catch (error) {
      addError("Error updating model color")
    }
  }

  const updateModelTransparency = (modelId: string, transparency: number) => {
    if (!modelId || transparency === undefined) return
    try {
      setModels((prev) => prev.map((model) => (model.id === modelId ? { ...model, transparency } : model)))
    } catch (error) {
      addError("Error updating model transparency")
    }
  }

  const updateModelName = (modelId: string, newName: string) => {
    if (!modelId || !newName) return
    try {
      setModels((prev) => prev.map((model) => (model.id === modelId ? { ...model, name: newName } : model)))
      setEditingName(null)
    } catch (error) {
      addError("Error updating model name")
    }
  }

  const selectModel = (modelId: string) => {
    if (!modelId) return
    try {
      setSelectedModel(modelId)
      setModels((prev) => prev.map((model) => ({ ...model, selected: model.id === modelId })))
    } catch (error) {
      addError("Error selecting model")
    }
  }

  const toggleModelClipping = (modelId: string) => {
    if (!modelId) return
    try {
      setModels((prev) =>
        prev.map((model) => (model.id === modelId ? { ...model, clippingEnabled: !model.clippingEnabled } : model)),
      )
    } catch (error) {
      addError("Error toggling model clipping")
    }
  }

  const deleteModel = (modelId: string) => {
    if (!modelId) return
    try {
      setModels((prev) => prev.filter((model) => model.id !== modelId))
      if (selectedModel === modelId) {
        setSelectedModel(null)
      }
    } catch (error) {
      addError("Error deleting model")
    }
  }

  const focusOnModel = (modelId: string) => {
    if (!modelId) return
    try {
      const model = models.find((m) => m.id === modelId)
      if (model?.geometry) {
        const box = new Box3().setFromBufferAttribute(model.geometry.attributes.position)
        const center = box.getCenter(new Vector3())
        center.add(new Vector3(...model.position))
        setFocusTarget(center)
      }
    } catch (error) {
      addError("Error focusing on model")
    }
  }

  const resetView = () => {
    try {
      if (controlsRef.current) {
        controlsRef.current.reset()
        setFocusTarget(null)
      }
    } catch (error) {
      addError("Error resetting view")
    }
  }

  const toggleClippingBox = () => {
    try {
      if (!clippingBox.enabled) {
        const clippingModels = models.filter((m) => m?.clippingEnabled && m?.visible && m?.geometry)
        if (clippingModels.length > 0) {
          const combinedBox = new Box3()

          clippingModels.forEach((model) => {
            if (model?.geometry?.attributes?.position) {
              try {
                const modelBox = new Box3().setFromBufferAttribute(model.geometry.attributes.position)
                modelBox.translate(new Vector3(...model.position))
                combinedBox.union(modelBox)
              } catch (error) {
                console.error("Error processing model for clipping box:", error)
              }
            }
          })

          if (!combinedBox.isEmpty()) {
            const size = combinedBox.getSize(new Vector3())
            const center = combinedBox.getCenter(new Vector3())
            const padding = 2

            setClippingBox({
              enabled: true,
              min: new Vector3(
                center.x - size.x / 2 - padding,
                center.y - size.y / 2 - padding,
                center.z - size.z / 2 - padding,
              ),
              max: new Vector3(
                center.x + size.x / 2 + padding,
                center.y + size.y / 2 + padding,
                center.z + size.z / 2 + padding,
              ),
            })
          }
        } else {
          addError("Please enable clipping on at least one model first")
        }
      } else {
        setClippingBox((prev) => ({ ...prev, enabled: false }))
      }
    } catch (error) {
      addError("Error toggling clipping box")
    }
  }

  const toggleTheme = () => {
    try {
      setTheme((prev) => ({ ...prev, isDark: !prev.isDark }))
    } catch (error) {
      addError("Error toggling theme")
    }
  }

  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"]
  const backgroundColors = ["#667eea", "#764ba2", "#2d3748", "#1a202c", "#2b6cb0", "#065f46", "#7c2d12", "#581c87"]

  const canvasStyle = {
    background: theme?.isDark
      ? `linear-gradient(135deg, ${theme.backgroundColor} 0%, #1a202c 100%)`
      : `linear-gradient(135deg, ${theme.backgroundColor} 0%, #764ba2 100%)`,
  }

  return (
    <ErrorBoundary onError={addError}>
      <div className={`flex h-screen ${theme?.isDark ? "bg-gray-900" : "bg-gray-100"}`}>
        {/* Error Banner */}
        {errors.length > 0 && (
          <div className="fixed top-0 left-0 right-0 z-50 p-4 space-y-2">
            {errors.map((error) => (
              <Alert key={error.id} variant="destructive" className="relative">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="pr-8">{error.message}</AlertDescription>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => removeError(error.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Alert>
            ))}
          </div>
        )}

        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? "block" : "hidden"} lg:block w-80 ${
            theme?.isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          } border-r flex flex-col h-full`}
        >
          {/* Header */}
          <div className={`p-4 border-b ${theme?.isDark ? "border-gray-700" : "border-gray-200"}`}>
            <div className="flex items-center justify-between mb-4">
              <h1 className={`text-xl font-bold ${theme?.isDark ? "text-white" : "text-gray-900"}`}>STL Viewer Pro</h1>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={toggleTheme}>
                  {theme?.isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowMinimap(!showMinimap)}>
                  {showMinimap ? <MapOff className="w-4 h-4" /> : <Map className="w-4 h-4" />}
                </Button>
                <Badge variant="secondary" className="text-xs">
                  Beta
                </Badge>
              </div>
            </div>

            {/* Background Color Picker */}
            <div className="mb-4">
              <Label className={`text-sm ${theme?.isDark ? "text-gray-300" : "text-gray-700"}`}>Background</Label>
              <div className="flex space-x-1 mt-1">
                {backgroundColors.map((color) => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded border-2 ${
                      theme?.backgroundColor === color ? "border-white" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => updateBackgroundColor(color)}
                  />
                ))}
              </div>
            </div>

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : theme?.isDark
                    ? "border-gray-600 hover:border-gray-500"
                    : "border-gray-300 hover:border-gray-400"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className={`w-8 h-8 mx-auto mb-2 ${theme?.isDark ? "text-gray-400" : "text-gray-400"}`} />
              <p className={`text-sm mb-2 ${theme?.isDark ? "text-gray-300" : "text-gray-600"}`}>
                Drag & drop STL files here
              </p>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                Browse Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".stl"
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              />
            </div>
          </div>

          {/* Models Panel */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold ${theme?.isDark ? "text-white" : "text-gray-900"}`}>
                  Models ({models?.length || 0})
                </h3>
                <Button variant="ghost" size="sm" onClick={resetView}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

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
                        <Checkbox checked={model.visible} onCheckedChange={() => toggleModelVisibility(model.id)} />
                        {editingName === model.id ? (
                          <Input
                            defaultValue={model.name}
                            className="text-sm h-6"
                            onBlur={(e) => updateModelName(model.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                updateModelName(model.id, e.currentTarget.value)
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span
                            className={`text-sm font-medium truncate cursor-pointer hover:text-blue-600 ${
                              theme?.isDark ? "text-gray-200" : ""
                            }`}
                            onClick={() => selectModel(model.id)}
                          >
                            {model.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingName(model.id)}>
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => focusOnModel(model.id)}>
                          <Focus className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteModel(model.id)}>
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
                              onClick={() => updateModelColor(model.id, color)}
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
                          onValueChange={([value]) => updateModelTransparency(model.id, value)}
                          min={0.1}
                          max={1}
                          step={0.1}
                          className="w-full"
                        />
                      </div>

                      {/* Clipping Toggle */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={model.clippingEnabled}
                          onCheckedChange={() => toggleModelClipping(model.id)}
                        />
                        <Scissors className="w-4 h-4 text-gray-500" />
                        <span className={`text-xs ${theme?.isDark ? "text-gray-400" : "text-gray-600"}`}>
                          Enable Clipping
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Clipping Tools */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold ${theme?.isDark ? "text-white" : "text-gray-900"}`}>
                  Interactive Clipping
                </h3>
                <Button variant="outline" size="sm" onClick={toggleClippingBox}>
                  {clippingBox?.enabled ? "Hide Box" : "Show Box"}
                </Button>
              </div>

              {clippingBox?.enabled && (
                <Card className={`p-3 ${theme?.isDark ? "bg-gray-700 border-gray-600" : ""}`}>
                  <div className="text-sm text-center">
                    <p className={`${theme?.isDark ? "text-gray-300" : "text-gray-600"}`}>
                      Interactive clipping box is active
                    </p>
                    <div className="mt-2 text-xs space-y-1">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className={theme?.isDark ? "text-gray-400" : "text-gray-500"}>X-axis handles</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className={theme?.isDark ? "text-gray-400" : "text-gray-500"}>Y-axis handles</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className={theme?.isDark ? "text-gray-400" : "text-gray-500"}>Z-axis handles</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {showImportExport && (
              <>
                <Separator />
                <div className="p-4">
                  <h3 className={`font-semibold mb-3 ${theme?.isDark ? "text-white" : "text-gray-900"}`}>
                    Import/Export
                  </h3>
                  <ImportExportPanel
                    models={models}
                    theme={theme}
                    clippingBox={clippingBox}
                    onLoadConfiguration={loadConfiguration}
                    onError={addError}
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div
            className={`p-4 border-t ${theme?.isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}
          >
            <div className="text-center">
              <p className={`text-xs mb-2 ${theme?.isDark ? "text-gray-400" : "text-gray-500"}`}>
                Upgrade to Pro for advanced features
              </p>
              <Button variant="default" size="sm" className="w-full">
                Get Pro Features
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div
            className={`${
              theme?.isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            } border-b p-4 flex items-center justify-between`}
          >
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="w-5 h-5" />
              </Button>

              <div className="hidden sm:flex items-center space-x-4">
                <Button variant="outline" size="sm" onClick={resetView}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset View
                </Button>
                <Badge variant="secondary">
                  {models?.length || 0} model{(models?.length || 0) !== 1 ? "s" : ""} loaded
                </Badge>
                {selectedModel && (
                  <Badge variant="outline">Selected: {models?.find((m) => m.id === selectedModel)?.name}</Badge>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setShowImportExport(!showImportExport)}>
                <Save className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowMinimap(!showMinimap)}>
                {showMinimap ? <MapOff className="w-4 h-4" /> : <Map className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 3D Viewer */}
          <div className="flex-1 relative">
            <Canvas
              camera={{ position: [30, 20, 30], fov: 60 }}
              style={canvasStyle}
              performance={{ min: 0.5 }}
              frameloop="demand"
              onError={(error) => addError(`Canvas Error: ${error.message}`)}
            >
              <Scene
                models={models}
                clippingBox={clippingBox}
                focusTarget={focusTarget}
                controlsRef={controlsRef}
                theme={theme}
                onClippingBoxUpdate={setClippingBox}
                showMinimap={showMinimap}
              />
            </Canvas>

            {/* Overlay Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
              <Card className={`p-2 ${theme?.isDark ? "bg-gray-800/80 border-gray-600" : "bg-white/80"}`}>
                <div className={`text-xs text-center ${theme?.isDark ? "text-gray-300" : "text-gray-500"}`}>
                  <div>Left: Rotate</div>
                  <div>Right: Pan</div>
                  <div>Scroll: Zoom</div>
                </div>
              </Card>
            </div>

            {/* Ad Space */}
            <div
              className={`absolute top-4 right-4 w-64 h-16 ${
                theme?.isDark ? "bg-gray-800/50 border-gray-600" : "bg-gray-200 border-gray-300"
              } border rounded flex items-center justify-center text-xs ${
                theme?.isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Advertisement Space
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
