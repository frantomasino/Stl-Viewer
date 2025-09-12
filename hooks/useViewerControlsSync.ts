import { useEffect } from "react";
import * as THREE from "three";
import type { ControlsState } from "@/components/ControlsPanel";

// Alias compatible para refs (evita warnings de tipos entre RefObject y MutableRefObject)
type RRef<T> = React.RefObject<T> | React.MutableRefObject<T | null>;
type RRefVal<T> = React.MutableRefObject<T>;

type RefsBundle = {
  sceneRef: RRef<THREE.Scene>;
  planesRef: RRefVal<THREE.Plane[]>; // array mutable, no null
  clipStateRef: React.MutableRefObject<Record<string, number | boolean>>;
  selectableMeshesRef: React.MutableRefObject<THREE.Mesh[]>;
  meshSettingsRef: React.MutableRefObject<Map<THREE.Mesh, { color: string; opacity: number }>>;
  explodeFactorRef: React.MutableRefObject<number>;
  currentRootRef: RRef<THREE.Object3D>;
};

type Callbacks = {
  updateExplode: () => void;
  isExploding: () => boolean;
  alignPlanesToCurrentModel: () => void;
  updateClipOffsetControllersRangeFromRoot?: (root: THREE.Object3D) => { min: number; max: number } | void;
  setSceneClippingEnabled: (on: boolean) => void;
  updateClippingState: () => void;
};

