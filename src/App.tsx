// ============================================================
// WAH SILENT EXAM MONITOR — Pengawas Keheningan & Timer Ujian
// WAH Official — Wiyanto Abu Hanif
//
// Aplikasi bantu guru untuk suasana ujian yang tenang:
// · Deteksi kebisingan lokal via Web Audio API (tanpa rekaman)
// · Robot indikator dengan 4 ekspresi dinamis
// · Timer countdown akurat berbasis timestamp
// · Peringatan audio bertahap (TTS id-ID / beep lembut)
// · Background PNG 16:9 kustom (IndexedDB)
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import defaultBg from "./assets/default-bg.jpg";
import { BottomBar } from "./components/BottomBar";
import { Header } from "./components/Header";
import { PresentationMode } from "./components/PresentationMode";
import { SetTimeModal } from "./components/SetTimeModal";
import { SettingsModal, type SettingsTab } from "./components/SettingsModal";
import { SilentMonitorPanel } from "./components/SilentMonitorPanel";
import { TimerPanel } from "./components/TimerPanel";
import { Toasts, type ToastItem, type ToastType } from "./components/Toasts";
import { useAlertSound } from "./hooks/useAlertSound";
import { useExamTimer } from "./hooks/useExamTimer";
import { useNoiseMonitor } from "./hooks/useNoiseMonitor";
import { useNow } from "./hooks/useNow";
import {
  clearBackgroundBlob,
  clearSettings,
  loadBackgroundBlob,
  loadSettings,
  saveBackgroundBlob,
  saveSettings,
} from "./lib/storage";
import { DEFAULT_SETTINGS, type AppSettings, type RobotState } from "./types";

