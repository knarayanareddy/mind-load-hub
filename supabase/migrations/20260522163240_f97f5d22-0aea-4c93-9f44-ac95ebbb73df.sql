ALTER PUBLICATION supabase_realtime ADD TABLE public.cl_scores;
ALTER TABLE public.cl_scores REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.interventions;
ALTER TABLE public.interventions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.manager_alerts;
ALTER TABLE public.manager_alerts REPLICA IDENTITY FULL;