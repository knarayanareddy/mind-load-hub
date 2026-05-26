import crypto from "crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

    let workspaceId = profile.workspace_id;
    if (!workspaceId) {
      workspaceId = `ws_${crypto.randomUUID()}`;
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ workspace_id: workspaceId } as any)
        .eq("id", profile.id);
      if (updateErr) {
        console.error("Failed to auto-generate workspace_id for profile", updateErr.message);
      } else {
        profile.workspace_id = workspaceId;
      }
    }

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
      webhook_secret_configured: Boolean(secret),
      workspace_id: workspaceId,
      user_email: profile.email ?? null,
      statuses,
    };
  });

export const getWorkspaceTokens = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const profile = await ensureProfileForUser(userId);

    let workspaceId = profile.workspace_id;
    if (!workspaceId) {
      workspaceId = `ws_${crypto.randomUUID()}`;
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ workspace_id: workspaceId } as any)
        .eq("id", profile.id);
      if (updateErr) {
        console.error("Failed to auto-generate workspace_id for profile", updateErr.message);
      } else {
        profile.workspace_id = workspaceId;
      }
    }

    const { data: tokens, error } = await supabase
      .from("workspace_tokens" as any)
      .select("id, workspace_id, created_at, expires_at")
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return {
      workspace_id: workspaceId,
      tokens: tokens || [],
    };
  });

export const createWorkspaceToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const profile = await ensureProfileForUser(userId);

    let workspaceId = profile.workspace_id;
    if (!workspaceId) {
      workspaceId = `ws_${crypto.randomUUID()}`;
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ workspace_id: workspaceId } as any)
        .eq("id", profile.id);
      if (updateErr) {
        throw new Error(`Failed to initialize workspace: ${updateErr.message}`);
      }
    }

    const rawToken = `clb_${crypto.randomBytes(16).toString("hex")}`;
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    const { data, error } = await supabase
      .from("workspace_tokens" as any)
      .insert({
        workspace_id: workspaceId,
        hashed_token: hashedToken,
        created_by: userId,
        expires_at: null,
      } as any)
      .select("id")
      .single() as any;

    if (error) throw new Error(`Failed to create token: ${error.message}`);

    return {
      id: data.id,
      raw_token: rawToken,
    };
  });

export const deleteWorkspaceToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("workspace_tokens" as any)
      .delete()
      .eq("id", data.id)
      .eq("created_by", userId);

    if (error) throw new Error(`Failed to delete token: ${error.message}`);
    return { ok: true };
  });
