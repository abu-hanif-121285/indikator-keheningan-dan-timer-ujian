// ============================================================
// WAH Silent Exam Monitor — Tipe & Konstanta Bersama
// ============================================================

export type NoiseStatus = "tenang" | "terdeteksi" | "berisik" | "sangatBerisik";
export type RobotState = NoiseStatus | "standby";
export type MicState =
  | "idle"
  | "requesting"
  | "active"
  | "denied"
  | "error"
  | "unsupported";
export type TimerState = "idle" | "running" | "paused" | "finished";
export type AlertType = "suara" | "beep" | "keduanya";

export interface Thresholds {
  /** Di bawah nilai ini dianggap tenang */
  quiet: number;
  /** Di atas nilai ini: suara terdeteksi */
  detected: number;
  /** Di atas nilai ini: mulai berisik; di atasnya lagi: sangat berisik */
  noisy: number;
}

export interface AppSettings {
  sensitivity: number; // 1..10
  thresholds: Thresholds;
  detectionDuration: number; // ms sebelum status naik
  alertCooldown: number; // detik jeda antar peringatan
  alertEnabled: boolean;
  alertType: AlertType;
  alertVolume: number; // 0..100
  voiceURI: string; // '' = otomatis (cari suara id-ID)
  timerNotifications: boolean; // pengingat 15/10/5/1 menit
  timerEndAlert: boolean; // bunyi saat waktu habis
  showSeconds: boolean;
  showMeter: boolean;
  animationsEnabled: boolean;
  defaultDurationSec: number;
  bgFit: "cover" | "contain";
  bgPosition: "center" | "top" | "bottom";
  bgOverlay: number; // 0..0.9
  bgCustom: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  sensitivity: 5,
  thresholds: { quiet: 15, detected: 35, noisy: 60 },
  detectionDuration: 1500,
  alertCooldown: 15,
  alertEnabled: true,
  alertType: "keduanya",
  alertVolume: 70,
  voiceURI: "",
  timerNotifications: true,
  timerEndAlert: true,
  showSeconds: true,
  showMeter: true,
  animationsEnabled: true,
  defaultDurationSec: 3600,
  bgFit: "cover",
  bgPosition: "center",
  bgOverlay: 0.35,
  bgCustom: false,
};

export const STATUS_COLORS: Record<NoiseStatus, string> = {
  tenang: "#22c55e",
  terdeteksi: "#eab308",
  berisik: "#f97316",
  sangatBerisik: "#ef4444",
};

export const STATUS_GRADIENTS: Record<NoiseStatus, string> = {
  tenang: "from-emerald-500 to-green-600",
  terdeteksi: "from-amber-400 to-yellow-500",
  berisik: "from-orange-500 to-amber-600",
  sangatBerisik: "from-red-500 to-rose-600",
};

export const STATUS_LABELS: Record<
  NoiseStatus,
  { title: string; subtitle: string; legend: string }
> = {
  tenang: {
    title: "KELAS TENANG",
    subtitle: "Pertahankan Keheningan",
    legend: "Tenang",
  },
  terdeteksi: {
    title: "SUARA TERDETEKSI",
    subtitle: "Mari Kembali Tenang",
    legend: "Suara Terdeteksi",
  },
  berisik: {
    title: "SUASANA MULAI BERISIK",
    subtitle: "Mohon Kurangi Suara",
    legend: "Mulai Berisik",
  },
  sangatBerisik: {
    title: "HARAP TENANG",
    subtitle: "Suara Kelas Terlalu Tinggi",
    legend: "Sangat Berisik",
  },
};

export const ALERT_TEXTS: Record<1 | 2 | 3, string> = {
  1: "Anak-anak, mari kembali tenang.",
  2: "Harap menjaga keheningan selama ujian.",
  3: "Suasana ujian harus tenang. Mohon hentikan percakapan.",
};

export const TIMER_PRESETS = [5, 10, 15, 20, 30, 45, 60, 90, 120] as const;

export const MAX_BG_SIZE = 5 * 1024 * 1024; // 5 MB
export const TARGET_RATIO = 16 / 9;
export const RATIO_TOLERANCE = 0.02;
