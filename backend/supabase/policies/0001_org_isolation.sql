-- Row-level security: organisation isolation (AGENTS §3.1, §6).
-- Every table holds one organisation's data, so RLS is ON for ALL of them.
-- High blast radius — a mistake here leaks data between institutions (§5).
--
-- ── PHASE 1 (run this now) ───────────────────────────────────────────────
-- Enable RLS with NO permissive policy. Effect:
--   • The public Data API (PostgREST via the anon/publishable key) is DENIED
--     read/write on every table — important, since the publishable key is
--     public. Nothing external can reach your data.
--   • The Express backend keeps working: it connects as the table-owner role,
--     which is exempt from RLS while FORCE is not set. Application-level org
--     scoping (src/db/scoped.ts) is the isolation guarantee on that path.
--
-- ── PHASE 2 (later — see the commented block at the bottom) ───────────────
-- Once the backend sets `app.current_org` per request, switch to FORCE + the
-- org-scoped policies for a true database-level backstop. DO NOT enable that
-- block before the backend sets the GUC, or every query returns empty.

do $$
declare
  t text;
  tables text[] := array[
    'organizations','users','classes','students',
    'roster_imports','roster_staging',
    'exam_groups','exams','exam_sections','exam_questions','exam_versions',
    'attempts','answers','proctoring_events','incidents','jobs',
    'imports','import_pages','converted_blocks'
    ,'question_bank'
    ,'question_bank'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;


-- ── PHASE 2 (do NOT run until the backend sets app.current_org) ───────────
-- The API server must run, inside each request's transaction:
--     select set_config('app.current_org', <organizationId>, true);
-- Then enable the block below to enforce org isolation at the database level
-- even against the backend connection.
--
-- do $$
-- declare
--   t text;
--   tables text[] := array[
--     'organizations','users','classes','students',
--     'roster_imports','roster_staging',
--     'exam_groups','exams','exam_sections','exam_questions','exam_versions',
--     'attempts','answers','proctoring_events','incidents','jobs',
--     'imports','import_pages','converted_blocks'
--   ];
-- begin
--   foreach t in array tables loop
--     execute format('alter table public.%I force row level security;', t);
--     execute format('drop policy if exists org_isolation on public.%I;', t);
--     if t = 'organizations' then
--       execute format($f$
--         create policy org_isolation on public.%I for all
--         using (id = current_setting('app.current_org', true))
--         with check (id = current_setting('app.current_org', true));
--       $f$, t);
--     else
--       execute format($f$
--         create policy org_isolation on public.%I for all
--         using (organization_id = current_setting('app.current_org', true))
--         with check (organization_id = current_setting('app.current_org', true));
--       $f$, t);
--     end if;
--   end loop;
-- end $$;
