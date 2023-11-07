-- This is an empty migration.
ALTER TABLE "prompt_history"
DROP COLUMN "embedding",
ADD COLUMN  "embedding" vector(1536);

ALTER TABLE "document"
DROP COLUMN "contentEmbedding",
ADD COLUMN  "contentEmbedding" vector(1536),
DROP COLUMN "headingEmbedding",
ADD COLUMN  "headingEmbedding" vector(1536),
DROP COLUMN "summaryEmbedding",
ADD COLUMN  "summaryEmbedding" vector(1536);