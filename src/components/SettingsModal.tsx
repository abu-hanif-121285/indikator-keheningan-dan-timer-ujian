// ============================================================
// SettingsModal — Pusat pengaturan guru (tab):
// Mikrofon & Kalibrasi · Audio · Timer · Robot · Background
// ============================================================

import {
  Activity,
  AudioLines,
  Bell,
  BellOff,
  Bot,
  Check,
  Clock3,
  Image as ImageIcon,
  ImageUp,
  Loader2,
  MessageSquareText,
  Mic,
  Music4,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Volume2,
  Waves,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AlertSound } from "../hooks/useAlertSound";
import { speechSupported } from "../hooks/useAlertSound";
import type { NoiseMonitor } from "../hooks/useNoiseMonitor";
import { validateBackgroundFile } from "../lib/storage";
import type { AppSettings, Thresholds } from "../types";
import { MAX_BG_SIZE } from "../types";
import { cn } from "../utils/cn";
import type { ToastType } from "./Toasts";

export type SettingsTab = "mikrofon" | "audio" | "timer" | "robot" | "background";

interface Props {
  open: boolean;
  tab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  onClose: () => void;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  mic: NoiseMonitor;
  sound: AlertSound;
  bgUrl: string;
  onApplyBackground: (blob: Blob) => Promise<boolean>;
  onRemoveBackground: () => void;
  onResetAll: () => void;
  pushToast: (type: ToastType, message: string) => void;
}

const TABS: { id: SettingsTab; label: string; icon: typeof Mic }[] = [
  { id: "mikrofon", label: "Mikrofon", icon: Mic },
  { id: "audio", label: "Audio", icon: Volume2 },
  { id: "timer", label: "Timer", icon: Clock3 },
  { id: "robot", label: "Robot", icon: Bot },
  { id: "background", label: "Background", icon: ImageIcon },
];

// --------------------------- Sub-komponen ---------------------------

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
      {children}
    </h4>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-left transition hover:border-brand-300"
    >
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300",
          checked ? "bg-emerald-500" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300",
            checked ? "left-[22px]" : "left-0.5"
          )}
        />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-sm font-bold text-navy-900">{label}</span>
        {desc && <span className="block text-[11px] font-medium text-slate-500">{desc}</span>}
      </span>
    </button>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  accent,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-bold text-navy-900">{label}</span>
        <span
          className="rounded-lg px-2 py-0.5 font-display text-sm font-bold tabular-nums text-white"
          style={{ backgroundColor: accent ?? "#1e63e9" }}
        >
          {value}
          {unit && <span className="ml-1 text-[10px] font-semibold opacity-80">{unit}</span>}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        aria-label={label}
      />
    </div>
  );
}

// ----------------------------- Komponen ------------------------------

interface StagedBg {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  is169: boolean;
}

