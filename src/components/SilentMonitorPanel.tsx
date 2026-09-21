// ============================================================
// SilentMonitorPanel — Panel 1: robot, status keheningan,
// meter suara, dan kartu status mikrofon.
// ============================================================

import { AlertTriangle, Mic, MicOff, ShieldCheck, Volume1, Volume2, VolumeX, Waves } from "lucide-react";
import type { NoiseMonitor } from "../hooks/useNoiseMonitor";
import type { NoiseStatus, RobotState, Thresholds } from "../types";
import { STATUS_GRADIENTS, STATUS_LABELS } from "../types";
import { cn } from "../utils/cn";
import { NoiseMeter } from "./NoiseMeter";
import { RobotCharacter } from "./RobotCharacter";

interface Props {
  robotState: RobotState;
  level: number;
  status: NoiseStatus;
  thresholds: Thresholds;
  mic: NoiseMonitor;
  animationsEnabled: boolean;
  showMeter: boolean;
  onToggleMic: () => void;
}

const STATUS_ICONS: Record<NoiseStatus, typeof VolumeX> = {
  tenang: VolumeX,
  terdeteksi: Volume1,
  berisik: Volume2,
  sangatBerisik: AlertTriangle,
};

export function SilentMonitorPanel({
  robotState,
  level,
  status,
  thresholds,
  mic,
  animationsEnabled,
  showMeter,
  onToggleMic,
}: Props) {
  const micActive = mic.micState === "active";
  const labels = micActive ? STATUS_LABELS[status] : null;
  const Icon = micActive ? STATUS_ICONS[status] : ShieldCheck;

  return (
    <section
      aria-label="Monitor keheningan kelas"
      className="animate-fade-up rounded-[1.75rem] border border-white/70 bg-white/75 p-4 shadow-[0_24px_60px_-24px_rgba(11,33,71,0.45)] backdrop-blur-xl md:p-6"
    >
      <div className="flex flex-col items-stretch gap-4 md:gap-5 lg:flex-row">
        {/* --- Robot --- */}
        <div className="relative mx-auto w-full max-w-[300px] shrink-0 lg:w-[41%] lg:max-w-none">
          <div
            className={cn(
              "relative overflow-hidden rounded-[1.4rem] border border-sky-100 bg-gradient-to-b from-sky-50/90 via-blue-50/70 to-indigo-100/80 p-2 md:p-3",
              animationsEnabled && micActive && "animate-breathe"
            )}
          >
            <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-cyan-300/25 blur-2xl" />
            <RobotCharacter state={robotState} animationsEnabled={animationsEnabled} />
          </div>
        </div>

        {/* --- Status + meter + mikrofon --- */}
        <div className="flex min-w-0 flex-1 flex-col gap-3.5 md:gap-4">
          {/* Banner status */}
          <div
            className={cn(
              "flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-white shadow-lg transition-all duration-500 md:px-5 md:py-4",
              micActive
                ? `bg-gradient-to-r ${STATUS_GRADIENTS[status]}`
                : "bg-gradient-to-r from-slate-500 to-slate-600"
            )}
            role="status"
            aria-live="polite"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-md md:h-14 md:w-14">
              <Icon
                className={cn("h-6 w-6 md:h-7 md:w-7", micActive ? "text-navy-900" : "text-slate-500")}
                strokeWidth={2.5}
              />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-base font-extrabold tracking-wide md:text-2xl">
                {micActive ? labels!.title : "MONITOR NONAKTIF"}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-white/90 md:text-sm">
                {micActive ? labels!.subtitle : "Aktifkan mikrofon untuk memantau keheningan"}
              </p>
            </div>
            {micActive && (
              <Waves className="ms-auto hidden h-6 w-6 shrink-0 text-white/70 md:block" />
            )}
          </div>

          {/* Meter suara (dapat disembunyikan via Pengaturan > Robot) */}
          {showMeter && (
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3.5 md:px-5 md:py-4">
              <NoiseMeter
                level={level}
                status={status}
                thresholds={thresholds}
                micActive={micActive}
              />
            </div>
          )}

          {/* Kartu mikrofon */}
          <div
            className={cn(
              "mt-auto flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 transition-colors duration-500 md:px-5",
              micActive
                ? "border-emerald-200 bg-emerald-50/80"
                : mic.micState === "denied" || mic.micState === "error"
                  ? "border-red-200 bg-red-50/80"
                  : "border-slate-200 bg-slate-50/80"
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                micActive ? "bg-emerald-500/15 text-emerald-600" : "bg-slate-500/10 text-slate-500"
              )}
            >
              {micActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p
                className={cn(
                  "flex items-center gap-2 text-sm font-bold md:text-base",
                  micActive ? "text-emerald-700" : "text-slate-600"
                )}
              >
                {micActive ? (
                  <>
                    Mikrofon Aktif
                    <span className="relative flex h-2 w-2">
                      <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
                      <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                  </>
                ) : mic.micState === "requesting" ? (
                  "Meminta izin mikrofon…"
                ) : mic.micState === "denied" ? (
                  "Izin Mikrofon Ditolak"
                ) : mic.micState === "error" ? (
                  "Mikrofon Tidak Tersedia"
                ) : (
                  "Mikrofon Nonaktif"
                )}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500 md:text-xs">
                {micActive
                  ? "Menganalisis suara secara lokal di browser — tidak ada rekaman yang disimpan"
                  : (mic.error ?? "Tekan tombol untuk mulai memantau keheningan kelas")}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleMic}
              className={cn(
                "shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-md transition hover:brightness-110 md:text-sm",
                micActive
                  ? "bg-slate-600 hover:bg-slate-700"
                  : "bg-gradient-to-r from-brand-600 to-sky-500"
              )}
            >
              {micActive ? "Matikan" : mic.micState === "requesting" ? "Memuat…" : "Aktifkan"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
