import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { generateRecommendations } from "@/lib/ai-agent.functions";
import { getDashboard } from "@/lib/dashboard.functions";

const q = queryOptions({ queryKey: ["dashboard"], queryFn: () => getDashboard() });

export const Route = createFileRoute("/_authenticated/interventions")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: InterventionsPage,
});

function InterventionsPage() {
  const { data } = useSuspenseQuery(q);
  const qc = useQueryClient();
  const generate = useServerFn(generateRecommendations);
  const mutation = useMutation({
    mutationFn: () => generate(),
    onSuccess: (res) => {
      toast.success(`${res.count} new recommendation${res.count > 1 ? "s" : ""}`, {
        description: res.summary,
      });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error("Couldn't generate recommendations", { description: e.message }),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Interventions</h1>
          <p className="text-sm text-muted-foreground">
            Every action triggered to protect your flow.
          </p>
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <Sparkles className="mr-2 h-4 w-4" />
          {mutation.isPending ? "Thinking…" : "AI recommendations"}
        </Button>
      </header>
      {data.interventions.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No interventions yet. Tap "AI recommendations" to get personalized actions.
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
}
