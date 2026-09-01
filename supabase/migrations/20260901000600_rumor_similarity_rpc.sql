-- FloodFact AI — 0006: pgvector nearest-neighbor RPC for rumor matching

create or replace function public.match_rumor_pattern(query_embedding vector(1024))
returns table (id uuid, canonical_claim text, category text, similarity float8)
language sql
stable
as $$
  select id, canonical_claim, category, (1 - (embedding <=> query_embedding))::float8 as similarity
  from public.rumor_patterns
  where embedding is not null
  order by embedding <=> query_embedding
  limit 1
$$;

grant execute on function public.match_rumor_pattern(vector) to service_role;
