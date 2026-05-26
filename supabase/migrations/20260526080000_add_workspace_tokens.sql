-- Create workspace_tokens table
CREATE TABLE IF NOT EXISTS public.workspace_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  hashed_token TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for workspace_tokens
ALTER TABLE public.workspace_tokens ENABLE ROW LEVEL SECURITY;

-- Add workspace_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS workspace_id TEXT;

-- RLS policies for workspace_tokens
DROP POLICY IF EXISTS "view own workspace tokens" ON public.workspace_tokens;
CREATE POLICY "view own workspace tokens" ON public.workspace_tokens FOR SELECT
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "insert own workspace tokens" ON public.workspace_tokens;
CREATE POLICY "insert own workspace tokens" ON public.workspace_tokens FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "delete own workspace tokens" ON public.workspace_tokens;
CREATE POLICY "delete own workspace tokens" ON public.workspace_tokens FOR DELETE
  USING (created_by = auth.uid());
