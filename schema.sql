CREATE TABLE standards_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  standard_code TEXT NOT NULL,
  standard_name TEXT NOT NULL,
  section TEXT NOT NULL,
  clause TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding TEXT,
  obligation_type TEXT,
  key_values TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usage_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  question TEXT NOT NULL,
  model_used TEXT,
  date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_standard_code ON standards_chunks(standard_code);
CREATE INDEX idx_session_date ON usage_log(session_id, date);

CREATE TABLE user_subscriptions (
  session_id TEXT PRIMARY KEY,
  daily_limit INTEGER DEFAULT 10,
  expert_name TEXT,
  expert_linkedin TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crowdsource_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_text TEXT NOT NULL,
  is_gold_standard BOOLEAN DEFAULT 0,
  gold_answer_keywords TEXT,
  is_active BOOLEAN DEFAULT 1
);

CREATE TABLE crowdsource_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(question_id) REFERENCES crowdsource_questions(id)
);

CREATE TABLE ndt_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL,
  instruction TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS code_safety_envelopes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_group TEXT NOT NULL,
  min_preheat_c REAL,
  min_preheat_f REAL,
  max_interpass_c REAL,
  max_interpass_f REAL,
  pwht_thickness_threshold_mm REAL,
  pwht_min_temp_c REAL,
  pwht_max_temp_c REAL,
  max_hardness_hrc REAL,
  governing_standard TEXT NOT NULL,
  primary_code TEXT,
  source_chunk_id INTEGER,
  min_remaining_wall_pct REAL,
  min_hydrotest_ratio REAL,
  notes TEXT,
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS request_traces (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  question TEXT,
  standard_filter TEXT,
  grounding_score REAL,
  evidence_badge TEXT,
  provider TEXT,
  model TEXT,
  duration_ms INTEGER,
  retrieval_ms INTEGER,
  table_ms INTEGER,
  draft_ms INTEGER,
  critic_ms INTEGER,
  verifier_ms INTEGER,
  mode TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO system_config (key, value) VALUES ('openrouter_api_key', '');
INSERT INTO system_config (key, value) VALUES ('openrouter_model', 'qwen/qwen3.8-27b:free');
