import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { CORS_HEADERS, ingestPartialSignal, json, verifyAuth } from "@/lib/ingest.server";

const Schema = z.object({
  user_email: z.string().email(),
  messages_today: z.number().int().min(0).max(2000).optional(),
  messages_after_hours: z.number().int().min(0).max(500).optional(),
  avg_response_time_mins: z.number().min(0).max(1440).optional(),
  sentiment_score: z.number().min(-1).max(1).optional(),
  sentiment_trend: z.enum(["IMPROVING", "STABLE", "DEGRADING"]).optional(),
  message_length_trend: z.enum(["IMPROVING", "STABLE", "DEGRADING"]).optional(),
});

export const Route = createFileRoute("/api/public/ingest/slack")({
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
            source: "slack",
            partial,
          });
          return json({ ok: true, ...result });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Bad request";
          console.error("slack ingest error", msg);
          return json({ error: msg }, 400);
        }
      },
    },
  },
});
