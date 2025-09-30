"use client";
import React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal  } from "lucide-react"

export type Limits = { min: number; max: number };

export type ControlsState = {
  selectedMesh: number;
  meshNames: string[];

  clipSelectedOnly: boolean;
  color: string;
  opacity: number;
  explode: number;

  windowX: [number, number];
  windowY: [number, number];
  windowZ: [number, number];

  limits: { x: Limits; y: Limits; z: Limits };

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

/* ===================== DualRange (pointer-ready SIN tocar estilos) ===================== */
function DualRange({
  title,
  value,
  limits,
  onChange,
  swapKnobs = false,
  accent,
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

  const move = (e: PointerEvent) => {
    e.preventDefault(); // evita scroll al arrastrar en mobile
    const v = stepSnap(clientXToValue(e.clientX));
    if (dragging.current === "min") onChange([Math.min(v, maxV), maxV]);
    else if (dragging.current === "max") onChange([minV, Math.max(v, minV)]);
  };

  const end = () => {
    dragging.current = null;
    window.removeEventListener("pointermove", move as any);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
  };

  const start =
    (which: "min" | "max") =>
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragging.current = which;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      window.addEventListener("pointermove", move as any, { passive: false });
      window.addEventListener("pointerup", end);
      window.addEventListener("pointercancel", end);
    };

  const onTrackPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const v = stepSnap(clientXToValue(e.clientX));
    const dMin = Math.abs(v - minV);
    const dMax = Math.abs(v - maxV);
    dragging.current = dMin <= dMax ? "min" : "max";
    window.addEventListener("pointermove", move as any, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    if (dragging.current === "min") onChange([Math.min(v, maxV), maxV]);
    else onChange([minV, Math.max(v, minV)]);
  };

  React.useEffect(() => () => end(), []);

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

      {/* MISMO MARKUP/CLASES – solo handlers + touch-none */}
      <div
        ref={trackRef}
        className="relative h-6 select-none touch-none"
        onPointerDown={onTrackPointerDown}
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
          className="absolute top-1 w-4 h-4 rounded-full bg-white border border-[2px] cursor-pointer z-10 touch-none"
          style={{ left: `calc(${pMin}% - 8px)`, ...knobStyle }}
          onPointerDown={start("min")}
        />
        <div
          className="absolute top-1 w-4 h-4 rounded-full bg-white border border-[2px] cursor-pointer z-10 touch-none"
          style={{ left: `calc(${pMax}% - 8px)`, ...knobStyle }}
          onPointerDown={start("max")}
        />
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
/* ====================================================================================== */

export default function ControlsPanel({ controls, onControlsChange }: Props) {
  const [open, setOpen] = React.useState(true);
  const [collapsed, setCollapsed] = React.useState(true);
  const [pinned, setPinned] = React.useState(true);
  const prevCollapsedRef = React.useRef(false);

  React.useEffect(() => {
    const o = localStorage.getItem("controlsOpen");
    const c = localStorage.getItem("controlsCollapsed");
    const p = localStorage.getItem("controlsPinned");
    if (o != null) setOpen(o === "1");
    if (c != null) setCollapsed(c === "1");
    if (p != null) setPinned(p === "1");
  }, []);
  React.useEffect(() => localStorage.setItem("controlsOpen", open ? "1" : "0"), [open]);
  React.useEffect(() => localStorage.setItem("controlsCollapsed", collapsed ? "1" : "0"), [collapsed]);
  React.useEffect(() => localStorage.setItem("controlsPinned", pinned ? "1" : "0"), [pinned]);

  // React.useEffect(() => {
  //   const onKey = (e: KeyboardEvent) => {
  //     if (e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) {
  //       setOpen((v) => !v);
  //     }
  //   };
  //   window.addEventListener("keydown", onKey);
  //   return () => window.removeEventListener("keydown", onKey);
  // }, []);

  const [pos, setPos] = React.useState(() => ({
    x: typeof window !== "undefined" ? window.innerWidth - 320 : 0,
    y: 20,
  }));
  const [drag, setDrag] = React.useState<{ on: boolean; dx: number; dy: number }>({
    on: false,
    dx: 0,
    dy: 0,
  });
const isInteractive = (el: Element | null) =>
  !!el && !!(el.closest("button, a, input, select, textarea, [role='button'], [data-no-drag]"));
  // cálculo de posición “snap” a la izquierda del viewer
  const calcSnapLeftPos = React.useCallback(() => {
    const anchor =
      document.getElementById("viewer-root") ||
      document.getElementById("three-viewer-root") ||
      document.getElementById("three-container") ||
      document.getElementById("canvas-root");

    if (anchor) {
      const r = anchor.getBoundingClientRect();
      return { x: Math.max(8, r.left + 8), y: Math.max(56, r.top + 56) };
    }
    return { x: 16, y: 56 };
  }, []);

  /* ============ DRAG DEL HEADER con Pointer Events (móvil + desktop) ============ */
  const onHeaderPointerDown = (e: React.PointerEvent) => {
    if (pinned) return; // si está anclado, no se arrastra
  if (isInteractive(e.target as Element)) return;     // ⟵ clave
  if (e.button !== 0) return; // sólo botón izquierdo
  e.preventDefault();
  e.stopPropagation();
  setDrag({ on: true, dx: e.clientX - pos.x, dy: e.clientY - pos.y });
  };
const onHeaderMouseDown = (e: React.MouseEvent) => {
  if (pinned) return;
  if (isInteractive(e.target as Element)) return;     // ⟵ clave
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  setDrag({ on: true, dx: e.clientX - pos.x, dy: e.clientY - pos.y });
};
  React.useEffect(() => {
    const mm = (e: PointerEvent) => {
      if (!drag.on) return;
      e.preventDefault(); // evita scroll mientras se arrastra en mobile
      const maxX = (typeof window !== "undefined" ? window.innerWidth : 1200) - 320;
      const maxY = (typeof window !== "undefined" ? window.innerHeight : 800) - 100;
      setPos({
        x: Math.max(0, Math.min(e.clientX - drag.dx, maxX)),
        y: Math.max(0, Math.min(e.clientY - drag.dy, maxY)),
      });
    };
    const mu = () => setDrag((d) => ({ ...d, on: false }));

    if (drag.on) {
      window.addEventListener("pointermove", mm as any, { passive: false });
      window.addEventListener("pointerup", mu);
      window.addEventListener("pointercancel", mu);
    }
    return () => {
      window.removeEventListener("pointermove", mm as any);
      window.removeEventListener("pointerup", mu);
      window.removeEventListener("pointercancel", mu);
    };
  }, [drag.on, drag.dx, drag.dy]);
  /* ============================================================================ */

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

  const body = (
    <div className="p-3 text-xs space-y-3">
      <div>
        <div className="text-gray-400 mb-1">Modelo</div>
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

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={controls.clipSelectedOnly}
          onChange={(e) =>
            onControlsChange({ clipSelectedOnly: e.target.checked })
          }
        />
        <span className="text-gray-400">Cortar selección</span>
      </label>

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

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-400">Opacidad</span>
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

      {/* RAS */}
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

  const panelChrome = (
    <div
      className="w-80 bg-gray-800 text-white overflow-y-auto border border-gray-600 rounded-lg shadow-2xl "
      style={
        pinned
          ? { position: "relative", maxHeight: "calc(100vh - 40px)" }
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
        onPointerDown={onHeaderPointerDown}     
        onMouseDown={onHeaderMouseDown}        /* ← antes onMouseDown */
        style={{ touchAction: "none" }}                 /* evita que el scroll robe el gesto */
      >
        <span className="text-sm text-gray-200">Controles</span>
        <div className="flex items-center gap-2 text-xs">
        
        <button
  type="button"
  title={collapsed ? "Maximizar (volver a flotante)" : "Minimizar"}
  onClick={(e) => {
    e.stopPropagation();

    if (pinned && collapsed) {
      setPos(calcSnapLeftPos());
      setPinned(false);
      setCollapsed(false);
      setOpen(true);
      return;
    }

    setCollapsed((v) => !v);
  }}
  className="px-2 py-1 rounded bg-gray-600 hover:bg-gray-500"
>
  {collapsed ? "▢" : "—"}
</button>

<button
  type="button"
  title={pinned ? "Desanclar" : "Anclar al navbar"}
  onClick={(e) => {
    e.stopPropagation();
    setPinned((wasPinned) => {
      const nowPinned = !wasPinned;
      if (nowPinned) {
        prevCollapsedRef.current = collapsed;
        setCollapsed(true);
      } else {
        setPos(calcSnapLeftPos());
        setOpen(true);
        setCollapsed(true);
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

  const pinnedChip = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        setPos(calcSnapLeftPos());
        setPinned(false);
        setCollapsed(false);
        setOpen(true);
      }}
      className="whitespace-nowrap"
      title="Abrir controles"
    >
      <SlidersHorizontal className="h-4 w-4" />
    </Button>
  );

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const dockEl = mounted ? document.getElementById("controls-dock") : null;

  if (pinned && dockEl) {
    if (collapsed) return createPortal(pinnedChip, dockEl);
    return createPortal(panelChrome, dockEl);
  }
  return panelChrome;
}
