// ============================================================
// Toasts — Notifikasi ringan (info / sukses / peringatan / error)
// ============================================================

import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "../utils/cn";

export type ToastType = "info" | "success" | "warning" | "error";

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

const ICONS: Record<ToastType, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const STYLES: Record<ToastType, string> = {
  info: "border-sky-300/60 bg-navy-900/95 text-sky-100",
  success: "border-emerald-300/60 bg-emerald-900/95 text-emerald-100",
  warning: "border-amber-300/60 bg-amber-950/95 text-amber-100",
  error: "border-red-300/60 bg-red-950/95 text-red-100",
};

export function Toasts({ items }: { items: ToastItem[] }) {
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[80] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4">
      {items.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            role="alert"
            className={cn(
              "flex w-full animate-toast-in items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur",
              STYLES[t.type]
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <p className="leading-snug">{t.message}</p>
          </div>
        );
      })}
    </div>
  );
}
