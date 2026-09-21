// ============================================================
// SetTimeModal — Atur durasi ujian manual (jam, menit, detik).
// ============================================================

import { Check, Clock3, Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../utils/cn";

interface Props {
  open: boolean;
  currentMs: number;
  onClose: () => void;
  onApply: (totalSec: number) => void;
}

interface FieldProps {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}

function NumberField({ label, value, max, onChange }: FieldProps) {
  const clamp = (v: number) => Math.min(max, Math.max(0, Math.round(v) || 0));
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`Kurangi ${label}`}
          onClick={() => onChange(clamp(value - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-navy-900 transition hover:bg-slate-200 active:scale-95"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          aria-label={label}
          className="h-14 w-20 rounded-xl border-2 border-slate-200 bg-white text-center font-display text-2xl font-bold tabular-nums text-navy-900 focus:border-brand-500 focus:outline-none"
        />
        <button
          type="button"
          aria-label={`Tambah ${label}`}
          onClick={() => onChange(clamp(value + 1))}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-navy-900 transition hover:bg-slate-200 active:scale-95"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <span className="text-[11px] font-bold tracking-[0.2em] text-slate-500">{label}</span>
    </div>
  );
}

export function SetTimeModal({ open, currentMs, onClose, onApply }: Props) {
  const [h, setH] = useState(0);
  const [m, setM] = useState(0);
  const [s, setS] = useState(0);

  useEffect(() => {
    if (open) {
      const total = Math.round(currentMs / 1000);
      setH(Math.floor(total / 3600));
      setM(Math.floor((total % 3600) / 60));
      setS(total % 60);
    }
  }, [open, currentMs]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") apply();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, h, m, s]);

  if (!open) return null;

  const totalSec = h * 3600 + m * 60 + s;
  const valid = totalSec >= 1;

  const apply = () => {
    if (!valid) return;
    onApply(totalSec);
    onClose();
  };

  const totalLabel =
    totalSec >= 3600
      ? `${h} jam${m > 0 ? ` ${m} menit` : ""}${s > 0 ? ` ${s} detik` : ""}`
      : totalSec >= 60
        ? `${Math.floor(totalSec / 60)} menit${s > 0 ? ` ${s} detik` : ""}`
        : `${totalSec} detik`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Atur waktu ujian"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md animate-fade-up rounded-3xl border border-white/60 bg-white/95 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600">
              <Clock3 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-extrabold text-navy-900">Atur Waktu Ujian</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex items-start justify-center gap-3 md:gap-5">
          <NumberField label="JAM" value={h} max={23} onChange={setH} />
          <NumberField label="MENIT" value={m} max={59} onChange={setM} />
          <NumberField label="DETIK" value={s} max={59} onChange={setS} />
        </div>

        <div
          className={cn(
            "mt-5 rounded-xl border px-4 py-2.5 text-center text-sm font-bold",
            valid ? "border-sky-200 bg-sky-50 text-sky-700" : "border-red-200 bg-red-50 text-red-600"
          )}
        >
          {valid ? `Total durasi: ${totalLabel}` : "Durasi minimal 1 detik"}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={!valid}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-sky-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check className="h-4 w-4" /> Terapkan
          </button>
        </div>
      </div>
    </div>
  );
}
