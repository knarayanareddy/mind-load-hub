import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Check, RefreshCw, Sparkles, TrendingUp, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updateInterventionOutcome } from "@/lib/intervention-actions.functions";
import { supabase } from "@/integrations/supabase/client";

import { CalendarDefragmenter } from "@/components/calendar-defragmenter";
import { IntegrationsPanel } from "@/components/integrations-panel";
import { FrictionSandbox } from "@/components/friction-sandbox";
import { ScoreRing } from "@/components/score-ring";
import { ScoreTrend } from "@/components/score-trend";
import { SignalGrid } from "@/components/signal-grid";
import { SlackBotSimulator } from "@/components/slack-bot-simulator";
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
const mapRuleToType = (rule: string): string => {
  const r = rule.toLowerCase();
  if (r.includes("buffer")) return "MEETING_BUFFER";
  if (r.includes("slack") || r.includes("auto-reply") || r.includes("dnd")) return "DND_STATUS";
  if (r.includes("sprint scope") || r.includes("parallel tracks") || r.includes("defer")) return "TASK_DEFER";
  if (r.includes("manager")) return "MANAGER_NUDGE";
  if (r.includes("break")) return "BREAK_REMINDER";
  if (r.includes("block") || r.includes("focus time")) return "FOCUS_BLOCK";
  return "UNKNOWN";
};

interface DisplayRec {
  id: string;
  type: string;
  text: string;
  isAi: boolean;
  aiObject?: any;
}

