"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { ViewportGizmo } from "three-viewport-gizmo";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

// 👉 importa tu panel nuevo (no lo toco)
import ControlsPanel, { ControlsState } from "@/components/ControlsPanel";

type ThreeViewerProps = { modelPath?: string };

export type ThreeViewerHandle = {
  takeScreenshot: () => void;
  home: () => void;
  startRecording: (opts?: { fps?: number; mimeType?: string; timesliceMs?: number }) => boolean;
  stopRecording: () => Promise<Blob | null>;
};

type MeshSettings = { color: string; opacity: number };
type ExplodeItem = {
  mesh: THREE.Mesh;
  original: THREE.Vector3;
  direction: THREE.Vector3;
};

const ThreeViewer = forwardRef<ThreeViewerHandle, ThreeViewerProps>(({ modelPath }, ref) => {
  // montaje/render
  const outerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentRootRef = useRef<THREE.Object3D | null>(null);

  // extras / panel
  const gizmoRef = useRef<any>(null);
  const guiRef = useRef<GUI | null>(null);
  const selectableMeshesRef = useRef<THREE.Mesh[]>([]);
  const meshSettingsRef = useRef<Map<THREE.Mesh, MeshSettings>>(new Map());
  const meshOriginalPositionsRef = useRef<ExplodeItem[]>([]);

  // clipping
  const planesReadyRef = useRef(false);
  const planesRef = useRef<THREE.Plane[]>([]);
  const clipStateRef = useRef<Record<string, any>>({});

  // ======= estado/control del panel lil-gui =======
  const planeOffsetCtrlsRef = useRef<any[]>([]);
  const clipRangesRef = useRef<{ min: number; max: number }[]>([]);

  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const selectedMeshIndexRef = useRef<number>(-1);

  /** factor de explode (0 = sin explode) y helper booleano */
  const explodeFactorRef = useRef<number>(0);
  const isExploding = () => explodeFactorRef.current > 0.0001;

  /** controladores de lil-gui */
  const meshSelectorControllerRef = useRef<any>(null);
  const colorControllerRef = useRef<any>(null);
  const transparencyControllerRef = useRef<any>(null);
  const explodeControllerRef = useRef<any>(null);

  const guiParamsRef = useRef({
    selectedMesh: 0,
    color: "#FFFFFF",
    opacity: 1,
    clipSelectedOnly: false,
  });

  // ====== Grabación ======
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordMimeRef = useRef<string>("video/webm");

  function startRecording(opts?: { fps?: number; mimeType?: string; timesliceMs?: number }): boolean {
    if (recorderRef.current) return false;
    const canvas = rendererRef.current?.domElement as HTMLCanvasElement | undefined;
    if (!canvas) return false;

    const fps = opts?.fps ?? 60;
    const stream = canvas.captureStream(fps);

    let mime = opts?.mimeType ?? "";
    if (mime && !MediaRecorder.isTypeSupported(mime)) mime = "";
    if (!mime) {
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) mime = "video/webm;codecs=vp9";
      else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) mime = "video/webm;codecs=vp8";
      else mime = "video/webm";
    }
    recordMimeRef.current = mime;

    const mr = new MediaRecorder(stream, { mimeType: mime });
    recorderRef.current = mr;
    recordChunksRef.current = [];

    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordChunksRef.current.push(e.data);
    };

    mr.start(opts?.timesliceMs ?? 1000);
    return true;
  }

  function stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const mr = recorderRef.current;
      if (!mr) return resolve(null);

      mr.onstop = () => {
        const blob = new Blob(recordChunksRef.current, { type: recordMimeRef.current });
        recorderRef.current = null;
        recordChunksRef.current = [];
        resolve(blob);
      };
      mr.stop();
    });
  }

  // ================= PANEL NUEVO: estado =================
  const [controlsState, setControlsState] = React.useState<ControlsState>({
    selectedMesh: 0,
    meshNames: [],
    clipSelectedOnly: false,
    color: "#ffffff",
    opacity: 1,
    explode: 0,
    windowX: [0, 0],
    windowY: [0, 0],
    windowZ: [0, 0],
    limits: { x: { min: -1, max: 1 }, y: { min: -1, max: 1 }, z: { min: -1, max: 1 } },
  });

  // ================= Setup escena =================
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.05, 500);
    camera.position.set(5, 5, 5);
    cameraRef.current = camera;
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, stencil: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.localClippingEnabled = true;
    renderer.sortObjects = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = true;
    controlsRef.current = controls;

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

   const gizmo = new ViewportGizmo(camera, renderer, {
      type: "sphere",
      size: 150,
      placement: "bottom-right",
      resolution: 64,
      lineWidth: 2,
      radius: 1,
      smoothness: 18,
      animated: true,
      speed: 1,
      background: {
        enabled: true,
        color: 16777215,
        opacity: 0,
        hover: { color: 3375261, opacity: 0.2 },
      },
      font: { family: "sans-serif", weight: 400 },
      offset: { top: 10, left: 10, bottom: 10, right: 10 },
      corners: { enabled: false, color: 0xf2f2c2, opacity: 1, scale: 0.15, radius: 1, smoothness: 18, hover: { color: 0xffffff, opacity: 1, scale: 0.2 } },
      edges:   { enabled: false, color: 0xf2f2c2, opacity: 1, radius: 1, smoothness: 18, scale: 0.15, hover: { color: 0xffffff, opacity: 1, scale: 0.2 } },
      x: { enabled: true, color: 16725587, opacity: 0.7, scale: 0.5, labelColor: 2236962, line: false, border: { size: 0, color: 0xdeadbd },
           hover: { color: 16777215, labelColor: 2236962, opacity: 1, scale: 0.7, border: { size: 0, color: 0xdeadbd } }, label: "" },
      y: { enabled: true, color: 2920447, opacity: 0.9, scale: 0.7, labelColor: 2236962, line: true, border: { size: 0, color: 14540253 },
           hover: { color: 16777215, labelColor: 2236962, opacity: 1, scale: 0.7, border: { size: 0, color: 14540253 } }, label: "S" },
      z: { enabled: true, color: 9100032, opacity: 0.9, scale: 0.7, labelColor: 2236962, line: true, border: { size: 0, color: 14540253 },
           hover: { color: 16777215, labelColor: 2236962, opacity: 1, scale: 0.7, border: { size: 0, color: 14540253 } }, label: "A" },
      nx: { line: true, scale: 0.7, hover: { scale: 0.5, color: 16777215, labelColor: 2236962, opacity: 1, border: { size: 0, color: 14540253 } },
            label: "R", enabled: true, color: 16725587, opacity: 0.9, labelColor: 2236962, border: { size: 0, color: 14540253 } },
      ny: { line: false, scale: 0.45, hover: { scale: 0.5, color: 16777215, labelColor: 2236962, opacity: 1, border: { size: 0, color: 14540253 } },
            label: "", enabled: true, color: 2920447, opacity: 0.7, labelColor: 2236962, border: { size: 0, color: 14540253 } },
      nz: { line: false, scale: 0.45, hover: { scale: 0.5, color: 16777215, labelColor: 2236962, opacity: 1, border: { size: 0, color: 14540253 } },
            label: "", enabled: true, color: 9100032, opacity: 0.7, labelColor: 2236962, border: { size: 0, color: 14540253 } },
    });
    gizmo.attachControls(controls);
    gizmoRef.current = gizmo;

    // planos
    const planes: THREE.Plane[] = [];
    const clipState: Record<string, any> = {};
    [new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 1)].forEach((n, i) => {
      const pl = new THREE.Plane(n.clone(), 0);
      planes.push(pl);
      clipState[`offset${i}`] = 0;
      clipState[`flip${i}`] = false;
    });
    planesRef.current = planes;
    clipStateRef.current = clipState;

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      gizmoRef.current?.render?.();
    };
    animate();

    const onResize = () => {
      if (!mountRef.current) return;
      const { clientWidth, clientHeight } = mountRef.current;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
      gizmoRef.current?.update?.();
      (gizmo as any).render?.();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mountRef.current);

    const onCanvasClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      mouseRef.current.set(x, y);

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(
        selectableMeshesRef.current.filter((m) => {
          const mat = getMat(m);
          if (mat) mat.side = THREE.DoubleSide;
          const visible = m.visible !== false;
          const op = (mat?.opacity ?? 1) > 0.001;
          return visible && op;
        })
      );
      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        const idx = selectableMeshesRef.current.indexOf(mesh);

        selectedMeshIndexRef.current = idx;
        guiParamsRef.current.selectedMesh = idx;

        const mat = getMat(mesh);
        guiParamsRef.current.color = "#" + (mat?.color?.getHexString?.() || "cccccc");
        guiParamsRef.current.opacity = mat?.opacity ?? 1;

        meshSelectorControllerRef.current?.setValue?.(idx);
        colorControllerRef.current?.setValue?.(guiParamsRef.current.color);
        transparencyControllerRef.current?.setValue?.(guiParamsRef.current.opacity);

        // refleja en el panel nuevo
        setControlsState((p) => ({
          ...p,
          selectedMesh: idx,
          color: guiParamsRef.current.color,
          opacity: guiParamsRef.current.opacity,
        }));

        if (!isExploding() && planesReadyRef.current) updateClippingState();
      }
    };
    renderer.domElement.addEventListener("click", onCanvasClick);

    return () => {
      ro.disconnect();
      renderer.domElement.removeEventListener("click", onCanvasClick);
      cancelAnimationFrame(raf);
      guiRef.current?.destroy();
      gizmoRef.current?.dispose?.();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) (renderer.domElement.parentNode as HTMLElement).removeChild(renderer.domElement);
      scene.clear();
      selectableMeshesRef.current = [];
      meshSettingsRef.current.clear();
      meshOriginalPositionsRef.current = [];
      currentRootRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!modelPath) return;

    const scene = sceneRef.current!;
    const camera = cameraRef.current!;
    const controls = controlsRef.current!;
    if (!scene || !camera || !controls) return;

    // limpiar root previo
    if (currentRootRef.current) scene.remove(currentRootRef.current);
    selectableMeshesRef.current = [];
    meshSettingsRef.current.clear();
    meshOriginalPositionsRef.current = [];
    explodeFactorRef.current = 0;

    const ext = modelPath.split(".").pop()?.toLowerCase();

    const onModelReady = (root: THREE.Object3D) => {
      currentRootRef.current = root;
      scene.add(root);

      // Colleo meshes y materiales
      const names: string[] = [];
      root.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          forEachMat(mesh, (mat) => {
            mat.side = THREE.DoubleSide;
            mat.transparent = true;
          });
          const mat = getMat(mesh);

          selectableMeshesRef.current.push(mesh);
          names.push(mesh.name || `Mesh_${names.length}`);

          meshSettingsRef.current.set(mesh, {
            color: `#${mat?.color?.getHexString?.() || "cccccc"}`,
            opacity: mat?.opacity ?? 1,
          });
        }
      });

      // Frame + centrar/escala
      const boxBefore = new THREE.Box3().setFromObject(root);
      centerAndFit(root, boxBefore);

      // === 👇 FIX EXPLODE: construir originales y direcciones ===
      const modelBox = new THREE.Box3().setFromObject(root);
      const modelCenter = modelBox.getCenter(new THREE.Vector3()); // ≈ (0,0,0) tras centerAndFit
      meshOriginalPositionsRef.current = []; // por las dudas
      selectableMeshesRef.current.forEach((mesh) => {
        // posición local original (después de centrar)
        const original = mesh.position.clone();

        // dirección desde el centro del modelo hacia el centro/worldPosition de la malla
  const meshBoxW = new THREE.Box3().setFromObject(mesh);
  const meshCenterW = meshBoxW.getCenter(new THREE.Vector3());
  let dirWorld = meshCenterW.clone().sub(modelCenter);
  if (dirWorld.lengthSq() < 1e-10) dirWorld.set(0, 0, 1);
  dirWorld.normalize();

  // 3) convertir esa dirección WORLD a LOCAL DEL PADRE del mesh (inline, sin helper)
  const parent = mesh.parent!;
  // tomamos dos puntos en world: base y base+dir, los llevamos al espacio local del padre
  const p0 = parent.worldToLocal(meshCenterW.clone());
  const p1 = parent.worldToLocal(meshCenterW.clone().add(dirWorld));
  const dirLocal = p1.sub(p0);
  if (dirLocal.lengthSq() < 1e-10) dirLocal.set(0, 0, 1);
  else dirLocal.normalize();

  // 4) guardamos original + dirección LOCAL
  meshOriginalPositionsRef.current.push({
    mesh,
    original: original,
    direction: dirLocal,
  });
      });
      // === 👆 FIN FIX EXPLODE ===

      // límites y ventanas para panel nuevo (coords del modelo)
      const box = new THREE.Box3().setFromObject(root);
      const lx = { min: box.min.x, max: box.max.x };
      const ly = { min: box.min.y, max: box.max.y };
      const lz = { min: box.min.z, max: box.max.z };

      setControlsState((p) => ({
        ...p,
        meshNames: names.length ? names : ["Mesh_0"],
        selectedMesh: 0,
        color: `#${getMat(selectableMeshesRef.current[0])?.color.getHexString?.() || "cccccc"}`,
        opacity: getMat(selectableMeshesRef.current[0])?.opacity ?? 1,
        explode: 0, // reset
        limits: { x: lx, y: ly, z: lz },
        windowX: [lx.min, lx.max],
        windowY: [ly.min, ly.max],
        windowZ: [lz.min, lz.max],
      }));

      updateClipOffsetControllersRangeFromRoot(root);
      alignPlanesToCurrentModel();
      setSceneClippingEnabled(true);
      // setupGUI();
      explodeFactorRef.current = 0;
