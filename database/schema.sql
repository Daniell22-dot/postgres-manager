-- Local SQLite database (stores your app's data)
CREATE TABLE connections (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  host TEXT NOT NULL,
  port INTEGER DEFAULT 5432,
  database TEXT NOT NULL,
  username TEXT NOT NULL,
  encrypted_password TEXT,  
  ssl_mode TEXT DEFAULT 'prefer',
  color TEXT,  -- For visual organization
  group_name TEXT,  -- Group related databases
  created_at INTEGER,
  last_connected INTEGER
);

CREATE TABLE query_history (
  id INTEGER PRIMARY KEY,
  connection_id INTEGER,
  sql_text TEXT NOT NULL,
  executed_at INTEGER,
  duration_ms INTEGER,
  row_count INTEGER,
  error TEXT,
  FOREIGN KEY(connection_id) REFERENCES connections(id)
);

CREATE TABLE saved_queries (
  id INTEGER PRIMARY KEY,
  connection_id INTEGER,
  name TEXT NOT NULL,
  sql_text TEXT NOT NULL,
  created_at INTEGER,
  last_executed INTEGER,
  favorite BOOLEAN DEFAULT 0,
  FOREIGN KEY(connection_id) REFERENCES connections(id)
);

CREATE TABLE metadata_cache (
  key TEXT PRIMARY KEY,  -- "db:schema:table:columns"
  value TEXT,  -- JSON encoded
  expires_at INTEGER,
  connection_id INTEGER
);