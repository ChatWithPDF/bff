-- This is an empty migration.
ALTER TABLE "prompt_history" ADD COLUMN "pdfId" UUID;

DROP FUNCTION match_prompt_history;

CREATE OR REPLACE FUNCTION match_prompt_history(
  query_embedding vector(768),
  pdfId UUID,
  similarity_threshold float,
  match_count int
)
RETURNS TABLE (
  id integer,
  "queryInEnglish" text,
  "responseInEnglish" text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    prompt_history.id AS id,
    prompt_history."queryInEnglish" AS "queryInEnglish",
    prompt_history."responseInEnglish" AS "responseInEnglish",
    1 - (prompt_history.pdf <=> query_embedding) AS similarity
  FROM
    prompt_history
  WHERE
    prompt_history."deletedAt" IS NULL  -- Added this condition to filter out deleted records
    AND 1 - (prompt_history.pdf <=> query_embedding) > similarity_threshold
    AND prompt_history."pdfId" = pdfId
  ORDER BY
    prompt_history.pdf <=> query_embedding
  LIMIT
    match_count;
END;
$$;

DROP FUNCTION match_documents;

CREATE OR REPLACE function match_documents (
  query_embedding vector(768),
  pdfId UUID,
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
    1 - (document.pdf <=> query_embedding) as similarity
  from document
  where 
    document."pdfId" = pdfId
    AND 1 - (document.pdf <=> query_embedding) > similarity_threshold
  order by document.pdf <=> query_embedding
  limit match_count;
end;
$$;