explodeControllerRef.current?.setValue?.(0); // lil-gui
setControlsState((p) => ({ ...p, explode: 0 }));
      planesReadyRef.current = true;
      updateClippingState();
    };

    if (ext === "stl") {
      const loader = new STLLoader();
      loader.load(
        modelPath,
        (geometry) => {
          if (!(geometry as any).hasAttribute?.("normal")) geometry.computeVertexNormals();
          const root = new THREE.Group();
          root.name = "ModelRoot";

          const mat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.2,
            roughness: 0.7,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
          });
          const mesh = new THREE.Mesh(geometry, mat);
          root.add(mesh);

          onModelReady(root);
        },
        undefined,
        (err) => console.error("❌ Error cargando STL:", modelPath, err)
      );
    } else {
      const loader = new GLTFLoader();
      loader.load(
        modelPath,
        (gltf) => onModelReady(gltf.scene),
        undefined,
        (error) => console.error("❌ Error cargando modelo:", modelPath, error)
      );
    }
  }, [modelPath]);

  // ===== Util =====
  function getMat(mesh: THREE.Mesh): THREE.MeshStandardMaterial | null {
    const m = mesh.material as any;
    if (Array.isArray(m)) {
      const first = m.find((x: any) => x?.isMeshStandardMaterial) as THREE.MeshStandardMaterial | undefined;
      return first ?? null;
    }
    return m?.isMeshStandardMaterial ? (m as THREE.MeshStandardMaterial) : null;
  }
  function forEachMat(mesh: THREE.Mesh, fn: (mat: THREE.MeshStandardMaterial) => void) {
    const m = mesh.material as any;
    if (Array.isArray(m)) m.forEach((mm: any) => mm?.isMeshStandardMaterial && fn(mm));
    else if (m?.isMeshStandardMaterial) fn(m);
  }

  function centerAndFit(root: THREE.Object3D, box: THREE.Box3) {
    const size = box.getSize(new THREE.Vector3()).length();
    const scaleFactor = size > 0 ? 5 / size : 1;
    root.scale.setScalar(scaleFactor);

    box.setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    root.position.sub(center);

    const camera = cameraRef.current!;
    const controls = controlsRef.current!;
    box.setFromObject(root);
    const c = box.getCenter(new THREE.Vector3());
    const s = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(s.x, s.y, s.z);
    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    camera.position.set(c.x, c.y, cameraZ * 2);
    camera.lookAt(c);
    controls.target.copy(c);
    controls.update();
  }

  function computeClipRangesFromBox(box: THREE.Box3) {
    return [
      { min: -box.max.x, max: -box.min.x }, // -X
      { min: box.min.x, max: box.max.x },   // +X
      { min: -box.max.y, max: -box.min.y }, // -Y
      { min: box.min.y, max: box.max.y },   // +Y
      { min: -box.max.z, max: -box.min.z }, // -Z
      { min: box.min.z, max: box.max.z },   // +Z
    ];
  }

  function updateClipOffsetControllersRangeFromRoot(root: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(root);
    clipRangesRef.current = computeClipRangesFromBox(box);
    planeOffsetCtrlsRef.current.forEach((ctrl, i) => {
      const r = clipRangesRef.current[i];
      if (!ctrl || !r) return;
      ctrl.min(r.min).max(r.max);
      const span = Math.max(1e-6, Math.abs(r.max - r.min));
      ctrl.step(span / 1000);
      ctrl.updateDisplay();
    });
  }

  function setSceneClippingEnabled(enabled: boolean) {
    const scene = sceneRef.current;
    if (!scene) return;
    const planes = planesRef.current;
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      forEachMat(mesh, (mat) => {
        mat.clippingPlanes = enabled ? planes : [];
        mat.needsUpdate = true;
        mat.side = THREE.DoubleSide;
      });
    });
  }

  function alignPlanesToCurrentModel() {
    const planes = planesRef.current;
    const root = currentRootRef.current;
    if (!root || planes.length < 6) return;

    const box = new THREE.Box3().setFromObject(root);
    const { min, max } = box;

    planes[0].constant = -min.x; // -X
    planes[1].constant =  max.x; // +X
    planes[2].constant = -min.y; // -Y
    planes[3].constant =  max.y; // +Y
    planes[4].constant = -min.z; // -Z
    planes[5].constant =  max.z; // +Z

    const clipState = clipStateRef.current;
    clipState.offset0 = planes[0].constant;
    clipState.offset1 = planes[1].constant;
    clipState.offset2 = planes[2].constant;
    clipState.offset3 = planes[3].constant;
    clipState.offset4 = planes[4].constant;
    clipState.offset5 = planes[5].constant;
  }

  function updateExplode() {
    meshOriginalPositionsRef.current.forEach(({ mesh, original, direction }) => {
      mesh.position.copy(original).add(direction.clone().multiplyScalar(explodeFactorRef.current));
    });

    const root = currentRootRef.current;
    if (root) {
      if (explodeFactorRef.current > 0) {
        setSceneClippingEnabled(false);
      } else {
        alignPlanesToCurrentModel();
        if (currentRootRef.current) updateClipOffsetControllersRangeFromRoot(currentRootRef.current);
        setSceneClippingEnabled(true);
        updateClippingState();
      }
    }
  }

  function updateClippingState() {
    if (isExploding()) return;
    const planes = planesRef.current;
    selectableMeshesRef.current.forEach((mesh, i) => {
      forEachMat(mesh, (mat) => {
        mat.clippingPlanes =
          guiParamsRef.current.clipSelectedOnly && i !== guiParamsRef.current.selectedMesh ? [] : planes;
        mat.needsUpdate = true;
        mat.side = THREE.DoubleSide;
      });
    });
  }

  // =================== Panel NUEVO -> aplicar cambios ===================
  function applyControls(u: Partial<ControlsState>) {
    // selected mesh
    if (u.selectedMesh !== undefined) {
      const i = Math.max(0, Math.min(u.selectedMesh, selectableMeshesRef.current.length - 1));
      guiParamsRef.current.selectedMesh = i;
      meshSelectorControllerRef.current?.setValue?.(i);
      const mesh = selectableMeshesRef.current[i];
      if (mesh) {
        const mat = getMat(mesh);
        setControlsState((p) => ({
          ...p,
          selectedMesh: i,
          color: `#${mat?.color?.getHexString?.() || p.color}`,
          opacity: mat?.opacity ?? p.opacity,
        }));
      }
      if (!isExploding()) updateClippingState();
    }

    // clip only
    if (u.clipSelectedOnly !== undefined) {
      guiParamsRef.current.clipSelectedOnly = u.clipSelectedOnly;
      if (!isExploding()) updateClippingState();
    }

    // color
    if (u.color !== undefined) {
      const mesh = selectableMeshesRef.current[guiParamsRef.current.selectedMesh];
      if (mesh) {
        forEachMat(mesh, (mat) => {
          try { mat.color.set(u.color!); } catch {}
          mat.needsUpdate = true;
          mat.side = THREE.DoubleSide;
        });
        meshSettingsRef.current.set(mesh, {
          color: u.color,
          opacity: getMat(mesh)?.opacity ?? 1,
        });
      }
      guiParamsRef.current.color = u.color;
      colorControllerRef.current?.setValue?.(u.color);
    }

    // opacity
    if (u.opacity !== undefined) {
      const mesh = selectableMeshesRef.current[guiParamsRef.current.selectedMesh];
      if (mesh) {
        forEachMat(mesh, (mat) => {
          mat.opacity = u.opacity!;
          mat.transparent = u.opacity! < 1;
          mat.needsUpdate = true;
          mat.side = THREE.DoubleSide;
        });
        meshSettingsRef.current.set(mesh, {
          color: `#${getMat(mesh)?.color.getHexString() || "cccccc"}`,
          opacity: u.opacity!,
        });
      }
      guiParamsRef.current.opacity = u.opacity;
      transparencyControllerRef.current?.setValue?.(u.opacity);
    }

    // explode
    if (u.explode !== undefined) {
      explodeFactorRef.current = u.explode;
      explodeControllerRef.current?.setValue?.(u.explode);
      updateExplode();
    }

    // ===== MAPEOS RANGE <-> PLANES (en coords del modelo) =====
    const planes = planesRef.current;
    const setOffsetGui = (idx: number, v: number) => {
      const ctrl = planeOffsetCtrlsRef.current[idx];
      if (ctrl?.setValue) ctrl.setValue(v);
      else ctrl?.updateDisplay?.();
    };

    // X: window = [xmin, xmax]  ->  c(-X)=xmax, c(+X)=-xmin
    if (u.windowX) {
      const [xmin, xmax] = u.windowX;
      planes[0].constant = xmax;   // -X
      planes[1].constant = -xmin;  // +X
      setOffsetGui(0, planes[0].constant);
      setOffsetGui(1, planes[1].constant);
    }
    // Y: window = [ymin, ymax]  ->  c(-Y)=ymax, c(+Y)=-ymin
    if (u.windowY) {
      const [ymin, ymax] = u.windowY;
      planes[2].constant = ymax;   // -Y
      planes[3].constant = -ymin;  // +Y
      setOffsetGui(2, planes[2].constant);
      setOffsetGui(3, planes[3].constant);
    }
    // Z: window = [zmin, zmax]  ->  c(-Z)=zmax, c(+Z)=-zmin
    if (u.windowZ) {
      const [zmin, zmax] = u.windowZ;
      planes[4].constant = zmax;   // -Z
      planes[5].constant = -zmin;  // +Z
      setOffsetGui(4, planes[4].constant);
      setOffsetGui(5, planes[5].constant);
    }

    if ((u.windowX || u.windowY || u.windowZ) && !isExploding()) updateClippingState();

    // merge al estado del panel
    setControlsState((p) => ({ ...p, ...u }));
  }

  // ===================== Panel ORIGINAL (lil-gui) =====================
  function setupGUI() {
    guiRef.current?.destroy();
    const gui = new GUI();
    guiRef.current = gui;

    const planes = planesRef.current;
    const clipState = clipStateRef.current;

    const meshOptions: Record<string, number> = {};
    selectableMeshesRef.current.forEach((mesh, i) => {
      meshOptions[mesh.name || `Mesh_${i}`] = i;
    });

    meshSelectorControllerRef.current = gui
      .add(guiParamsRef.current, "selectedMesh", meshOptions)
      .name("Target Mesh")
      .onChange((i: number) => {
        if (i < 0) return;
        const mesh = selectableMeshesRef.current[i];
        const current = meshSettingsRef.current.get(mesh) || {
          color: "#" + (getMat(mesh)?.color.getHexString() || "cccccc"),
          opacity: getMat(mesh)?.opacity ?? 1,
        };
        guiParamsRef.current.color = current.color;
        guiParamsRef.current.opacity = current.opacity;
        colorControllerRef.current?.setValue(guiParamsRef.current.color);
        transparencyControllerRef.current?.setValue(guiParamsRef.current.opacity);

        // reflejar en panel
        setControlsState((p) => ({ ...p, selectedMesh: i, color: current.color, opacity: current.opacity }));

        if (!isExploding()) updateClippingState();
      });

    gui
      .add(guiParamsRef.current, "clipSelectedOnly")
      .name("Clip Only Target")
      .onChange(() => {
        setControlsState((p) => ({ ...p, clipSelectedOnly: guiParamsRef.current.clipSelectedOnly }));
        if (isExploding()) return;
        updateClippingState();
      });

    colorControllerRef.current = gui
      .addColor(guiParamsRef.current, "color")
      .name("Color")
      .onChange((c: string) => {
        const mesh = selectableMeshesRef.current[guiParamsRef.current.selectedMesh];
        forEachMat(mesh, (mat) => {
          mat.side = THREE.DoubleSide;
          if (mat?.color) mat.color.set(c);
        });
        meshSettingsRef.current.set(mesh, {
          color: c,
          opacity: getMat(mesh)?.opacity ?? 1,
        });
        setControlsState((p) => ({ ...p, color: c }));
      });

    transparencyControllerRef.current = gui
      .add(guiParamsRef.current, "opacity", 0, 1, 0.01)
      .name("Opacity")
      .onChange((v: number) => {
        const mesh = selectableMeshesRef.current[guiParamsRef.current.selectedMesh];
        forEachMat(mesh, (mat) => {
          mat.opacity = v;
          mat.transparent = v < 1;
          mat.needsUpdate = true;
          mat.side = THREE.DoubleSide;
        });
        meshSettingsRef.current.set(mesh, {
          color: `#${getMat(mesh)?.color.getHexString() || "cccccc"}`,
          opacity: v,
        });
        setControlsState((p) => ({ ...p, opacity: v }));
      });

    explodeControllerRef.current = gui
      .add({ explode: 0 }, "explode", 0, 200, 0.01)
      .name("Explode")
      .onChange((v: number) => {
        explodeFactorRef.current = v;
        setControlsState((p) => ({ ...p, explode: v }));
        updateExplode();

        if (isExploding()) {
          sceneRef.current?.traverse((obj) => {
            const m = obj as THREE.Mesh;
            if (!m.isMesh) return;
            forEachMat(m, (mat) => {
              if (mat.clippingPlanes?.length) {
                mat.clippingPlanes = [];
                mat.needsUpdate = true;
                mat.side = THREE.DoubleSide;
              }
            });
          });
        } else {
          alignPlanesToCurrentModel();
          sceneRef.current?.traverse((obj) => {
            const m = obj as THREE.Mesh;
            if (!m.isMesh) return;
            forEachMat(m, (mat) => {
              mat.clippingPlanes = planes;
              mat.needsUpdate = true;
              mat.side = THREE.DoubleSide;
            });
          });
          updateClippingState();
        }
      });

    planeOffsetCtrlsRef.current = [];

    const axisNames = ["-X", "+X", "-Y", "+Y", "-Z", "+Z"];
    planes.forEach((pl, i) => {
      const folder = gui.addFolder(axisNames[i]);
      const offsetCtrl = folder
        .add(clipState, `offset${i}`, -1, 1, 0.001)
        .name("Offset")
        .onChange((v: number) => {
          pl.constant = v;

          // reflejar a ventanas del panel NUEVO (map inverso)
          setControlsState((p) => {
            const px = planesRef.current;
            const winX: [number, number] = [-px[1].constant, px[0].constant];
            const winY: [number, number] = [-px[3].constant, px[2].constant];
            const winZ: [number, number] = [-px[5].constant, px[4].constant];
            return { ...p, windowX: winX, windowY: winY, windowZ: winZ };
          });

          if (!isExploding()) updateClippingState();
        });
      folder.add(clipState, `flip${i}`).name("Flip");
      planeOffsetCtrlsRef.current[i] = offsetCtrl;
      folder.open();
    });

    if (currentRootRef.current) updateClipOffsetControllersRangeFromRoot(currentRootRef.current);
    setSceneClippingEnabled(true);
  }

  // ===== Botones Home / Screenshot =====
  const handleHome = () => {
    const root = currentRootRef.current;
    if (!root) return;
    const box = new THREE.Box3().setFromObject(root);
    centerAndFit(root, box);
  };

  const handleScreenshot = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const dataURL = renderer.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "screenshot.png";
    link.click();
  };

  useImperativeHandle(ref, () => ({
    takeScreenshot: handleScreenshot,
    home: handleHome,
    startRecording,
    stopRecording,
  }));

  return (
    <div ref={outerRef} className="w-full h-full relative">
      <div ref={mountRef} className="absolute inset-0" />
      {/* Panel NUEVO (separado) */}
      <ControlsPanel controls={controlsState} onControlsChange={applyControls} />
    </div>
  );
});

export default ThreeViewer;
