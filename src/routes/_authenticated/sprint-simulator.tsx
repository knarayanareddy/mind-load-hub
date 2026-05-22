import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Waves, AlertTriangle, TrendingDown, Lightbulb, Loader2 } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/sprint-simulator")({
  component: SprintSimulatorPage,
});

const SPRINTS = [
  { id: "s14", label: "Sprint 14: Q3 Core Release" },
  { id: "s15", label: "Sprint 15: Payments Hardening" },
  { id: "s16", label: "Sprint 16: AI Insights Beta" },
];

const LOADING_STAGES = [
  "Spawning 10,000 autonomous AI developer agents...",
  "Analyzing GraphRAG task dependencies...",
  "Simulating sprint progression...",
  "Aggregating predictive cognitive load curves...",
];

const BURNOUT_CURVE = [
  { day: "Mon", score: 38 },
  { day: "Tue", score: 54 },
  { day: "Wed", score: 71 },
  { day: "Thu", score: 86 },
  { day: "Fri", score: 78 },
  { day: "Sat", score: 62 },
  { day: "Sun", score: 49 },
  { day: "Mon+1", score: 67 },
  { day: "Tue+1", score: 81 },
  { day: "Wed+1", score: 73 },
];

function SprintSimulatorPage() {
  const [sprint, setSprint] = useState("s14");
  const [seed, setSeed] = useState(
    "Proposed scope: 14 high-priority Jira stories, average 2.5 sync meetings/day per developer, launching on Friday.",
  );
  const [stage, setStage] = useState(-1);
  const [done, setDone] = useState(false);

  const run = () => {
    setDone(false);
    setStage(0);
    LOADING_STAGES.forEach((_, i) => {
      setTimeout(() => setStage(i), i * 900);
    });
    setTimeout(() => {
      setStage(-1);
      setDone(true);
    }, LOADING_STAGES.length * 900 + 400);
  };

  const loading = stage >= 0;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Waves className="h-3.5 w-3.5" /> MiroFish Engine
          </div>
          <h1 className="font-display text-3xl font-semibold">
            Predictive Swarm Simulation
          </h1>
          <p className="text-sm text-muted-foreground">
            Run a multi-agent forecast of the upcoming sprint before it begins. Surface burnout risks,
            morale drops, and emergent bottlenecks while there's still time to intervene.
          </p>
        </div>

        <Card className="border-border/60 bg-gradient-to-br from-surface to-surface/40 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Simulation Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Sprint</Label>
                <Select value={sprint} onValueChange={setSprint}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPRINTS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Agents in swarm</Label>
                <div className="flex h-10 items-center rounded-md border border-border/60 bg-background/40 px-3 text-sm text-muted-foreground">
                  10,000 autonomous developer agents
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Seed Context</Label>
              <Textarea
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                rows={4}
                placeholder="Describe sprint scope, constraints, holidays, dependencies..."
              />
            </div>
            <Button onClick={run} disabled={loading} size="lg" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Run MiroFish Swarm Simulation
            </Button>
          </CardContent>
        </Card>

        {loading && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="space-y-4 py-10">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/40">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  </div>
                </div>
                <div className="w-full max-w-md space-y-2">
                  {LOADING_STAGES.map((s, i) => (
                    <div
                      key={s}
                      className={
                        "flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition-all " +
                        (i < stage
                          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200/80"
                          : i === stage
                            ? "border-primary/40 bg-primary/10 text-foreground"
                            : "border-border/40 bg-background/30 text-muted-foreground opacity-50")
                      }
                    >
                      {i < stage ? (
                        <span className="text-emerald-400">✓</span>
                      ) : i === stage ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : (
                        <span className="text-muted-foreground">○</span>
                      )}
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {done && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-primary" /> Predictive Burnout Curve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={BURNOUT_CURVE} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="burnout" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="var(--color-primary)" />
                          <stop offset="60%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 4" opacity={0.6} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="url(#burnout)"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "var(--color-primary)" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Dashed line marks the 75-point burnout threshold. Swarm predicts a sustained breach Thu–Tue+1.
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" /> Emergent Risk Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                    ⚠️ Swarm predicts <strong>82% burnout risk</strong> for backend developers on Tuesday due to parallel PR review bottlenecks.
                  </div>
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
                    📉 Morale &amp; sentiment score predicted to drop <strong>30% by Thursday</strong> if after-hours Slack chatter is not restricted.
                  </div>
                  <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3">
                    🔁 Context-switching cost forecast to exceed <strong>4.2 hrs/dev/day</strong> mid-sprint.
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-surface to-surface">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" /> MiroFish Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-base leading-relaxed">
                    💡 <strong>Mitigation Suggestion:</strong> Reschedule Thursday's Sprint Sync to Monday, and auto-enforce Focus Blocks for the backend pod Mon–Wed.
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Predicted load reduction: <span className="text-foreground font-medium">−24 pts</span></li>
                    <li>• Predicted morale recovery: <span className="text-foreground font-medium">+18%</span></li>
                    <li>• Delivery confidence: <span className="text-foreground font-medium">87% on-time</span></li>
                  </ul>
                  <Button className="w-full gap-2" variant="default">
                    <Sparkles className="h-4 w-4" /> Apply Mitigation Plan
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
