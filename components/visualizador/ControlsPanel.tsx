"use client";
import React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button"; // ← AGREGADO

export type Limits = { min: number; max: number };

export type ControlsState = {
  selectedMesh: number;
  meshNames: string[];

  clipSelectedOnly: boolean;
  color: string;
  opacity: number;
  explode: number;

  // ventanas (coord del modelo)
  windowX: [number, number];
  windowY: [number, number];
  windowZ: [number, number];

  limits: { x: Limits; y: Limits; z: Limits };

  // opcional: helpers por eje (si ya los usás)
  showHelperR?: boolean;
  showHelperA?: boolean;
  showHelperS?: boolean;
};

type Props = {
  controls: ControlsState;
  onControlsChange: (u: Partial<ControlsState>) => void;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function DualRange({
  title,
  value,
  limits,
  onChange,
  swapKnobs = false,
  accent, // 'R' | 'A' | 'S'
}: {
  title: string;
  value: [number, number];
  limits: Limits;
  onChange: (v: [number, number]) => void;
  swapKnobs?: boolean;
  accent?: "R" | "A" | "S";
}) {
  const [minV, maxV] = value;
  const trackRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef<null | "min" | "max">(null);

  const span = Math.max(1e-12, limits.max - limits.min);
  const toPct = (val: number) => ((val - limits.min) / span) * 100;
  const toPosPct = (val: number) => (swapKnobs ? 100 - toPct(val) : toPct(val));

  React.useEffect(() => {
    const bothMax =
      Math.abs(minV - limits.max) < 1e-9 && Math.abs(maxV - limits.max) < 1e-9;
    const bothMin =
      Math.abs(minV - limits.min) < 1e-9 && Math.abs(maxV - limits.min) < 1e-9;
    if (bothMax || bothMin || minV > maxV) onChange([limits.min, limits.max]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limits.min, limits.max]);

  const clientXToValue = (clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r) return minV;
    const t = clamp((clientX - r.left) / r.width, 0, 1);
    return swapKnobs ? limits.max - t * span : limits.min + t * span;
  };

  const stepSnap = (v: number) => {
    const step = span / 1000;
    const q = limits.min + Math.round((v - limits.min) / step) * step;
    return clamp(q, limits.min, limits.max);
  };

  const start = (which: "min" | "max") => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = which;
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
  };

  const move = (e: MouseEvent) => {
    const v = stepSnap(clientXToValue(e.clientX));
    if (dragging.current === "min") onChange([Math.min(v, maxV), maxV]);
    else if (dragging.current === "max") onChange([minV, Math.max(v, minV)]);
  };

  const end = () => {
    dragging.current = null;
    window.removeEventListener("mousemove", move);
    window.removeEventListener("mouseup", end);
  };

  const onTrackClick = (e: React.MouseEvent) => {
    const v = stepSnap(clientXToValue(e.clientX));
    const dMin = Math.abs(v - minV);
    const dMax = Math.abs(v - maxV);
    if (dMin <= dMax) onChange([Math.min(v, maxV), maxV]);
    else onChange([minV, Math.max(v, minV)]);
  };

  const accentMap: Record<"R" | "A" | "S", string> = {
    R: "#ff3654b3",
    A: "#8ADB00b3",
    S: "#2C8FFFb3",
  };
  const fillColor = accent ? accentMap[accent] : "#9ca3af";

  const pMin = toPosPct(minV);
  const pMax = toPosPct(maxV);
  const leftFill = Math.min(pMin, pMax);
  const rightFill = 100 - Math.max(pMin, pMax);

  const knobStyle = accent ? { borderColor: fillColor } : {};

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-300">▼ {title}</span>
        </div>
      </div>

      <div
        ref={trackRef}
        className="relative h-6 select-none"
        onMouseDown={onTrackClick}
      >
        <div className="absolute inset-y-2 left-0 right-0 rounded bg-gray-600" />
        <div
          className="absolute inset-y-2 rounded"
          style={{
            left: `${leftFill}%`,
            right: `${rightFill}%`,
            backgroundColor: fillColor,
            opacity: 0.9,
          }}
        />
        <div
          className="absolute top-1 w-4 h-4 rounded-full bg-white border border-[2px] cursor-pointer z-10"
          style={{ left: `calc(${pMin}% - 8px)`, ...knobStyle }}
          onMouseDown={start("min")}
        />
        <div
          className="absolute top-1 w-4 h-4 rounded-full bg-white border border-[2px] cursor-pointer z-10"
          style={{ left: `calc(${pMax}% - 8px)`, ...knobStyle }}
          onMouseDown={start("max")}
        />
        {/* Etiquetas de extremos según RAS */}
        <div className="absolute -top-3 left-0 text-[10px] text-gray-400">
          {title === "R" ? "" : title === "A" ? "" : ""}
        </div>
        <div className="absolute -top-3 right-0 text-[10px] text-gray-400">
          {title === "R" ? "L" : title === "A" ? "P" : "I"}
        </div>
      </div>
    </div>
  );
}

