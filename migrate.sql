CREATE TABLE IF NOT EXISTS user_subscriptions (
  session_id TEXT PRIMARY KEY,
  daily_limit INTEGER DEFAULT 10,
  expert_name TEXT,
  expert_linkedin TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crowdsource_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_text TEXT NOT NULL,
  is_gold_standard BOOLEAN DEFAULT 0,
  gold_answer_keywords TEXT,
  is_active BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS crowdsource_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(question_id) REFERENCES crowdsource_questions(id)
);

CREATE TABLE IF NOT EXISTS ndt_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL,
  instruction TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO system_config (key, value) VALUES ('openrouter_api_key', '');
INSERT OR IGNORE INTO system_config (key, value) VALUES ('openrouter_model', 'qwen/qwen3.8-27b:free');

-- Phase P2.1: Obligation Subtyping & Key Values
-- Added to standards_chunks:
-- ALTER TABLE standards_chunks ADD COLUMN obligation_type TEXT;
-- ALTER TABLE standards_chunks ADD COLUMN key_values TEXT;

-- Phase P2.6 / Batch B: Safety Envelopes Census & Request Trace Stage Timings
-- ALTER TABLE code_safety_envelopes ADD COLUMN primary_code TEXT;
-- ALTER TABLE code_safety_envelopes ADD COLUMN source_chunk_id INTEGER;
-- ALTER TABLE code_safety_envelopes ADD COLUMN min_remaining_wall_pct REAL;
-- ALTER TABLE code_safety_envelopes ADD COLUMN min_hydrotest_ratio REAL;
-- ALTER TABLE code_safety_envelopes ADD COLUMN notes TEXT;
-- ALTER TABLE request_traces ADD COLUMN retrieval_ms INTEGER;
-- ALTER TABLE request_traces ADD COLUMN table_ms INTEGER;
-- ALTER TABLE request_traces ADD COLUMN draft_ms INTEGER;
-- ALTER TABLE request_traces ADD COLUMN critic_ms INTEGER;
-- ALTER TABLE request_traces ADD COLUMN verifier_ms INTEGER;
-- ALTER TABLE request_traces ADD COLUMN mode TEXT;

-- Phase 9: Answer Depth
-- ALTER TABLE request_traces ADD COLUMN answer_depth TEXT;


