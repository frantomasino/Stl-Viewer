"use client"

import { useRef } from "react"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import type { Group } from "three"

interface MinimapProps {
  showMinimap: boolean
  isDark: boolean
}

function MinimapContent() {
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

  return (
    <group ref={groupRef}>
      <axesHelper args={[2.5]} />
      <mesh position={[3, 0, 0]}>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial color="#ff4444" />
      </mesh>
      <mesh position={[0, 3, 0]}>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial color="#44ff44" />
      </mesh>
      <mesh position={[0, 0, 3]}>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial color="#4444ff" />
      </mesh>
    </group>
  )
}

export function Minimap({ showMinimap, isDark }: MinimapProps) {
  if (!showMinimap) return null

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className={`${isDark ? "bg-gray-800/90" : "bg-white/90"} backdrop-blur-sm rounded-lg p-3 border shadow-lg`}>
        <div className="w-24 h-24">
          <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <MinimapContent />
          </Canvas>
        </div>
        <div className="mt-2 flex justify-between text-xs">
          <span className="text-red-500 font-medium">X</span>
          <span className="text-green-500 font-medium">Y</span>
          <span className="text-blue-500 font-medium">Z</span>
        </div>
      </div>
    </div>
  )
}
