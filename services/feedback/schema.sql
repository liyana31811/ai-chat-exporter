-- Apply with Wrangler D1 migrations or execute this schema before deployment.
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  reasons TEXT NOT NULL,
  text TEXT NOT NULL,
  locale TEXT NOT NULL CHECK(locale IN ('en', 'zh-CN')),
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'read', 'resolved')),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS feedback_created ON feedback(created_at DESC, id DESC);
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_expiry ON rate_limits(expires_at);
