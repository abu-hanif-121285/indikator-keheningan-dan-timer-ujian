// ============================================================
// NoiseMeter — Meter tingkat suara (estimasi relatif 0–100)
// dengan penanda ambang batas & legenda status.
// ============================================================

import type { NoiseStatus, Thresholds } from "../types";
import { STATUS_COLORS, STATUS_LABELS } from "../types";
import { cn } from "../utils/cn";

interface Props {
  level: number;
  status: NoiseStatus;
  thresholds: Thresholds;
  micActive: boolean;
  compact?: boolean;
}

const LEGEND_ORDER: NoiseStatus[] = ["tenang", "terdeteksi", "berisik", "sangatBerisik"];

export function NoiseMeter({ level, status, thresholds, micActive, compact = false }: Props) {
  const shown = micActive ? level : 0;
  const color = micActive ? STATUS_COLORS[status] : "#94a3b8";

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-3">
        <p className={cn("font-extrabold tracking-wide text-navy-900", compact ? "text-sm md:text-base" : "text-sm md:text-lg")}>
          TINGKAT SUARA
        </p>
        <p className="text-[11px] md:text-xs font-semibold text-sky-600 bg-sky-100/80 rounded-full px-2.5 py-0.5">
          Estimasi Relatif
        </p>
      </div>

      <div className="relative mt-2.5">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-full bg-slate-200/90 ring-1 ring-inset ring-slate-300/60",
            compact ? "h-4 md:h-5" : "h-4 md:h-5"
          )}
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(shown)}
          aria-label="Tingkat suara kelas"
        >
          <div
            className="h-full rounded-full transition-[width,background-color] duration-200 ease-out"
            style={{ width: `${Math.min(100, Math.max(2, shown))}%`, backgroundColor: color }}
          >
            <div className="h-full w-full bg-gradient-to-b from-white/35 to-transparent" />
          </div>
          {micActive && (
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          )}
        </div>

        {/* Penanda ambang batas */}
        {([thresholds.quiet, thresholds.detected, thresholds.noisy] as const).map((t, i) => (
          <div
            key={i}
            className="absolute -top-1 -bottom-1 w-[3px] rounded-full bg-navy-900/35"
            style={{ left: `calc(${t}% - 1px)` }}
            aria-hidden
          />
        ))}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
          {LEGEND_ORDER.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-offset-1 ring-transparent"
                style={{
                  backgroundColor: STATUS_COLORS[s],
                  ...(micActive && s === status ? { boxShadow: `0 0 0 2px ${STATUS_COLORS[s]}55` } : {}),
                }}
              />
              <span
                className={cn(
                  "text-[11px] md:text-xs font-semibold",
                  micActive && s === status ? "text-navy-900" : "text-slate-500"
                )}
              >
                {STATUS_LABELS[s].legend}
              </span>
            </span>
          ))}
        </div>
        <p className="font-display text-base md:text-xl font-bold text-navy-900 tabular-nums">
          {String(Math.round(shown)).padStart(2, "0")}
          <span className="text-slate-400 text-xs md:text-sm font-semibold"> / 100</span>
        </p>
      </div>
    </div>
  );
}