function DashboardPage() {
  const router = useRouter();
  const qc = useQueryClient();
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

  const updateOutcome = useServerFn(updateInterventionOutcome);
  const actMutation = useMutation({
    mutationFn: (input: { id: string; outcome: "SUCCESS" | "SKIPPED" }) =>
      updateOutcome({ data: input }),
    onSuccess: (_r, vars) => {
      toast.success(vars.outcome === "SUCCESS" ? "Marked as applied" : "Dismissed");
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const score = data.latestScore;
  const profile = data.profile;

  // Realtime subscription
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("realtime-dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cl_scores",
          filter: `person_id=eq.${profile.id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["dashboard"] });
          router.invalidate();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interventions",
          filter: `person_id=eq.${profile.id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["dashboard"] });
          router.invalidate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, qc, router]);

  if (!score) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 py-12">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold">Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}</h1>
          <p className="mt-2 text-muted-foreground">
            Connect a data source below, or seed 14 days of demo telemetry to preview the dashboard.
          </p>
          <Button className="mt-6" onClick={() => seed.mutate()} disabled={seed.isPending}>
            {seed.isPending ? "Seeding…" : "Seed demo data"}
          </Button>
        </div>
        <IntegrationsPanel />
      </div>
    );
  }

  // Get all pending AI interventions
  const pendingAi = (data.interventions ?? []).filter(
    (iv) => iv.triggered_by === "AI" && iv.outcome === "PENDING",
  );

  const usedAiIds = new Set<string>();
  const rules = (score.recommended_interventions as string[] | null) ?? [];

  const displayRecs: DisplayRec[] = rules.map((rule) => {
    const type = mapRuleToType(rule);
    const matchingAi = pendingAi.find((ai) => ai.intervention_type === type && !usedAiIds.has(ai.id));
    if (matchingAi) {
      usedAiIds.add(matchingAi.id);
      return {
        id: matchingAi.id,
        type: matchingAi.intervention_type,
        text: matchingAi.outcome_details || rule,
        isAi: true,
        aiObject: matchingAi,
      };
    }
    return {
      id: `rule-${rule}`,
      type,
      text: rule,
      isAi: false,
    };
  });

  // Add remaining AI recommendations not matching any baseline rules
  const leftoverAi = pendingAi.filter((ai) => !usedAiIds.has(ai.id));
  for (const ai of leftoverAi) {
    displayRecs.push({
      id: ai.id,
      type: ai.intervention_type,
      text: ai.outcome_details || `Recommend ${ai.intervention_type}`,
      isAi: true,
      aiObject: ai,
    });
  }

  // Explainability deltas & top drivers
  const history = data.scoreHistory || [];
  const prevScore = history.length >= 2 ? history[history.length - 2] : null;

  const subscores = [
    { name: "Temporal", value: Number(score.temporal_score ?? 0), prevValue: Number(prevScore?.temporal_score ?? score.temporal_score ?? 0), weight: 0.30, hint: "Meeting load & focus blocks", description: "Meeting density, focus blocks, and back-to-back calendar load." },
    { name: "Communication", value: Number(score.communication_score ?? 0), prevValue: Number(prevScore?.communication_score ?? score.communication_score ?? 0), weight: 0.25, hint: "Response patterns", description: "Slack response latency and message volume." },
    { name: "Task switching", value: Number(score.task_switching_score ?? 0), prevValue: Number(prevScore?.task_switching_score ?? score.task_switching_score ?? 0), weight: 0.20, hint: "Parallel work", description: "Context switching across Jira tasks and parallel GitHub PRs." },
    { name: "Boundary", value: Number(score.boundary_score ?? 0), prevValue: Number(prevScore?.boundary_score ?? score.boundary_score ?? 0), weight: 0.15, hint: "After-hours pressure", description: "Work-life balance and after-hours activities." },
    { name: "Sentiment", value: Number(score.sentiment_score ?? 0), prevValue: Number(prevScore?.sentiment_score ?? score.sentiment_score ?? 0), weight: 0.10, hint: "Wellbeing signal", description: "NLP sentiment indices and message tone signals." }
  ];

  const contributions = subscores.map(s => ({
    ...s,
    contribution: s.value * s.weight,
    delta: s.value - s.prevValue
  })).sort((a, b) => b.contribution - a.contribution);

  const top3Drivers = contributions.slice(0, 3);

  const components = subscores.map(s => ({
    label: s.name,
    value: s.value,
    hint: s.hint
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Today's cognitive load</h1>
          <p className="text-sm text-muted-foreground">
            Last computed {new Date(score.computed_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-sm">
            <Label htmlFor="sandbox-mode" className="text-xs font-medium text-muted-foreground">
              {sandboxMode ? "Sandbox Demo" : "Real Data"}
            </Label>
            <Switch
              id="sandbox-mode"
              checked={sandboxMode}
              onCheckedChange={setSandboxMode}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => seed.mutate()} disabled={seed.isPending}>
            <RefreshCw className="mr-2 h-4 w-4" /> Re-seed demo data
          </Button>
        </div>
      </header>

      {sandboxMode ? (
        <FrictionSandbox />
      ) : (
        <div className="space-y-6">

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

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <h2 className="mb-1 font-display text-base font-semibold text-slate-100">What's driving your load today?</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Analysis of the top three factors contributing to your cognitive workload right now.
            </p>
            <div className="space-y-4">
              {top3Drivers.map((driver) => {
                const deltaVal = Math.round(driver.delta);
                const deltaText = deltaVal > 0 ? `+${deltaVal}` : `${deltaVal}`;
                const isIncrease = deltaVal > 0;
                const isZero = deltaVal === 0;

                return (
                  <div key={driver.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{driver.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Value: {Math.round(driver.value)}</span>
                        {!isZero && (
                          <span className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${isIncrease ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-450"}`}>
                            {isIncrease ? "↑" : "↓"} {deltaText} vs last record
                          </span>
                        )}
                      </div>
                    </div>
                    <Progress value={driver.value} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground leading-normal">{driver.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between">
          <div>
            <h2 className="mb-1 font-display text-base font-semibold text-slate-100">Component breakdown</h2>
            <p className="text-xs text-muted-foreground mb-4">
              A comprehensive look at all five subscores used to compile your aggregate cognitive load.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {components.map((c) => (
                <div key={c.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{c.label}</span>
                    <span className="tabular-nums font-semibold text-slate-100">{Math.round(c.value)}</span>
                  </div>
                  <Progress value={c.value} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground">{c.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

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
          {displayRecs.length ? (
            <ul className="space-y-3 text-sm">
              {displayRecs.map((rec) => (
                <li key={rec.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-3 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {rec.isAi ? (
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/15 border-primary/20 gap-1 text-[10px] py-0.5">
                          <Sparkles className="h-2.5 w-2.5" /> AI-Enhanced
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] py-0.5">
                          Baseline
                        </Badge>
                      )}
                      <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                        {rec.type.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{rec.text}</p>
                  </div>
                  {rec.isAi && (
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-750 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                        title="Apply Intervention"
                        onClick={() => actMutation.mutate({ id: rec.aiObject.id, outcome: "SUCCESS" })}
                        disabled={actMutation.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/5 dark:hover:bg-destructive/950/20"
                        title="Dismiss Recommendation"
                        onClick={() => actMutation.mutate({ id: rec.aiObject.id, outcome: "SKIPPED" })}
                        disabled={actMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No interventions recommended right now.</p>
          )}
        </Card>
      </div>

      <CalendarDefragmenter />

      <IntegrationsPanel />

      <SlackBotSimulator />

        </div>
      )}
    </div>
  );
}
