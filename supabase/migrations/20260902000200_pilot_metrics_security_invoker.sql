-- FloodFact AI — 0008: close an RLS-bypass gap on pilot_metrics
--
-- reports/classifications/alerts all scope ambassadors to their own
-- pilot_area_id (see 0004_rls_policies.sql), but pilot_metrics is a plain
-- view: by default a view runs with its OWNER's privileges, not the
-- querying user's, so it bypassed that scoping and returned every ward's
-- aggregates to any authenticated session (any staff account, not just
-- admins). security_invoker (PG15+) makes the view re-apply each row's RLS
-- as the actual caller — admins (who bypass via is_admin()) see everything
-- exactly as before; ambassadors now see real numbers only for their own
-- ward and zero/null aggregates for others, matching every other table's
-- intent. public_alert_feed is deliberately public and is left unchanged.

alter view public.pilot_metrics set (security_invoker = true);