export default function ControlsPanel({ controls, onControlsChange }: Props) {
  // estado de visibilidad/colapso/anclado (persistente)
  const [open, setOpen] = React.useState(true);
  const [collapsed, setCollapsed] = React.useState(true);
  const [pinned, setPinned] = React.useState(true);
  // guarda el estado de colapso “flotante” para restaurarlo al despinnear
  const prevCollapsedRef = React.useRef(false);

  React.useEffect(() => {
    const o = localStorage.getItem("controlsOpen");
    const c = localStorage.getItem("controlsCollapsed");
    const p = localStorage.getItem("controlsPinned");
    if (o != null) setOpen(o === "1");
    if (c != null) setCollapsed(c === "1");
    if (p != null) setPinned(p === "1");
  }, []);
  React.useEffect(
    () => localStorage.setItem("controlsOpen", open ? "1" : "0"),
    [open]
  );
  React.useEffect(
    () => localStorage.setItem("controlsCollapsed", collapsed ? "1" : "0"),
    [collapsed]
  );
  React.useEffect(
    () => localStorage.setItem("controlsPinned", pinned ? "1" : "0"),
    [pinned]
  );

  // hotkey C para mostrar/ocultar
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === "c" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // draggable (sólo cuando no está anclado)
  const [pos, setPos] = React.useState(() => ({
    x: typeof window !== "undefined" ? window.innerWidth - 320 : 0,
    y: 20,
  }));
  const [drag, setDrag] = React.useState<{
    on: boolean;
    dx: number;
    dy: number;
  }>({ on: false, dx: 0, dy: 0 });

  // ====== NUEVO: calcular pos a la IZQ del render sin esperar a un frame ======
  const calcSnapLeftPos = React.useCallback(() => {
    const anchor =
      document.getElementById("viewer-root") ||
      document.getElementById("three-viewer-root") ||
      document.getElementById("three-container") ||
      document.getElementById("canvas-root");

    if (anchor) {
      const r = anchor.getBoundingClientRect();
      return {
        x: Math.max(8, r.left + 8),   // pegado a la izq del viewer
        y: Math.max(56, r.top + 56),  // debajo del navbar
      };
    }
    return { x: 16, y: 56 };
  }, []);
  // ===========================================================================

  const onHeaderDown = (e: React.MouseEvent) => {
    if (pinned) return; // no drag cuando está anclado
    setDrag({ on: true, dx: e.clientX - pos.x, dy: e.clientY - pos.y });
  };

  React.useEffect(() => {
    const mm = (e: MouseEvent) => {
      if (!drag.on) return;
      const maxX =
        (typeof window !== "undefined" ? window.innerWidth : 1200) - 320;
      const maxY =
        (typeof window !== "undefined" ? window.innerHeight : 800) - 100;
      setPos({
        x: Math.max(0, Math.min(e.clientX - drag.dx, maxX)),
        y: Math.max(0, Math.min(e.clientY - drag.dy, maxY)),
      });
    };
    const mu = () => setDrag((d) => ({ ...d, on: false }));
    if (drag.on) {
      document.addEventListener("mousemove", mm);
      document.addEventListener("mouseup", mu);
    }
    return () => {
      document.removeEventListener("mousemove", mm);
      document.removeEventListener("mouseup", mu);
    };
  }, [drag, pos.x, pos.y]);

  // si está cerrado y no anclado, mostramos un FAB para reabrir
  if (!open && !pinned) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[1000] px-3 py-2 rounded-full bg-gray-800 border border-gray-600 text-white text-xs shadow-lg"
        title="Mostrar controles (C)"
      >
        Controles
      </button>
    );
  }

  // panel completo (contenido)
  const body = (
    <div className="p-3 text-xs space-y-3">
      {/* Target Mesh */}
      <div>
        <div className="text-gray-400 mb-1">Target Mesh</div>
        <select
          className="w-full h-7 bg-gray-700 border border-gray-600 rounded px-2"
          value={String(controls.selectedMesh)}
          onChange={(e) =>
            onControlsChange({
              selectedMesh: Number.parseInt(e.target.value) || 0,
            })
          }
        >
          {controls.meshNames.map((n, i) => (
            <option key={i} value={String(i)}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Clip Only Target */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={controls.clipSelectedOnly}
          onChange={(e) =>
            onControlsChange({ clipSelectedOnly: e.target.checked })
          }
        />
        <span className="text-gray-400">Clip Only Target</span>
      </label>

      {/* Color */}
      <div>
        <div className="text-gray-400 mb-1">Color</div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={controls.color}
            onChange={(e) => onControlsChange({ color: e.target.value })}
            className="h-6 w-12 border border-gray-600 rounded bg-gray-700"
          />
          <input
            value={controls.color}
            readOnly
            className="h-6 flex-1 bg-gray-700 border border-gray-600 rounded px-2 text-xs"
          />
        </div>
      </div>

      {/* Opacity */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-400">Opacity</span>
          <span className="text-gray-500">{controls.opacity.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={controls.opacity}
          onChange={(e) =>
            onControlsChange({ opacity: Number.parseFloat(e.target.value) })
          }
          className="w-full"
        />
      </div>

      {/* Explode */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-400">Explode</span>
          <span className="text-gray-500">{controls.explode.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={200}
          step={0.01}
          value={controls.explode}
          onChange={(e) =>
            onControlsChange({ explode: Number.parseFloat(e.target.value) })
          }
          className="w-full"
        />
      </div>

      {/* Rangos dobles (RAS) */}
      <DualRange
        title="R"
        value={controls.windowX}
        limits={controls.limits.x}
        onChange={(v) => onControlsChange({ windowX: v })}
        accent="R"
      />
      <DualRange
        title="A"
        value={controls.windowZ}
        limits={controls.limits.z}
        onChange={(v) => onControlsChange({ windowZ: v })}
        swapKnobs={true}
        accent="A"
      />
      <DualRange
        title="S"
        value={controls.windowY}
        limits={controls.limits.y}
        onChange={(v) => onControlsChange({ windowY: v })}
        swapKnobs={true}
        accent="S"
      />
    </div>
  );

  // panel “chrome” (header + body opcional)
  const panelChrome = (
    <div
      className="w-80 bg-gray-800 text-white overflow-y-auto border border-gray-600 rounded-lg shadow-2xl "
      style={
        pinned
          ? { position: "relative", maxHeight: "calc(100vh - 40px)" } // dentro del navbar dock
          : {
              position: "fixed",
              left: pos.x,
              top: pos.y,
              zIndex: 1000,
              maxHeight: "calc(100vh - 40px)",
            }
      }
    >
      <div
        className={`flex items-center justify-between p-3 ${
          pinned ? "cursor-default" : "cursor-move"
        } bg-gray-700 rounded-t-lg border-b border-gray-600`}
        onMouseDown={onHeaderDown}
      >
        <span className="text-sm text-gray-200">Controles</span>
        <div className="flex items-center gap-2 text-xs">
          <button
            title={collapsed ? "Maximizar (volver a flotante)" : "Minimizar"}
            onClick={(e) => {
              e.stopPropagation();

              if (pinned && collapsed) {
                // Estaba pineado y colapsado → “maximizar” = despinnear y volver a flotante
                setPos(calcSnapLeftPos());    // ← fijar pos ANTES
                setPinned(false);
                setCollapsed(false); // volvé expandido
                setOpen(true);
                return;
              }

              // Caso normal: toggle de colapso
              setCollapsed((v) => !v);
            }}
            className="px-2 py-1 rounded bg-gray-600 hover:bg-gray-500"
          >
            {collapsed ? "▢" : "—"}
          </button>
          <button
            title={pinned ? "Desanclar" : "Anclar al navbar"}
            onClick={(e) => {
              e.stopPropagation();
              setPinned((wasPinned) => {
                const nowPinned = !wasPinned;
                if (nowPinned) {
                  // me voy al navbar → colapso
                  prevCollapsedRef.current = collapsed; // (si querés recuperar luego)
                  setCollapsed(true);
                } else {
                  // vuelvo a flotante → fijar pos ANTES para evitar salto
                  setPos(calcSnapLeftPos());
                  setOpen(true);       // aseguro que se vea el header flotante
                  setCollapsed(true);  // lo dejás minimizado (si querés expandido poné false)
                }
                return nowPinned;
              });
            }}
            className="px-2 py-1 rounded bg-gray-600 hover:bg-gray-500"
          >
            📌
          </button>
        </div>
      </div>

      {!collapsed && body}
    </div>
  );

  // botón compacto para navbar cuando está pineado + colapsado
  const pinnedChip = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        // salir del navbar y volver flotante expandido SIN salto
        setPos(calcSnapLeftPos());  // ← fijar pos ANTES
        setPinned(false);
        setCollapsed(false);
        setOpen(true);
      }}
      className="whitespace-nowrap"
      title="Abrir controles"
    >
      📌 Controles
    </Button>
  );

  // si está “pinned”, lo renderizamos en el contenedor del navbar (si existe)
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const dockEl = mounted ? document.getElementById("controls-dock") : null;

  if (pinned && dockEl) {
    if (collapsed) return createPortal(pinnedChip, dockEl);
    return createPortal(panelChrome, dockEl);
  }
  return panelChrome;
}
