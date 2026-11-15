-- ==============================================================================
-- SMRITI BACKEND: ROW LEVEL SECURITY HARDENING
-- ==============================================================================
-- Supabase automatically exposes all tables in the 'public' schema via PostgREST.
-- Since the Smriti platform is an API-first server architecture where Prisma
-- connects as the PostgreSQL database owner (or service role), we must enable
-- Row Level Security (RLS) on all public tables with NO public policies.
--
-- This guarantees:
-- 1. Direct PostgREST / Supabase REST client access using anon/authenticated keys is BLOCKED.
-- 2. Only our Next.js backend (connecting through Prisma directly or via pooler) can read/write.
-- 3. Zero data leakage of sensitive medical, elder, and access link records.
-- ==============================================================================

ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.elder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.elder_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.redeem_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.medicine_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dose_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.caretaker_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_patient_summaries ENABLE ROW LEVEL SECURITY;
