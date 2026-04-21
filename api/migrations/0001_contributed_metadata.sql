-- Community-contributed metadata, consent-gated via rotating opaque token.
-- Populated by POST /contribute (see handleContribute in worker.js).

CREATE TABLE IF NOT EXISTS contributed_metadata (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url     TEXT NOT NULL,
  source_id     TEXT,
  tags          TEXT NOT NULL,           -- JSON-encoded array
  query         TEXT,
  model         TEXT,
  consent_token TEXT NOT NULL,           -- rotating per-grant opaque token
  received_at   TEXT NOT NULL            -- ISO-8601
);

CREATE INDEX IF NOT EXISTS idx_contributed_metadata_image_url ON contributed_metadata(image_url);
CREATE INDEX IF NOT EXISTS idx_contributed_metadata_token     ON contributed_metadata(consent_token);
CREATE INDEX IF NOT EXISTS idx_contributed_metadata_received  ON contributed_metadata(received_at);
