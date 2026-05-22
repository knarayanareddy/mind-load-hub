import { queryOptions, useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Bell, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDashboard, markAlertRead } from "@/lib/dashboard.functions";

const q = queryOptions({ queryKey: ["dashboard"], queryFn: () => getDashboard() });

export const Route = createFileRoute("/_authenticated/alerts")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: AlertsPage,
});

function AlertsPage() {
  const router = useRouter();
  const { data } = useSuspenseQuery(q);
  const mark = useMutation({
    mutationFn: (id: string) => markAlertRead({ data: { id } }),
    onSuccess: () => router.invalidate(),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header>
        <h1 className="font-display text-2xl font-semibold">Alerts</h1>
        <p className="text-sm text-muted-foreground">
          Manager alerts triggered by sustained high cognitive load.
        </p>
      </header>
      {data.alerts.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <Bell className="mx-auto mb-2 h-6 w-6 opacity-50" /> No alerts.
        </Card>
      ) : (
        <div className="space-y-2">
          {data.alerts.map((a) => (
            <Card key={a.id} className="flex items-start justify-between gap-3 p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge>{a.alert_level}</Badge>
                  {!a.is_read && <Badge variant="secondary">New</Badge>}
                </div>
                <p className="mt-2 text-sm">{a.alert_message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
              {!a.is_read && (
                <Button variant="ghost" size="sm" onClick={() => mark.mutate(a.id)}>
                  <Check className="mr-1 h-4 w-4" /> Mark read
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
