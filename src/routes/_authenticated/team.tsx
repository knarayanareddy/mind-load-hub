import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getTeam } from "@/lib/team.functions";
import type { AlertLevel } from "@/lib/scoring";

const teamQuery = queryOptions({ queryKey: ["team"], queryFn: () => getTeam() });

export const Route = createFileRoute("/_authenticated/team")({
  loader: ({ context }) => context.queryClient.ensureQueryData(teamQuery),
  component: TeamPage,
});

const LEVEL_CLASS: Record<AlertLevel, string> = {
  OPTIMAL: "bg-[color:var(--load-optimal)]/15 text-[color:var(--load-optimal)]",
  LOW: "bg-[color:var(--load-low)]/15 text-[color:var(--load-low)]",
  MODERATE: "bg-[color:var(--load-moderate)]/15 text-[color:var(--load-moderate)]",
  HIGH: "bg-[color:var(--load-high)]/15 text-[color:var(--load-high)]",
  CRITICAL: "bg-destructive/15 text-destructive",
};

function TeamPage() {
  const { data } = useSuspenseQuery(teamQuery);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <header>
        <h1 className="font-display text-2xl font-semibold">Team</h1>
        <p className="text-sm text-muted-foreground">
          Aggregated cognitive load for your direct reports. Individual signal detail stays private.
        </p>
      </header>

      {data.reports.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Users className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-display font-semibold">No direct reports yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Once teammates set you as their manager in Settings, they'll show up here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.reports.map((r) => (
            <Card key={r.id} className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display font-semibold leading-tight">
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

              <div className="flex items-end gap-3">
                <p className="font-display text-3xl font-semibold tabular-nums">
                  {r.score !== null ? Math.round(r.score) : "—"}
                </p>
                <p className="pb-1 text-xs text-muted-foreground">/ 100 load</p>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{r.in_flow ? "In flow" : "Active"}</span>
                {r.unread_alerts > 0 && (
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <Bell className="h-3 w-3" /> {r.unread_alerts} alert
                    {r.unread_alerts > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
