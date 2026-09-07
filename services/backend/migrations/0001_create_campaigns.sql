-- Base campaigns table. Nothing in the repo created this before now — the
-- four migrations that follow (moved here from the old repo-root
-- migrations/ directory) all ALTER or REFERENCE `campaigns` without ever
-- creating it, so they were unrunnable on a fresh database until this file
-- was added.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  creator text NOT NULL,
  goal_amount numeric(78, 0),
  status text NOT NULL DEFAULT 'DRAFT'
    CONSTRAINT campaigns_status_check CHECK (
      status IN ('DRAFT', 'PENDING_VERIFICATION', 'ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED')
    ),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS campaigns_creator_idx ON campaigns (creator);
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON campaigns (status);
