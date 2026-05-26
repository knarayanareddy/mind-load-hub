import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, CheckCircle2, Copy, Github, MessageSquare, Ticket, Key, Trash2, ShieldCheck, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getIntegrations,
  getWorkspaceTokens,
  createWorkspaceToken,
  deleteWorkspaceToken,
  type IngestSource
} from "@/lib/integrations.functions";

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
  const fetchTokens = useServerFn(getWorkspaceTokens);
  const generateToken = useServerFn(createWorkspaceToken);
  const revokeToken = useServerFn(deleteWorkspaceToken);

  const queryClient = useQueryClient();
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => fetchIntegrations(),
  });

  const tokensQuery = useQuery({
    queryKey: ["workspace-tokens"],
    queryFn: () => fetchTokens(),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateToken(),
    onSuccess: (res) => {
      setNewlyCreatedToken(res.raw_token);
      toast.success("Workspace token generated!");
      queryClient.invalidateQueries({ queryKey: ["workspace-tokens"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate token");
    }
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeToken({ data: { id } }),
    onSuccess: () => {
      toast.success("Token revoked successfully");
      queryClient.invalidateQueries({ queryKey: ["workspace-tokens"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to revoke token");
    }
  });

  if (isLoading || !data) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Loading integrations…</p>
      </Card>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-100">Connect your data sources</h2>
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

      <div className="mb-5 rounded-lg border bg-muted/40 p-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Security Notice</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          For security, your shared webhook secret bearer token is not displayed in the dashboard interface. 
          Admins can configure or view this token by referencing the <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">INGEST_WEBHOOK_SECRET</code> variable inside the environment configuration.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {data.statuses.map(({ source, last_captured_at }) => {
          const meta = META[source];
          const Icon = meta.icon;
          const url = `${origin}/api/public/ingest/${source}`;
          const curl = [
            `curl -X POST '${url}' \\`,
            `  -H 'Authorization: Bearer <WORKSPACE_TOKEN>' \\`,
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

      {/* Workspace Tokens section */}
      <div className="mt-8 border-t border-border pt-8 space-y-4">
        <div>
          <h3 className="font-display text-base font-semibold flex items-center gap-2 text-slate-100">
            <Key className="h-4 w-4 text-primary" /> Workspace Ingestion Tokens (Multi-Tenancy)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Generate and manage access tokens for this specific workspace (Workspace ID: <code className="font-mono text-xs font-semibold text-slate-350">{data.workspace_id || "default"}</code>). Scoped tokens allow multiple teams to isolate cognitive load telemetry without sharing a global webhook secret.
          </p>
        </div>

        {newlyCreatedToken && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-450 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" /> Copy your new token now!
            </div>
            <p className="text-xs text-slate-300">
              For security, this token is only shown once and cannot be recovered if lost.
            </p>
            <div className="flex items-center gap-2 rounded bg-muted/60 p-2">
              <code className="flex-1 font-mono text-xs break-all text-emerald-400 select-all">{newlyCreatedToken}</code>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-emerald-450 hover:bg-emerald-950/30"
                onClick={() => copy(newlyCreatedToken, "Workspace token")}
              >
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {tokensQuery.isLoading ? (
            <p className="text-xs text-muted-foreground">Loading workspace tokens...</p>
          ) : tokensQuery.data?.tokens.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <AlertCircle className="h-6 w-6 text-muted-foreground opacity-55 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No active workspace tokens. Generate one below to authorize your team's telemetry clients.</p>
            </div>
          ) : (
            <div className="border rounded-xl divide-y bg-card">
              {tokensQuery.data?.tokens.map((tok: any) => (
                <div key={tok.id} className="flex items-center justify-between p-3.5 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-300 font-mono">clb_************************</span>
                      <Badge variant="outline" className="text-[9px] px-1.5 font-normal">Active</Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Generated on {new Date(tok.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-rose-500 hover:text-rose-455 hover:bg-rose-950/15"
                    onClick={() => {
                      if (confirm("Are you sure you want to revoke this ingestion token? Telemetry clients using this token will fail to authorize immediately.")) {
                        revokeMutation.mutate(tok.id);
                      }
                    }}
                    disabled={revokeMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="w-full sm:w-auto mt-2 bg-primary hover:bg-primary/95 text-white"
          >
            {generateMutation.isPending ? "Generating..." : "Generate Workspace Ingestion Token"}
          </Button>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Tip: use Zapier, n8n, or a small worker to translate native Slack/Calendar/GitHub/Jira events
        into these payloads. Full OAuth connectors aren't enabled — this webhook contract is the
        supported integration path.
      </p>
    </Card>
  );
}
