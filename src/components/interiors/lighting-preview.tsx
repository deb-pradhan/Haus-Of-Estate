"use client";

import { useId, useState } from "react";

const LAYERS = [
  { id: "ambient", title: "Ambient", detail: "Light for the whole room" },
  { id: "task", title: "Task", detail: "Focus for reading or working" },
  { id: "accent", title: "Accent", detail: "Draw attention to a detail" },
] as const;

export function LightingPreview() {
  const id = useId().replace(/:/g, "");
  const [layers, setLayers] = useState({ ambient: true, task: false, accent: false });
  const activeLayers = LAYERS.filter(layer => layers[layer.id]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/20 bg-[#163426]">
      <div className="flex items-center justify-between gap-5 px-5 pt-5 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-widest text-white/75">Try the layers</p>
        <span className="text-[10px] uppercase tracking-widest text-white/55">Illustrative room</span>
      </div>
      <div className="px-3 pt-3 sm:px-6" aria-hidden="true">
        <svg viewBox="0 0 600 345" className="w-full" fill="none">
          <defs>
            <radialGradient id={`${id}-ambient`}><stop stopColor="#f5d796" stopOpacity=".64" /><stop offset="1" stopColor="#f5d796" stopOpacity="0" /></radialGradient>
            <radialGradient id={`${id}-task`}><stop stopColor="#ffecb6" stopOpacity=".85" /><stop offset="1" stopColor="#e8c274" stopOpacity="0" /></radialGradient>
            <linearGradient id={`${id}-accent`} x1="450" y1="62" x2="450" y2="204" gradientUnits="userSpaceOnUse"><stop stopColor="#fff0ba" stopOpacity=".7" /><stop offset="1" stopColor="#ffe0a2" stopOpacity="0" /></linearGradient>
          </defs>
          <path d="M35 30H565V274H35V30Z" fill="#47604e" />
          <path d="M35 274H565L596 337H4L35 274Z" fill="#304a3a" />
          <ellipse cx="290" cy="186" rx="280" ry="190" fill={`url(#${id}-ambient)`} opacity={layers.ambient ? 1 : 0} className="transition-opacity duration-500 motion-reduce:transition-none" />
          <path d="M35 274H565M55 313H575" stroke="#d3d8be" strokeOpacity=".2" />
          <rect x="69" y="61" width="113" height="150" rx="54" fill="#1f3a2b" stroke="#a7b89c" strokeOpacity=".5" />
          <path d="M69 137H182M125 61V211" stroke="#a7b89c" strokeOpacity=".45" />
          <rect x="217" y="177" width="192" height="88" rx="18" fill="#b3b8a0" />
          <path d="M202 220C202 213 208 207 215 207H224V247H402V207H411C418 207 424 213 424 220V274H202V220Z" fill="#7f977b" />
          <path d="M240 185V243M311 185V243M383 185V243" stroke="#5b7257" strokeOpacity=".3" />
          <path d="M217 274V289M408 274V289" stroke="#bac3a6" strokeWidth="5" />
          <ellipse cx="319" cy="295" rx="55" ry="12" fill="#203a2a" />
          <ellipse cx="319" cy="281" rx="55" ry="12" fill="#c8c3a8" />
          <path d="M319 292V310" stroke="#c8c3a8" strokeWidth="3" />
          <rect x="438" y="85" width="69" height="99" rx="1" fill="#66775b" stroke="#c8c3a8" strokeWidth="3" />
          <path d="M449 166L469 103L499 166H449Z" fill="#acb396" />
          <path d="M461 166L490 117L499 166" fill="#314d38" />
          <path d="M467 61L420 204H525L479 61H467Z" fill={`url(#${id}-accent)`} opacity={layers.accent ? 1 : 0} className="transition-opacity duration-500 motion-reduce:transition-none" />
          <rect x="455" y="56" width="36" height="6" rx="3" fill={layers.accent ? "#f9e3a9" : "#a8ad91"} />
          <ellipse cx="199" cy="224" rx="111" ry="80" fill={`url(#${id}-task)`} opacity={layers.task ? 1 : 0} className="transition-opacity duration-500 motion-reduce:transition-none" />
          <path d="M169 279V137M149 280H189" stroke="#cec8a8" strokeWidth="3" />
          <path d="M139 140L149 110H184L197 140H139Z" fill={layers.task ? "#f9e3a9" : "#b9b69b"} />
          <path d="M310 30V57" stroke="#cec8a8" strokeWidth="2" />
          <path d="M277 79C277 65 292 55 310 55C328 55 343 65 343 79H277Z" fill={layers.ambient ? "#f9e3a9" : "#b9b69b"} />
        </svg>
      </div>
      <div className="border-t border-white/15 p-5 sm:p-6">
        <div role="group" aria-label="Lighting preview layers" className="grid grid-cols-3 gap-2">
          {LAYERS.map(layer => <button key={layer.id} type="button" aria-pressed={layers[layer.id]} onClick={() => setLayers(current => ({ ...current, [layer.id]: !current[layer.id] }))} className={`min-h-12 rounded-lg border px-2 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${layers[layer.id] ? "border-[#ead7a7] bg-[#ead7a7] text-[#163426]" : "border-white/30 text-white/80 hover:border-white/70"}`}>{layer.title}</button>)}
        </div>
        <p aria-live="polite" aria-atomic="true" className="mt-4 min-h-10 text-xs leading-5 text-white/75">{activeLayers.length ? `${activeLayers.map(layer => layer.title).join(" + ")}. ${activeLayers.map(layer => layer.detail).join("; ")}.` : "All layers off. Add a layer to explore its effect."}</p>
        <p className="mt-2 text-[11px] leading-5 text-white/50">A concept to explore lighting, not a completed Haus project or a technical lighting plan.</p>
      </div>
    </div>
  );
}
