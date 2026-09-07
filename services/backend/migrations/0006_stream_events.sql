-- On-chain event index. Populated by the indexer task in src/indexer/,
-- which polls Soroban RPC getEvents for the contracts listed in
-- CONTRACT_IDS and stores every event generically (see src/indexer/decode.rs
-- for why this is intentionally schema-agnostic rather than one table per
-- contract). Replaces the old, unwired scripts/cdc-indexer.ts.

CREATE TABLE IF NOT EXISTS stream_events (
  id bigserial PRIMARY KEY,
  rpc_event_id text NOT NULL UNIQUE,
  contract_id text NOT NULL,
  ledger bigint NOT NULL,
  ledger_closed_at timestamptz,
  tx_hash text NOT NULL,
  event_type text,
  topics jsonb NOT NULL,
  data jsonb NOT NULL,
  in_successful_contract_call boolean NOT NULL DEFAULT true,
  indexed_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS stream_events_contract_ledger_idx
  ON stream_events (contract_id, ledger DESC);
CREATE INDEX IF NOT EXISTS stream_events_event_type_idx
  ON stream_events (event_type);

-- One row per running indexer instance so polling can resume from where it
-- left off after a restart.
CREATE TABLE IF NOT EXISTS indexer_cursors (
  indexer_id text PRIMARY KEY,
  last_ledger bigint NOT NULL DEFAULT 0,
  last_paging_token text,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
