"use client";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

const COLORS = [0x1976d2, 0xd32f2f, 0xffffff, 0x888888, 0xffeb3b];
const STL_FILES = ["modelo.stl"]; // mismo que tu main.js

export default function LegacyViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // ---- Styles del index.html (inline para no tocar globals) ----
    const style = document.createElement("style");
    style.innerHTML = `
      * { margin:0; padding:0; box-sizing:border-box; }
      body { overflow:hidden; }
      .legacy-root { position:relative; width:100vw; height:100vh; font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      .legacy-info {
        position:absolute; top:20px; left:20px; color:#fff; background:rgba(0,0,0,0.7); padding:15px; border-radius:10px; z-index:100; backdrop-filter:blur(10px);
      }
      .legacy-info h1 { margin-bottom:10px; font-size:24px; }
      .legacy-info p { margin-bottom:5px; font-size:14px; }
      .legacy-controls {
        position:absolute; bottom:20px; left:20px; color:#fff; background:rgba(0,0,0,0.7); padding:15px; border-radius:10px; z-index:100; backdrop-filter:blur(10px);
      }
      .legacy-controls h3 { margin-bottom:10px; }
      .legacy-controls ul { list-style:none; font-size:12px; }
      .legacy-controls li { margin-bottom:3px; }
      #clip-sliders {
        position:absolute; right:20px; top:20px; z-index:200; display:flex; flex-direction:column; gap:8px; background:rgba(0,0,0,0.2); padding:10px 12px; border-radius:10px;
      }
      #clip-sliders label { color:#fff; margin-right:8px; font-size:13px; width:80px; }
      #clip-sliders input[type="range"] { width:180px; }
    `;
    document.head.appendChild(style);

    // ---- DOM base (como tu index.html) ----
    const root = document.createElement("div");
    root.className = "legacy-root";

    const info = document.createElement("div");
    info.className = "legacy-info";
    info.innerHTML = `
      <h1>🚀 Proyecto Three.js</h1>
      <p>Escena 3D interactiva</p>
      <p>FPS: <span id="fps">0</span></p>
    `;
    root.appendChild(info);

    const controlsBox = document.createElement("div");
    controlsBox.className = "legacy-controls";
    controlsBox.innerHTML = `
      <h3>🎮 Controles:</h3>
      <ul>
        <li>🖱️ Click + arrastrar: Rotar cámara</li>
        <li>🔍 Scroll: Zoom</li>
        <li>⌨️ WASD: Mover cámara</li>
      </ul>
    `;
    root.appendChild(controlsBox);

    const mount = document.createElement("div");
    mount.id = "legacy-canvas-mount";
    mount.style.position = "absolute";
    mount.style.inset = "0";
    root.appendChild(mount);

    containerRef.current.appendChild(root);

    // ---- Tu main.js adaptado ----
    let scene: THREE.Scene,
      camera: THREE.PerspectiveCamera,
      renderer: THREE.WebGLRenderer,
      controls: OrbitControls;
    let stlMeshes: THREE.Mesh[] = [];
    let clock = new THREE.Clock();
    let clippingPlanes: any = { xmin: null, xmax: null, ymin: null, ymax: null, zmin: null, zmax: null };
    let globalBoundingBox: THREE.Box3 | null = null;
    let stlFilesLoaded = 0;
    let stlFilesAttempted = 0;
    const fpsEl = info.querySelector("#fps") as HTMLSpanElement;

    function init() {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a2e);

      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 5, 20);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.localClippingEnabled = true;
      mount.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
      scene.add(ambientLight);

      stlFilesLoaded = 0;
      stlFilesAttempted = 0;
      stlMeshes = [];
      STL_FILES.forEach((filename) => {
        loadSTL(`/GLTF/${filename}`, () => {
          stlFilesLoaded++;
          stlFilesAttempted++;
          checkSTLLoadingComplete();
        }, () => {
          stlFilesAttempted++;
          checkSTLLoadingComplete();
        });
      });

      window.addEventListener("resize", onWindowResize);
      animate();
    }

    function loadSTL(path: string, onSuccess?: () => void, onError?: (e?: any) => void) {
      const loader = new STLLoader();
      loader.load(
        path,
        function (geometry) {
          geometry.computeBoundingBox();
          const color = COLORS[Math.floor(Math.random() * COLORS.length)];
          const material = new THREE.MeshLambertMaterial({
            color,
            side: THREE.DoubleSide,
            clippingPlanes: [],
          });
          const mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);
          stlMeshes.push(mesh);

          if (!globalBoundingBox) {
            globalBoundingBox = geometry.boundingBox!.clone();
          } else {
            globalBoundingBox.union(geometry.boundingBox!);
          }
          onSuccess && onSuccess();
        },
        undefined,
        function (err) {
          onError && onError(err);
        },
      );
    }

    function checkSTLLoadingComplete() {
      if (stlFilesAttempted === STL_FILES.length) {
        if (stlMeshes.length > 0) {
          centerCameraAndSliders();
        }
      }
    }

    function centerCameraAndSliders() {
      if (!globalBoundingBox) return;
      const center = new THREE.Vector3();
      globalBoundingBox.getCenter(center);
      controls.target.copy(center);
      controls.update();

      const minX = globalBoundingBox.min.x;
      const maxX = globalBoundingBox.max.x;
      const minY = globalBoundingBox.min.y;
      const maxY = globalBoundingBox.max.y;
      const minZ = globalBoundingBox.min.z;
      const maxZ = globalBoundingBox.max.z;

      clippingPlanes.xmin = new THREE.Plane(new THREE.Vector3(1, 0, 0), -minX);
      clippingPlanes.xmax = new THREE.Plane(new THREE.Vector3(-1, 0, 0), maxX);
      clippingPlanes.ymin = new THREE.Plane(new THREE.Vector3(0, 1, 0), -minY);
      clippingPlanes.ymax = new THREE.Plane(new THREE.Vector3(0, -1, 0), maxY);
      clippingPlanes.zmin = new THREE.Plane(new THREE.Vector3(0, 0, 1), -minZ);
      clippingPlanes.zmax = new THREE.Plane(new THREE.Vector3(0, 0, -1), maxZ);

      stlMeshes.forEach((mesh) => {
        (mesh.material as THREE.MeshLambertMaterial).clippingPlanes = [
          clippingPlanes.xmin,
          clippingPlanes.xmax,
          clippingPlanes.ymin,
          clippingPlanes.ymax,
          clippingPlanes.zmin,
          clippingPlanes.zmax,
        ];
        (mesh.material as THREE.MeshLambertMaterial).needsUpdate = true;
      });

      createClipSliders({ minX, maxX, minY, maxY, minZ, maxZ });
      createAdaptiveGround(center);
    }

    function createClipSliders(bounds: any) {
      const old = document.getElementById("clip-sliders");
      if (old && old.parentElement) old.parentElement.removeChild(old);

      const slidersContainer = document.createElement("div");
      slidersContainer.id = "clip-sliders";

      function addSlider(labelText: string, id: string, min: number, max: number, value: number, onInput: (e: any) => void) {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";

        const label = document.createElement("label");
        label.textContent = labelText;

        const slider = document.createElement("input");
        slider.type = "range";
        slider.id = id;
        slider.min = String(min);
        slider.max = String(max);
        slider.value = String(value);
        slider.step = "0.1";
        slider.oninput = onInput;

        wrapper.appendChild(label);
        wrapper.appendChild(slider);
        slidersContainer.appendChild(wrapper);
      }

      // X
      addSlider("Clip X min:", "clipXmin", bounds.minX, bounds.maxX, bounds.minX, (e) => {
        clippingPlanes.xmin.constant = -parseFloat(e.target.value);
      });
      addSlider("Clip X max:", "clipXmax", bounds.minX, bounds.maxX, bounds.maxX, (e) => {
        clippingPlanes.xmax.constant = parseFloat(e.target.value);
      });
      // Y
      addSlider("Clip Y min:", "clipYmin", bounds.minY, bounds.maxY, bounds.minY, (e) => {
        clippingPlanes.ymin.constant = -parseFloat(e.target.value);
      });
      addSlider("Clip Y max:", "clipYmax", bounds.minY, bounds.maxY, bounds.maxY, (e) => {
        clippingPlanes.ymax.constant = parseFloat(e.target.value);
      });
      // Z
      addSlider("Clip Z min:", "clipZmin", bounds.minZ, bounds.maxZ, bounds.minZ, (e) => {
        clippingPlanes.zmin.constant = -parseFloat(e.target.value);
      });
      addSlider("Clip Z max:", "clipZmax", bounds.minZ, bounds.maxZ, bounds.maxZ, (e) => {
        clippingPlanes.zmax.constant = parseFloat(e.target.value);
      });

      root.appendChild(slidersContainer);
    }

    function createAdaptiveGround(center: THREE.Vector3) {
      const prev = scene.getObjectByName("adaptiveGround");
      if (prev) scene.remove(prev);
      if (!globalBoundingBox) return;

      const width = globalBoundingBox.max.x - globalBoundingBox.min.x;
      const depth = globalBoundingBox.max.z - globalBoundingBox.min.z;
      const groundWidth = width * 1.2;
      const groundDepth = depth * 1.2;
      const groundY = globalBoundingBox.min.y - 0.01;

      const groundGeometry = new THREE.PlaneGeometry(groundWidth, groundDepth);
      const groundMaterial = new THREE.MeshLambertMaterial({
        color: 0x2c3e50,
        transparent: true,
        opacity: 0.8,
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = groundY;
      ground.name = "adaptiveGround";
      scene.add(ground);
    }

    function onWindowResize() {
      if (!renderer || !camera) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      requestAnimationFrame(animate);
      const deltaTime = clock.getDelta();
      controls.update();
      renderer.render(scene, camera);
      const fps = Math.round(1 / deltaTime);
      if (fpsEl) fpsEl.textContent = String(fps);
    }

    init();

    // Cleanup
    return () => {
      window.removeEventListener("resize", onWindowResize);
      if (renderer) {
        renderer.dispose();
        mount.removeChild(renderer.domElement);
      }
      document.head.removeChild(style);
      if (containerRef.current) containerRef.current.removeChild(root);
    };
  }, []);

  return <div ref={containerRef} />;
}
