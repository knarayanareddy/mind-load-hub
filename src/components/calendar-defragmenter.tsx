import { useState } from "react";
import { CalendarClock, Play, Sparkles, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BlockKind = "meeting" | "free" | "focus";

interface Block {
  id: string;
  label: string;
  start: number; // hours, e.g. 9.5
  end: number;
  kind: BlockKind;
}

const DAY_START = 9;
const DAY_END = 18;
const TOTAL_HOURS = DAY_END - DAY_START; // 9

const BEFORE: Block[] = [
  { id: "standup", label: "Daily Standup", start: 9, end: 9.5, kind: "meeting" },
  { id: "f1", label: "Free", start: 9.5, end: 10.5, kind: "free" },
  { id: "pr", label: "PR Review Sync", start: 10.5, end: 11, kind: "meeting" },
  { id: "f2", label: "Free", start: 11, end: 13, kind: "free" },
  { id: "pm", label: "Sync with PM", start: 13, end: 13.5, kind: "meeting" },
  { id: "f3", label: "Free", start: 13.5, end: 15, kind: "free" },
  { id: "design", label: "Design Review", start: 15, end: 15.5, kind: "meeting" },
  { id: "f4", label: "Free", start: 15.5, end: 18, kind: "free" },
];

const AFTER: Block[] = [
  { id: "standup", label: "Daily Standup", start: 9, end: 9.5, kind: "meeting" },
  { id: "pr", label: "PR Review Sync", start: 9.5, end: 10, kind: "meeting" },
  { id: "pm", label: "Sync with PM", start: 10, end: 10.5, kind: "meeting" },
  { id: "design", label: "Design Review", start: 10.5, end: 11, kind: "meeting" },
  { id: "focus", label: "🚀 Protected Deep Focus", start: 11, end: 18, kind: "focus" },
];

function fmt(h: number) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function CalendarColumn({
  title,
  subtitle,
  blocks,
  animateKey,
}: {
  title: string;
  subtitle: string;
  blocks: Block[];
  animateKey: string | number;
}) {
  const hourLines = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => DAY_START + i);
  return (
    <div className="flex-1">
      <div className="mb-3">
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="relative flex">
        {/* hour gutter */}
        <div className="w-12 shrink-0 pr-2 text-right">
          {hourLines.map((h) => (
            <div
              key={h}
              className="h-12 text-[10px] tabular-nums text-muted-foreground"
              style={{ lineHeight: "0" }}
            >
              <span className="relative -top-1.5">{fmt(h)}</span>
            </div>
          ))}
        </div>

        {/* track */}
        <div className="relative flex-1 rounded-xl border bg-muted/30 p-1">
          <div
            className="relative"
            style={{ height: `${TOTAL_HOURS * 48}px` }}
          >
            {/* hour gridlines */}
            {hourLines.slice(0, -1).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-dashed border-border/60"
                style={{ top: `${i * 48}px` }}
              />
            ))}

            {blocks.map((b, idx) => {
              const top = (b.start - DAY_START) * 48;
              const height = (b.end - b.start) * 48;
              return (
                <div
                  key={`${animateKey}-${b.id}`}
                  className={cn(
                    "absolute left-1 right-1 overflow-hidden rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm",
                    "transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]",
                    b.kind === "meeting" &&
                      "border border-[color:var(--load-high)]/30 bg-[color:var(--load-high)]/15 text-[color:var(--load-burnout)]",
                    b.kind === "free" &&
                      "border border-dashed border-border bg-background/60 text-muted-foreground",
                    b.kind === "focus" &&
                      "border border-[color:var(--flow)]/40 bg-gradient-to-br from-[color:var(--flow)]/25 via-primary/15 to-[color:var(--load-optimal)]/25 text-foreground shadow-[0_8px_30px_-12px_color-mix(in_oklab,var(--flow)_50%,transparent)]",
                  )}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    animation: `defrag-slide 600ms cubic-bezier(0.65,0,0.35,1) ${idx * 60}ms both`,
                  }}
                >
                  <div className="flex h-full flex-col justify-between">
                    <span className="line-clamp-1">{b.label}</span>
                    <span className="text-[10px] opacity-70 tabular-nums">
                      {fmt(b.start)} – {fmt(b.end)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CalendarDefragmenter() {
  const [optimized, setOptimized] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const run = () => {
    setOptimized(true);
    setAnimKey((k) => k + 1);
  };
  const reset = () => {
    setOptimized(false);
    setAnimKey((k) => k + 1);
  };

  return (
    <Card className="relative overflow-hidden p-6 shadow-[0_10px_40px_-20px_color-mix(in_oklab,var(--primary)_40%,transparent)]">
      <style>{`
        @keyframes defrag-slide {
          0% { opacity: 0; transform: translateY(-6px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <CalendarClock className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold">Calendar Defragmenter</h2>
            <p className="text-xs text-muted-foreground">
              Watch the agent cluster meetings and reclaim contiguous deep-focus time.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {optimized && (
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
          )}
          <Button size="sm" onClick={run} disabled={optimized}>
            <Play className="mr-2 h-4 w-4" />
            {optimized ? "Defragmented" : "Run Defragmenter"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <CalendarColumn
          title="Before"
          subtitle="Fragmented day · 0 focus blocks of 2hr+"
          blocks={BEFORE}
          animateKey={`before-${animKey}`}
        />
        <div className="hidden items-center md:flex">
          <div className="h-24 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
        </div>
        <CalendarColumn
          title="After (Optimized)"
          subtitle="Clustered meetings · 1 contiguous 7hr block"
          blocks={optimized ? AFTER : BEFORE}
          animateKey={`after-${animKey}-${optimized}`}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-muted/40 px-4 py-3">
          <p className="text-xs text-muted-foreground">Focus blocks (≥2hr)</p>
          <p className="mt-1 font-display text-lg font-semibold">
            <span className="text-muted-foreground">0</span>
            <span className="mx-2 text-muted-foreground">→</span>
            <span className="text-[color:var(--flow)]">{optimized ? 1 : 0}</span>
          </p>
        </div>
        <div className="rounded-xl border bg-muted/40 px-4 py-3">
          <p className="text-xs text-muted-foreground">Longest focus stretch</p>
          <p className="mt-1 font-display text-lg font-semibold">
            <span className="text-muted-foreground">2.5h</span>
            <span className="mx-2 text-muted-foreground">→</span>
            <span className="text-[color:var(--flow)]">{optimized ? "7h" : "2.5h"}</span>
          </p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-primary/8 to-[color:var(--flow)]/10 px-4 py-3">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Reclaimed
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-primary">
            {optimized ? "+4.5 hrs of deep work" : "Run to see gain"}
          </p>
        </div>
      </div>
    </Card>
  );
}
