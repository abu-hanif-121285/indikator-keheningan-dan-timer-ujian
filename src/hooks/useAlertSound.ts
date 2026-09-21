// ============================================================
// useAlertSound — Peringatan audio bertahap.
// - Suara sintetis (SpeechSynthesis API, Bahasa Indonesia)
// - Beep lembut nonverbal (Web Audio API)
// AudioContext dibuat/di-resume hanya atas interaksi pengguna.
// ============================================================

import { useCallback, useRef } from "react";
import type { AlertType } from "../types";
import { ALERT_TEXTS } from "../types";

export interface SoundSettings {
  alertType: AlertType;
  alertVolume: number;
  voiceURI: string;
}

type MutableRef<T> = { current: T };

type ChimeKind = "ringan" | "sedang" | "tegas" | "ping" | "habis";

export const speechSupported =
  typeof window !== "undefined" && "speechSynthesis" in window;

export function useAlertSound(settingsRef: MutableRef<SoundSettings>) {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureCtx = useCallback((): AudioContext | null => {
    try {
      if (!ctxRef.current) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        ctxRef.current = new Ctor();
      }
      if (ctxRef.current.state === "suspended") {
        ctxRef.current.resume().catch(() => undefined);
      }
      return ctxRef.current;
    } catch {
      return null;
    }
  }, []);

  /** Panggil dari gesture pengguna (mis. klik tombol) untuk membuka kunci audio. */
  const unlock = useCallback(() => {
    ensureCtx();
    if (speechSupported) {
      try {
        window.speechSynthesis.getVoices();
      } catch {
        /* abaikan */
      }
    }
  }, [ensureCtx]);

  const tone = useCallback(
    (freq: number, startIn: number, dur: number, vol: number, type: OscillatorType = "sine") => {
      const ctx = ensureCtx();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        const t0 = ctx.currentTime + startIn;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.025);
        gain.gain.setValueAtTime(Math.max(0.0002, vol), t0 + dur * 0.6);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + dur + 0.05);
      } catch {
        /* abaikan */
      }
    },
    [ensureCtx]
  );

  const chime = useCallback(
    (kind: ChimeKind) => {
      const v = (settingsRef.current.alertVolume / 100) * 0.45;
      if (v <= 0) return;
      switch (kind) {
        case "ringan":
          tone(660, 0, 0.2, v);
          tone(880, 0.22, 0.26, v);
          break;
        case "sedang":
          tone(587, 0, 0.18, v);
          tone(740, 0.2, 0.18, v);
          tone(880, 0.4, 0.3, v);
          break;
        case "tegas":
          tone(523, 0, 0.2, v * 1.05);
          tone(523, 0.26, 0.2, v * 1.05);
          tone(784, 0.52, 0.38, v);
          break;
        case "ping":
          tone(1046, 0, 0.16, v * 0.8);
          break;
        case "habis":
          tone(523, 0, 0.22, v);
          tone(659, 0.24, 0.22, v);
          tone(784, 0.48, 0.22, v);
          tone(1046, 0.72, 0.6, v);
          break;
      }
    },
    [settingsRef, tone]
  );

  const speak = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        if (!speechSupported) {
          resolve();
          return;
        }
        let done = false;
        const finish = () => {
          if (!done) {
            done = true;
            resolve();
          }
        };
        try {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = "id-ID";
          u.rate = 0.95;
          u.pitch = 1;
          u.volume = Math.min(1, Math.max(0, settingsRef.current.alertVolume / 100));
          const voices = window.speechSynthesis.getVoices();
          const wanted = settingsRef.current.voiceURI;
          const chosen =
            (wanted && voices.find((v) => v.voiceURI === wanted)) ||
            voices.find((v) => v.lang?.toLowerCase().startsWith("id")) ||
            null;
          if (chosen) u.voice = chosen;
          u.onend = finish;
          u.onerror = finish;
          window.speechSynthesis.speak(u);
          window.setTimeout(finish, 12000); // pengaman
        } catch {
          finish();
        }
      });
    },
    [settingsRef]
  );

  /** Peringatan kebisingan bertahap sesuai level 1..3 */
  const playAlert = useCallback(
    (level: 1 | 2 | 3) => {
      const { alertType, alertVolume } = settingsRef.current;
      if (alertVolume <= 0) return;
      const kind: ChimeKind = level === 1 ? "ringan" : level === 2 ? "sedang" : "tegas";
      if (alertType === "beep") {
        chime(kind);
      } else if (alertType === "suara") {
        void speak(ALERT_TEXTS[level]);
      } else {
        chime(kind);
        window.setTimeout(() => void speak(ALERT_TEXTS[level]), 650);
      }
    },
    [chime, settingsRef, speak]
  );

  /** Pengingat milestone (15/10/5/1 menit) */
  const playMilestone = useCallback(
    (minutes: number) => {
      const { alertType } = settingsRef.current;
      chime("ping");
      if (alertType !== "beep" && speechSupported) {
        const label = minutes === 1 ? "satu" : minutes.toString();
        window.setTimeout(() => void speak(`Sisa waktu ${label} menit.`), 300);
      }
    },
    [chime, settingsRef, speak]
  );

  /** Bunyi saat waktu habis */
  const playTimerEnd = useCallback(() => {
    const { alertType } = settingsRef.current;
    chime("habis");
    if (alertType !== "beep" && speechSupported) {
      window.setTimeout(() => void speak("Waktu ujian telah berakhir."), 900);
    }
  }, [chime, settingsRef, speak]);

  return {
    unlock,
    chime,
    speak,
    playAlert,
    playMilestone,
    playTimerEnd,
  };
}

export type AlertSound = ReturnType<typeof useAlertSound>;
