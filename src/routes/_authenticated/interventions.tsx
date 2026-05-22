import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getDashboard } from "@/lib/dashboard.functions";

const q = queryOptions({ queryKey: ["dashboard"], queryFn: () => getDashboard() });

export const Route = createFileRoute("/_authenticated/interventions")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: () => {
    const { data } = useSuspenseQuery(q);
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <header>
          <h1 className="font-display text-2xl font-semibold">Interventions</h1>
          <p className="text-sm text-muted-foreground">
            Every action triggered to protect your flow.
          </p>
        </header>
        {data.interventions.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            No interventions yet. They'll appear here as the engine acts.
          </Card>
        ) : (
          <div className="space-y-2">
            {data.interventions.map((iv) => (
              <Card key={iv.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{iv.triggered_by}</Badge>
                    <span className="font-display font-semibold">{iv.intervention_type}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{iv.outcome_details}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(iv.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge
                  className={
                    iv.outcome === "SUCCESS"
                      ? "bg-[color:var(--load-optimal)]/15 text-[color:var(--load-optimal)]"
                      : iv.outcome === "FAILED"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-muted text-muted-foreground"
                  }
                >
                  {iv.outcome ?? "PENDING"}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  },
});
