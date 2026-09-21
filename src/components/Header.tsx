// ============================================================
// Header — Brand, status mikrofon, pengaturan, fullscreen, jam.
// ============================================================

import { Loader2, Maximize, Mic, MicOff, Minimize, Settings } from "lucide-react";
import type { MicState } from "../types";
import { cn } from "../utils/cn";
import { formatClock, formatDate } from "../hooks/useNow";
import wahLogo from "../assets/wah-logo.png";

interface Props {
  now: Date;
  micState: MicState;
  onToggleMic: () => void;
  onOpenSettings: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function Header({
  now,
  micState,
  onToggleMic,
  onOpenSettings,
  isFullscreen,
  onToggleFullscreen,
}: Props) {
  const active = micState === "active";
  const requesting = micState === "requesting";
  const failed = micState === "denied" || micState === "error" || micState === "unsupported";

  return (
    <header className="relative z-20">
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 border-b border-white/10 shadow-lg">
        <div className="mx-auto flex max-w-[1720px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-8">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/95 shadow-lg shadow-black/20 ring-1 ring-white/40 md:h-12 md:w-16">
              <img
                src={wahLogo}
                alt="Logo WAH Official"
                className="h-full w-full object-contain p-1"
              />
            </div>
            <div className="leading-tight">
              <p className="text-white font-extrabold text-base md:text-lg tracking-tight">
                WAH Official
              </p>
              <p className="text-sky-300/90 text-[11px] md:text-xs font-medium">
                Wiyanto Abu Hanif
              </p>
            </div>
            <div className="mx-2 hidden h-9 w-px bg-white/15 sm:block" />
            <div className="leading-tight hidden sm:block">
              <p className="text-white font-bold text-sm md:text-base">
                WAH Silent Exam Monitor
              </p>
              <p className="text-sky-200/80 text-[11px] md:text-xs">
                Pengawas Keheningan &amp; Timer Ujian
              </p>
            </div>
          </div>

          <div className="ms-auto flex items-center gap-2 md:gap-3">
            {/* Status / tombol mikrofon */}
            <button
              type="button"
              onClick={onToggleMic}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs md:text-sm font-bold transition-all duration-300",
                active &&
                  "border-emerald-400/70 bg-emerald-500/25 text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.35)] hover:bg-emerald-500/35",
                requesting && "border-sky-400/60 bg-sky-500/20 text-sky-200",
                !active && !requesting && !failed &&
                  "border-white/20 bg-white/10 text-white hover:bg-white/20",
                failed && "border-red-400/60 bg-red-500/20 text-red-200 hover:bg-red-500/30"
              )}
              title={active ? "Klik untuk mematikan mikrofon" : "Klik untuk mengaktifkan mikrofon"}
            >
              {requesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : active ? (
                <span className="relative flex h-4 w-4 items-center justify-center">
                  <span className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-400/60" />
                  <Mic className="relative h-4 w-4" />
                </span>
              ) : (
                <MicOff className="h-4 w-4" />
              )}
              <span className="hidden md:inline">
                {requesting
                  ? "Meminta Izin…"
                  : active
                    ? "Mikrofon Aktif"
                    : failed
                      ? "Mikrofon Bermasalah"
                      : "Aktifkan Mikrofon"}
              </span>
              <span className="md:hidden">{active ? "Aktif" : "Mic"}</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs md:text-sm font-bold text-white transition hover:bg-white/20"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Pengaturan</span>
            </button>

            <button
              type="button"
              onClick={onToggleFullscreen}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs md:text-sm font-bold text-white transition hover:bg-white/20"
              aria-pressed={isFullscreen}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              <span className="hidden sm:inline">{isFullscreen ? "Keluar" : "Fullscreen"}</span>
            </button>

            {/* Jam */}
            <div className="hidden lg:block text-right leading-tight ps-2">
              <p className="font-display text-xl font-bold text-white tabular-nums">
                {formatClock(now)}
              </p>
              <p className="text-[11px] font-medium text-sky-200/80">{formatDate(now)}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
