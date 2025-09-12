"use client";
import React from "react";

export type Limits = { min: number; max: number };

export type ControlsState = {
  selectedMesh: number;
  meshNames: string[];

  clipSelectedOnly: boolean;
  color: string;
  opacity: number;
  explode: number;

  // “window” en coords del eje (no en constantes de los planos)
  windowX: [number, number];
  windowY: [number, number];
  windowZ: [number, number];

  limits: { x: Limits; y: Limits; z: Limits };
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
  swapKnobs = false, // si true, el eje visual va de max→min (izq = valor alto)
}: {
  title: string;
  value: [number, number];
  limits: Limits;
  onChange: (v: [number, number]) => void;
  swapKnobs?: boolean;
}) {
  const [minV, maxV] = value;
  const trackRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef<null | "min" | "max">(null);

  const span = Math.max(1e-12, limits.max - limits.min);
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  // porcentaje “lineal”
  const toPct = (val: number) => ((val - limits.min) / span) * 100;
  // porcentaje visual (si swapKnobs: espejado)
  const toPosPct = (val: number) => (swapKnobs ? 100 - toPct(val) : toPct(val));

  // Corrige estados degenerados
  React.useEffect(() => {
    const bothMax = Math.abs(minV - limits.max) < 1e-9 && Math.abs(maxV - limits.max) < 1e-9;
    const bothMin = Math.abs(minV - limits.min) < 1e-9 && Math.abs(maxV - limits.min) < 1e-9;
    if (bothMax || bothMin || minV > maxV) {
      onChange([limits.min, limits.max]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limits.min, limits.max]);

  // mapea pixel → valor (si swapKnobs: invierte el dominio)
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
    if (dragging.current === "min") {
      onChange([Math.min(v, maxV), maxV]);
    } else if (dragging.current === "max") {
      onChange([minV, Math.max(v, minV)]);
    }
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

  const setMinTxt = (txt: string) => {
    const v = Number.parseFloat(txt);
    if (Number.isFinite(v)) onChange([clamp(Math.min(v, maxV), limits.min, limits.max), maxV]);
  };
  const setMaxTxt = (txt: string) => {
    const v = Number.parseFloat(txt);
    if (Number.isFinite(v)) onChange([minV, clamp(Math.max(v, minV), limits.min, limits.max)]);
  };

  // posiciones en %
  const pMin = toPosPct(minV);
  const pMax = toPosPct(maxV);
  const leftFill = Math.min(pMin, pMax);
  const rightFill = 100 - Math.max(pMin, pMax);

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-300">▼ {title}</span>
        <span className="text-[10px] text-gray-400">
          {minV.toFixed(5)} … {maxV.toFixed(5)}
        </span>
      </div>

      <div ref={trackRef} className="relative h-6 select-none" onMouseDown={onTrackClick}>
        <div className="absolute inset-y-2 left-0 right-0 rounded bg-gray-600" />
        <div className="absolute inset-y-2 rounded bg-gray-300" style={{ left: `${leftFill}%`, right: `${rightFill}%` }} />

        {/* knob MIN (puede quedar a la derecha si swapKnobs) */}
        <div
          className="absolute top-1 w-4 h-4 rounded-full bg-white border border-gray-700 cursor-pointer z-10"
          style={{ left: `calc(${pMin}% - 8px)` }}
          onMouseDown={start("min")}
        />
        {/* knob MAX (puede quedar a la izquierda si swapKnobs) */}
        <div
          className="absolute top-1 w-4 h-4 rounded-full bg-white border border-gray-700 cursor-pointer z-10"
          style={{ left: `calc(${pMax}% - 8px)` }}
          onMouseDown={start("max")}
        />
      </div>

      <div className="flex items-center gap-2 mt-2">
        <input
          value={minV.toFixed(5)}
          onChange={(e) => setMinTxt(e.target.value)}
          className="w-24 h-6 bg-gray-700 border border-gray-600 rounded px-2 text-xs"
        />
        <input
          value={maxV.toFixed(5)}
          onChange={(e) => setMaxTxt(e.target.value)}
          className="w-24 h-6 bg-gray-700 border border-gray-600 rounded px-2 text-xs"
        />
      </div>
    </div>
  );
}



export default function ControlsPanel({ controls, onControlsChange }: Props) {
  const [pos, setPos] = React.useState(() => ({
    x: typeof window !== "undefined" ? window.innerWidth - 320 : 0,
    y: 20,
  }));
  const [drag, setDrag] = React.useState<{ on: boolean; dx: number; dy: number }>({ on: false, dx: 0, dy: 0 });

  const onHeaderDown = (e: React.MouseEvent) =>
    setDrag({ on: true, dx: e.clientX - pos.x, dy: e.clientY - pos.y });

  React.useEffect(() => {
    const mm = (e: MouseEvent) => {
      if (!drag.on) return;
      const maxX = (typeof window !== "undefined" ? window.innerWidth : 1200) - 320;
      const maxY = (typeof window !== "undefined" ? window.innerHeight : 800) - 100;
      setPos({ x: Math.max(0, Math.min(e.clientX - drag.dx, maxX)), y: Math.max(0, Math.min(e.clientY - drag.dy, maxY)) });
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

  return (
    <div
      className="w-80 bg-gray-800 text-white overflow-y-auto border border-gray-600 rounded-lg shadow-2xl"
      style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 1000, maxHeight: "calc(100vh - 40px)" }}
    >
      <div
        className="flex items-center justify-between p-3 bg-gray-700 cursor-move rounded-t-lg border-b border-gray-600"
        onMouseDown={onHeaderDown}
      >
        <span className="text-sm text-gray-200">✓ Controles</span>
        <span className="text-xs text-gray-400">⋮⋮</span>
      </div>

      <div className="p-3 text-xs space-y-3">
        {/* Target Mesh */}
        <div>
          <div className="text-gray-400 mb-1">Target Mesh</div>
          <select
            className="w-full h-7 bg-gray-700 border border-gray-600 rounded px-2"
            value={String(controls.selectedMesh)}
            onChange={(e) => onControlsChange({ selectedMesh: Number.parseInt(e.target.value) || 0 })}
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
            onChange={(e) => onControlsChange({ clipSelectedOnly: e.target.checked })}
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
            <input value={controls.color} readOnly className="h-6 flex-1 bg-gray-700 border border-gray-600 rounded px-2 text-xs" />
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
            onChange={(e) => onControlsChange({ opacity: Number.parseFloat(e.target.value) })}
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
            onChange={(e) => onControlsChange({ explode: Number.parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Rangos dobles (en coordenadas del modelo) */}
        <DualRange
          title="R"
          value={controls.windowX}
          limits={controls.limits.x}
          onChange={(v) => onControlsChange({ windowX: v })}
        />
        <DualRange
          title="A"
          value={controls.windowZ}
          limits={controls.limits.z}
          onChange={(v) => onControlsChange({ windowZ: v })}
          swapKnobs={true}
        />
        <DualRange
          title="S"
          value={controls.windowY}
          limits={controls.limits.y}
          onChange={(v) => onControlsChange({ windowY: v })}
           swapKnobs={true}
        />
      </div>
    </div>
  );
}
