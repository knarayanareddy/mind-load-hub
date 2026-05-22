import { queryOptions, useQuery, useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  Bell,
  Users,
  Clock,
  Calendar,
  MessageSquare,
  GitPullRequest,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  Lock,
  EyeOff,
  ShieldCheck,
  Activity,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { getTeam, getTeammateDetail } from "@/lib/team.functions";
import type { AlertLevel } from "@/lib/scoring";

const teamQuery = queryOptions({ queryKey: ["team"], queryFn: () => getTeam() });

const teammateDetailQuery = (id: string) => queryOptions({
  queryKey: ["teammate-detail", id],
  queryFn: () => getTeammateDetail({ data: { teammateId: id } }),
});

export const Route = createFileRoute("/_authenticated/team")({
  loader: ({ context }) => context.queryClient.ensureQueryData(teamQuery),
  component: TeamPage,
});

const LEVEL_CLASS: Record<AlertLevel, string> = {
  OPTIMAL: "bg-[color:var(--load-optimal)]/15 text-[color:var(--load-optimal)] border-[color:var(--load-optimal)]/20",
  MODERATE: "bg-[color:var(--load-moderate)]/15 text-[color:var(--load-moderate)] border-[color:var(--load-moderate)]/20",
  HIGH: "bg-[color:var(--load-high)]/15 text-[color:var(--load-high)] border-[color:var(--load-high)]/20",
  CRITICAL: "bg-destructive/15 text-destructive border-destructive/20",
  BURNOUT: "bg-destructive/20 text-destructive border-destructive/20",
};

function TeamPage() {
  const { data } = useSuspenseQuery(teamQuery);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <header>
        <h1 className="font-display text-2xl font-semibold">Team Workloads</h1>
        <p className="text-sm text-muted-foreground">
          Aggregated cognitive load for your direct reports. Click on a teammate to view their individual load parameters, historical trends, and recommended interventions.
        </p>
      </header>

      {data.reports.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center border-dashed">
          <Users className="h-8 w-8 text-muted-foreground opacity-50" />
          <div>
            <p className="font-display font-semibold">No direct reports yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Once teammates set you as their manager in Settings, they'll show up here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.reports.map((r) => {
            const cardBg = r.alert_level === "CRITICAL" || r.alert_level === "BURNOUT"
              ? "hover:border-destructive/55 hover:shadow-destructive/5"
              : "hover:border-sky-500/50 hover:shadow-sky-500/5";

            return (
              <Card
                key={r.id}
                className={`group space-y-3 p-5 cursor-pointer transition-all hover:scale-[1.015] hover:shadow-md border border-border/80 ${cardBg}`}
                onClick={() => setSelectedId(r.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-semibold leading-tight group-hover:text-sky-450 transition-colors">
                      {r.display_name ?? r.email ?? "Teammate"}
                    </p>
                    {r.role && <p className="text-xs text-muted-foreground">{r.role}</p>}
                  </div>
                  {r.alert_level ? (
                    <Badge className={LEVEL_CLASS[r.alert_level as AlertLevel]}>
                      {r.alert_level}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">NO DATA</Badge>
                  )}
                </div>

                <div className="flex items-end gap-3 py-1">
                  <p className="font-display text-3xl font-semibold tabular-nums leading-none">
                    {r.score !== null ? Math.round(r.score) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground pb-0.5">/ 100 load</p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                  <div className="flex items-center gap-1">
                    <span className={`inline-block h-2 w-2 rounded-full ${r.in_flow ? "bg-emerald-550 animate-pulse" : "bg-slate-500"}`} />
                    <span>{r.in_flow ? "In flow" : "Active"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.unread_alerts > 0 && (
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full text-[10px]">
                        <Bell className="h-2.5 w-2.5" /> {r.unread_alerts} Alert{r.unread_alerts > 1 ? "s" : ""}
                      </span>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={!!selectedId} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto bg-slate-950 border-slate-900 text-slate-100 p-6 flex flex-col gap-6">
          {selectedId && <TeammateDetailDrawer id={selectedId} onClose={() => setSelectedId(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function TeammateDetailDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const router = useRouter();
  const { data, isLoading, error } = useQuery(teammateDetailQuery(id));

  const triggerIntervention = useMutation({
    mutationFn: async () => {
      // Mock triggering an intervention via Slack
      await new Promise((resolve) => setTimeout(resolve, 800));
    },
    onSuccess: () => {
      toast.success("Slack Bot: Workload mitigation suggestion dispatched successfully!");
      onClose();
      router.invalidate();
    },
  });

  if (isLoading) {
    return <TeammateDetailDrawerSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-sm text-rose-450">
        <ShieldAlert className="h-8 w-8 mb-2 opacity-50" />
        <p className="font-semibold">Failed to load teammate details</p>
        <p className="text-xs text-muted-foreground mt-1">Please try again or contact support.</p>
      </div>
    );
  }

  const { teammate, scores, snapshot, interventions, alerts } = data;
  const latestScore = scores[scores.length - 1];

  return (
    <div className="space-y-6">
      <SheetHeader className="text-left space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <SheetTitle className="text-2xl font-bold font-display text-white">
              {teammate.display_name ?? teammate.email ?? "Teammate Profile"}
            </SheetTitle>
            {teammate.role && <p className="text-sm text-slate-400 font-medium">{teammate.role}</p>}
          </div>
          {teammate.consent_level && (
            <Badge
              variant="outline"
              className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                teammate.consent_level === "FULL"
                  ? "border-emerald-500/30 text-emerald-450 bg-emerald-500/5"
                  : teammate.consent_level === "BASIC"
                  ? "border-sky-500/30 text-sky-450 bg-sky-500/5"
                  : "border-slate-500/30 text-slate-400 bg-slate-500/5"
              }`}
            >
              {teammate.consent_level === "FULL" && <ShieldCheck className="h-3 w-3" />}
              {teammate.consent_level === "BASIC" && <EyeOff className="h-3 w-3" />}
              {teammate.consent_level === "MINIMAL" && <Lock className="h-3 w-3" />}
              {teammate.consent_level} CONSENT
            </Badge>
          )}
        </div>
        <SheetDescription className="hidden">Teammate cognitive load analysis.</SheetDescription>
      </SheetHeader>

      {/* Aggregate Score Card */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Current Cognitive Load</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold font-display text-white tracking-tight">
              {latestScore ? Math.round(Number(latestScore.score)) : "—"}
            </span>
            <span className="text-sm text-slate-500">/ 100</span>
          </div>
          <div className="mt-3">
            {latestScore?.alert_level ? (
              <Badge className={`text-xs font-semibold px-2.5 py-1 ${LEVEL_CLASS[latestScore.alert_level as AlertLevel]}`}>
                {latestScore.alert_level} LOAD
              </Badge>
            ) : (
              <Badge variant="secondary">NO DATA</Badge>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Work Status & Flow</span>
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${latestScore?.in_flow_state ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
              <span className="text-lg font-bold font-display text-slate-200">
                {latestScore?.in_flow_state ? "In Deep Flow State" : "Active / Standard Work"}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {latestScore?.in_flow_state
                ? "Teammate is in a high-focus block. The scheduler is protecting them from unnecessary Slack interruptions."
                : "Teammate is active, answering pings, and participating in normal collaborative activity."}
            </p>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Last calculated {latestScore ? new Date(latestScore.computed_at).toLocaleTimeString() : "N/A"}
          </div>
        </div>
      </div>

      {/* SVG Historical Chart */}
      <TeammateHistoryChart scores={scores} />

      {/* Consent Level Disclosures */}
      {teammate.consent_level === "FULL" && snapshot && (
        <div className="space-y-6">
          {/* Signal breakdown - Full Consent only */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-sky-400" /> Granular Signal Telemetry
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Calendar Indicators */}
              <div className="rounded-xl border border-slate-850 bg-slate-900/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-455">
                  <Calendar className="h-4 w-4 text-sky-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Calendar & Meetings</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Meetings Today</span>
                      <span className="font-semibold text-slate-200">{snapshot.meeting_count_today ?? 0}</span>
                    </div>
                    <Progress value={Math.min(100, ((snapshot.meeting_count_today ?? 0) / 8) * 100)} className="h-1.5 bg-slate-800 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Back-to-Back Chains</span>
                      <span className="font-semibold text-slate-200">{snapshot.back_to_back_chains ?? 0} chains</span>
                    </div>
                    <Progress value={Math.min(100, ((snapshot.back_to_back_chains ?? 0) / 5) * 100)} className="h-1.5 bg-slate-800" />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 pt-1">
                    <span>Average Inter-meeting Gap:</span>
                    <span className="font-medium text-slate-200">{snapshot.avg_gap_mins ?? 0} mins</span>
                  </div>
                </div>
              </div>

              {/* Slack & Interruption Indicators */}
              <div className="rounded-xl border border-slate-850 bg-slate-900/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-455">
                  <MessageSquare className="h-4 w-4 text-rose-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Slack Communications</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Avg Slack Response Time</span>
                      <span className="font-semibold text-slate-200">{snapshot.avg_response_time_mins ?? 0} mins</span>
                    </div>
                    <Progress value={Math.min(100, ((snapshot.avg_response_time_mins ?? 0) / 200) * 100)} className="h-1.5 bg-slate-800" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">After-hours Pings</span>
                      <span className="font-semibold text-slate-200">{snapshot.messages_after_hours ?? 0} msg</span>
                    </div>
                    <Progress value={Math.min(100, ((snapshot.messages_after_hours ?? 0) / 40) * 100)} className="h-1.5 bg-slate-800" />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 pt-1">
                    <span>Sentiment Index:</span>
                    <span className={`font-semibold ${Number(snapshot.sentiment_score ?? 0) < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                      {Number(snapshot.sentiment_score ?? 0) > 0 ? "+" : ""}{snapshot.sentiment_score ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tasks & Deliverables */}
              <div className="rounded-xl border border-slate-850 bg-slate-900/30 p-4 sm:col-span-2 space-y-3">
                <div className="flex items-center gap-2 text-slate-455">
                  <GitPullRequest className="h-4 w-4 text-violet-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Task Switching & PR Density</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Parallel Open PRs</span>
                      <span className={`font-semibold ${(snapshot.parallel_open_prs ?? 0) >= 5 ? "text-rose-400 animate-pulse" : "text-slate-200"}`}>
                        {snapshot.parallel_open_prs ?? 0} open PRs
                      </span>
                    </div>
                    <Progress value={Math.min(100, ((snapshot.parallel_open_prs ?? 0) / 8) * 100)} className="h-1.5 bg-slate-800" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">In-Progress Tasks</span>
                      <span className={`font-semibold ${(snapshot.avg_tasks_in_progress ?? 0) >= 6 ? "text-rose-400" : "text-slate-200"}`}>
                        {snapshot.avg_tasks_in_progress ?? 0} tasks
                      </span>
                    </div>
                    <Progress value={Math.min(100, (Number(snapshot.avg_tasks_in_progress ?? 0) / 10) * 100)} className="h-1.5 bg-slate-800" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {teammate.consent_level === "BASIC" && (
        <div className="rounded-xl border border-sky-500/20 bg-sky-950/15 p-4 text-sky-200 backdrop-blur-sm flex items-start gap-3">
          <EyeOff className="h-5 w-5 text-sky-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Privacy Masking Enabled</h4>
            <p className="text-xs text-sky-300/80 leading-relaxed">
              {teammate.display_name} has enabled <strong>Basic Consent</strong>. Component breakdown metrics (Slack response times, calendar durations, commit sequences) are private. Overall scores, risk factors, and recommendations remain fully accessible to help you monitor their load safely.
            </p>
          </div>
        </div>
      )}

      {teammate.consent_level === "MINIMAL" && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-950/15 p-4 text-rose-200 backdrop-blur-sm flex items-start gap-3">
          <Lock className="h-5 w-5 text-rose-455 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Strict Privacy Enforcement</h4>
            <p className="text-xs text-rose-300/80 leading-relaxed">
              {teammate.display_name} has enabled <strong>Minimal Consent</strong>. All component-level load scoring, active telemetry snapshots, and specific risk factors are completely confidential. Only their aggregated daily cognitive load trend is shared.
            </p>
          </div>
        </div>
      )}

      {/* Risk Factors Section */}
      {teammate.consent_level !== "MINIMAL" && (
        <Card className="border-slate-850 bg-slate-900/20 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[color:var(--load-high)]" /> Active Stress & Load Risk Factors
          </h3>
          {(latestScore?.risk_factors as string[] | null)?.length ? (
            <ul className="space-y-2 text-sm text-slate-350">
              {(latestScore.risk_factors as string[]).map((r, idx) => (
                <li key={idx} className="flex gap-2 rounded-lg bg-slate-900/60 px-3 py-2 border border-slate-850/40">
                  <span className="text-[color:var(--load-high)] font-bold">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 bg-slate-900/30 rounded-lg p-3 border border-slate-850/40 text-center">
              No active stress risk factors detected. Load is healthy and stable!
            </p>
          )}
        </Card>
      )}

      {/* Actionable Interventions Section */}
      {teammate.consent_level !== "MINIMAL" && (
        <Card className="border-slate-855 bg-slate-900/20 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-400" /> Recommended Contextual Interventions
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Actions you can take as a manager to help {teammate.display_name} restore healthy cognitive balance.
            </p>
          </div>
          {(latestScore?.recommended_interventions as string[] | null)?.length ? (
            <div className="space-y-3">
              <ul className="space-y-2 text-sm text-slate-350">
                {(latestScore.recommended_interventions as string[]).map((r, idx) => (
                  <li key={idx} className="flex gap-2 rounded-lg bg-sky-950/10 px-3 py-2 border border-sky-500/10">
                    <span className="text-sky-400 font-medium">→</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => triggerIntervention.mutate()}
                disabled={triggerIntervention.isPending}
                className="w-full mt-2 bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-lg hover:shadow-sky-500/10 transition-all"
              >
                {triggerIntervention.isPending ? (
                  "Sending Slack trigger request..."
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" /> Recommend Focus Block & Slack DND Status via Slack
                  </>
                )}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-slate-400 bg-slate-900/30 rounded-lg p-3 border border-slate-855/40 text-center">
              No interventions needed currently. High-performance flow is sustained!
            </p>
          )}
        </Card>
      )}

      {teammate.consent_level === "MINIMAL" && (
        <Card className="border-slate-850 bg-slate-900/20 p-5 text-center space-y-2">
          <Lock className="mx-auto h-5 w-5 text-slate-500 opacity-60" />
          <p className="text-sm font-semibold text-slate-300">Individual Recommendations Disabled</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Due to strict privacy parameters, the system cannot recommend individualized manager interventions. Workload adjustments should be discussed directly in your next 1-on-1 check-in.
          </p>
        </Card>
      )}
    </div>
  );
}

function TeammateHistoryChart({ scores }: { scores: any[] }) {
  if (!scores || scores.length === 0) return null;

  const width = 500;
  const height = 150;
  const padLeft = 40;
  const padRight = 15;
  const padTop = 15;
  const padBottom = 20;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const points = scores.map((s, i) => {
    const x = padLeft + (i / (scores.length - 1)) * chartW;
    const y = padTop + chartH - (Number(s.score) / 100) * chartH;
    return { x, y, score: Number(s.score), computed_at: s.computed_at };
  });

  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`;
  const areaD = `M ${padLeft},${padTop + chartH} L ${points.map(p => `${p.x},${p.y}`).join(" L ")} L ${padLeft + chartW},${padTop + chartH} Z`;

  const gridLines = [40, 65, 80].map(val => {
    const y = padTop + chartH - (val / 100) * chartH;
    return { y, val };
  });

  return (
    <div className="rounded-xl border border-slate-850 bg-slate-900/30 p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">14-Day Cognitive Load History</span>
        <span className="text-[9px] text-slate-500 font-semibold">Scale: 0-100 Load</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Zones */}
        <rect x={padLeft} y={padTop + chartH - (40 / 100) * chartH} width={chartW} height={(40 / 100) * chartH} fill="#10b981" opacity="0.02" />
        <rect x={padLeft} y={padTop + chartH - (65 / 100) * chartH} width={chartW} height={((65 - 40) / 100) * chartH} fill="#f59e0b" opacity="0.02" />
        <rect x={padLeft} y={padTop + chartH - (80 / 100) * chartH} width={chartW} height={((80 - 65) / 100) * chartH} fill="#ef4444" opacity="0.015" />
        <rect x={padLeft} y={padTop} width={chartW} height={((100 - 80) / 100) * chartH} fill="#ef4444" opacity="0.03" />

        {/* Gridlines */}
        {gridLines.map((g, idx) => (
          <g key={idx}>
            <line x1={padLeft} y1={g.y} x2={padLeft + chartW} y2={g.y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
            <text x={padLeft - 8} y={g.y + 3} fill="#475569" fontSize="8" textAnchor="end" fontWeight="bold">
              {g.val}
            </text>
          </g>
        ))}

        {/* Axis lines */}
        <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + chartH} stroke="#334155" strokeWidth="1" />
        <line x1={padLeft} y1={padTop + chartH} x2={padLeft + chartW} y2={padTop + chartH} stroke="#334155" strokeWidth="1" />

        {/* Path fill & line */}
        <path d={areaD} fill="url(#chartGradient)" />
        <path d={pathD} fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {points.map((p, idx) => {
          let dotColor = "#0ea5e9";
          if (p.score >= 80) dotColor = "#ef4444";
          else if (p.score >= 65) dotColor = "#f97316";

          return (
            <g key={idx} className="group/dot cursor-pointer">
              <circle cx={p.x} cy={p.y} r="3" fill={dotColor} stroke="#0f172a" strokeWidth="1" />
              <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-150 pointer-events-none">
                <rect x={p.x - 15} y={p.y - 20} width="30" height="14" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                <text x={p.x} y={p.y - 10} fill="#f8fafc" fontSize="8" fontWeight="bold" textAnchor="middle">
                  {Math.round(p.score)}
                </text>
              </g>
            </g>
          );
        })}

        {/* Labels */}
        <text x={padLeft} y={padTop + chartH + 12} fill="#475569" fontSize="8" fontWeight="bold">
          14d ago
        </text>
        <text x={padLeft + chartW} y={padTop + chartH + 12} fill="#475569" fontSize="8" fontWeight="bold" textAnchor="end">
          Today
        </text>
      </svg>
    </div>
  );
}

function TeammateDetailDrawerSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-1/2">
          <div className="h-6 bg-slate-800 rounded w-3/4" />
          <div className="h-4 bg-slate-800 rounded w-1/2" />
        </div>
        <div className="h-5 bg-slate-800 rounded w-1/4" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-24 bg-slate-800 rounded-xl" />
        <div className="h-24 bg-slate-800 rounded-xl" />
      </div>
      <div className="h-36 bg-slate-800 rounded-xl" />
      <div className="space-y-3">
        <div className="h-4 bg-slate-800 rounded w-1/3" />
        <div className="h-16 bg-slate-800 rounded-xl" />
        <div className="h-16 bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
}
