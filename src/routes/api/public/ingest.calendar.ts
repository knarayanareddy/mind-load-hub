import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { CORS_HEADERS, ingestPartialSignal, json, verifyAuth } from "@/lib/ingest.server";

const Schema = z.object({
  user_email: z.string().email(),
  meeting_count_today: z.number().int().min(0).max(20).optional(),
  back_to_back_chains: z.number().int().min(0).max(10).optional(),
  avg_gap_mins: z.number().min(0).max(480).optional(),
  focus_blocks_available: z.number().int().min(0).max(10).optional(),
  meetings_after_hours: z.number().int().min(0).max(20).optional(),
  days_without_break: z.number().int().min(0).max(30).optional(),
});

export const Route = createFileRoute("/api/public/ingest/calendar")({
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
            source: "calendar",
            partial,
          });
          return json({ ok: true, ...result });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Bad request";
          console.error("calendar ingest error", msg);
          return json({ error: msg }, 400);
        }
      },
    },
  },
});
