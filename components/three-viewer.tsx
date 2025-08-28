"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { ViewportGizmo } from "three-viewport-gizmo";

type MeshSettings = { color: string; opacity: number };
type ExplodeItem = { mesh: THREE.Mesh; original: THREE.Vector3; direction: THREE.Vector3 };

const ThreeViewer: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Three refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentRootRef = useRef<THREE.Object3D | null>(null);
  const gizmoRef = useRef<any>(null);

  // Clipping + selección
  const planesRef = useRef<THREE.Plane[]>([]);
  const clipStateRef = useRef<Record<string, any>>({});
  const selectableMeshesRef = useRef<THREE.Mesh[]>([]);
  const meshSettingsRef = useRef<Map<THREE.Mesh, MeshSettings>>(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const selectedMeshIndexRef = useRef<number>(0);

  // Explode
  const explodeFactorRef = useRef<number>(0);
  const meshOriginalPositionsRef = useRef<ExplodeItem[]>([]);

  // GUI
  const guiRef = useRef<GUI | null>(null);
  const meshSelectorControllerRef = useRef<any>(null);
  const colorControllerRef = useRef<any>(null);
  const transparencyControllerRef = useRef<any>(null);

  const guiParamsRef = useRef({
    color: "#FFC107",
    opacity: 1,
    clipSelectedOnly: false,
    selectedMesh: 0,
  });

  const getThree = () => ({
    scene: sceneRef.current!,
    camera: cameraRef.current!,
    renderer: rendererRef.current!,
    controls: controlsRef.current!,
    planes: planesRef.current,
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
      500
    );
    camera.position.set(5, 5, 5);
    cameraRef.current = camera;

    // preserveDrawingBuffer => screenshot ok
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      stencil: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.localClippingEnabled = true;
    renderer.sortObjects = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controlsRef.current = controls;

    // Gizmo
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

    // Modelo DEMO (sin GLTF)
    createDemoModel();

    // Picking
    const onCanvasClick = (event: MouseEvent) => {
      const { renderer, camera } = getThree();
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      mouseRef.current.set(x, y);

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(
        selectableMeshesRef.current.filter((m) => {
          const mat = m.material as THREE.MeshStandardMaterial;
          return m.visible !== false && (mat.opacity ?? 1) > 0.001;
        })
      );

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        const idx = selectableMeshesRef.current.indexOf(mesh);
        selectedMeshIndexRef.current = idx;
        guiParamsRef.current.selectedMesh = idx;

        const mat = mesh.material as THREE.MeshStandardMaterial;
        guiParamsRef.current.color = `#${mat.color.getHexString()}`;
        guiParamsRef.current.opacity = mat.opacity;

        meshSelectorControllerRef.current?.setValue(idx);
        colorControllerRef.current?.setValue(guiParamsRef.current.color);
        transparencyControllerRef.current?.setValue(guiParamsRef.current.opacity);

        updateClippingState();
      }
    };
    renderer.domElement.addEventListener("click", onCanvasClick);

    // Render loop
    let raf = 0;
    const render = () => {
      raf = requestAnimationFrame(render);
      controls.update();
      renderer.render(scene, camera);
      gizmoRef.current?.render?.();
    };
    render();

    // Resize
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
      renderer.domElement.removeEventListener("click", onCanvasClick);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- DEMO MODEL (sin GLTF) ----------
  function createDemoModel() {
    const scene = sceneRef.current!;
    const planes = planesRef.current;

    // grupo raíz
    const root = new THREE.Group();
    root.name = "DemoRoot";
    scene.add(root);
    currentRootRef.current = root;

    // cuatro meshes separados para probar explode/selección
    const items: { geom: THREE.BufferGeometry; pos: [number, number, number]; name: string; color: string }[] = [
      { geom: new THREE.BoxGeometry(1, 1, 1), pos: [-1.5, 0, 0], name: "Box", color: "#9ad5ff" },
      { geom: new THREE.SphereGeometry(0.7, 32, 32), pos: [1.5, 0, 0], name: "Sphere", color: "#ffd59a" },
      { geom: new THREE.ConeGeometry(0.7, 1.2, 32), pos: [0, 0, 1.8], name: "Cone", color: "#c1ffa3" },
      { geom: new THREE.CylinderGeometry(0.4, 0.4, 1.4, 32), pos: [0, 0, -1.8], name: "Cylinder", color: "#ffb3c1" },
    ];

    items.forEach((it) => {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(it.color),
        metalness: 0.2,
        roughness: 0.7,
        transparent: true,
        opacity: 1,
        clippingPlanes: planes,
        clipShadows: true,
      });

      const mesh = new THREE.Mesh(it.geom, mat);
      mesh.position.set(...it.pos);
      mesh.name = it.name;
      root.add(mesh);
      selectableMeshesRef.current.push(mesh);
    });

    // computar direcciones para explode
    const modelBox = new THREE.Box3().setFromObject(root);
    const modelCenter = modelBox.getCenter(new THREE.Vector3());

    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const meshBox = new THREE.Box3().setFromObject(mesh);
        const meshCenter = meshBox.getCenter(new THREE.Vector3());
        const dir = new THREE.Vector3().subVectors(meshCenter, modelCenter).normalize();
        meshOriginalPositionsRef.current.push({
          mesh,
          original: mesh.position.clone(),
          direction: dir,
        });
        if (mesh.geometry && !mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
      }
    });

    // setear planos (offsets por bounding box)
    setupStencilCaps(root);
    // encuadrar cámara y GUI
    frameCamera(root);
    setupGUI();
  }

  // ---------- helpers ----------
  function frameCamera(root: THREE.Object3D) {
    const { camera, controls } = getThree();
    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length() || 1;
    camera.position.copy(center).add(new THREE.Vector3(1, 1, 1).multiplyScalar(size));
    controls.target.copy(center);
    controls.update();
  }

  function setupStencilCaps(root: THREE.Object3D) {
    const planes = planesRef.current;
    const clipState = clipStateRef.current;
    const box = new THREE.Box3().setFromObject(root);
    const def = [
      { n: new THREE.Vector3(1, 0, 0), c: -box.min.x },
      { n: new THREE.Vector3(-1, 0, 0), c: box.max.x },
      { n: new THREE.Vector3(0, 1, 0), c: -box.min.y },
      { n: new THREE.Vector3(0, -1, 0), c: box.max.y },
      { n: new THREE.Vector3(0, 0, 1), c: -box.min.z },
      { n: new THREE.Vector3(0, 0, -1), c: box.max.z },
    ];
    def.forEach((d, i) => {
      planes[i].normal.copy(d.n);
      planes[i].constant = d.c;
      clipState[`offset${i}`] = d.c;
    });
  }

  function updateClippingState() {
    const planes = planesRef.current;
    const selected = guiParamsRef.current.selectedMesh;
    const onlySelected = guiParamsRef.current.clipSelectedOnly;
    selectableMeshesRef.current.forEach((mesh, i) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.clippingPlanes = onlySelected && i !== selected ? [] : planes;
      mat.needsUpdate = true;
    });
  }

  function saveMeshSettings(mesh: THREE.Mesh) {
    const mat = mesh.material as THREE.MeshStandardMaterial;
    meshSettingsRef.current.set(mesh, {
      color: `#${mat.color.getHexString()}`,
      opacity: mat.opacity,
    });
  }

  function updateExplode() {
    const planes = planesRef.current;
    const factor = explodeFactorRef.current;
    meshOriginalPositionsRef.current.forEach(({ mesh, original, direction }) => {
      mesh.position.copy(original).add(direction.clone().multiplyScalar(factor));
    });
    selectableMeshesRef.current.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.clippingPlanes = factor === 0 ? planes : [];
      mat.needsUpdate = true;
    });
  }

  function setupGUI() {
    guiRef.current?.destroy();
    const gui = new GUI();
    guiRef.current = gui;

    const planes = planesRef.current;
    const clipState = clipStateRef.current;

    const meshOptions: Record<string, number> = {};
    selectableMeshesRef.current.forEach((m, i) => (meshOptions[m.name || `Mesh_${i}`] = i));
    guiParamsRef.current.selectedMesh = 0;

    meshSelectorControllerRef.current = gui
      .add(guiParamsRef.current, "selectedMesh", meshOptions)
      .name("Target Mesh")
      .onChange((i: number) => {
        const mesh = selectableMeshesRef.current[i];
        const mat = mesh.material as THREE.MeshStandardMaterial;
        guiParamsRef.current.color = `#${mat.color.getHexString()}`;
        guiParamsRef.current.opacity = mat.opacity;
        colorControllerRef.current?.setValue(guiParamsRef.current.color);
        transparencyControllerRef.current?.setValue(guiParamsRef.current.opacity);
        updateClippingState();
      });

    gui
      .add(guiParamsRef.current, "clipSelectedOnly")
      .name("Clip Only Target")
      .onChange(() => updateClippingState());

    colorControllerRef.current = gui
      .addColor(guiParamsRef.current, "color")
      .name("Color")
      .onChange((c: string) => {
        const mesh = selectableMeshesRef.current[guiParamsRef.current.selectedMesh];
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.color.set(c);
        saveMeshSettings(mesh);
      });

    transparencyControllerRef.current = gui
      .add(guiParamsRef.current, "opacity", 0, 1, 0.01)
      .name("Opacity")
      .onChange((v: number) => {
        const mesh = selectableMeshesRef.current[guiParamsRef.current.selectedMesh];
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = v;
        mat.transparent = v < 1;
        mat.depthWrite = v === 1;
        mat.needsUpdate = true;
        saveMeshSettings(mesh);
      });

    gui
      .add({ explode: 0 }, "explode", 0, 200, 0.01)
      .name("Explode")
      .onChange((v: number) => {
        explodeFactorRef.current = v;
        updateExplode();
      });

    const axisNames = ["-X", "+X", "-Y", "+Y", "-Z", "+Z"];
    planes.forEach((pl, i) => {
      const folder = gui.addFolder(axisNames[i]);
      folder
        .add(clipState, `offset${i}`, -1, 1, 0.001)
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

  // ---------- UI botones flotantes ----------
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
      <div className="absolute top-3 right-3 flex gap-2">
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
