CREATE TABLE IF NOT EXISTS conversation (
  id SERIAL PRIMARY KEY NOT NULL,
  conversation_id TEXT NOT NULL,
  content TEXT NOT NULL
);