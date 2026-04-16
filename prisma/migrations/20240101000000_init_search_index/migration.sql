-- Enable pg_trgm extension for trigram-based fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index on Content.title for sub-10ms title search at scale
CREATE INDEX IF NOT EXISTS "content_title_trgm_idx"
  ON "Content" USING GIN (title gin_trgm_ops);

-- GIN index on Content.description for full text search
CREATE INDEX IF NOT EXISTS "content_description_trgm_idx"
  ON "Content" USING GIN (description gin_trgm_ops);
