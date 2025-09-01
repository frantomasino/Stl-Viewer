"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { ViewportGizmo } from "three-viewport-gizmo";

type MeshSettings = { color: string; opacity: number };
type ExplodeItem = { mesh: THREE.Mesh; original: THREE.Vector3; direction: THREE.Vector3 };

type ThreeViewerProps = {
  modelPath?: string;
};

const ThreeViewer: React.FC<ThreeViewerProps> = ({ modelPath }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentRootRef = useRef<THREE.Object3D | null>(null);
  const gizmoRef = useRef<any>(null);

  const selectableMeshesRef = useRef<THREE.Mesh[]>([]);
  const meshSettingsRef = useRef<Map<THREE.Mesh, MeshSettings>>(new Map());
  const meshOriginalPositionsRef = useRef<ExplodeItem[]>([]);

  const planesRef = useRef<THREE.Plane[]>([]);
  const clipStateRef = useRef<Record<string, any>>({});

  const guiRef = useRef<GUI | null>(null);
  const guiParamsRef = useRef({
    color: "#cccccc",
    opacity: 1,
    selectedMesh: 0,
    explode: 0,
  });

  const getThree = () => ({
    scene: sceneRef.current!,
    camera: cameraRef.current!,
    renderer: rendererRef.current!,
    controls: controlsRef.current!,
  });

  // ---------- init ----------
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.05,
      5000
    );
    camera.position.set(5, 5, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.localClippingEnabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = true;   // ✅ mover
    controls.enableRotate = true; // ✅ rotar
    controls.enableZoom = true;   // ✅ zoom
    controlsRef.current = controls;

    const gizmo = new ViewportGizmo(camera, renderer, { placement: "bottom-right", type: "sphere" });
    gizmo.attachControls(controls);
    gizmoRef.current = gizmo;

    // Luces
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // Clipping planes
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

    // Render loop
    let raf = 0;
    const render = () => {
      raf = requestAnimationFrame(render);
      controls.update();
      renderer.render(scene, camera);
      gizmoRef.current?.render?.();
    };
    render();

    const onResize = () => {
      if (!mountRef.current) return;
      const { clientWidth, clientHeight } = mountRef.current;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
      gizmoRef.current?.update?.();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mountRef.current);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      guiRef.current?.destroy();
      gizmoRef.current?.dispose?.();
      controls.dispose();
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      scene.clear();
      selectableMeshesRef.current = [];
      meshSettingsRef.current.clear();
      meshOriginalPositionsRef.current = [];
      currentRootRef.current = null;
    };
  }, []);

  // ---------- Cargar modelo externo ----------
  function loadModel(path: string) {
    const scene = sceneRef.current!;
    const root = new THREE.Group();
    root.name = "ModelRoot";
    scene.add(root);
    currentRootRef.current = root;

    const ext = path.split(".").pop()?.toLowerCase();

    if (ext === "gltf" || ext === "glb") {
      const loader = new GLTFLoader();
      loader.load(path, (gltf) => {
        root.add(gltf.scene);

        // Escalado automático
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3()).length();
        const scaleFactor = 10 / size;
        gltf.scene.scale.setScalar(scaleFactor);

        // Helpers de debug (opcional)
        // scene.add(new THREE.BoxHelper(gltf.scene, 0xffff00));
        // scene.add(new THREE.AxesHelper(5));

        gltf.scene.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              color: 0xcccccc,
              metalness: 0.2,
              roughness: 0.8,
            });
            selectableMeshesRef.current.push(mesh);
            meshSettingsRef.current.set(mesh, { color: "#cccccc", opacity: 1 });
            meshOriginalPositionsRef.current.push({
              mesh,
              original: mesh.position.clone(),
              direction: mesh.position.clone().normalize(),
            });
          }
        });

        frameCamera(gltf.scene);
        setupGUI();
      });
    } else if (ext === "stl") {
      const loader = new STLLoader();
      loader.load(path, (geometry) => {
        const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const mesh = new THREE.Mesh(geometry, mat);
        root.add(mesh);
        selectableMeshesRef.current.push(mesh);

        frameCamera(mesh);
        setupGUI();
      });
    }
  }

  useEffect(() => {
    if (!modelPath) return;
    if (currentRootRef.current) {
      sceneRef.current?.remove(currentRootRef.current);
    }
    selectableMeshesRef.current = [];
    meshOriginalPositionsRef.current = [];
    loadModel(modelPath);
  }, [modelPath]);

  // ---------- frameCamera ----------
  function frameCamera(root: THREE.Object3D) {
    const { camera, controls } = getThree();
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
  }

  // ---------- GUI ----------
  function setupGUI() {
    guiRef.current?.destroy();
    const gui = new GUI();
    guiRef.current = gui;

    const planes = planesRef.current;
    const clipState = clipStateRef.current;

    const meshOptions: Record<string, number> = {};
    selectableMeshesRef.current.forEach((m, i) => (meshOptions[m.name || `Mesh_${i}`] = i));

    gui.add(guiParamsRef.current, "selectedMesh", meshOptions).name("Target Mesh");

    gui
      .addColor(guiParamsRef.current, "color")
      .name("Color")
      .onChange((c: string) => {
        const mesh = selectableMeshesRef.current[guiParamsRef.current.selectedMesh];
        (mesh.material as THREE.MeshStandardMaterial).color.set(c);
      });

    gui
      .add(guiParamsRef.current, "opacity", 0, 1, 0.01)
      .name("Opacity")
      .onChange((v: number) => {
        const mesh = selectableMeshesRef.current[guiParamsRef.current.selectedMesh];
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = v;
        mat.transparent = v < 1;
        mat.needsUpdate = true;
      });

    gui
      .add(guiParamsRef.current, "explode", 0, 200, 0.1)
      .name("Explode")
      .onChange((v: number) => updateExplode(v));

    const axisNames = ["-X", "+X", "-Y", "+Y", "-Z", "+Z"];
    planes.forEach((pl, i) => {
      const folder = gui.addFolder(axisNames[i]);
      folder
        .add(clipState, `offset${i}`, -50, 50, 0.1)
        .name("Offset")
        .onChange((v: number) => (pl.constant = v));
      folder
        .add(clipState, `flip${i}`)
        .name("Flip")
        .onChange(() => {
          pl.negate();
          clipState[`offset${i}`] = pl.constant;
        });
      folder.open();
    });
  }

  function updateExplode(factor: number) {
    const planes = planesRef.current;
    meshOriginalPositionsRef.current.forEach(({ mesh, original, direction }) => {
      mesh.position.copy(original).add(direction.clone().multiplyScalar(factor));
    });
    selectableMeshesRef.current.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.clippingPlanes = factor === 0 ? planes : [];
      mat.needsUpdate = true;
    });
  }

  // ---------- UI ----------
  const handleHome = () => {
    const root = currentRootRef.current;
    if (root) frameCamera(root);
  };

  const handleScreenshot = () => {
    const renderer = rendererRef.current!;
    const dataURL = renderer.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "screenshot.png";
    link.click();
  };

  return (
    <div className="w-full h-full relative">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        <button
          onClick={handleHome}
          className="px-3 py-2 rounded bg-blue-600 text-white text-sm shadow hover:bg-blue-700"
          title="Home (frame model)"
        >
          🏠 Home
        </button>
        <button
          onClick={handleScreenshot}
          className="px-3 py-2 rounded bg-gray-700 text-white text-sm shadow hover:bg-gray-800"
          title="Screenshot"
        >
          📷 Screenshot
        </button>
      </div>
    </div>
  );
};

export default ThreeViewer;
