import { queryOptions, useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PrivacyCompliancePanel } from "@/components/privacy-compliance-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getDashboard, updateConsent } from "@/lib/dashboard.functions";

const q = queryOptions({ queryKey: ["dashboard"], queryFn: () => getDashboard() });

export const Route = createFileRoute("/_authenticated/settings")({
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: SettingsPage,
});

function SettingsPage() {
  const router = useRouter();
  const { data } = useSuspenseQuery(q);
  const p = data.profile;
  const [name, setName] = useState(p?.display_name ?? "");
  const [role, setRole] = useState(p?.role ?? "");
  const [consent, setConsent] = useState<"MINIMAL" | "BASIC" | "FULL">(
    (p?.consent_level as "MINIMAL" | "BASIC" | "FULL") ?? "BASIC",
  );

  const save = useMutation({
    mutationFn: () =>
      updateConsent({ data: { display_name: name, role, consent_level: consent } }),
    onSuccess: () => {
      toast.success("Settings saved");
      router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Profile, privacy, and data sources.</p>
      </header>

      <Card className="space-y-4 p-6">
        <h2 className="font-display font-semibold">Profile</h2>
        <div className="space-y-1.5">
          <Label htmlFor="dn">Display name</Label>
          <Input id="dn" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rl">Role</Label>
          <Input id="rl" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Engineer, EM, …" />
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="font-display font-semibold">Privacy & consent</h2>
          <p className="text-sm text-muted-foreground">
            Controls how much signal your manager can see.
          </p>
        </div>
        <RadioGroup value={consent} onValueChange={(v) => setConsent(v as "MINIMAL" | "BASIC" | "FULL")}>
          {[
            { v: "MINIMAL", t: "Minimal", d: "Only aggregate score visible. No component breakdown shared." },
            { v: "BASIC", t: "Basic (default)", d: "Score + alert level + risk factors shared with manager." },
            { v: "FULL", t: "Full", d: "All signals visible. Best for proactive interventions." },
          ].map((o) => (
            <label
              key={o.v}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted"
            >
              <RadioGroupItem value={o.v} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium">{o.t}</p>
                <p className="text-xs text-muted-foreground">{o.d}</p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </Card>

      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
