import { Activity, AlertTriangle, Calendar, GitPullRequest, MessageSquare, Moon } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

export interface SignalRow {
  meeting_count_today: number | null;
  back_to_back_chains: number | null;
  focus_blocks_available: number | null;
  avg_response_time_mins: number | null;
  sentiment_score: number | null;
  messages_after_hours: number | null;
  parallel_open_prs: number | null;
  avg_tasks_in_progress: number | null;
  meetings_after_hours: number | null;
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

export function SignalGrid({ s }: { s: SignalRow | null | undefined }) {
  const safe = (n: number | null | undefined, suffix = "") =>
    n == null ? "—" : `${Math.round(Number(n))}${suffix}`;
  const sentiment = s?.sentiment_score == null ? null : Number(s.sentiment_score);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Stat
        icon={<Calendar className="h-4 w-4" />}
        label="Meetings today"
        value={safe(s?.meeting_count_today)}
        hint={`${safe(s?.back_to_back_chains)} back-to-back`}
      />
      <Stat
        icon={<Activity className="h-4 w-4" />}
        label="Focus blocks"
        value={safe(s?.focus_blocks_available)}
        hint="Open windows for deep work"
      />
      <Stat
        icon={<MessageSquare className="h-4 w-4" />}
        label="Avg response time"
        value={safe(s?.avg_response_time_mins, "m")}
        hint="Across Slack channels"
      />
      <Stat
        icon={<GitPullRequest className="h-4 w-4" />}
        label="Parallel PRs"
        value={safe(s?.parallel_open_prs)}
        hint={`${safe(s?.avg_tasks_in_progress)} active tasks`}
      />
      <Stat
        icon={<Moon className="h-4 w-4" />}
        label="After-hours"
        value={safe(s?.messages_after_hours)}
        hint={`${safe(s?.meetings_after_hours)} late meetings`}
      />
      <Stat
        icon={<AlertTriangle className="h-4 w-4" />}
        label="Sentiment"
        value={sentiment == null ? "—" : sentiment.toFixed(2)}
        hint={sentiment != null && sentiment < 0 ? "Negative trend" : "Within range"}
      />
    </div>
  );
}
