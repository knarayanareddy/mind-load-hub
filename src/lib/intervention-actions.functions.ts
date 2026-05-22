import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ApplySchema = z.object({
  id: z.string().uuid(),
  outcome: z.enum(["SUCCESS", "FAILED", "SKIPPED", "PENDING"]),
});

/** Updates an intervention outcome (Apply / Dismiss / Skip from the UI). */
export const updateInterventionOutcome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ApplySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: latest } = await supabase
      .from("cl_scores")
      .select("score")
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase
      .from("interventions")
      .update({
        outcome: data.outcome,
        cl_score_after: latest ? Number(latest.score) : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