export default function App() {
  // ------------------------- Pengaturan -------------------------
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  // --------------------------- Toasts ---------------------------
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);
  const pushToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // ------------------------- Audio alerts ------------------------
  const sound = useAlertSound(settingsRef);

  // --------------------- Monitor kebisingan ----------------------
  const noise = useNoiseMonitor({
    sensitivity: settings.sensitivity,
    thresholds: settings.thresholds,
    detectionDuration: settings.detectionDuration,
  });
  const micActive = noise.micState === "active";

  const handleToggleMic = useCallback(() => {
    sound.unlock();
    void noise.toggle();
  }, [noise, sound]);

  // Laporkan perubahan status mikrofon
  useEffect(() => {
    if (noise.micState === "active") {
      pushToast("success", "Mikrofon aktif — analisis suara berjalan lokal di perangkat ini.");
    } else if (
      (noise.micState === "denied" || noise.micState === "error" || noise.micState === "unsupported") &&
      noise.error
    ) {
      pushToast("error", noise.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noise.micState]);

  // Peringatan bertahap dengan cooldown + eskalasi ketegasan
  const lastAlertAt = useRef(0);
  const severity = useRef(0);
  useEffect(() => {
    if (!micActive) {
      severity.current = 0;
      return;
    }
    const st = noise.status;
    if (st === "tenang" || st === "terdeteksi") {
      severity.current = 0;
      return;
    }
    const s = settingsRef.current;
    if (!s.alertEnabled) return;
    const now = Date.now();
    if (now - lastAlertAt.current < s.alertCooldown * 1000) return;
    lastAlertAt.current = now;
    const level = (
      st === "berisik" ? (severity.current % 2 === 0 ? 1 : 2) : 2 + Math.min(severity.current, 1)
    ) as 1 | 2 | 3;
    severity.current += 1;
    sound.playAlert(level);
    pushToast(
      "warning",
      st === "berisik" ? "Suasana mulai berisik — pengingat diputar." : "Kelas sangat berisik — pengingat tegas diputar."
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noise.status, micActive]);

  // --------------------------- Timer ------------------------------
  const handleDurationChange = useCallback(
    (sec: number) => updateSettings({ defaultDurationSec: sec }),
    [updateSettings]
  );
  const timer = useExamTimer(settings.defaultDurationSec, {
    onDurationChange: handleDurationChange,
    onMilestone: (min) => {
      if (!settingsRef.current.timerNotifications) return;
      sound.playMilestone(min);
      pushToast("info", `Sisa waktu ujian ${min} menit.`);
    },
    onFinish: () => {
      if (settingsRef.current.timerEndAlert) sound.playTimerEnd();
      pushToast("warning", "Waktu ujian telah berakhir.");
    },
  });

  const handlePreset = useCallback(
    (minutes: number) => {
      timer.setDuration(minutes * 60);
      pushToast("info", `Durasi ujian diatur ke ${minutes} menit.`);
    },
    [timer, pushToast]
  );

  const handleSetTime = useCallback(
    (totalSec: number) => {
      timer.setDuration(totalSec);
      pushToast("success", "Waktu ujian baru berhasil diatur.");
    },
    [timer, pushToast]
  );

  // ------------------------- Background ---------------------------
  const [bgUrl, setBgUrl] = useState<string>(defaultBg);
  useEffect(() => {
    let cancelled = false;
    if (settings.bgCustom) {
      void loadBackgroundBlob().then((blob) => {
        if (cancelled) return;
        if (blob) {
          setBgUrl((prev) => {
            if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
            return URL.createObjectURL(blob);
          });
        }
      });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyBackground = useCallback(
    async (blob: Blob): Promise<boolean> => {
      try {
        await saveBackgroundBlob(blob);
      } catch {
        pushToast(
          "warning",
          "Background diterapkan, tetapi gagal disimpan permanen (IndexedDB tidak tersedia/penuh)."
        );
      }
      setBgUrl((prev) => {
        if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
      updateSettings({ bgCustom: true });
      return true;
    },
    [pushToast, updateSettings]
  );

  const removeBackground = useCallback(() => {
    void clearBackgroundBlob();
    setBgUrl((prev) => {
      if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return defaultBg;
    });
    updateSettings({ bgCustom: false });
    pushToast("info", "Background dikembalikan ke ruang kelas default.");
  }, [pushToast, updateSettings]);

  // ------------------------- Fullscreen ---------------------------
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const sync = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenEnabled) {
      pushToast("error", "Browser ini tidak mendukung mode fullscreen.");
      return;
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      document.documentElement.requestFullscreen().catch(() => {
        pushToast("error", "Permintaan fullscreen ditolak oleh browser.");
      });
    }
  }, [pushToast]);

  // --------------------- Mode Presentasi / UI ----------------------
  const [presenting, setPresenting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("mikrofon");
  const [setTimeOpen, setSetTimeOpen] = useState(false);

  const openSettings = useCallback((tab: SettingsTab) => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  }, []);

  const enterPresentation = useCallback(() => {
    setPresenting(true);
    if (document.fullscreenEnabled && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => undefined);
    }
  }, []);

  const now = useNow();
  const robotState: RobotState = micActive ? noise.status : "standby";

  const resetAll = useCallback(() => {
    clearSettings();
    void clearBackgroundBlob();
    setBgUrl((prev) => {
      if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return defaultBg;
    });
    const fresh = { ...DEFAULT_SETTINGS };
    setSettings(fresh);
    saveSettings(fresh);
    timer.setDuration(fresh.defaultDurationSec);
    setSettingsOpen(false);
    pushToast("success", "Semua pengaturan dikembalikan ke bawaan.");
  }, [pushToast, timer]);

  // ----------------------------- Render -----------------------------
  return (
    <div className="relative min-h-screen font-sans">
      {/* Latar belakang + overlay keterbacaan */}
      <div
        className="fixed inset-0 -z-10 bg-navy-900 bg-cover bg-center"
        aria-hidden
        style={{
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: settings.bgFit,
          backgroundPosition:
            settings.bgPosition === "center" ? "center" : `center ${settings.bgPosition}`,
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        className="fixed inset-0 -z-10 transition-colors duration-500"
        aria-hidden
        style={{ backgroundColor: `rgba(232, 240, 252, ${settings.bgOverlay})` }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-white/10 via-transparent to-navy-900/10"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header
          now={now}
          micState={noise.micState}
          onToggleMic={handleToggleMic}
          onOpenSettings={() => openSettings("mikrofon")}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />

        <main className="mx-auto grid w-full max-w-[1720px] flex-1 items-stretch gap-4 px-4 py-4 md:gap-6 md:px-8 md:py-6 xl:grid-cols-[1.12fr_1fr]">
          <SilentMonitorPanel
            robotState={robotState}
            level={noise.level}
            status={noise.status}
            thresholds={settings.thresholds}
            mic={noise}
            animationsEnabled={settings.animationsEnabled}
            showMeter={settings.showMeter}
            onToggleMic={handleToggleMic}
          />
          <TimerPanel
            timer={timer}
            showSeconds={settings.showSeconds}
            animationsEnabled={settings.animationsEnabled}
            onOpenSetTime={() => setSetTimeOpen(true)}
            onPreset={handlePreset}
          />
        </main>

        <div className="px-4 pb-3 md:px-8 md:pb-4">
          <BottomBar
            bgThumb={bgUrl}
            bgLabel={settings.bgCustom ? "Kustom (PNG)" : "Default (16:9)"}
            alertEnabled={settings.alertEnabled}
            alertVolume={settings.alertVolume}
            timerNotifications={settings.timerNotifications}
            onOpenSettings={openSettings}
            onToggleAlerts={() => {
              const next = !settings.alertEnabled;
              updateSettings({ alertEnabled: next });
              if (next) sound.unlock();
              pushToast("info", next ? "Peringatan audio diaktifkan." : "Peringatan audio dinonaktifkan.");
            }}
            onToggleNotif={() => {
              const next = !settings.timerNotifications;
              updateSettings({ timerNotifications: next });
              pushToast("info", next ? "Notifikasi sisa waktu diaktifkan." : "Notifikasi sisa waktu dinonaktifkan.");
            }}
            onEnterPresentation={enterPresentation}
          />
        </div>

        <footer className="pb-4 text-center">
          <p className="text-[11px] font-bold tracking-wide text-navy-900/60 md:text-xs">
            WAH Official — Wiyanto Abu Hanif
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-navy-900/40">
            Mikrofon diproses 100% lokal · Tingkat suara adalah estimasi relatif, bukan dB SPL
            terkalibrasi
          </p>
        </footer>
      </div>

      {/* ------------------------- Overlays ------------------------- */}
      <SettingsModal
        open={settingsOpen}
        tab={settingsTab}
        onTabChange={setSettingsTab}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        updateSettings={updateSettings}
        mic={noise}
        sound={sound}
        bgUrl={bgUrl}
        onApplyBackground={applyBackground}
        onRemoveBackground={removeBackground}
        onResetAll={resetAll}
        pushToast={pushToast}
      />

      <SetTimeModal
        open={setTimeOpen}
        currentMs={timer.durationMs}
        onClose={() => setSetTimeOpen(false)}
        onApply={handleSetTime}
      />

      {presenting && (
        <PresentationMode
          robotState={robotState}
          status={noise.status}
          level={noise.level}
          thresholds={settings.thresholds}
          micActive={micActive}
          timer={timer}
          now={now}
          animationsEnabled={settings.animationsEnabled}
          showMeter={settings.showMeter}
          alertEnabled={settings.alertEnabled}
          onToggleAlerts={() => updateSettings({ alertEnabled: !settings.alertEnabled })}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onExit={() => setPresenting(false)}
        />
      )}

      <Toasts items={toasts} />
    </div>
  );
}
