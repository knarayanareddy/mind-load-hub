
-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  role TEXT,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  consent_level TEXT NOT NULL DEFAULT 'BASIC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ SIGNAL SNAPSHOTS ============
CREATE TABLE public.signal_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meeting_count_today INTEGER DEFAULT 0,
  back_to_back_chains INTEGER DEFAULT 0,
  avg_gap_mins NUMERIC DEFAULT 0,
  focus_blocks_available INTEGER DEFAULT 0,
  days_without_break INTEGER DEFAULT 0,
  meetings_after_hours INTEGER DEFAULT 0,
  avg_response_time_mins NUMERIC DEFAULT 0,
  message_length_trend TEXT,
  sentiment_score NUMERIC DEFAULT 0,
  sentiment_trend TEXT,
  messages_after_hours INTEGER DEFAULT 0,
  parallel_open_prs INTEGER DEFAULT 0,
  avg_tasks_in_progress NUMERIC DEFAULT 0,
  ticket_reassignments INTEGER DEFAULT 0,
  source TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_snapshots_person_time ON public.signal_snapshots(person_id, captured_at DESC);
ALTER TABLE public.signal_snapshots ENABLE ROW LEVEL SECURITY;

-- ============ CL SCORES ============
CREATE TABLE public.cl_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  alert_level TEXT NOT NULL,
  burnout_risk_pct NUMERIC,
  in_flow_state BOOLEAN DEFAULT false,
  score_trend TEXT,
  temporal_score NUMERIC,
  communication_score NUMERIC,
  task_switching_score NUMERIC,
  boundary_score NUMERIC,
  sentiment_score NUMERIC,
  risk_factors JSONB DEFAULT '[]'::jsonb,
  recommended_interventions JSONB DEFAULT '[]'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_scores_person_time ON public.cl_scores(person_id, computed_at DESC);
ALTER TABLE public.cl_scores ENABLE ROW LEVEL SECURITY;

-- ============ INTERVENTIONS ============
CREATE TABLE public.interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  triggered_by TEXT NOT NULL,
  intervention_type TEXT NOT NULL,
  intervention_params JSONB DEFAULT '{}'::jsonb,
  outcome TEXT,
  outcome_details TEXT,
  cl_score_before NUMERIC,
  cl_score_after NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_interventions_person_time ON public.interventions(person_id, created_at DESC);
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

-- ============ MANAGER ALERTS ============
CREATE TABLE public.manager_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  alert_level TEXT NOT NULL,
  alert_message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_alerts_manager ON public.manager_alerts(manager_id, created_at DESC);
ALTER TABLE public.manager_alerts ENABLE ROW LEVEL SECURITY;

-- ============ HELPER FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Returns the caller's profile id (used inside policies to avoid recursion)
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- True if target_person reports to the caller
CREATE OR REPLACE FUNCTION public.is_manager_of(target_person UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = target_person
      AND p.manager_id = public.current_profile_id()
  );
$$;

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES ============

-- profiles
CREATE POLICY "view own profile" ON public.profiles FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "view reports profiles" ON public.profiles FOR SELECT
  USING (manager_id = public.current_profile_id());
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "delete own profile" ON public.profiles FOR DELETE
  USING (user_id = auth.uid());

-- signal_snapshots
CREATE POLICY "view own snapshots" ON public.signal_snapshots FOR SELECT
  USING (person_id = public.current_profile_id() OR public.is_manager_of(person_id));
CREATE POLICY "insert own snapshots" ON public.signal_snapshots FOR INSERT
  WITH CHECK (person_id = public.current_profile_id());
CREATE POLICY "update own snapshots" ON public.signal_snapshots FOR UPDATE
  USING (person_id = public.current_profile_id());
CREATE POLICY "delete own snapshots" ON public.signal_snapshots FOR DELETE
  USING (person_id = public.current_profile_id());

-- cl_scores
CREATE POLICY "view own scores" ON public.cl_scores FOR SELECT
  USING (person_id = public.current_profile_id() OR public.is_manager_of(person_id));
CREATE POLICY "insert own scores" ON public.cl_scores FOR INSERT
  WITH CHECK (person_id = public.current_profile_id());
CREATE POLICY "update own scores" ON public.cl_scores FOR UPDATE
  USING (person_id = public.current_profile_id());
CREATE POLICY "delete own scores" ON public.cl_scores FOR DELETE
  USING (person_id = public.current_profile_id());

-- interventions
CREATE POLICY "view own interventions" ON public.interventions FOR SELECT
  USING (person_id = public.current_profile_id() OR public.is_manager_of(person_id));
CREATE POLICY "insert own interventions" ON public.interventions FOR INSERT
  WITH CHECK (person_id = public.current_profile_id());
CREATE POLICY "update own interventions" ON public.interventions FOR UPDATE
  USING (person_id = public.current_profile_id());
CREATE POLICY "delete own interventions" ON public.interventions FOR DELETE
  USING (person_id = public.current_profile_id());

-- manager_alerts
CREATE POLICY "view alerts as recipient" ON public.manager_alerts FOR SELECT
  USING (manager_id = public.current_profile_id() OR person_id = public.current_profile_id());
CREATE POLICY "insert own person alerts" ON public.manager_alerts FOR INSERT
  WITH CHECK (person_id = public.current_profile_id());
CREATE POLICY "update alerts as recipient" ON public.manager_alerts FOR UPDATE
  USING (manager_id = public.current_profile_id());
CREATE POLICY "delete alerts as recipient" ON public.manager_alerts FOR DELETE
  USING (manager_id = public.current_profile_id());
