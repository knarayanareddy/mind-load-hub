import { useMemo, useState } from "react";
import { AlertTriangle, Sparkles, Sliders } from "lucide-react";

import { ScoreRing } from "@/components/score-ring";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import type { AlertLevel } from "@/lib/scoring";

interface SandboxInputs {
  meetings: number; // 0-10
  slack: number; // 0-60
  context: number; // 0-8
  afterHours: number; // 0-5
}

function clamp(n: number, lo = 0, hi = 100) {
  return Math.min(hi, Math.max(lo, n));
}

function levelFor(score: number): AlertLevel {
  if (score <= 40) return "OPTIMAL";
  if (score <= 65) return "MODERATE";
  if (score <= 80) return "HIGH";
  if (score <= 90) return "CRITICAL";
  return "BURNOUT";
}

function computeSandbox(i: SandboxInputs) {
  // Each subscore 0..100
  const temporal = clamp((i.meetings / 10) * 100);
  const communication = clamp((i.slack / 60) * 100);
  const taskSwitching = clamp((i.context / 8) * 100);
  const boundary = clamp((i.afterHours / 5) * 100);
  // Sentiment: degrades as combined pressure rises
  const pressure = (temporal + communication + boundary) / 3;
  const sentiment = clamp(pressure * 0.9);

  const score = clamp(
    Math.round(
      (temporal * 0.3 +
        communication * 0.25 +
        taskSwitching * 0.2 +
        boundary * 0.15 +
        sentiment * 0.1) *
        10,
    ) / 10,
  );

  const risks: string[] = [];
  const recs: string[] = [];
  if (i.meetings > 5) {
    risks.push("⚡ Excessive meetings creating fragmentation");
    recs.push("📅 Enable 15-minute meeting recovery buffers");
  }
  if (i.slack > 30) {
    risks.push("💬 Heavy communication volume distracting from focus");
    recs.push("🌙 Trigger Focus Mode (Auto-reply & DND)");
  }
  if (i.context > 4) {
    risks.push("🔀 Too many parallel tracks of work");
    recs.push("🔀 Recommend PM reduces current sprint scope");
  }
  if (i.afterHours > 2) {
    risks.push("🌙 Sustained late-night activity detected");
    recs.push("🛑 Enforce Strict After-Hours DND blocks");
  }

  return {
    score,
    level: levelFor(score),
    temporal,
    communication,
    taskSwitching,
    boundary,
    sentiment,
    risks,
    recs,
  };
}

export function FrictionSandbox() {
  const [inputs, setInputs] = useState<SandboxInputs>({
    meetings: 3,
    slack: 15,
    context: 2,
    afterHours: 1,
  });

  const result = useMemo(() => computeSandbox(inputs), [inputs]);

  const sliders: Array<{
    key: keyof SandboxInputs;
    label: string;
    max: number;
    unit: string;
  }> = [
    { key: "meetings", label: "Meeting Density", max: 10, unit: "meetings/day" },
    { key: "slack", label: "Slack Interruption Rate", max: 60, unit: "msgs/hr" },
    { key: "context", label: "Context Switching", max: 8, unit: "parallel PRs" },
    { key: "afterHours", label: "After-Hours Work", max: 5, unit: "hrs late night" },
  ];

  const breakdown = [
    { label: "Temporal", value: result.temporal },
    { label: "Communication", value: result.communication },
    { label: "Task switching", value: result.taskSwitching },
    { label: "Boundary", value: result.boundary },
    { label: "Sentiment", value: result.sentiment },
  ];

  return (
    <Card
      className="relative overflow-hidden border border-white/40 bg-gradient-to-br from-white/70 via-white/50 to-primary/5 p-6 shadow-[0_8px_30px_-12px_color-mix(in_oklab,var(--primary)_25%,transparent)] backdrop-blur-xl"
    >
      {/* gradient border accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-60"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--primary) 18%, transparent), transparent 40%, color-mix(in oklab, var(--flow) 14%, transparent))",
          mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: 1,
        }}
      />

      <div className="relative">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold">Friction Sandbox</h2>
              <p className="text-xs text-muted-foreground">
                Drag the sliders to simulate a workday and watch the load shift live.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          {/* Controls */}
          <div className="space-y-5">
            {sliders.map((s) => (
              <div key={s.key}>
                <div className="mb-2 flex items-baseline justify-between">
                  <label className="text-sm font-medium">{s.label}</label>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    <span className="font-display text-sm font-semibold text-foreground">
                      {inputs[s.key]}
                    </span>{" "}
                    / {s.max} {s.unit}
                  </span>
                </div>
                <Slider
                  value={[inputs[s.key]]}
                  min={0}
                  max={s.max}
                  step={s.max <= 10 ? 1 : 1}
                  onValueChange={([v]) =>
                    setInputs((prev) => ({ ...prev, [s.key]: v }))
                  }
                />
              </div>
            ))}
          </div>

          {/* Live readout */}
          <div className="space-y-5">
            <div className="flex items-center justify-center rounded-xl border border-white/40 bg-white/40 p-4 backdrop-blur">
              <ScoreRing score={result.score} level={result.level} size={150} />
            </div>

            <div className="grid gap-2">
              {breakdown.map((c) => (
                <div key={c.label}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{c.label}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {Math.round(c.value)}
                    </span>
                  </div>
                  <Progress value={c.value} className="mt-1 h-1.5" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/40 bg-white/40 p-4 backdrop-blur">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-[color:var(--load-high)]" /> Risk factors
            </h3>
            {result.risks.length ? (
              <ul className="space-y-1.5 text-sm">
                {result.risks.map((r, i) => (
                  <li
                    key={i}
                    className="rounded-md bg-[color:var(--load-high)]/8 px-2.5 py-1.5"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                Sandbox looks calm. Push a slider to see risks emerge.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-white/40 bg-white/40 p-4 backdrop-blur">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> Recommended interventions
            </h3>
            {result.recs.length ? (
              <ul className="space-y-1.5 text-sm">
                {result.recs.map((r, i) => (
                  <li key={i} className="rounded-md bg-primary/8 px-2.5 py-1.5">
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                No interventions needed in this scenario.
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