export function SettingsModal({
  open,
  tab,
  onTabChange,
  onClose,
  settings,
  updateSettings,
  mic,
  sound,
  bgUrl,
  onApplyBackground,
  onRemoveBackground,
  onResetAll,
  pushToast,
}: Props) {
  const [calState, setCalState] = useState<"idle" | "measuring" | "done">("idle");
  const [calProgress, setCalProgress] = useState(0);
  const [calAvg, setCalAvg] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [staged, setStaged] = useState<StagedBg | null>(null);
  const [applying, setApplying] = useState(false);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Muat daftar suara TTS
  useEffect(() => {
    if (!open || !speechSupported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [open]);

  // Lock scroll + Esc
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setStaged((s) => {
        if (s) URL.revokeObjectURL(s.url);
        return null;
      });
      setCalState("idle");
      setConfirmResetAll(false);
    }
  }, [open]);

  if (!open) return null;

  const t = settings.thresholds;
  const setThresholds = (patch: Partial<Thresholds>) => {
    let next = { ...t, ...patch };
    // Jaga urutan: quiet < detected < noisy (jarak minimal 5)
    next.quiet = Math.min(next.quiet, next.detected - 5);
    next.noisy = Math.max(next.noisy, next.detected + 5);
    next.quiet = Math.max(5, next.quiet);
    next.noisy = Math.min(90, next.noisy);
    next.detected = Math.min(Math.max(next.detected, next.quiet + 5), next.noisy - 5);
    updateSettings({ thresholds: next });
  };

  const startCalibration = async () => {
    if (mic.micState !== "active") {
      pushToast("warning", "Aktifkan mikrofon terlebih dahulu sebelum kalibrasi.");
      return;
    }
    setCalState("measuring");
    setCalProgress(0);
    try {
      const avg = await mic.sampleBaseline(5000, setCalProgress);
      setCalAvg(avg);
      setCalState("done");
    } catch {
      setCalState("idle");
      pushToast("error", "Kalibrasi gagal. Pastikan mikrofon aktif.");
    }
  };

  const suggested: Thresholds = (() => {
    const quiet = Math.min(45, Math.max(8, Math.round(calAvg * 1.7 + 6)));
    const detected = Math.min(65, quiet + 18);
    const noisy = Math.min(85, detected + 22);
    return { quiet, detected, noisy };
  })();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const v = await validateBackgroundFile(file);
      setStaged((old) => {
        if (old) URL.revokeObjectURL(old.url);
        return { blob: v.blob, url: URL.createObjectURL(v.blob), width: v.width, height: v.height, is169: v.is169 };
      });
      if (!v.is169) {
        pushToast(
          "warning",
          `Rasio gambar ${v.width}×${v.height} bukan 16:9. Tetap dapat digunakan, namun disarankan 1920×1080.`
        );
      }
    } catch (e) {
      pushToast("error", (e as Error).message);
    }
  };

  const applyBackground = async () => {
    if (!staged) return;
    setApplying(true);
    const ok = await onApplyBackground(staged.blob);
    setApplying(false);
    if (ok) {
      setStaged(null);
      pushToast("success", "Background baru berhasil diterapkan & disimpan di perangkat.");
    }
  };

  const indoVoices = voices.filter((v) => v.lang?.toLowerCase().startsWith("id"));
  const otherVoices = voices.filter((v) => !v.lang?.toLowerCase().startsWith("id"));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-3 backdrop-blur-sm md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Pengaturan"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-[min(720px,94vh)] w-full max-w-4xl animate-fade-up flex-col overflow-hidden rounded-3xl border border-white/60 bg-slate-50/95 shadow-2xl backdrop-blur-xl">
        {/* Kepala modal */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/70 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-white">
              <SlidersHorizontal className="h-4.5 w-4.5" />
            </div>
            <div className="leading-tight">
              <h3 className="text-base font-extrabold text-navy-900 md:text-lg">Pengaturan Guru</h3>
              <p className="text-[11px] font-medium text-slate-500">
                Disimpan otomatis di perangkat ini (localStorage)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Navigasi tab */}
          <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200/80 bg-white/50 p-2 md:w-48 md:flex-col md:border-b-0 md:border-r md:p-3">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                aria-current={tab === id}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition",
                  tab === id
                    ? "bg-gradient-to-r from-brand-600 to-sky-500 text-white shadow-md shadow-sky-500/25"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                {label}
              </button>
            ))}
          </nav>

          {/* Isi tab */}
          <div className="nice-scroll min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
            {/* ===================== MIKROFON ===================== */}
            {tab === "mikrofon" && (
              <div className="flex flex-col gap-3.5">
                <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-[13px] font-medium leading-snug text-sky-800">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                  <p>
                    Analisis suara diproses <strong>100% lokal di browser</strong> — tidak ada
                    rekaman, tidak ada audio yang dikirim ke server, dan tidak ada data siswa yang
                    dikumpulkan. Nilai yang ditampilkan adalah <strong>estimasi relatif</strong>,
                    bukan pengukuran desibel (dB SPL) terkalibrasi.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={mic.toggle}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:brightness-110",
                    mic.micState === "active"
                      ? "bg-gradient-to-r from-slate-600 to-slate-700"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/25"
                  )}
                >
                  <Mic className="h-5 w-5" />
                  {mic.micState === "active" ? "Matikan Mikrofon" : "Aktifkan Mikrofon"}
                </button>

                {/* Kalibrasi */}
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <SectionTitle>Kalibrasi Suasana Awal</SectionTitle>
                  <p className="mb-3 text-xs font-medium leading-snug text-slate-500">
                    Minta siswa untuk diam, lalu tekan tombol di bawah. Aplikasi mengambil sampel
                    suara ruangan selama 5 detik dan menyarankan ambang batas awal. Anda tetap
                    dapat menyesuaikannya secara manual.
                  </p>
                  {calState === "measuring" ? (
                    <div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-cyan-400 transition-[width] duration-150"
                          style={{ width: `${calProgress * 100}%` }}
                        />
                      </div>
                      <p className="mt-2 flex items-center gap-2 text-xs font-bold text-brand-700">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Mengambil sampel suasana… mohon tetap hening (
                        {Math.round(calProgress * 5)} / 5 detik)
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={startCalibration}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-sky-500/25 transition hover:brightness-110"
                      >
                        <Activity className="h-4 w-4" />
                        {calState === "done" ? "Ulangi Kalibrasi" : "Mulai Kalibrasi (5 detik)"}
                      </button>
                      {calState === "done" && (
                        <>
                          <span className="text-xs font-semibold text-slate-600">
                            Baseline ruangan:{" "}
                            <strong className="font-display text-navy-900">
                              {calAvg.toFixed(1)} / 100
                            </strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              updateSettings({ thresholds: suggested });
                              pushToast(
                                "success",
                                `Rekomendasi diterapkan: ${suggested.quiet} / ${suggested.detected} / ${suggested.noisy}`
                              );
                            }}
                            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            <Check className="h-4 w-4" />
                            Terapkan Rekomendasi ({suggested.quiet}/{suggested.detected}/
                            {suggested.noisy})
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Preset suasana */}
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <SectionTitle>Preset Suasana</SectionTitle>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(
                      [
                        { label: "Sangat Tenang", th: { quiet: 10, detected: 28, noisy: 52 } },
                        { label: "Normal", th: { quiet: 15, detected: 35, noisy: 60 } },
                        { label: "Lingkungan Ramai", th: { quiet: 22, detected: 45, noisy: 72 } },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          updateSettings({ thresholds: { ...p.th } });
                          pushToast("info", `Preset "${p.label}" diterapkan.`);
                        }}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-xs font-bold transition",
                          t.quiet === p.th.quiet && t.detected === p.th.detected
                            ? "border-brand-500 bg-sky-50 text-brand-700"
                            : "border-slate-200 bg-white text-navy-900 hover:border-brand-300"
                        )}
                      >
                        {p.label}
                        <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">
                          {p.th.quiet} / {p.th.detected} / {p.th.noisy}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slider ambang */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <SliderRow
                    label="Sensitivitas Mikrofon"
                    value={settings.sensitivity}
                    min={1}
                    max={10}
                    onChange={(v) => updateSettings({ sensitivity: v })}
                  />
                  <SliderRow
                    label="Durasi Sebelum Status Berubah"
                    value={Math.round(settings.detectionDuration / 500) * 0.5}
                    min={0.5}
                    max={5}
                    step={0.5}
                    unit="dtk"
                    onChange={(v) => updateSettings({ detectionDuration: Math.round(v * 1000) })}
                  />
                  <SliderRow
                    label="Ambang Tenang"
                    value={t.quiet}
                    min={5}
                    max={50}
                    accent="#16a34a"
                    onChange={(v) => setThresholds({ quiet: v })}
                  />
                  <SliderRow
                    label="Ambang Suara Terdeteksi"
                    value={t.detected}
                    min={15}
                    max={70}
                    accent="#ca8a04"
                    onChange={(v) => setThresholds({ detected: v })}
                  />
                  <SliderRow
                    label="Ambang Berisik"
                    value={t.noisy}
                    min={25}
                    max={90}
                    accent="#ea580c"
                    onChange={(v) => setThresholds({ noisy: v })}
                  />
                  <SliderRow
                    label="Cooldown Peringatan"
                    value={settings.alertCooldown}
                    min={5}
                    max={60}
                    unit="dtk"
                    accent="#dc2626"
                    onChange={(v) => updateSettings({ alertCooldown: v })}
                  />
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2.5 text-[11px] font-semibold text-slate-500">
                  <Waves className="h-4 w-4 shrink-0 text-brand-500" />
                  Visual ambang: tenang &lt; {t.quiet} · terdeteksi {t.quiet}–{t.detected} ·
                  berisik {t.detected}–{t.noisy} · sangat berisik &gt; {t.noisy}
                </div>
              </div>
            )}

            {/* ======================== AUDIO ======================== */}
            {tab === "audio" && (
              <div className="flex flex-col gap-3.5">
                <Toggle
                  checked={settings.alertEnabled}
                  onChange={(v) => {
                    updateSettings({ alertEnabled: v });
                    if (v) sound.unlock();
                  }}
                  label="Peringatan Audio Otomatis"
                  desc="Pengingat bertahap saat kelas mulai berisik (dengan cooldown, tidak berulang tanpa jeda)"
                />

                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <SectionTitle>Jenis Peringatan</SectionTitle>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: "suara", label: "Suara (TTS)", icon: MessageSquareText },
                        { id: "beep", label: "Beep Lembut", icon: Music4 },
                        { id: "keduanya", label: "Keduanya", icon: AudioLines },
                      ] as const
                    ).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => updateSettings({ alertType: id })}
                        aria-pressed={settings.alertType === id}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-bold transition",
                          settings.alertType === id
                            ? "border-brand-500 bg-sky-50 text-brand-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {label}
                      </button>
                    ))}
                  </div>
                  {!speechSupported && (
                    <p className="mt-2.5 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">
                      Browser ini tidak mendukung SpeechSynthesis — peringatan suara akan diganti
                      beep secara otomatis.
                    </p>
                  )}
                </div>

                {speechSupported && (
                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                    <SectionTitle>Suara Text-to-Speech (Bahasa Indonesia)</SectionTitle>
                    <select
                      value={settings.voiceURI}
                      onChange={(e) => updateSettings({ voiceURI: e.target.value })}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-navy-900 focus:border-brand-500 focus:outline-none"
                      aria-label="Pilih suara TTS"
                    >
                      <option value="">Otomatis (cari suara id-ID)</option>
                      {indoVoices.length > 0 && (
                        <optgroup label="Bahasa Indonesia">
                          {indoVoices.map((v) => (
                            <option key={v.voiceURI} value={v.voiceURI}>
                              {v.name} ({v.lang})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {otherVoices.length > 0 && (
                        <optgroup label="Suara lain di perangkat">
                          {otherVoices.map((v) => (
                            <option key={v.voiceURI} value={v.voiceURI}>
                              {v.name} ({v.lang})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    {voices.length > 0 && indoVoices.length === 0 && (
                      <p className="mt-2 text-[11px] font-medium text-amber-600">
                        Tidak ditemukan suara Bahasa Indonesia di perangkat ini — browser akan
                        menggunakan suara bawaan dengan pelafalan terdekat.
                      </p>
                    )}
                  </div>
                )}

                <SliderRow
                  label="Volume Peringatan"
                  value={settings.alertVolume}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(v) => updateSettings({ alertVolume: Math.round(v) })}
                />
                <SliderRow
                  label="Jeda Antar Peringatan (Cooldown)"
                  value={settings.alertCooldown}
                  min={5}
                  max={60}
                  unit="dtk"
                  onChange={(v) => updateSettings({ alertCooldown: v })}
                />

                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <SectionTitle>Uji Suara Peringatan</SectionTitle>
                  <div className="grid grid-cols-3 gap-2">
                    {([1, 2, 3] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          sound.unlock();
                          sound.playAlert(lvl);
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 px-2 py-2.5 text-xs font-extrabold text-white shadow-md shadow-sky-500/25 transition hover:brightness-110"
                      >
                        <Volume2 className="h-4 w-4" />
                        Level {lvl}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] font-medium leading-snug text-slate-500">
                    Level 1: “Anak-anak, mari kembali tenang.” · Level 2: “Harap menjaga
                    keheningan selama ujian.” · Level 3: “Suasana ujian harus tenang. Mohon
                    hentikan percakapan.”
                  </p>
                </div>
              </div>
            )}

            {/* ======================== TIMER ======================== */}
            {tab === "timer" && (
              <div className="flex flex-col gap-3.5">
                <Toggle
                  checked={settings.timerNotifications}
                  onChange={(v) => updateSettings({ timerNotifications: v })}
                  label="Pengingat Sisa Waktu"
                  desc="Notifikasi pada sisa 15, 10, 5, dan 1 menit"
                />
                <Toggle
                  checked={settings.timerEndAlert}
                  onChange={(v) => updateSettings({ timerEndAlert: v })}
                  label="Bunyi Saat Waktu Habis"
                  desc="Bel akhir + pengumuman “Waktu ujian telah berakhir”"
                />
                <Toggle
                  checked={settings.showSeconds}
                  onChange={(v) => updateSettings({ showSeconds: v })}
                  label="Tampilkan Detik"
                  desc="Nonaktifkan untuk tampilan menit saja yang lebih tenang"
                />
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <SectionTitle>Uji Bunyi Timer</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sound.unlock();
                        sound.playMilestone(5);
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 px-3.5 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:brightness-110"
                    >
                      <Bell className="h-4 w-4" /> Uji Pengingat
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.unlock();
                        sound.playTimerEnd();
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-extrabold text-navy-900 transition hover:bg-slate-100"
                    >
                      <BellOff className="h-4 w-4" /> Uji Waktu Habis
                    </button>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-100 px-3.5 py-2.5 text-[11px] font-semibold leading-snug text-slate-500">
                  Timer dihitung berbasis timestamp (Date.now), sehingga tetap akurat meskipun tab
                  browser mengalami throttling.
                </div>
              </div>
            )}

            {/* ======================== ROBOT ======================== */}
            {tab === "robot" && (
              <div className="flex flex-col gap-3.5">
                <Toggle
                  checked={settings.animationsEnabled}
                  onChange={(v) => updateSettings({ animationsEnabled: v })}
                  label="Animasi Robot & Latar"
                  desc="Gerakan melayang, cincin berputar, dan denyut lembut. Nonaktifkan untuk perangkat lambat atau preferensi gerak minimal"
                />
                <Toggle
                  checked={settings.showMeter}
                  onChange={(v) => updateSettings({ showMeter: v })}
                  label="Tampilkan Meter Suara"
                  desc="Nonaktifkan untuk tampilan minimalis — status & robot tetap ditampilkan"
                />
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3.5 text-[13px] font-medium leading-snug text-slate-600">
                  <Bot className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                  <p>
                    Robot WAH menampilkan 4 ekspresi: <strong>mata terpejam</strong> (tenang),{" "}
                    <strong>mata setengah terbuka</strong> (suara terdeteksi),{" "}
                    <strong>mata terbuka + alis waspada</strong> (mulai berisik), dan{" "}
                    <strong>mata penuh + ekspresi tegas</strong> (sangat berisik). Semua transisi
                    bekerja otomatis mengikuti analisis mikrofon.
                  </p>
                </div>
              </div>
            )}

            {/* ====================== BACKGROUND ====================== */}
            {tab === "background" && (
              <div className="flex flex-col gap-3.5">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,.png"
                  className="hidden"
                  onChange={(e) => {
                    void handleFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-sky-50/60 px-4 py-6 text-center transition hover:border-brand-500 hover:bg-sky-50"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-sky-500 text-white shadow-lg shadow-sky-500/30 transition group-hover:scale-105">
                    <ImageUp className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-extrabold text-navy-900">
                    Pilih File PNG untuk Background
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Disarankan 1920 × 1080 px (rasio 16:9) · Maks{" "}
                    {Math.round(MAX_BG_SIZE / 1024 / 1024)} MB · Diproses &amp; disimpan lokal
                    (IndexedDB)
                  </span>
                </button>

                {/* Preview */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-navy-950">
                  <div className="relative aspect-video w-full">
                    <img
                      src={staged ? staged.url : bgUrl}
                      alt="Pratinjau background"
                      className="absolute inset-0 h-full w-full"
                      style={{
                        objectFit: settings.bgFit,
                        objectPosition:
                          settings.bgPosition === "center" ? "center" : `center ${settings.bgPosition}`,
                      }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: `rgba(233, 240, 252, ${settings.bgOverlay})` }}
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-navy-950/70 to-transparent px-3 py-2">
                      <span className="text-[11px] font-bold text-white">
                        {staged
                          ? `Pratinjau file baru · ${staged.width}×${staged.height}`
                          : "Background saat ini"}
                      </span>
                      {staged && !staged.is169 && (
                        <span className="rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-extrabold text-amber-950">
                          BUKAN 16:9
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {staged && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={applyBackground}
                      disabled={applying}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-emerald-500/25 transition hover:brightness-110 disabled:opacity-50"
                    >
                      {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Terapkan &amp; Simpan Background
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setStaged((s) => {
                          if (s) URL.revokeObjectURL(s.url);
                          return null;
                        })
                      }
                      className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-extrabold text-slate-600 transition hover:bg-slate-200"
                    >
                      Batalkan Pratinjau
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-3.5">
                    <SectionTitle>Mode Tampilan</SectionTitle>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["cover", "contain"] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => updateSettings({ bgFit: f })}
                          aria-pressed={settings.bgFit === f}
                          className={cn(
                            "rounded-lg px-2 py-2 text-xs font-bold capitalize transition",
                            settings.bgFit === f
                              ? "bg-brand-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-3.5">
                    <SectionTitle>Posisi Gambar</SectionTitle>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: "top", label: "Atas" },
                          { id: "center", label: "Tengah" },
                          { id: "bottom", label: "Bawah" },
                        ] as const
                      ).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => updateSettings({ bgPosition: p.id })}
                          aria-pressed={settings.bgPosition === p.id}
                          className={cn(
                            "rounded-lg px-1 py-2 text-[11px] font-bold transition",
                            settings.bgPosition === p.id
                              ? "bg-brand-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <SliderRow
                    label="Overlay Transparan"
                    value={Math.round(settings.bgOverlay * 100)}
                    min={0}
                    max={90}
                    unit="%"
                    onChange={(v) => updateSettings({ bgOverlay: v / 100 })}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveBackground();
                      setStaged((s) => {
                        if (s) URL.revokeObjectURL(s.url);
                        return null;
                      });
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-extrabold text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" /> Hapus Background Kustom
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateSettings({ bgFit: "cover", bgPosition: "center", bgOverlay: 0.35 });
                      pushToast("info", "Tampilan background dikembalikan ke pengaturan awal.");
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-extrabold text-slate-600 transition hover:bg-slate-100"
                  >
                    <RefreshCcw className="h-4 w-4" /> Reset Tampilan Background
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kaki modal */}
        <div className="flex flex-wrap items-center gap-2.5 border-t border-slate-200/80 bg-white/70 px-5 py-3">
          <button
            type="button"
            onClick={() => {
              if (!confirmResetAll) {
                setConfirmResetAll(true);
                window.setTimeout(() => setConfirmResetAll(false), 3500);
              } else {
                setConfirmResetAll(false);
                onResetAll();
              }
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition",
              confirmResetAll
                ? "bg-red-500 text-white shadow-md shadow-red-500/30"
                : "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            )}
          >
            <RotateCcw className="h-4 w-4" />
            {confirmResetAll ? "Klik lagi untuk konfirmasi reset semua" : "Reset Semua Pengaturan"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ms-auto rounded-xl bg-gradient-to-r from-navy-800 to-navy-900 px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:brightness-110"
          >
            Tutup Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
}
