import type { AlertLevel } from "@/lib/scoring";
import { cn } from "@/lib/utils";

const LEVEL_COLORS: Record<AlertLevel, string> = {
  OPTIMAL: "var(--load-optimal)",
  MODERATE: "var(--load-moderate)",
  HIGH: "var(--load-high)",
  CRITICAL: "var(--load-critical)",
  BURNOUT: "var(--load-burnout)",
};

export function ScoreRing({
  score,
  level,
  inFlow,
  size = 180,
}: {
  score: number;
  level: AlertLevel;
  inFlow?: boolean;
  size?: number;
}) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * (score / 100);
  const color = inFlow ? "var(--flow)" : LEVEL_COLORS[level];

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 700ms ease, stroke 300ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-semibold tabular-nums">{Math.round(score)}</span>
        <span
          className={cn(
            "mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
          )}
          style={{ backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`, color }}
        >
          {inFlow ? "In flow" : level}
        </span>
      </div>
    </div>
  );
}
