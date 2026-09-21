// ============================================================
// useNoiseMonitor — Deteksi tingkat suara via Web Audio API
// Analisis dilakukan 100% lokal: tidak ada perekaman,
// tidak ada audio yang dikirim ke server.
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import type { MicState, NoiseStatus, Thresholds } from "../types";

interface Options {
  sensitivity: number;
  thresholds: Thresholds;
  detectionDuration: number; // ms sebelum status naik
}

const CALM_DOWN_MS = 2600; // jeda sebelum status turun
const STATUS_RANK: Record<NoiseStatus, number> = {
  tenang: 0,
  terdeteksi: 1,
  berisik: 2,
  sangatBerisik: 3,
};

export function useNoiseMonitor(opts: Options) {
  const [micState, setMicState] = useState<MicState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [status, setStatus] = useState<NoiseStatus>("tenang");

  const optsRef = useRef(opts);
  optsRef.current = opts;

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const rafRef = useRef(0);
  const smoothedRef = useRef(0);
  const statusRef = useRef<NoiseStatus>("tenang");
  const pendingRef = useRef<{ status: NoiseStatus; since: number } | null>(null);
  const lastPushRef = useRef(0);

  const supported =
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    !!(window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);

  const applyStatus = useCallback((s: NoiseStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const statusForLevel = useCallback((v: number): NoiseStatus => {
    const t = optsRef.current.thresholds;
    if (v < t.quiet) return "tenang";
    if (v < t.detected) return "terdeteksi";
    if (v < t.noisy) return "berisik";
    return "sangatBerisik";
  }, []);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    const data = dataRef.current;
    if (!analyser || !data) return;

    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    // Pemetaan RMS -> skala relatif 0..100 (BUKAN desibel terkalibrasi)
    const sens = optsRef.current.sensitivity / 5;
    const raw = Math.min(100, Math.max(0, Math.pow(rms * 3, 0.75) * 100 * sens));

    // Smoothing asimetris: naik responsif, turun lembut
    const s = smoothedRef.current;
    const next = s + (raw - s) * (raw > s ? 0.28 : 0.07);
    smoothedRef.current = next;

    const now = performance.now();
    if (now - lastPushRef.current > 90) {
      lastPushRef.current = now;
      setLevel(next);
    }

    // Mesin status dengan hysteresis + durasi minimum
    const candidate = statusForLevel(next);
    const current = statusRef.current;
    if (candidate === current) {
      pendingRef.current = null;
    } else {
      const pending = pendingRef.current;
      if (!pending || pending.status !== candidate) {
        pendingRef.current = { status: candidate, since: now };
      } else {
        const isEscalation = STATUS_RANK[candidate] > STATUS_RANK[current];
        const needed = isEscalation ? optsRef.current.detectionDuration : CALM_DOWN_MS;
        if (now - pending.since >= needed) {
          applyStatus(candidate);
          pendingRef.current = null;
        }
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [applyStatus, statusForLevel]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      ctxRef.current.close().catch(() => undefined);
    }
    ctxRef.current = null;
    analyserRef.current = null;
    dataRef.current = null;
    smoothedRef.current = 0;
    pendingRef.current = null;
    setLevel(0);
    applyStatus("tenang");
    setMicState("idle");
  }, [applyStatus]);

  const start = useCallback(async (): Promise<boolean> => {
    if (streamRef.current) return true;
    if (!supported) {
      setMicState("unsupported");
      setError(
        "Browser ini tidak mendukung Web Audio API / akses mikrofon. Timer dan background tetap dapat digunakan."
      );
      return false;
    }
    setMicState("requesting");
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => undefined);
      }
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.fftSize);

      smoothedRef.current = 0;
      applyStatus("tenang");
      setMicState("active");
      rafRef.current = requestAnimationFrame(tick);
      return true;
    } catch (e) {
      const err = e as DOMException;
      streamRef.current = null;
      if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
        setMicState("denied");
        setError(
          "Izin mikrofon ditolak. Buka pengaturan situs di browser, izinkan mikrofon, lalu coba lagi. Timer dan background tetap dapat digunakan."
        );
      } else if (err?.name === "NotFoundError" || err?.name === "OverconstrainedError") {
        setMicState("error");
        setError("Perangkat mikrofon tidak ditemukan pada komputer ini.");
      } else {
        setMicState("error");
        setError(
          `Mikrofon tidak dapat diakses (${err?.message ?? "kesalahan tidak diketahui"}).`
        );
      }
      return false;
    }
  }, [applyStatus, supported, tick]);

  const toggle = useCallback(async () => {
    if (micState === "active" || micState === "requesting") {
      stop();
      return false;
    }
    return start();
  }, [micState, start, stop]);

  /**
   * Kalibrasi suasana awal: ambil rata-rata level selama `durationMs`.
   */
  const sampleBaseline = useCallback(
    (durationMs: number, onProgress?: (ratio: number) => void): Promise<number> => {
      return new Promise((resolve, reject) => {
        if (micState !== "active") {
          reject(new Error("Aktifkan mikrofon terlebih dahulu sebelum kalibrasi."));
          return;
        }
        const samples: number[] = [];
        const started = performance.now();
        const iv = window.setInterval(() => {
          samples.push(smoothedRef.current);
          const elapsed = performance.now() - started;
          onProgress?.(Math.min(1, elapsed / durationMs));
          if (elapsed >= durationMs) {
            window.clearInterval(iv);
            const avg = samples.length
              ? samples.reduce((a, b) => a + b, 0) / samples.length
              : 0;
            resolve(avg);
          }
        }, 100);
      });
    },
    [micState]
  );

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (ctxRef.current && ctxRef.current.state !== "closed") {
        ctxRef.current.close().catch(() => undefined);
      }
    };
  }, []);

  return {
    micState,
    micSupported: supported,
    error,
    level,
    status,
    start,
    stop,
    toggle,
    sampleBaseline,
  };
}

export type NoiseMonitor = ReturnType<typeof useNoiseMonitor>;
