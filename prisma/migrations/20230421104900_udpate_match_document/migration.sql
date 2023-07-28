CREATE OR REPLACE function match_documents (
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    id,
    content,
    1 - (document.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (document.embedding <=> query_embedding) > similarity_threshold
  order by document.embedding <=> query_embedding
  limit match_count;
end;
$$;