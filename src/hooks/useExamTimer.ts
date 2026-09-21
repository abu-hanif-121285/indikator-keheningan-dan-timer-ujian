// ============================================================
// useExamTimer — Countdown akurat berbasis timestamp.
// Tetap benar walau tab mengalami throttling karena sisa waktu
// dihitung dari selisih Date.now(), bukan pengurangan interval.
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import type { TimerState } from "../types";

const MILESTONES_MIN = [15, 10, 5, 1];
const MAX_MS = 99 * 3600_000;

interface TimerCallbacks {
  onMilestone?: (minutesLeft: number) => void;
  onFinish?: () => void;
  onDurationChange?: (sec: number) => void;
}

export function useExamTimer(initialSec: number, callbacks: TimerCallbacks = {}) {
  const [state, setState] = useState<TimerState>("idle");
  const [durationMs, setDurationMsState] = useState(() => Math.max(1000, initialSec * 1000));
  const [remainingMs, setRemainingMs] = useState(durationMs);

  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;
  const stateRef = useRef<TimerState>("idle");
  stateRef.current = state;
  const durationRef = useRef(durationMs);
  durationRef.current = durationMs;
  const remainingRef = useRef(remainingMs);
  remainingRef.current = remainingMs;
  const endAtRef = useRef(0);
  const intervalRef = useRef<number | undefined>(undefined);
  const notifiedRef = useRef<Set<number>>(new Set());

  const clearTick = useCallback(() => {
    if (intervalRef.current !== undefined) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  const finish = useCallback(() => {
    clearTick();
    remainingRef.current = 0;
    setRemainingMs(0);
    setState("finished");
    cbRef.current.onFinish?.();
  }, [clearTick]);

  const tick = useCallback(() => {
    const rem = endAtRef.current - Date.now();
    if (rem <= 0) {
      finish();
      return;
    }
    const remSec = Math.ceil(rem / 1000);
    for (const m of MILESTONES_MIN) {
      const ms = m * 60;
      if (remSec <= ms && !notifiedRef.current.has(ms)) {
        notifiedRef.current.add(ms);
        cbRef.current.onMilestone?.(m);
      }
    }
    remainingRef.current = rem;
    setRemainingMs(rem);
  }, [finish]);

  const start = useCallback(() => {
    if (stateRef.current === "running") return;
    const rem = remainingRef.current;
    if (rem <= 0) return;
    // Tandai milestone yang sudah terlewati agar tidak berbunyi telat
    const remSec = Math.ceil(rem / 1000);
    for (const m of MILESTONES_MIN) {
      if (m * 60 >= remSec) notifiedRef.current.add(m * 60);
    }
    endAtRef.current = Date.now() + rem;
    setState("running");
    clearTick();
    intervalRef.current = window.setInterval(tick, 200);
  }, [clearTick, tick]);

  const pause = useCallback(() => {
    if (stateRef.current !== "running") return;
    clearTick();
    const rem = Math.max(0, endAtRef.current - Date.now());
    remainingRef.current = rem;
    setRemainingMs(rem);
    setState("paused");
  }, [clearTick]);

  const reset = useCallback(() => {
    clearTick();
    notifiedRef.current.clear();
    remainingRef.current = durationRef.current;
    setRemainingMs(durationRef.current);
    setState("idle");
  }, [clearTick]);

  const restart = useCallback(() => {
    reset();
    // Jalankan kembali setelah state tersinkron
    window.setTimeout(() => {
      endAtRef.current = Date.now() + durationRef.current;
      notifiedRef.current.clear();
      remainingRef.current = durationRef.current;
      setRemainingMs(durationRef.current);
      setState("running");
      intervalRef.current = window.setInterval(tick, 200);
    }, 0);
  }, [reset, tick]);

  /** Atur durasi baru — selalu menghentikan & me-reset timer. */
  const setDuration = useCallback(
    (sec: number) => {
      const total = Math.min(MAX_MS, Math.max(1000, Math.round(sec * 1000)));
      clearTick();
      notifiedRef.current.clear();
      setDurationMsState(total);
      remainingRef.current = total;
      setRemainingMs(total);
      setState("idle");
      cbRef.current.onDurationChange?.(Math.round(total / 1000));
    },
    [clearTick]
  );

  /** Tambah/kurangi 1 menit. Tidak pernah negatif. */
  const adjustMinutes = useCallback(
    (delta: number) => {
      const deltaMs = delta * 60_000;
      if (stateRef.current === "running") {
        const newRem = Math.min(MAX_MS, Math.max(0, endAtRef.current - Date.now() + deltaMs));
        if (newRem <= 0) {
          finish();
          return;
        }
        endAtRef.current = Date.now() + newRem;
        remainingRef.current = newRem;
        setRemainingMs(newRem);
      } else if (stateRef.current === "paused") {
        const newRem = Math.min(MAX_MS, Math.max(0, remainingRef.current + deltaMs));
        remainingRef.current = newRem;
        setRemainingMs(newRem);
        if (newRem === 0) setState("finished");
      } else if (stateRef.current === "idle") {
        // Saat siap, geser durasi dasar sekaligus
        const newTotal = Math.min(MAX_MS, Math.max(60_000, durationRef.current + deltaMs));
        setDurationMsState(newTotal);
        remainingRef.current = newTotal;
        setRemainingMs(newTotal);
        cbRef.current.onDurationChange?.(Math.round(newTotal / 1000));
      }
    },
    [finish]
  );

  useEffect(() => clearTick, [clearTick]);

  return {
    state,
    durationMs,
    remainingMs,
    progress: durationMs > 0 ? remainingMs / durationMs : 0,
    start,
    pause,
    resume: start,
    reset,
    restart,
    setDuration,
    adjustMinutes,
  };
}

export type ExamTimer = ReturnType<typeof useExamTimer>;
