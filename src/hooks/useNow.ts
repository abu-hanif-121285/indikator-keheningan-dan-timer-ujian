import { useEffect, useState } from "react";

/** Jam digital — diperbarui setiap detik. */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(iv);
  }, [intervalMs]);
  return now;
}

export function formatClock(d: Date): string {
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatDate(d: Date): string {
  return d
    .toLocaleDateString("id-ID", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(",", ",");
}
