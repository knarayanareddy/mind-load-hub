import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, CheckCircle2, Copy, Github, MessageSquare, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getIntegrations, type IngestSource } from "@/lib/integrations.functions";

const META: Record<
  IngestSource,
  { label: string; icon: typeof Calendar; description: string; samplePayload: Record<string, unknown> }
> = {
  slack: {
    label: "Slack",
    icon: MessageSquare,
    description: "Message volume, after-hours activity, sentiment.",
    samplePayload: {
      user_email: "you@company.com",
      messages_today: 84,
      messages_after_hours: 12,
      avg_response_time_mins: 6,
      sentiment_score: -0.1,
      sentiment_trend: "DEGRADING",
    },
  },
  calendar: {
    label: "Calendar",
    icon: Calendar,
    description: "Meeting load, focus blocks, after-hours meetings.",
    samplePayload: {
      user_email: "you@company.com",
      meeting_count_today: 7,
      back_to_back_chains: 2,
      avg_gap_mins: 10,
      focus_blocks_available: 1,
      meetings_after_hours: 1,
      days_without_break: 4,
    },
  },
  github: {
    label: "GitHub",
    icon: Github,
    description: "Parallel PRs, task switching, in-progress work.",
    samplePayload: {
      user_email: "you@company.com",
      parallel_open_prs: 5,
      avg_tasks_in_progress: 4,
    },
  },
  jira: {
    label: "Jira",
    icon: Ticket,
    description: "Ticket reassignments, work-in-progress signal.",
    samplePayload: {
      user_email: "you@company.com",
      ticket_reassignments: 3,
      avg_tasks_in_progress: 6,
    },
  },
};

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} copied`),
    () => toast.error("Copy failed"),
  );
}

function timeAgo(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function IntegrationsPanel() {
  const fetchIntegrations = useServerFn(getIntegrations);
  const { data, isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => fetchIntegrations(),
  });
  const [showSecret, setShowSecret] = useState(false);

  if (isLoading || !data) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Loading integrations…</p>
      </Card>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const secret = data.webhook_secret ?? "";

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold">Connect your data sources</h2>
          <p className="text-sm text-muted-foreground">
            Send signed POST requests to these webhooks from Slack, Calendar, GitHub, and Jira to
            populate your real cognitive-load score.
          </p>
        </div>
        {data.webhook_secret_configured ? (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> Webhook secret configured
          </Badge>
        ) : (
          <Badge variant="destructive">Webhook secret missing</Badge>
        )}
      </div>

      {data.webhook_secret_configured && (
        <div className="mb-5 rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Shared bearer token</p>
              <p className="truncate font-mono text-sm">
                {showSecret ? secret : "•".repeat(Math.min(secret.length, 24))}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSecret((s) => !s)}>
                {showSecret ? "Hide" : "Reveal"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => copy(secret, "Secret")}>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Send as <code className="font-mono">Authorization: Bearer &lt;token&gt;</code> on every
            request.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {data.statuses.map(({ source, last_captured_at }) => {
          const meta = META[source];
          const Icon = meta.icon;
          const url = `${origin}/api/public/ingest/${source}`;
          const curl = [
            `curl -X POST '${url}' \\`,
            `  -H 'Authorization: Bearer ${secret || "<INGEST_WEBHOOK_SECRET>"}' \\`,
            `  -H 'Content-Type: application/json' \\`,
            `  -d '${JSON.stringify({ ...meta.samplePayload, user_email: data.user_email ?? meta.samplePayload.user_email })}'`,
          ].join("\n");
          const connected = Boolean(last_captured_at);
          return (
            <div key={source} className="rounded-xl border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-display text-sm font-semibold">{meta.label}</span>
                </div>
                <Badge variant={connected ? "secondary" : "outline"} className="gap-1">
                  {connected ? <CheckCircle2 className="h-3 w-3" /> : null}
                  {connected ? `Last: ${timeAgo(last_captured_at)}` : "Not connected"}
                </Badge>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">{meta.description}</p>

              <div className="space-y-2">
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Webhook URL
                  </p>
                  <div className="flex items-center gap-2 rounded-md bg-muted/60 px-2 py-1.5">
                    <code className="flex-1 truncate font-mono text-xs">{url}</code>
                    <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => copy(url, "URL")}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Example request
                  </p>
                  <div className="relative">
                    <pre className="max-h-40 overflow-auto rounded-md bg-muted/60 p-2 font-mono text-[11px] leading-snug">
                      {curl}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-6 px-2"
                      onClick={() => copy(curl, "Snippet")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Tip: use Zapier, n8n, or a small worker to translate native Slack/Calendar/GitHub/Jira events
        into these payloads. Full OAuth connectors aren't enabled — this webhook contract is the
        supported integration path.
      </p>
    </Card>
  );
}
