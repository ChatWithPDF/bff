DROP FUNCTION match_prompt_history;

CREATE OR REPLACE FUNCTION match_prompt_history(
  query_embedding vector(768),
  pdfIds TEXT[],
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
    AND prompt_history."pdfId"::text = ANY(pdfIds)
  ORDER BY
    prompt_history.pdf <=> query_embedding
  LIMIT
    match_count;
END;
$$;

DROP FUNCTION match_documents;

CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(768),
  pdfIds TEXT[],
  similarity_threshold float,
  match_count int
)
RETURNS TABLE (
  id integer,
  content text,
  tags text,
  similarity float,
  "pdfId" uuid,
  "metaData" jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document.id as id,
    document.content as content,
    document.tags as tags,
    1 - (document.pdf <=> query_embedding) as similarity,
    document."pdfId" as "pdfId",
    document."metaData" as "metaData"
  FROM
    document
  WHERE 
    document."pdfId"::text = ANY(pdfIds)
    AND 1 - (document.pdf <=> query_embedding) > similarity_threshold
  ORDER BY
    document.pdf <=> query_embedding
  LIMIT match_count;
END;
$$;
