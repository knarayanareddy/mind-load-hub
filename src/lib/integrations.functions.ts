import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureProfileForUser } from "@/lib/profile.server";

export type IngestSource = "slack" | "calendar" | "github" | "jira";

export const SOURCES: IngestSource[] = ["slack", "calendar", "github", "jira"];

export type IntegrationStatus = {
  source: IngestSource;
  last_captured_at: string | null;
};

export const getIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const profile = await ensureProfileForUser(userId);
    const secret = process.env.INGEST_WEBHOOK_SECRET ?? null;

    const { data: snapshots } = await supabase
      .from("signal_snapshots")
      .select("source, captured_at")
      .eq("person_id", profile.id)
      .order("captured_at", { ascending: false })
      .limit(200);

    const lastBySource = new Map<string, string>();
    for (const row of snapshots ?? []) {
      if (row.source && !lastBySource.has(row.source)) {
        lastBySource.set(row.source, row.captured_at);
      }
    }

    const statuses: IntegrationStatus[] = SOURCES.map((source) => ({
      source,
      last_captured_at: lastBySource.get(source) ?? null,
    }));

    return {
      webhook_secret: secret,
      webhook_secret_configured: Boolean(secret),
      user_email: profile.email ?? null,
      statuses,
    };
  });
