// ============================================================
// TimerPanel — Panel 2: countdown ujian, kontrol, preset durasi.
// ============================================================

import {
  AlarmClock,
  Clock3,
  Minus,
  Pause,
  PenLine,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ExamTimer } from "../hooks/useExamTimer";
import type { TimerState } from "../types";
import { TIMER_PRESETS } from "../types";
import { cn } from "../utils/cn";

interface Props {
  timer: ExamTimer;
  showSeconds: boolean;
  animationsEnabled: boolean;
  onOpenSetTime: () => void;
  onPreset: (minutes: number) => void;
}

const BADGES: Record<TimerState, { text: string; cls: string }> = {
  idle: { text: "Siap", cls: "bg-sky-100 text-sky-700" },
  running: { text: "Berjalan", cls: "bg-emerald-100 text-emerald-700" },
  paused: { text: "Jeda", cls: "bg-amber-100 text-amber-700" },
  finished: { text: "Waktu Habis", cls: "bg-red-100 text-red-700" },
};

export function TimerPanel({ timer, showSeconds, animationsEnabled, onOpenSetTime, onPreset }: Props) {
  const { state, durationMs, remainingMs, progress } = timer;
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!confirmReset) return;
    const t = window.setTimeout(() => setConfirmReset(false), 3000);
    return () => window.clearTimeout(t);
  }, [confirmReset]);

  const totalSec = Math.ceil(remainingMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  // Format MM:SS sampai tepat 60 menit (contoh "60:00");
  // di atas 60 menit memakai HH:MM:SS.
  const withHours = h > 0 || durationMs > 3_600_000;

  type Group = { value: string; label: string };
  let groups: Group[];
  if (!showSeconds) {
    groups = withHours
      ? [
          { value: String(h).padStart(2, "0"), label: "JAM" },
          { value: String(m).padStart(2, "0"), label: "MENIT" },
        ]
      : [{ value: String(Math.ceil(totalSec / 60)).padStart(2, "0"), label: "MENIT" }];
  } else if (withHours) {
    groups = [
      { value: String(h).padStart(2, "0"), label: "JAM" },
      { value: String(m).padStart(2, "0"), label: "MENIT" },
      { value: String(s).padStart(2, "0"), label: "DETIK" },
    ];
  } else {
    groups = [
      { value: String(m).padStart(2, "0"), label: "MENIT" },
      { value: String(s).padStart(2, "0"), label: "DETIK" },
    ];
  }

  const badge = BADGES[state];
  const canStart = (state === "idle" && remainingMs > 0) || state === "paused";
  const activePresetMin = Math.round(durationMs / 60000);

  const handleReset = () => {
    if (state === "running" && !confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    timer.reset();
  };

  return (
    <section
      aria-label="Timer ujian"
      className="animate-fade-up flex flex-col rounded-[1.75rem] border border-white/70 bg-white/75 p-4 shadow-[0_24px_60px_-24px_rgba(11,33,71,0.45)] backdrop-blur-xl md:p-6"
      style={{ animationDelay: "80ms" }}
    >
      {/* Kepala panel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Clock3 className="h-6 w-6 text-navy-900" strokeWidth={2.4} />
          <h2 className="text-base font-extrabold tracking-wide text-navy-900 md:text-xl">
            TIMER UJIAN
          </h2>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-bold md:text-xs",
            badge.cls,
            state === "finished" && animationsEnabled && "animate-blink-soft"
          )}
          role="status"
        >
          {badge.text}
        </span>
      </div>

      {/* Layar waktu */}
      <div className="relative mt-4 overflow-hidden rounded-2xl border border-navy-700/60 bg-gradient-to-b from-navy-900 via-navy-800 to-navy-950 px-4 py-5 shadow-inner md:py-7">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-36 w-96 -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
        <div
          className="relative flex items-start justify-center gap-1 text-white"
          aria-live="off"
          aria-label={`Sisa waktu ${groups.map((g) => `${g.value} ${g.label.toLowerCase()}`).join(" ")}`}
        >
          {groups.map((g, i) => (
            <div key={g.label} className="flex items-start">
              {i > 0 && (
                <span
                  className={cn(
                    "mx-1 font-display text-5xl font-bold leading-none text-sky-300/80 md:mx-2 md:text-8xl",
                    state === "running" && animationsEnabled && "animate-blink-soft"
                  )}
                >
                  :
                </span>
              )}
              <div className="flex flex-col items-center">
                <span className="font-display text-6xl font-bold leading-none tracking-tight tabular-nums md:text-8xl">
                  {g.value}
                </span>
                <span className="mt-2 text-[10px] font-bold tracking-[0.25em] text-sky-300/70 md:text-xs">
                  {g.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Progres */}
        <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/10 md:mt-5">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300",
              state === "finished" ? "bg-red-500" : "bg-gradient-to-r from-sky-400 to-cyan-300"
            )}
            style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
          />
        </div>

        {state === "finished" && (
          <div className="absolute inset-0 flex items-center justify-center bg-navy-950/70 backdrop-blur-[2px]">
            <div className="flex items-center gap-2.5 rounded-2xl border border-red-400/50 bg-red-500/20 px-5 py-3">
              <AlarmClock className={cn("h-7 w-7 text-red-300", animationsEnabled && "animate-blink-soft")} />
              <p className="text-xl font-extrabold tracking-widest text-red-200 md:text-3xl">
                WAKTU HABIS
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tombol utama */}
      {state === "finished" ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={timer.restart}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/30 transition hover:brightness-110 active:scale-[0.98] md:text-base"
          >
            <RotateCw className="h-5 w-5" /> Mulai Ulang
          </button>
          <button
            type="button"
            onClick={onOpenSetTime}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-sky-500/30 transition hover:brightness-110 active:scale-[0.98] md:text-base"
          >
            <Clock3 className="h-5 w-5" /> Atur Waktu Baru
          </button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-4 gap-2.5 md:gap-3">
          <button
            type="button"
            onClick={canStart ? timer.start : undefined}
            disabled={!canStart}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-xs font-extrabold transition active:scale-[0.98] md:text-sm",
              canStart
                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 hover:brightness-110"
                : "cursor-not-allowed bg-slate-100 text-slate-400"
            )}
          >
            <Play className="h-5 w-5" fill="currentColor" />
            {state === "paused" ? "Lanjut" : "Mulai"}
          </button>
          <button
            type="button"
            onClick={state === "running" ? timer.pause : undefined}
            disabled={state !== "running"}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-xs font-extrabold transition active:scale-[0.98] md:text-sm",
              state === "running"
                ? "bg-gradient-to-r from-brand-600 to-sky-500 text-white shadow-lg shadow-sky-500/30 hover:brightness-110"
                : "cursor-not-allowed bg-slate-100 text-slate-400"
            )}
          >
            <Pause className="h-5 w-5" fill="currentColor" />
            Pause
          </button>
          <button
            type="button"
            onClick={handleReset}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-xs font-extrabold transition active:scale-[0.98] md:text-sm",
              confirmReset
                ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30"
                : "bg-slate-100 text-navy-900 hover:bg-slate-200"
            )}
            title={confirmReset ? "Klik lagi untuk konfirmasi reset" : "Kembalikan ke durasi awal"}
          >
            <RotateCcw className="h-5 w-5" />
            {confirmReset ? "Yakin?" : "Reset"}
          </button>
          <button
            type="button"
            onClick={state === "running" ? undefined : onOpenSetTime}
            disabled={state === "running"}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-xs font-extrabold transition active:scale-[0.98] md:text-sm",
              state === "running"
                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                : "bg-slate-100 text-navy-900 hover:bg-slate-200"
            )}
            title={state === "running" ? "Jeda atau reset timer untuk mengatur waktu" : "Atur durasi ujian"}
          >
            <Clock3 className="h-5 w-5" />
            Set Waktu
          </button>
        </div>
      )}

      {/* +/- 1 Menit */}
      <div className="mt-3 grid grid-cols-2 gap-2.5 md:gap-3">
        <button
          type="button"
          onClick={() => timer.adjustMinutes(-1)}
          disabled={state === "finished" || remainingMs <= 60_000}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-bold text-navy-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 md:text-sm"
        >
          <Minus className="h-4 w-4" /> 1 Menit
        </button>
        <button
          type="button"
          onClick={() => timer.adjustMinutes(1)}
          disabled={state === "finished"}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-bold text-navy-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 md:text-sm"
        >
          <Plus className="h-4 w-4" /> 1 Menit
        </button>
      </div>

      {/* Preset */}
      <p className="mt-4 text-xs font-extrabold tracking-wide text-slate-500 md:text-sm">
        Preset Durasi
      </p>
      <div className="mt-2 grid grid-cols-6 gap-2 max-lg:grid-cols-5 max-md:grid-cols-3">
        {TIMER_PRESETS.map((min) => (
          <button
            key={min}
            type="button"
            onClick={() => onPreset(min)}
            className={cn(
              "rounded-xl border px-2 py-2.5 text-xs font-bold transition active:scale-[0.97] md:text-sm",
              activePresetMin === min && state !== "finished"
                ? "border-brand-600 bg-gradient-to-r from-brand-600 to-sky-500 text-white shadow-md shadow-sky-500/30"
                : "border-slate-200 bg-white/70 text-navy-900 hover:border-brand-400 hover:bg-sky-50"
            )}
          >
            {min}m
          </button>
        ))}
        <button
          type="button"
          onClick={onOpenSetTime}
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-400 bg-sky-50/70 px-2 py-2.5 text-xs font-bold text-brand-700 transition hover:bg-sky-100 max-md:col-span-3 md:text-sm"
        >
          <PenLine className="h-4 w-4" /> Custom
        </button>
      </div>
    </section>
  );
}
