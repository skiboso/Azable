-- Wallet-signature auth. There is no username/password or OAuth anywhere in
-- this codebase (the frontend's only identity signal is wallet-connection
-- state), so auth here is a SEP-10-inspired challenge-transaction flow:
-- POST /auth/challenge issues a row here, POST /auth/verify consumes it once
-- the caller returns a transaction signed by the claimed address.

CREATE TABLE IF NOT EXISTS auth_nonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  nonce text NOT NULL,
  tx_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  consumed_at timestamptz
);

CREATE INDEX IF NOT EXISTS auth_nonces_address_idx ON auth_nonces (address);
CREATE UNIQUE INDEX IF NOT EXISTS auth_nonces_tx_hash_idx ON auth_nonces (tx_hash);
