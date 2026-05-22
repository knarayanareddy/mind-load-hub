import { queryOptions, useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AlertTriangle, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FrictionSandbox } from "@/components/friction-sandbox";
import { ScoreRing } from "@/components/score-ring";
import { ScoreTrend } from "@/components/score-trend";
import { SignalGrid } from "@/components/signal-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { getDashboard, seedDemoData } from "@/lib/dashboard.functions";
import type { AlertLevel } from "@/lib/scoring";

const dashboardQuery = queryOptions({
  queryKey: ["dashboard"],
  queryFn: () => getDashboard(),
});

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery),
  component: DashboardPage,
});

function DashboardPage() {
  const router = useRouter();
  const { data } = useSuspenseQuery(dashboardQuery);
  const [sandboxMode, setSandboxMode] = useState(false);
  const seed = useMutation({
    mutationFn: () => seedDemoData(),
    onSuccess: () => {
      toast.success("Seeded 14 days of demo signals");
      router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  });

  const score = data.latestScore;
  const profile = data.profile;

  if (!score) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}</h1>
        <p className="mt-2 text-muted-foreground">
          No signals yet. Seed 14 days of demo telemetry to see the dashboard come to life.
        </p>
        <Button className="mt-6" onClick={() => seed.mutate()} disabled={seed.isPending}>
          {seed.isPending ? "Seeding…" : "Seed demo data"}
        </Button>
      </div>
    );
  }

  const components = [
    { label: "Temporal", value: Number(score.temporal_score), hint: "Meeting load & focus blocks" },
    { label: "Communication", value: Number(score.communication_score), hint: "Response patterns" },
    { label: "Task switching", value: Number(score.task_switching_score), hint: "Parallel work" },
    { label: "Boundary", value: Number(score.boundary_score), hint: "After-hours pressure" },
    { label: "Sentiment", value: Number(score.sentiment_score), hint: "Wellbeing signal" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Today's cognitive load</h1>
          <p className="text-sm text-muted-foreground">
            Last computed {new Date(score.computed_at).toLocaleString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => seed.mutate()} disabled={seed.isPending}>
          <RefreshCw className="mr-2 h-4 w-4" /> Re-seed demo data
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center p-6 lg:col-span-1">
          <ScoreRing
            score={Number(score.score)}
            level={score.alert_level as AlertLevel}
            inFlow={!!score.in_flow_state}
          />
          <div className="mt-4 grid w-full grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-muted px-3 py-2">
              <p className="text-xs text-muted-foreground">Burnout risk</p>
              <p className="font-display text-lg font-semibold tabular-nums">
                {Math.round(Number(score.burnout_risk_pct ?? 0))}%
              </p>
            </div>
            <div className="rounded-lg bg-muted px-3 py-2">
              <p className="text-xs text-muted-foreground">Trend</p>
              <p className="font-display text-lg font-semibold">{score.score_trend ?? "STABLE"}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">14-day trend</h2>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3" /> {data.scoreHistory.length} points
            </Badge>
          </div>
          <ScoreTrend data={data.scoreHistory} />
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 font-display text-base font-semibold">Component breakdown</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {components.map((c) => (
            <div key={c.label}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{c.label}</span>
                <span className="text-sm tabular-nums text-muted-foreground">{Math.round(c.value)}</span>
              </div>
              <Progress value={c.value} className="mt-1.5 h-2" />
              <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <h2 className="mb-3 font-display text-base font-semibold">Latest signals</h2>
        <SignalGrid s={data.latestSnapshot} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
            <AlertTriangle className="h-4 w-4 text-[color:var(--load-high)]" /> Risk factors
          </h2>
          {(score.risk_factors as string[] | null)?.length ? (
            <ul className="space-y-2 text-sm">
              {(score.risk_factors as string[]).map((r, i) => (
                <li key={i} className="flex gap-2 rounded-md bg-muted/60 px-3 py-2">
                  <span className="text-[color:var(--load-high)]">•</span> {r}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No active risk factors detected.</p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> Recommended interventions
          </h2>
          {(score.recommended_interventions as string[] | null)?.length ? (
            <ul className="space-y-2 text-sm">
              {(score.recommended_interventions as string[]).map((r, i) => (
                <li key={i} className="flex gap-2 rounded-md bg-primary/5 px-3 py-2">
                  <span className="text-primary">→</span> {r}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No interventions recommended right now.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
