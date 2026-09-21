// ============================================================
// BottomBar — Baris kontrol cepat: background, audio, volume,
// notifikasi waktu, upload background, mode presentasi.
// ============================================================

import {
  Bell,
  BellOff,
  ChevronRight,
  ImageUp,
  Presentation,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "../utils/cn";
import type { SettingsTab } from "./SettingsModal";

interface Props {
  bgThumb: string;
  bgLabel: string;
  alertEnabled: boolean;
  alertVolume: number;
  timerNotifications: boolean;
  onOpenSettings: (tab: SettingsTab) => void;
  onToggleAlerts: () => void;
  onToggleNotif: () => void;
  onEnterPresentation: () => void;
}

function Tile({
  onClick,
  icon,
  title,
  subtitle,
  subtitleClass,
  ariaPressed,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  subtitleClass?: string;
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3 py-1.5 text-left transition hover:bg-sky-50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center text-navy-800 transition group-hover:text-brand-600">
        {icon}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-xs font-bold text-navy-900 md:text-sm">{title}</span>
        <span className={cn("block text-[11px] font-semibold text-slate-500", subtitleClass)}>
          {subtitle}
        </span>
      </span>
    </button>
  );
}

export function BottomBar({
  bgThumb,
  bgLabel,
  alertEnabled,
  alertVolume,
  timerNotifications,
  onOpenSettings,
  onToggleAlerts,
  onToggleNotif,
  onEnterPresentation,
}: Props) {
  return (
    <div
      className="animate-fade-up mx-auto grid w-full max-w-[1720px] grid-cols-2 gap-2 rounded-3xl border border-white/70 bg-white/75 p-2.5 shadow-[0_18px_50px_-20px_rgba(11,33,71,0.4)] backdrop-blur-xl md:grid-cols-3 xl:grid-cols-[1.2fr_1.9fr_1fr_1fr]"
      style={{ animationDelay: "140ms" }}
    >
      {/* Background */}
      <button
        type="button"
        onClick={() => onOpenSettings("background")}
        className="group col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/60 px-3 py-2 text-left transition hover:border-brand-400 hover:bg-sky-50 md:col-span-1"
      >
        <span className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-slate-300/70">
          <img src={bgThumb} alt="Miniatur background" className="h-full w-full object-cover" />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-xs font-bold text-navy-900 md:text-sm">Background</span>
          <span className="block truncate text-[11px] font-semibold text-slate-500">{bgLabel}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
      </button>

      {/* Grup audio & notifikasi */}
      <div className="col-span-2 flex items-stretch divide-x divide-slate-200/80 rounded-2xl border border-slate-200/80 bg-white/60 px-1 py-1.5 md:col-span-1">
        <Tile
          onClick={onToggleAlerts}
          ariaPressed={alertEnabled}
          icon={alertEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          title="Peringatan Audio"
          subtitle={alertEnabled ? "Aktif" : "Nonaktif"}
          subtitleClass={alertEnabled ? "text-emerald-600" : "text-red-500"}
        />
        <Tile
          onClick={() => onOpenSettings("audio")}
          icon={<Volume2 className="h-5 w-5" />}
          title="Volume"
          subtitle={`${alertVolume}%`}
          subtitleClass="text-brand-600"
        />
        <Tile
          onClick={onToggleNotif}
          ariaPressed={timerNotifications}
          icon={timerNotifications ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          title="Notifikasi Waktu"
          subtitle={timerNotifications ? "Aktif" : "Nonaktif"}
          subtitleClass={timerNotifications ? "text-emerald-600" : "text-red-500"}
        />
      </div>

      {/* Upload background */}
      <button
        type="button"
        onClick={() => onOpenSettings("background")}
        className="group flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/60 px-3 py-2.5 text-sm font-bold text-navy-900 transition hover:border-brand-400 hover:bg-sky-50"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-white transition group-hover:bg-brand-600">
          <ImageUp className="h-4.5 w-4.5" />
        </span>
        <span className="hidden lg:inline">Upload Background</span>
        <span className="lg:hidden">Upload BG</span>
      </button>

      {/* Mode presentasi */}
      <button
        type="button"
        onClick={onEnterPresentation}
        className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/60 px-3 py-2 text-left transition hover:border-brand-400 hover:bg-sky-50 md:col-span-3 xl:col-span-1"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-sky-500 text-white shadow-md shadow-sky-500/30">
          <Presentation className="h-4.5 w-4.5" />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-xs font-bold text-navy-900 md:text-sm">Mode Presentasi</span>
          <span className="block text-[11px] font-semibold text-slate-500">Tampilan Minimalis</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
      </button>
    </div>
  );
}
