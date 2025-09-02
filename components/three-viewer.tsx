"use client"

import React, { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
import { ViewportGizmo } from "three-viewport-gizmo"

type ThreeViewerProps = {
  modelPath?: string
}

type MeshSettings = { color: string; opacity: number }
type ExplodeItem = { mesh: THREE.Mesh; original: THREE.Vector3; direction: THREE.Vector3 }

const ThreeViewer: React.FC<ThreeViewerProps> = ({ modelPath }) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const currentRootRef = useRef<THREE.Object3D | null>(null)

  // 👉 refs para el panel y funciones extra (NO afectan tu flujo)
  const gizmoRef = useRef<any>(null)
  const guiRef = useRef<GUI | null>(null)
  const selectableMeshesRef = useRef<THREE.Mesh[]>([])
  const meshSettingsRef = useRef<Map<THREE.Mesh, MeshSettings>>(new Map())
  const meshOriginalPositionsRef = useRef<ExplodeItem[]>([])

  const planesRef = useRef<THREE.Plane[]>([])
  const clipStateRef = useRef<Record<string, any>>({})
  const guiParamsRef = useRef({
    selectedMesh: 0,
    color: "#cccccc",
    opacity: 1,
    explode: 0,
    clippingEnabled: false,   // ← desactivado por defecto para no cortar el modelo
    clipSelectedOnly: false,
  })

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      5000
    )
    camera.position.set(0, 0, 5)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.localClippingEnabled = true // necesario para clipping (no afecta si está off)
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controlsRef.current = controls

    // luces (igual que tenías)
    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(10, 10, 10)
    scene.add(light)
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))

    // ✅ joystick
    const gizmo = new ViewportGizmo(camera, renderer, { placement: "bottom-right", type: "sphere" })
    gizmo.attachControls(controls)
    gizmoRef.current = gizmo

    // planos de corte (quedan listos para cuando actives clipping en la GUI)
    const planes: THREE.Plane[] = []
    const clipState: Record<string, any> = {}
    ;[
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0, 1),
    ].forEach((n, i) => {
      const pl = new THREE.Plane(n.clone(), 0)
      planes.push(pl)
      clipState[`offset${i}`] = 0
      clipState[`flip${i}`] = false
    })
    planesRef.current = planes
    clipStateRef.current = clipState

    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
      gizmoRef.current?.render?.()
    }
    animate()

    // resize
    const onResize = () => {
      if (!mountRef.current) return
      const { clientWidth, clientHeight } = mountRef.current
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(clientWidth, clientHeight)
      gizmoRef.current?.update?.()
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(mountRef.current)

    return () => {
      ro.disconnect()
      guiRef.current?.destroy()
      gizmoRef.current?.dispose?.()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }
  }, [])

  useEffect(() => {
    if (!modelPath) return
    console.log("🔄 Intentando cargar modelo:", modelPath)

    const scene = sceneRef.current
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!scene || !camera || !controls) return

    // limpiar root previo
    if (currentRootRef.current) {
      scene.remove(currentRootRef.current)
    }
    selectableMeshesRef.current.length = 0
    meshSettingsRef.current.clear()
    meshOriginalPositionsRef.current.length = 0

    const loader = new GLTFLoader()
    loader.load(
      modelPath,
      (gltf) => {
        console.log("✅ Modelo cargado con éxito:", modelPath)
        const root = gltf.scene

        // 🔹 Escalar modelo automáticamente
        const box = new THREE.Box3().setFromObject(root)
        const size = box.getSize(new THREE.Vector3()).length()
        const scaleFactor = 5 / size
        root.scale.setScalar(scaleFactor)

        // 🔹 Recentrar en el origen
        box.setFromObject(root)
        const center = box.getCenter(new THREE.Vector3())
        root.position.sub(center)

        // 🔹 Agregar a la escena
        currentRootRef.current = root
        scene.add(root)

        // 🔹 Registrar meshes para el panel (respetando colores)
        root.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh
            // permitir transparencia para el slider de Opacity (sin tocar el color)
            const mat = mesh.material as THREE.MeshStandardMaterial
            if (mat) mat.transparent = true

            selectableMeshesRef.current.push(mesh)
            meshSettingsRef.current.set(mesh, {
              color: `#${mat?.color?.getHexString?.() || "cccccc"}`,
              opacity: mat?.opacity ?? 1,
            })

            // vector de explosión desde el centro
            const wp = new THREE.Vector3()
            mesh.getWorldPosition(wp)
            const dir = wp.clone().sub(new THREE.Vector3()).normalize() // ya está centrado
            meshOriginalPositionsRef.current.push({
              mesh,
              original: mesh.position.clone(),
              direction: dir.lengthSq() > 1e-6 ? dir : new THREE.Vector3(0, 0, 1),
            })
          }
        })

        // 🔹 Ajustar cámara
        box.setFromObject(root)
        const newCenter = box.getCenter(new THREE.Vector3())
        const newSize = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(newSize.x, newSize.y, newSize.z)
        const fov = camera.fov * (Math.PI / 180)
        const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
        camera.position.set(newCenter.x, newCenter.y, cameraZ * 2)
        camera.lookAt(newCenter)
        controls.target.copy(newCenter)
        controls.update()

        // 🔹 Panel
        setupGUI()
      },
      undefined,
      (error) => {
        console.error("❌ Error cargando modelo:", modelPath, error)
      }
    )
  }, [modelPath])

  // ===== Panel (solo agrega controles, no cambia tu flujo) =====
  function setupGUI() {
    guiRef.current?.destroy()
    const gui = new GUI()
    guiRef.current = gui

    const planes = planesRef.current
    const clipState = clipStateRef.current

    // Selección de mesh
    const meshOptions: Record<string, number> = {}
    selectableMeshesRef.current.forEach((m, i) => (meshOptions[m.name || `Mesh_${i}`] = i))
    gui.add(guiParamsRef.current, "selectedMesh", meshOptions).name("Target Mesh")

    // Color
    gui
      .addColor(guiParamsRef.current, "color")
      .name("Color")
      .onChange((c: string) => {
        const mesh = selectableMeshesRef.current[guiParamsRef.current.selectedMesh]
        const mat = mesh.material as THREE.MeshStandardMaterial
        if (mat?.color) mat.color.set(c)
      })

    // Opacidad
    gui
      .add(guiParamsRef.current, "opacity", 0, 1, 0.01)
      .name("Opacity")
      .onChange((v: number) => {
        const mesh = selectableMeshesRef.current[guiParamsRef.current.selectedMesh]
        const mat = mesh.material as THREE.MeshStandardMaterial
        if (mat) {
          mat.opacity = v
          mat.transparent = v < 1
          mat.needsUpdate = true
        }
      })

    // Explode
    gui
      .add(guiParamsRef.current, "explode", 0, 200, 0.1)
      .name("Explode")
      .onChange((v: number) => updateExplode(v))

    // Clipping ON/OFF + sólo target (para no cortar por defecto)
    gui
      .add(guiParamsRef.current, "clippingEnabled")
      .name("Enable Clipping")
      .onChange(updateClippingState)
    gui
      .add(guiParamsRef.current, "clipSelectedOnly")
      .name("Clip Only Target")
      .onChange(updateClippingState)

    // Sliders por plano
    const axisNames = ["-X", "+X", "-Y", "+Y", "-Z", "+Z"]
    planes.forEach((pl, i) => {
      const folder = gui.addFolder(axisNames[i])
      folder
        .add(clipState, `offset${i}`, -50, 50, 0.1)
        .name("Offset")
        .onChange((v: number) => {
          pl.constant = v
          updateClippingState()
        })
      folder
        .add(clipState, `flip${i}`)
        .name("Flip")
        .onChange(() => {
          pl.negate()
          clipState[`offset${i}`] = pl.constant
          updateClippingState()
        })
      folder.open()
    })
  }

  function updateExplode(factor: number) {
    meshOriginalPositionsRef.current.forEach(({ mesh, original, direction }) => {
      mesh.position.copy(original).add(direction.clone().multiplyScalar(factor))
    })
  }

  function updateClippingState() {
    const enabled = guiParamsRef.current.clippingEnabled
    const onlyTarget = guiParamsRef.current.clipSelectedOnly
    const planes = planesRef.current

    selectableMeshesRef.current.forEach((mesh, i) => {
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (!mat) return
      if (!enabled) {
        mat.clippingPlanes = []
      } else {
        const apply = !onlyTarget || i === guiParamsRef.current.selectedMesh
        mat.clippingPlanes = apply ? planes : []
      }
      mat.needsUpdate = true
    })
  }

  return <div ref={mountRef} className="w-full h-full" />
}

export default ThreeViewer