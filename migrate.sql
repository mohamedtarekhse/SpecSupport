-- Migration: Conversations, Messages, and User Memory Tables

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_key TEXT NOT NULL,
  title TEXT NOT NULL,
  pinned INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  message_count INT DEFAULT 0,
  last_badge TEXT
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_key, pinned DESC, updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  grounding_brief TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at ASC);

CREATE TABLE IF NOT EXISTS user_memory (
  id TEXT PRIMARY KEY,
  user_key TEXT NOT NULL,
  fact TEXT NOT NULL,
  category TEXT NOT NULL,
  active INT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_memory_user ON user_memory(user_key, active);

-- Add memory_used to request_traces if not present
-- ALTER TABLE request_traces ADD COLUMN memory_used TEXT;
