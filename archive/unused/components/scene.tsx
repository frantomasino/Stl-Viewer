"use client"

import type React from "react"

import { useRef } from "react"
import { OrbitControls, Environment, Grid } from "@react-three/drei"
import { Vector3, Plane, type Mesh } from "three"

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

interface ClippingBox {
  enabled: boolean
  min: Vector3
  max: Vector3
}

interface Theme {
  isDark: boolean
  backgroundColor: string
}

// Safe clipping box component
function SafeClippingBox({
  clippingBox,
  models,
}: {
  clippingBox: ClippingBox
  models: STLModel[]
}) {
  if (!clippingBox?.enabled) return null

  try {
    const clippingModels = models?.filter((m) => m?.clippingEnabled && m?.visible && m?.geometry) || []
    if (clippingModels.length === 0) return null

    if (!clippingBox.min || !clippingBox.max) return null

    const size = new Vector3().subVectors(clippingBox.max, clippingBox.min)
    const center = new Vector3().addVectors(clippingBox.min, clippingBox.max).multiplyScalar(0.5)

    if (size.x <= 0 || size.y <= 0 || size.z <= 0) return null

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

// Safe model mesh component
function SafeModelMesh({ model, clippingBox }: { model: STLModel; clippingBox: ClippingBox }) {
  const meshRef = useRef<Mesh>(null)

  if (!model?.visible || !model?.geometry) return null

  // Simplified clipping - only create planes if absolutely necessary
  let clippingPlanes: Plane[] = []

  if (model.clippingEnabled && clippingBox?.enabled) {
    try {
      if (clippingBox.min && clippingBox.max) {
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
  }

  return (
    <mesh ref={meshRef} position={model.position} geometry={model.geometry} onClick={(e) => e.stopPropagation()}>
      <meshStandardMaterial
        color={model.color}
        clippingPlanes={clippingPlanes.length > 0 ? clippingPlanes : undefined}
        clipShadows={clippingPlanes.length > 0}
        side={2}
        transparent={model.transparency < 1}
        opacity={model.transparency}
      />
      {model.selected && <meshBasicMaterial color={model.color} wireframe transparent opacity={0.3} />}
    </mesh>
  )
}

interface SceneProps {
  models: STLModel[]
  clippingBox: ClippingBox
  focusTarget: Vector3 | null
  controlsRef: React.MutableRefObject<any>
  theme: Theme
}

export function Scene({ models, clippingBox, focusTarget, controlsRef, theme }: SceneProps) {
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

      <Grid
        args={[100, 100]}
        position={[0, 0, 0]}
        cellSize={1}
        cellThickness={0.6}
        cellColor={theme?.isDark ? "#4b5563" : "#6b7280"}
        sectionSize={5}
        sectionThickness={1.2}
        sectionColor={theme?.isDark ? "#374151" : "#374151"}
        fadeDistance={80}
        fadeStrength={1}
      />

      <Environment preset={theme?.isDark ? "night" : "studio"} />

      <SafeClippingBox clippingBox={clippingBox} models={models} />

      {models?.map((model) => (
        <SafeModelMesh key={model.id} model={model} clippingBox={clippingBox} />
      ))}
    </>
  )
}
