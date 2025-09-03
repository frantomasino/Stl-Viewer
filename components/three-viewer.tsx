"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { ViewportGizmo } from "three-viewport-gizmo";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

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

  // ancla donde montaremos el panel
const guiMountRef = useRef<HTMLDivElement>(null);


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

  // ======= estado/control del panel tipo main.jsx =======
  const planeOffsetCtrlsRef = useRef<any[]>([]);
  const clipRangesRef = useRef<{ min: number; max: number }[]>([]);

  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const selectedMeshIndexRef = useRef<number>(-1);

  /** factor de explode (0 = sin explode) y helper booleano */
  const explodeFactorRef = useRef<number>(0);
  const isExploding = () => explodeFactorRef.current > 0.0001;

  /** controladores de lil-gui que sincronizamos al seleccionar por click */
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
  // =============================================================

  // ====== Grabación (para botón "Grabar" externo) ======
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
  // =====================================================

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa); // fondo render
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.05,
      500
    );
    camera.position.set(5, 5, 5);
    cameraRef.current = camera;
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      stencil: true,
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.localClippingEnabled = true;
    renderer.sortObjects = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = true;
    controlsRef.current = controls;

    // luces
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    // joystick
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

    // planos de corte (lista como en tu archivo original)
    const planes: THREE.Plane[] = [];
    const clipState: Record<string, any> = {};
    [
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0, 1),
    ].forEach((n, i) => {
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

    // resize
    const onResize = () => {
      if (!mountRef.current) return;
      const { clientWidth, clientHeight } = mountRef.current;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
      gizmoRef.current?.update?.();
      gizmo.render?.();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mountRef.current);

    // click picking para Target Mesh + sync GUI
    const onCanvasClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      mouseRef.current.set(x, y);

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(
        selectableMeshesRef.current.filter((m) => {
          const mat = m.material as THREE.MeshStandardMaterial;
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

        const mat = mesh.material as THREE.MeshStandardMaterial;
        guiParamsRef.current.color = "#" + (mat?.color?.getHexString?.() || "cccccc");
        guiParamsRef.current.opacity = mat?.opacity ?? 1;

        meshSelectorControllerRef.current?.setValue(idx);
        colorControllerRef.current?.setValue(guiParamsRef.current.color);
        transparencyControllerRef.current?.setValue(guiParamsRef.current.opacity);

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
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      scene.clear();
      selectableMeshesRef.current.length = 0;
      meshSettingsRef.current.clear();
      meshOriginalPositionsRef.current.length = 0;
      currentRootRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!modelPath) return;

    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!scene || !camera || !controls) return;

    // limpiar root previo
    if (currentRootRef.current) {
      scene.remove(currentRootRef.current);
    }
    selectableMeshesRef.current.length = 0;
    meshSettingsRef.current.clear();
    meshOriginalPositionsRef.current.length = 0;
    explodeFactorRef.current = 0;

    const ext = modelPath.split(".").pop()?.toLowerCase();

    if (ext === "stl") {
      const loader = new STLLoader();
      loader.load(
        modelPath,
        (geometry) => {
          if (!(geometry as any).hasAttribute?.("normal")) {
            geometry.computeVertexNormals();
          }
          const root = new THREE.Group();
          root.name = "ModelRoot";

          const mat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.2,
            roughness: 0.7,
            transparent: true,
            opacity: 1,
          });

          const mesh = new THREE.Mesh(geometry, mat);
          root.add(mesh);

          const scene = sceneRef.current!;
          scene.add(root);

          const box = new THREE.Box3().setFromObject(root);
          const sizeLen = box.getSize(new THREE.Vector3()).length();
          const scaleFactor = sizeLen > 0 ? 5 / sizeLen : 1;
          root.scale.setScalar(scaleFactor);

          box.setFromObject(root);
          const center = box.getCenter(new THREE.Vector3());
          root.position.sub(center);

          currentRootRef.current = root;

          selectableMeshesRef.current.length = 0;
          selectableMeshesRef.current.push(mesh);

          meshSettingsRef.current.set(mesh, {
            color: `#${mat.color?.getHexString?.() || "cccccc"}`,
            opacity: mat.opacity ?? 1,
          });
          actulizarGui(mesh);

          const wp = new THREE.Vector3();
          mesh.getWorldPosition(wp);
          const dir = wp.clone().sub(new THREE.Vector3()).normalize();
          meshOriginalPositionsRef.current.push({
            mesh,
            original: mesh.position.clone(),
            direction: dir.lengthSq() > 1e-6 ? dir : new THREE.Vector3(0, 0, 1),
          });

          frameCamera(root);

          updateClipOffsetControllersRangeFromRoot(root);
          alignPlanesToCurrentModel();
          setSceneClippingEnabled(true);

          setupGUI();
        },
        undefined,
        (err) => {
          console.error("❌ Error cargando STL:", modelPath, err);
        }
      );
    } else if (ext?.includes("gltf") || ext === "glb") {
      const loader = new GLTFLoader();
      loader.load(
        modelPath,
        (gltf) => {
          const root = gltf.scene;

          const box = new THREE.Box3().setFromObject(root);
          const modelCenter = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3()).length();
          const scaleFactor = 5 / size;
          root.scale.setScalar(scaleFactor);

          box.setFromObject(root);
          const center = box.getCenter(new THREE.Vector3());
          root.position.sub(center);

          currentRootRef.current = root;
          scene.add(root);

          root.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const mesh = obj as THREE.Mesh;
              const mat = mesh.material as THREE.MeshStandardMaterial;
              const meshBox = new THREE.Box3().setFromObject(mesh);
              const meshCenter = meshBox.getCenter(new THREE.Vector3());
              if (mat) mat.transparent = true;

              selectableMeshesRef.current.push(mesh);
              meshSettingsRef.current.set(mesh, {
                color: `#${mat?.color?.getHexString?.() || "cccccc"}`,
                opacity: mat?.opacity ?? 1,
              });
              actulizarGui(mesh);

              const dir = new THREE.Vector3().subVectors(meshCenter, modelCenter).normalize();
              const wp = new THREE.Vector3();
              mesh.getWorldPosition(wp);
              meshOriginalPositionsRef.current.push({
                mesh,
                original: mesh.position.clone(),
                direction: dir,
              });
            }
          });

          box.setFromObject(root);
          const newCenter = box.getCenter(new THREE.Vector3());
          const newSize = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(newSize.x, newSize.y, newSize.z);
          const fov = camera.fov * (Math.PI / 180);
          const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
          camera.position.set(newCenter.x, newCenter.y, cameraZ * 2);
          camera.lookAt(newCenter);
          controls.target.copy(newCenter);
          controls.update();

          updateClipOffsetControllersRangeFromRoot(root);
          alignPlanesToCurrentModel();
          setSceneClippingEnabled(true);
          setupGUI();
        },
        undefined,
        (error) => {
          console.error("❌ Error cargando modelo:", modelPath, error);
        }
      );
    }
  }, [modelPath]);

  // ===================== UTILIDADES (panel) =====================

  function actulizarGui(mesh: THREE.Mesh) {
    const existing = meshSettingsRef.current.get(mesh);
    const colorHex = "#" + (mesh.material as THREE.MeshStandardMaterial).color.getHexString();
    const opacityVal = (mesh.material as THREE.MeshStandardMaterial).opacity;
    const settings = existing || { color: colorHex, opacity: opacityVal };
    guiParamsRef.current.color = settings.color;
    guiParamsRef.current.opacity = settings.opacity;
  }

  function computeClipRangesFromBox(box: THREE.Box3) {
    return [
      { min: -box.max.x, max: -box.min.x }, // -X
      { min: box.min.x, max: box.max.x }, // +X
      { min: -box.max.y, max: -box.min.y }, // -Y
      { min: box.min.y, max: box.max.y }, // +Y
      { min: -box.max.z, max: -box.min.z }, // -Z
      { min: box.min.z, max: box.max.z }, // +Z
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
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.clippingPlanes = enabled ? planes : [];
      mat.needsUpdate = true;
    });
  }

  function alignPlanesToCurrentModel() {
    const planes = planesRef.current;
    const root = currentRootRef.current;
    if (!root || planes.length < 6) return;

    const box = new THREE.Box3().setFromObject(root);
    const { min, max } = box;

    planes[0].constant = -min.x;
    planes[1].constant = max.x;
    planes[2].constant = -min.y;
    planes[3].constant = max.y;
    planes[4].constant = -min.z;
    planes[5].constant = max.z;

    const clipState = clipStateRef.current;
    clipState.offset0 = planes[0].constant;
    clipState.offset1 = planes[1].constant;
    clipState.offset2 = planes[2].constant;
    clipState.offset3 = planes[3].constant;
    clipState.offset4 = planes[4].constant;
    clipState.offset5 = planes[5].constant;
  }

  function ensureCameraCoversBox(box: THREE.Box3, fitOffset = 1.2) {
    const camera = cameraRef.current!;
    const controls = controlsRef.current!;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxSize = Math.max(size.x, size.y, size.z);
    const fitHeightDistance =
      maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5));
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

    camera.near = Math.max(0.01, distance / 100);
    camera.far = Math.max(camera.far, distance * 100);
    camera.updateProjectionMatrix();
    controls.update();
    controls.maxDistance = Math.max(controls.maxDistance || 0, distance * 10);
  }

  function frameCamera(root: THREE.Object3D) {
    const camera = cameraRef.current!;
    const controls = controlsRef.current!;
    const box = new THREE.Box3().setFromObject(root);

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

    camera.position.set(center.x + cameraZ, center.y + cameraZ, center.z + cameraZ);
    camera.lookAt(center);
    controls.target.copy(center);
    controls.update();
    ensureCameraCoversBox(box, 1.2);
  }

  // ===== Panel =====
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
          color: "#" + (mesh.material as THREE.MeshStandardMaterial).color.getHexString(),
          opacity: (mesh.material as THREE.MeshStandardMaterial).opacity,
        };
        guiParamsRef.current.color = current.color;
        guiParamsRef.current.opacity = current.opacity;
        colorControllerRef.current?.setValue(guiParamsRef.current.color);
        transparencyControllerRef.current?.setValue(guiParamsRef.current.opacity);
        if (!isExploding()) updateClippingState();
      });

    gui
      .add(guiParamsRef.current, "clipSelectedOnly")
      .name("Clip Only Target")
      .onChange(() => {
        if (isExploding()) return;
        updateClippingState();
      });

    colorControllerRef.current = gui
      .addColor(guiParamsRef.current, "color")
      .name("Color")
      .onChange((c: string) => {
        const mesh = selectableMeshesRef.current[guiParamsRef.current.selectedMesh];
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat?.color) mat.color.set(c);
        meshSettingsRef.current.set(mesh, {
          color: c,
          opacity: (mesh.material as THREE.MeshStandardMaterial)?.opacity ?? 1,
        });
      });

    transparencyControllerRef.current = gui
      .add(guiParamsRef.current, "opacity", 0, 1, 0.01)
      .name("Opacity")
      .onChange((v: number) => {
        const mesh = selectableMeshesRef.current[guiParamsRef.current.selectedMesh];
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.opacity = v;
          mat.transparent = v < 1;
          mat.needsUpdate = true;
          meshSettingsRef.current.set(mesh, {
            color: `#${mat.color.getHexString()}`,
            opacity: v,
          });
        }
      });

    explodeControllerRef.current = gui
      .add({ explode: 0 }, "explode", 0, 200, 0.01)
      .name("Explode")
      .onChange((v: number) => {
        explodeFactorRef.current = v;
        updateExplode();

        if (isExploding()) {
          sceneRef.current?.traverse((obj) => {
            const m = obj as THREE.Mesh;
            if (!m.isMesh) return;
            const mat = m.material as THREE.MeshStandardMaterial;
            if (mat.clippingPlanes && mat.clippingPlanes.length) {
              mat.clippingPlanes = [];
              mat.needsUpdate = true;
            }
          });
        } else {
          alignPlanesToCurrentModel();
          sceneRef.current?.traverse((obj) => {
            const m = obj as THREE.Mesh;
            if (!m.isMesh) return;
            const mat = m.material as THREE.MeshStandardMaterial;
            mat.clippingPlanes = planes;
            mat.needsUpdate = true;
          });
          updateClippingState();
        }
      });

    // reset refs de sliders por si se reconstruye la GUI
    planeOffsetCtrlsRef.current = [];

    const axisNames = ["-X", "+X", "-Y", "+Y", "-Z", "+Z"];
    planes.forEach((pl, i) => {
      const folder = gui.addFolder(axisNames[i]);
      const offsetCtrl = folder
        .add(clipState, `offset${i}`, -1, 1, 0.001)
        .name("Offset")
        .onChange((v: number) => {
          pl.constant = v;
          if (!isExploding()) updateClippingState();
        });
      folder
        .add(clipState, `flip${i}`)
        .name("Flip")
        .onChange(() => {
          pl.negate();
          clipState[`offset${i}`] = pl.constant;
          offsetCtrl.updateDisplay();
          if (!isExploding()) updateClippingState();
        });
      planeOffsetCtrlsRef.current[i] = offsetCtrl;
      folder.open();
    });

    if (currentRootRef.current) {
      updateClipOffsetControllersRangeFromRoot(currentRootRef.current);
    }

    setSceneClippingEnabled(true);
  }

  // ===== Explode (con lógica de clipping ON/OFF y realineo) =====
  function updateExplode() {
    meshOriginalPositionsRef.current.forEach(({ mesh, original, direction }) => {
      mesh.position.copy(original).add(direction.clone().multiplyScalar(explodeFactorRef.current));
    });

    const root = currentRootRef.current;
    if (root) {
      const explodedBox = new THREE.Box3().setFromObject(root);
      if (explodeFactorRef.current > 0) {
        setSceneClippingEnabled(false);
        // opcional: ensureCameraCoversBox(explodedBox);
      } else {
        alignPlanesToCurrentModel();
        if (currentRootRef.current) {
          updateClipOffsetControllersRangeFromRoot(currentRootRef.current);
        }
        setSceneClippingEnabled(true);
        updateClippingState();
      }
    }
  }

  // ===== Clipping por target =====
  function updateClippingState() {
    if (isExploding()) return;
    const planes = planesRef.current;
    selectableMeshesRef.current.forEach((mesh, i) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.clippingPlanes =
        guiParamsRef.current.clipSelectedOnly && i !== guiParamsRef.current.selectedMesh ? [] : planes;
      mat.needsUpdate = true;
    });
  }

  // ===== Botones Home / Screenshot =====
  const handleHome = () => {
    const root = currentRootRef.current;
    if (root) frameCamera(root);
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

  // ===== Render (sin botones internos) =====
  return (
    <div ref={outerRef} className="w-full h-full relative">
      <div ref={mountRef} className="absolute inset-0" />
    </div>
  );
});

export default ThreeViewer;
