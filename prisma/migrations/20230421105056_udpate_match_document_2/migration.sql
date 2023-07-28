-- This is an empty migration.

DROP FUNCTION match_documents;

CREATE OR REPLACE function match_documents (
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int
)
returns table (
  id integer,
  content text,
  tags text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    document.id as id,
    document.content as content,
    document.tags as tags,
    1 - (document.embedding <=> query_embedding) as similarity
  from document
  where 1 - (document.embedding <=> query_embedding) > similarity_threshold
  order by document.embedding <=> query_embedding
  limit match_count;
end;
$$;