// ============================================================
// PresentationMode — Mode Presentasi / Ujian (tampilan minimalis
// untuk proyektor): robot, status, meter, dan timer besar.
// Kontrol teknis disembunyikan; keluar via tombol atau Esc.
// ============================================================

import { LogOut, Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ExamTimer } from "../hooks/useExamTimer";
import { formatClock } from "../hooks/useNow";
import type { NoiseStatus, RobotState, Thresholds } from "../types";
import { STATUS_COLORS, STATUS_LABELS } from "../types";
import { cn } from "../utils/cn";
import { NoiseMeter } from "./NoiseMeter";
import { RobotCharacter } from "./RobotCharacter";

interface Props {
  robotState: RobotState;
  status: NoiseStatus;
  level: number;
  thresholds: Thresholds;
  micActive: boolean;
  timer: ExamTimer;
  now: Date;
  animationsEnabled: boolean;
  showMeter: boolean;
  alertEnabled: boolean;
  onToggleAlerts: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onExit: () => void;
}

export function PresentationMode({
  robotState,
  status,
  level,
  thresholds,
  micActive,
  timer,
  now,
  animationsEnabled,
  showMeter,
  alertEnabled,
  onToggleAlerts,
  isFullscreen,
  onToggleFullscreen,
  onExit,
}: Props) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<number | undefined>(undefined);

  const pokeControls = useCallback(() => {
    setControlsVisible(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), 2600);
  }, []);

  useEffect(() => {
    pokeControls();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("mousemove", pokeControls);
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(hideTimer.current);
      window.removeEventListener("mousemove", pokeControls);
      window.removeEventListener("keydown", onKey);
    };
  }, [onExit, pokeControls]);

  const totalSec = Math.ceil(timer.remainingMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const withHours = h > 0 || timer.durationMs > 3_600_000;
  const timeStr = withHours
    ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  const color = micActive ? STATUS_COLORS[status] : "#8496b4";
  const labels = STATUS_LABELS[status];

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex flex-col p-4 md:p-8",
        !controlsVisible && "cursor-none"
      )}
    >
      {/* Bar atas minimal */}
      <div
        className={cn(
          "flex items-center justify-between transition-opacity duration-500",
          controlsVisible ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex items-center gap-2.5 rounded-full bg-navy-950/70 px-4 py-2 backdrop-blur">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-bold text-white md:text-sm">
            WAH Silent Exam Monitor
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-navy-950/70 px-4 py-2 font-display text-sm font-bold tabular-nums text-white backdrop-blur">
            {formatClock(now)}
          </div>
          <button
            type="button"
            onClick={onToggleAlerts}
            aria-pressed={alertEnabled}
            title={alertEnabled ? "Matikan peringatan audio" : "Aktifkan peringatan audio"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-950/70 text-white backdrop-blur transition hover:bg-navy-800/80"
          >
            {alertEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            title="Layar penuh"
            className="hidden h-10 w-10 items-center justify-center rounded-full bg-navy-950/70 text-white backdrop-blur transition hover:bg-navy-800/80 md:flex"
          >
            {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-2 rounded-full bg-red-500/85 px-4 py-2 text-xs font-extrabold text-white backdrop-blur transition hover:bg-red-500 md:text-sm"
          >
            <LogOut className="h-4 w-4" /> Keluar (Esc)
          </button>
        </div>
      </div>

      {/* Isi utama */}
      <div className="mx-auto grid w-full max-w-[1500px] flex-1 items-center gap-4 md:gap-8 lg:grid-cols-2">
        {/* Robot + status */}
        <div className="flex flex-col items-center gap-3 md:gap-5">
          <div className="w-full max-w-[300px] md:max-w-[420px]">
            <RobotCharacter state={robotState} animationsEnabled={animationsEnabled} />
          </div>
          <div
            className="w-full max-w-xl rounded-3xl px-6 py-4 text-center text-white shadow-2xl backdrop-blur transition-colors duration-500 md:py-5"
            style={{ backgroundColor: `${color}e6` }}
            role="status"
            aria-live="polite"
          >
            <p className="text-xl font-extrabold tracking-wide md:text-4xl">
              {micActive ? labels.title : "MONITOR NONAKTIF"}
            </p>
            <p className="mt-1 text-sm font-medium text-white/90 md:text-lg">
              {micActive ? labels.subtitle : "Aktifkan mikrofon di mode guru"}
            </p>
          </div>
        </div>

        {/* Timer besar */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-2xl rounded-[2rem] border border-white/25 bg-navy-950/80 px-6 py-8 text-center shadow-2xl backdrop-blur md:py-12">
            <p className="mb-2 text-xs font-extrabold tracking-[0.3em] text-sky-300/80 md:text-sm">
              SISA WAKTU UJIAN
            </p>
            {timer.state === "finished" ? (
              <p className="font-display text-4xl font-bold tracking-widest text-red-400 md:text-7xl">
                WAKTU HABIS
              </p>
            ) : (
              <p
                className="font-display font-bold leading-none tabular-nums tracking-tight text-white"
                style={{ fontSize: "clamp(4rem, 11vw, 9.5rem)" }}
                aria-label={`Sisa waktu ${timeStr}`}
              >
                {timeStr}
              </p>
            )}
            <div className="mx-auto mt-5 h-2 w-full max-w-md overflow-hidden rounded-full bg-white/10 md:mt-7">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-300",
                  timer.state === "finished" ? "bg-red-500" : "bg-gradient-to-r from-sky-400 to-cyan-300"
                )}
                style={{ width: `${Math.max(0, timer.progress * 100)}%` }}
              />
            </div>
            <p
              className={cn(
                "mt-3 text-xs font-bold uppercase tracking-[0.25em]",
                timer.state === "running"
                  ? "text-emerald-400"
                  : timer.state === "paused"
                    ? "text-amber-400"
                    : timer.state === "finished"
                      ? "text-red-400"
                      : "text-sky-300/70"
              )}
            >
              {timer.state === "running"
                ? "Ujian Berlangsung"
                : timer.state === "paused"
                  ? "Dijeda"
                  : timer.state === "finished"
                    ? "Selesai"
                    : "Siap Dimulai"}
            </p>
          </div>

          {/* Meter ringkas */}
          {showMeter && (
            <div className="w-full max-w-2xl rounded-3xl border border-white/25 bg-white/85 px-5 py-4 shadow-xl backdrop-blur">
              <NoiseMeter
                level={level}
                status={status}
                thresholds={thresholds}
                micActive={micActive}
                compact
              />
            </div>
          )}
        </div>
      </div>

      <p className="pb-1 text-center text-[11px] font-semibold text-navy-900/50 md:text-xs">
        WAH Official — Wiyanto Abu Hanif · Estimasi tingkat suara bersifat relatif, bukan
        pengukuran dB terkalibrasi
      </p>
    </div>
  );
}
