import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to live changes on cl_scores / interventions / manager_alerts
 * for the current user and invalidates relevant queries so the dashboard
 * stays in sync without a refresh.
 */
export function RealtimeListener() {
  const qc = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId || cancelled) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      const personId = profile?.id;
      if (!personId || cancelled) return;

      const channel = supabase
        .channel(`person:${personId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "cl_scores", filter: `person_id=eq.${personId}` },
          () => {
            qc.invalidateQueries({ queryKey: ["dashboard"] });
            router.invalidate();
          },
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "interventions", filter: `person_id=eq.${personId}` },
          () => {
            qc.invalidateQueries({ queryKey: ["dashboard"] });
          },
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "manager_alerts", filter: `person_id=eq.${personId}` },
          (payload) => {
            qc.invalidateQueries({ queryKey: ["dashboard"] });
            qc.invalidateQueries({ queryKey: ["team"] });
            const row = payload.new as { alert_message?: string } | null;
            if (row?.alert_message) toast.message("New alert", { description: row.alert_message });
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    let cleanup: (() => void) | undefined;
    setup().then((fn) => {
      if (cancelled) fn?.();
      else cleanup = fn;
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [qc, router]);

  return null;
}
