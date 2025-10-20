-- Row Level Security policies for SwissStartup Connect core tables
-- This script grants read access required by the public site while
-- keeping mutation permissions scoped to the owning authenticated user.
-- It also implements Supabase's RLS performance recommendations by
-- wrapping auth helpers in SELECT statements and consolidating policies
-- where Supabase's linter flagged duplicates.

-- Ensure anon and authenticated roles can access the schema and tables.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT SELECT ON storage.objects TO anon, authenticated;

-- ---------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles visible to startups" ON public.profiles;
DROP POLICY IF EXISTS "Startups view applicant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Review authors visible" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;

CREATE POLICY "Profiles readable when public or owner"
  ON public.profiles
  FOR SELECT
  USING (
    (cv_public IS TRUE)
    OR (user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Update own profile"
  ON public.profiles
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Startups view applicant profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_applications ja
      JOIN public.jobs j ON j.id = ja.job_id
      JOIN public.startups s ON s.id = j.startup_id
      WHERE ja.profile_id = public.profiles.id
        AND s.owner_id = (SELECT auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- STARTUPS
-- ---------------------------------------------------------------------
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insert own startup record" ON public.startups;
DROP POLICY IF EXISTS "Read own startup record" ON public.startups;
DROP POLICY IF EXISTS "Update own startup record" ON public.startups;
DROP POLICY IF EXISTS "Public read startups" ON public.startups;

CREATE POLICY "Public read startups"
  ON public.startups
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Insert own startup record"
  ON public.startups
  FOR INSERT
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Update own startup record"
  ON public.startups
  FOR UPDATE
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- ---------------------------------------------------------------------
-- JOBS
-- ---------------------------------------------------------------------
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read jobs" ON public.jobs;
DROP POLICY IF EXISTS "Startup insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Startup update own jobs" ON public.jobs;

CREATE POLICY "Public read jobs"
  ON public.jobs
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Startup manage own jobs"
  ON public.jobs
  FOR ALL
  USING (
    startup_id IN (
      SELECT id
      FROM public.startups
      WHERE owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    startup_id IN (
      SELECT id
      FROM public.startups
      WHERE owner_id = (SELECT auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- JOB APPLICATIONS
-- ---------------------------------------------------------------------
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students insert applications" ON public.job_applications;
DROP POLICY IF EXISTS "Students read applications" ON public.job_applications;
DROP POLICY IF EXISTS "Startups read job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Startups update application status" ON public.job_applications;

CREATE POLICY "Students manage their applications"
  ON public.job_applications
  FOR ALL
  USING (
    profile_id IN (
      SELECT id
      FROM public.profiles
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id
      FROM public.profiles
      WHERE user_id = (SELECT auth.uid())
        AND type = 'student'
    )
  );

CREATE POLICY "Startups view their job applications"
  ON public.job_applications
  FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT id
      FROM public.jobs
      WHERE startup_id IN (
        SELECT id FROM public.startups WHERE owner_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "Startups update application status"
  ON public.job_applications
  FOR UPDATE
  USING (
    job_id IN (
      SELECT id
      FROM public.jobs
      WHERE startup_id IN (
        SELECT id FROM public.startups WHERE owner_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    job_id IN (
      SELECT id
      FROM public.jobs
      WHERE startup_id IN (
        SELECT id FROM public.startups WHERE owner_id = (SELECT auth.uid())
      )
    )
  );

-- ---------------------------------------------------------------------
-- COMPANY REVIEWS
-- ---------------------------------------------------------------------
ALTER TABLE public.company_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read reviews" ON public.company_reviews;
DROP POLICY IF EXISTS "Verified members create reviews" ON public.company_reviews;

CREATE POLICY "Authenticated read reviews"
  ON public.company_reviews
  FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Verified members create reviews"
  ON public.company_reviews
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.startup_members sm
      JOIN public.profiles p ON p.id = sm.profile_id
      WHERE sm.startup_id = public.company_reviews.startup_id
        AND p.user_id = (SELECT auth.uid())
        AND sm.verified_at IS NOT NULL
    )
  );

-- ---------------------------------------------------------------------
-- STARTUP MEMBERS
-- ---------------------------------------------------------------------
ALTER TABLE public.startup_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read their membership" ON public.startup_members;
DROP POLICY IF EXISTS "Owner manages team membership" ON public.startup_members;

CREATE POLICY "Members read their membership"
  ON public.startup_members
  FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id
      FROM public.profiles
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owner manages team membership"
  ON public.startup_members
  FOR ALL
  USING (
    startup_id IN (
      SELECT id
      FROM public.startups
      WHERE owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    startup_id IN (
      SELECT id
      FROM public.startups
      WHERE owner_id = (SELECT auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- STORAGE
-- ---------------------------------------------------------------------
ALTER POLICY IF EXISTS "Public read avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

ALTER POLICY IF EXISTS "Public read logos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'logos');

ALTER POLICY IF EXISTS "Public read cvs" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'cvs');

DROP POLICY IF EXISTS "Users manage their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users manage their cvs" ON storage.objects;
DROP POLICY IF EXISTS "Users manage their logos" ON storage.objects;

CREATE POLICY "Users manage their avatars"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name LIKE (SELECT auth.uid())::text || '/%'
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND name LIKE (SELECT auth.uid())::text || '/%'
  );

CREATE POLICY "Users manage their cvs"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'cvs'
    AND name LIKE (SELECT auth.uid())::text || '/profiles/%'
  )
  WITH CHECK (
    bucket_id = 'cvs'
    AND name LIKE (SELECT auth.uid())::text || '/profiles/%'
  );

CREATE POLICY "Users manage their logos"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'logos'
    AND name LIKE (SELECT auth.uid())::text || '/%'
  )
  WITH CHECK (
    bucket_id = 'logos'
    AND name LIKE (SELECT auth.uid())::text || '/%'
  );
