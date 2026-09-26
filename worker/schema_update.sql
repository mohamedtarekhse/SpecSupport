CREATE TABLE IF NOT EXISTS documents_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_hash TEXT UNIQUE NOT NULL,
  standard_code TEXT NOT NULL,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  scope TEXT DEFAULT 'global',
  session_id TEXT,
  chunk_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);

-- Ensure columns exist in standards_chunks
-- In SQLite, we can safely attempt adding columns if not present
CREATE INDEX IF NOT EXISTS idx_doc_hash ON documents_catalog(file_hash);
