import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { CORS_HEADERS, ingestPartialSignal, json, verifyAuth } from "@/lib/ingest.server";

const Schema = z.object({
  user_email: z.string().email(),
  avg_tasks_in_progress: z.number().min(0).max(30).optional(),
  parallel_open_prs: z.number().int().min(0).max(30).optional(),
  ticket_reassignments: z.number().int().min(0).max(30).optional(),
});

export const Route = createFileRoute("/api/public/ingest/jira")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        const auth = verifyAuth(request);
        if (!auth.ok) return auth.res;
        try {
          const body = Schema.parse(await request.json());
          const { user_email, ...partial } = body;
          const result = await ingestPartialSignal({
            email: user_email,
            source: "jira",
            partial,
          });
          return json({ ok: true, ...result });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Bad request";
          console.error("jira ingest error", msg);
          return json({ error: msg }, 400);
        }
      },
    },
  },
});