export function useViewerControlsSync(
  refs: RefsBundle,
  controls: ControlsState,
  setControls: (u: Partial<ControlsState>) => void,
  cbs: Callbacks
) {
  const {
    sceneRef,
    planesRef,
    clipStateRef,
    selectableMeshesRef,
    meshSettingsRef,
    explodeFactorRef,
    currentRootRef,
  } = refs;

  const {
    updateExplode,
    isExploding,
    alignPlanesToCurrentModel,
    updateClipOffsetControllersRangeFromRoot,
    setSceneClippingEnabled,
    updateClippingState,
  } = cbs;

  // helper para obtener el valor real desde un RRef<T>
  const getRef = <T,>(r: RRef<T>) => ("current" in r ? r.current : null);

  // 1) Habilitar clipping global
  useEffect(() => {
    setSceneClippingEnabled(true);
  }, [setSceneClippingEnabled]);

  // 2) Cambia el mesh seleccionado → sincroniza color/opacity guardados por mesh
  useEffect(() => {
    const i = controls.selectedMesh;
    if (i < 0) return;
    const mesh = selectableMeshesRef.current[i];
    if (!mesh) return;

    const mat = mesh.material as THREE.MeshStandardMaterial;
    const current = meshSettingsRef.current.get(mesh) || {
      color: `#${mat.color.getHexString()}`,
      opacity: mat.opacity ?? 1,
    };

    if (controls.color !== current.color || controls.opacity !== current.opacity) {
      setControls({ color: current.color, opacity: current.opacity });
    }

    if (!isExploding()) updateClippingState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls.selectedMesh]);

  // 3) Clip Only Target
  useEffect(() => {
    if (!isExploding()) updateClippingState();
  }, [controls.clipSelectedOnly, isExploding, updateClippingState]);

  // 4) Color
  useEffect(() => {
    const i = controls.selectedMesh;
    const mesh = selectableMeshesRef.current[i];
    if (!mesh) return;

    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (mat?.color) {
      mat.side = THREE.DoubleSide;
      try {
        mat.color.set(controls.color);
      } catch {}
      meshSettingsRef.current.set(mesh, {
        color: controls.color,
        opacity: mat.opacity ?? 1,
      });
    }
  }, [controls.color, selectableMeshesRef, meshSettingsRef]);

  // 5) Opacity
  useEffect(() => {
    const i = controls.selectedMesh;
    const mesh = selectableMeshesRef.current[i];
    if (!mesh) return;

    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (mat) {
      mat.opacity = controls.opacity;
      mat.transparent = controls.opacity < 1;
      mat.side = THREE.DoubleSide;
      mat.needsUpdate = true;
      meshSettingsRef.current.set(mesh, {
        color: `#${mat.color.getHexString()}`,
        opacity: controls.opacity,
      });
    }
  }, [controls.opacity, selectableMeshesRef, meshSettingsRef]);

  // 6) Explode → gestiona clipping on/off y reposiciona
  useEffect(() => {
    explodeFactorRef.current = controls.explode;
    updateExplode();

    if (isExploding()) {
      const scene = getRef(sceneRef);
      scene?.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (!m.isMesh) return;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat.clippingPlanes && mat.clippingPlanes.length) {
          mat.clippingPlanes = [];
          mat.needsUpdate = true;
          mat.side = THREE.DoubleSide;
        }
      });
    } else {
      alignPlanesToCurrentModel();
      const planes = planesRef.current;
      const scene = getRef(sceneRef);
      scene?.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (!m.isMesh) return;
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.clippingPlanes = planes;
        mat.needsUpdate = true;
        mat.side = THREE.DoubleSide;
      });
      updateClippingState();
    }
  }, [
    controls.explode,
    explodeFactorRef,
    updateExplode,
    isExploding,
    sceneRef,
    planesRef,
    alignPlanesToCurrentModel,
    updateClippingState,
  ]);

  // === NUEVO: RANGOS DOBLES ===
  // Mantiene planes[0..5].constant en sync con rangeX/Y/Z
  useEffect(() => {
    const p = planesRef.current;
    if (!p || p.length < 6) return;
    // -X (0) y +X (1)
    p[0].constant = controls.rangeX[0];
    p[1].constant = controls.rangeX[1];
    // opcional: reflejar en clipState si lo usás (para compatibilidad)
    clipStateRef.current.offset0 = p[0].constant;
    clipStateRef.current.offset1 = p[1].constant;

    if (!isExploding()) updateClippingState();
  }, [controls.rangeX, planesRef, clipStateRef, isExploding, updateClippingState]);

  useEffect(() => {
    const p = planesRef.current;
    if (!p || p.length < 6) return;
    // -Y (2) y +Y (3)
    p[2].constant = controls.rangeY[0];
    p[3].constant = controls.rangeY[1];
    clipStateRef.current.offset2 = p[2].constant;
    clipStateRef.current.offset3 = p[3].constant;

    if (!isExploding()) updateClippingState();
  }, [controls.rangeY, planesRef, clipStateRef, isExploding, updateClippingState]);

  useEffect(() => {
    const p = planesRef.current;
    if (!p || p.length < 6) return;
    // -Z (4) y +Z (5)
    p[4].constant = controls.rangeZ[0];
    p[5].constant = controls.rangeZ[1];
    clipStateRef.current.offset4 = p[4].constant;
    clipStateRef.current.offset5 = p[5].constant;

    if (!isExploding()) updateClippingState();
  }, [controls.rangeZ, planesRef, clipStateRef, isExploding, updateClippingState]);

  // === NUEVO: FLIPS ===
  // Cada flip niega el plano y re-sincroniza el rango correspondiente.
  useEffect(() => {
    const p = planesRef.current;
    if (!p || p.length < 6) return;

    let changed = false;

    const applyFlip = (idx: number, flipped: boolean) => {
      if (!flipped) return;
      p[idx].negate();
      clipStateRef.current[`flip${idx}`] = false;
      changed = true;
    };

    applyFlip(0, controls.flip0);
    applyFlip(1, controls.flip1);
    applyFlip(2, controls.flip2);
    applyFlip(3, controls.flip3);
    applyFlip(4, controls.flip4);
    applyFlip(5, controls.flip5);

    if (changed) {
      // Releer constants y empujar al estado (mantener slider en su lugar actualizado)
      setControls({
        rangeX: [p[0].constant, p[1].constant],
        rangeY: [p[2].constant, p[3].constant],
        rangeZ: [p[4].constant, p[5].constant],
        flip0: false, flip1: false, flip2: false, flip3: false, flip4: false, flip5: false,
      });
      if (!isExploding()) updateClippingState();
    }
  }, [
    controls.flip0, controls.flip1, controls.flip2, controls.flip3, controls.flip4, controls.flip5,
    planesRef, clipStateRef, setControls, isExploding, updateClippingState,
  ]);

  // 8) Cuando cambia currentRoot, actualizar rangos de offset (si tenés ese callback)
  useEffect(() => {
    const root = getRef(currentRootRef);
    if (!root || !updateClipOffsetControllersRangeFromRoot) return;
    updateClipOffsetControllersRangeFromRoot(root);
  }, [currentRootRef, updateClipOffsetControllersRangeFromRoot]);
}
