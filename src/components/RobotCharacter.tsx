// ============================================================
// RobotCharacter — Maskot robot edukatif (SVG murni).
// Ekspresi mata, alis, mulut & cincin status berubah sesuai
// tingkat kebisingan kelas. Transisi halus berbasis CSS.
// ============================================================

import type { RobotState } from "../types";
import { cn } from "../utils/cn";

interface Props {
  state: RobotState;
  animationsEnabled?: boolean;
  className?: string;
}

const RING_COLORS: Record<RobotState, string> = {
  standby: "#8496b4",
  tenang: "#22c55e",
  terdeteksi: "#eab308",
  berisik: "#f97316",
  sangatBerisik: "#ef4444",
};

/** 0 = terpejam, 1 = terbuka penuh */
const EYE_OPEN: Record<RobotState, number> = {
  standby: 0.14,
  tenang: 0.1,
  terdeteksi: 0.52,
  berisik: 0.82,
  sangatBerisik: 1,
};

type Mouth = "smile" | "softSmile" | "flat" | "open";
const MOUTHS: Record<RobotState, Mouth> = {
  standby: "softSmile",
  tenang: "smile",
  terdeteksi: "softSmile",
  berisik: "flat",
  sangatBerisik: "open",
};

export function RobotCharacter({ state, animationsEnabled = true, className }: Props) {
  const ring = RING_COLORS[state];
  const eyeOpen = EYE_OPEN[state];
  const dimmed = state === "standby";
  const eyeColor = dimmed ? "#7c93b5" : state === "sangatBerisik" ? "#fbbf24" : "#2ee6ff";
  const mouth = MOUTHS[state];
  const browAngle = state === "sangatBerisik" ? 13 : state === "berisik" ? 7 : 0;
  const alertPulse = state === "berisik" || state === "sangatBerisik";
  const asleep = state === "tenang" || state === "standby";

  return (
    <svg
      viewBox="0 0 440 462"
      role="img"
      aria-label="Robot indikator keheningan"
      className={cn("w-full h-auto select-none", className)}
    >
      <defs>
        <linearGradient id="rb-helmet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d7e4fb" />
        </linearGradient>
        <linearGradient id="rb-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c1e40" />
          <stop offset="100%" stopColor="#081430" />
        </linearGradient>
        <linearGradient id="rb-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e4fd8" />
        </linearGradient>
        <radialGradient id="rb-core" cx="50%" cy="46%" r="55%">
          <stop offset="0%" stopColor={ring} stopOpacity="0.34" />
          <stop offset="65%" stopColor={ring} stopOpacity="0.1" />
          <stop offset="100%" stopColor={ring} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ------- Latar: cahaya status + cincin berputar ------- */}
      <circle
        cx="220"
        cy="222"
        r="176"
        fill="url(#rb-core)"
        style={{ transition: "fill-opacity 600ms" }}
      />
      <g className={animationsEnabled ? "animate-spin-slower" : undefined} style={{ transformOrigin: "220px 222px" }}>
        <circle
          cx="220"
          cy="222"
          r="198"
          fill="none"
          stroke={ring}
          strokeWidth="2.5"
          strokeDasharray="3 14"
          strokeLinecap="round"
          opacity={dimmed ? 0.35 : 0.55}
          style={{ transition: "stroke 600ms" }}
        />
      </g>
      <g className={animationsEnabled ? "animate-spin-slower-rev" : undefined} style={{ transformOrigin: "220px 222px" }}>
        <circle
          cx="220"
          cy="222"
          r="184"
          fill="none"
          stroke={ring}
          strokeWidth="1.5"
          strokeDasharray="26 40"
          strokeLinecap="round"
          opacity={dimmed ? 0.2 : 0.32}
          style={{ transition: "stroke 600ms" }}
        />
      </g>

      {/* Cincin peringatan berdenyut saat berisik */}
      <circle
        cx="220"
        cy="222"
        r="192"
        fill="none"
        stroke={ring}
        strokeWidth="4"
        className={alertPulse && animationsEnabled ? "animate-ping-ring" : "opacity-0"}
        style={{ transformOrigin: "220px 222px", transition: "stroke 600ms" }}
      />

      {/* Bayangan melayang */}
      <ellipse cx="220" cy="436" rx="86" ry="13" fill="#0b2147" opacity="0.14" />

      {/* ---------------------- BADAN ROBOT ---------------------- */}
      <g className={animationsEnabled ? "animate-floaty" : undefined}>
        {/* Telinga */}
        {[64, 376].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="182" r="27" fill="url(#rb-blue)" />
            <circle cx={cx} cy="182" r="17" fill="#0a1a38" />
            <circle
              cx={cx}
              cy="182"
              r="15.5"
              fill="none"
              stroke={ring}
              strokeWidth="3"
              style={{ transition: "stroke 600ms" }}
            />
            <circle
              cx={cx}
              cy="182"
              r="5"
              fill={ring}
              className={animationsEnabled && !dimmed ? "animate-blink-soft" : undefined}
              style={{ transition: "fill 600ms" }}
            />
          </g>
        ))}

        {/* Antena */}
        <rect x="192" y="22" width="56" height="30" rx="15" fill="url(#rb-blue)" />
        <circle
          cx="220"
          cy="30"
          r="7"
          fill={ring}
          className={animationsEnabled && !dimmed ? "animate-blink-soft" : undefined}
          style={{ transition: "fill 600ms" }}
        />

        {/* Kepala */}
        <rect
          x="106"
          y="56"
          width="228"
          height="188"
          rx="66"
          fill="url(#rb-helmet)"
          stroke="#bdd2f6"
          strokeWidth="2"
        />
        <ellipse cx="172" cy="92" rx="52" ry="18" fill="#ffffff" opacity="0.75" />

        {/* Layar wajah */}
        <rect
          x="134"
          y="88"
          width="172"
          height="132"
          rx="44"
          fill="url(#rb-face)"
          stroke="#233f74"
          strokeWidth="2"
        />

        {/* Alis — miring saat berisik */}
        {[172, 268].map((cx, i) => (
          <rect
            key={`brow-${cx}`}
            x={cx - 19}
            y="112"
            width="38"
            height="8"
            rx="4"
            fill={dimmed ? "#7c93b5" : "#8fd8ff"}
            className="svg-origin transition-all duration-500"
            opacity={browAngle > 0 ? 1 : 0}
            style={{
              transform: `rotate(${(i === 0 ? -1 : 1) * -browAngle}deg) translateY(${browAngle > 0 ? -3 : 6}px)`,
            }}
          />
        ))}

        {/* Mata TERBUKA (diskalakan vertikal sesuai tingkat kewaspadaan) */}
        {[172, 268].map((cx) => (
          <g
            key={`open-${cx}`}
            className="svg-origin transition-all duration-500 ease-out"
            opacity={asleep ? 0 : 1}
            style={{
              transform: `scaleY(${Math.max(eyeOpen, 0.18)})`,
            }}
          >
            <ellipse
              cx={cx}
              cy="150"
              rx="17"
              ry="16"
              fill={eyeColor}
              style={{
                transition: "fill 500ms",
                filter: `drop-shadow(0 0 7px ${eyeColor})`,
              }}
            />
            <circle cx={cx - 5} cy={143} r="4" fill="#ffffff" opacity="0.9" />
          </g>
        ))}

        {/* Mata TERPEJAM (lengkung tenang) */}
        {[172, 268].map((cx) => (
          <path
            key={`closed-${cx}`}
            d={`M ${cx - 17} 148 Q ${cx} 159 ${cx + 17} 148`}
            fill="none"
            stroke={eyeColor}
            strokeWidth="7"
            strokeLinecap="round"
            className="transition-opacity duration-500"
            opacity={asleep ? 1 : 0}
            style={{ filter: `drop-shadow(0 0 5px ${eyeColor})` }}
          />
        ))}

        {/* Pipi bercahaya */}
        {[146, 294].map((cx) => (
          <circle
            key={`cheek-${cx}`}
            cx={cx}
            cy="188"
            r="4.5"
            fill={ring}
            opacity={dimmed ? 0.25 : 0.5}
            className={alertPulse && animationsEnabled ? "animate-blink-soft" : undefined}
            style={{ transition: "fill 600ms" }}
          />
        ))}

        {/* ---------- Mulut: 4 varian, crossfade ---------- */}
        <g
          stroke={state === "sangatBerisik" && !dimmed ? "#fbbf24" : eyeColor}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          className="transition-colors duration-500"
        >
          <path
            d="M 200 190 Q 220 203 240 190"
            className="transition-opacity duration-400"
            opacity={mouth === "smile" ? 1 : 0}
          />
          <path
            d="M 208 192 Q 220 199 232 192"
            strokeWidth="5"
            className="transition-opacity duration-400"
            opacity={mouth === "softSmile" ? 1 : 0}
          />
          <path
            d="M 206 194 L 234 194"
            className="transition-opacity duration-400"
            opacity={mouth === "flat" ? 1 : 0}
          />
        </g>
        <ellipse
          cx="220"
          cy="194"
          rx="11"
          ry="8.5"
          fill="#081430"
          stroke="#fbbf24"
          strokeWidth="4"
          className="transition-opacity duration-400"
          opacity={mouth === "open" ? 1 : 0}
        />

        {/* Leher */}
        <rect x="204" y="242" width="32" height="16" rx="6" fill="#a9c0ea" />

        {/* Bahu */}
        <circle cx="140" cy="292" r="24" fill="url(#rb-helmet)" stroke="#bdd2f6" strokeWidth="2" />
        <circle cx="300" cy="292" r="24" fill="url(#rb-helmet)" stroke="#bdd2f6" strokeWidth="2" />

        {/* Badan */}
        <path
          d="M 158 268 Q 158 252 178 252 L 262 252 Q 282 252 282 268 L 289 344 Q 291 372 262 372 L 178 372 Q 149 372 151 344 Z"
          fill="url(#rb-helmet)"
          stroke="#bdd2f6"
          strokeWidth="2"
        />
        <rect x="163" y="292" width="9" height="54" rx="4.5" fill="url(#rb-blue)" opacity="0.9" />
        <rect x="268" y="292" width="9" height="54" rx="4.5" fill="url(#rb-blue)" opacity="0.9" />

        {/* Lencana WAH */}
        <rect
          x="184"
          y="286"
          width="72"
          height="42"
          rx="12"
          fill="url(#rb-blue)"
          stroke={ring}
          strokeWidth="2"
          style={{ transition: "stroke 600ms" }}
        />
        <text
          x="220"
          y="313"
          textAnchor="middle"
          fontSize="19"
          fontWeight="800"
          fill="#ffffff"
          letterSpacing="2.5"
          style={{ fontFamily: "inherit" }}
        >
          WAH
        </text>

        {/* Lampu dada status */}
        <circle
          cx="220"
          cy="348"
          r="7"
          fill={ring}
          className={animationsEnabled && !dimmed ? "animate-breathe svg-origin" : undefined}
          style={{
            transition: "fill 600ms",
            filter: `drop-shadow(0 0 6px ${ring})`,
          }}
        />
      </g>
    </svg>
  );
}
