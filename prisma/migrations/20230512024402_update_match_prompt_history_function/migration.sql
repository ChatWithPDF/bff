-- This is an empty migration.
CREATE OR REPLACE FUNCTION match_prompt_history(
  query_embedding vector(1536),
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
    1 - (prompt_history.embedding <=> query_embedding) AS similarity
  FROM
    prompt_history
  WHERE
    prompt_history."deletedAt" IS NULL  -- Added this condition to filter out deleted records
    AND 1 - (prompt_history.embedding <=> query_embedding) > similarity_threshold
  ORDER BY
    prompt_history.embedding <=> query_embedding
  LIMIT
    match_count;
END;
$$;
