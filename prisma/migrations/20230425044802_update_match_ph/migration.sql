-- This is an empty migration.
CREATE function match_prompt_history (
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int
)
returns table (
  id integer,
  "queryInEnglish" text,
  "responseInEnglish" text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    prompt_history.id as id,
    prompt_history."queryInEnglish" as "queryInEnglish",
    prompt_history."responseInEnglish" as "responseInEnglish",
    1 - (prompt_history.embedding <=> query_embedding) as similarity
  from prompt_history
  where 1 - (prompt_history.embedding <=> query_embedding) > similarity_threshold
  order by prompt_history.embedding <=> query_embedding
  limit match_count;
end;
$$;
