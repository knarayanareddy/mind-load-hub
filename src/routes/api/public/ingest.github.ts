import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { CORS_HEADERS, ingestPartialSignal, json, verifyAuth } from "@/lib/ingest.server";

const Schema = z.object({
  user_email: z.string().email(),
  parallel_open_prs: z.number().int().min(0).max(30).optional(),
  ticket_reassignments: z.number().int().min(0).max(30).optional(),
});

export const Route = createFileRoute("/api/public/ingest/github")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        const auth = await verifyAuth(request);
        if (!auth.ok) return auth.res;
        try {
          const body = Schema.parse(await request.json());
          const { user_email, ...partial } = body;
          const result = await ingestPartialSignal({
            email: user_email,
            workspace_id: auth.workspace_id,
            source: "github",
            partial,
          });
          return json({ ok: true, ...result });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Bad request";
          console.error("github ingest error", msg);
          return json({ error: msg }, 400);
        }
      },
    },
  },
});
