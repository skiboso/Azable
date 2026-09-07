# Azable Backend

Rust/Axum service providing:

- **On-chain event indexing** — polls Soroban RPC `getEvents` for the
  contracts in `contracts/` and persists them to Postgres (`stream_events`),
  replacing the old, unwired `scripts/cdc-indexer.ts`.
- **Wallet-based auth** — a SEP-10-inspired challenge/verify flow issuing
  session JWTs, since this app has no username/password or OAuth (the
  frontend's only identity signal today is wallet-connection state).
- **Off-chain data API** — `campaigns`, `streams`, etc. backed by real
  Postgres tables instead of the in-memory/JSON-file stand-ins currently in
  `apps/web/src/services/*`.

See [`CAMPAIGN_CONTRACT_ARCHITECTURE.md`](../../docs/CAMPAIGN_CONTRACT_ARCHITECTURE.md)
for how this fits into the wider system, and this crate's module docs
(`src/indexer/decode.rs`, `src/auth/challenge_tx.rs`) for the specific
design trade-offs made for v1.

## Setup

Requires Rust (stable) and a Postgres 16 instance.

```bash
# From the repo root, start Postgres (or point DATABASE_URL at your own):
docker compose up -d postgres

cd services/backend
cp .env.example .env
# edit .env: set CONTRACT_IDS from ../../deployments/testnet.json, a real JWT_SECRET, etc.

cargo install sqlx-cli --no-default-features --features postgres,rustls
sqlx migrate run

cargo run
```

The server binds to `BIND_ADDR` (default `0.0.0.0:8080`) and starts the
background indexer loop immediately if `CONTRACT_IDS` is non-empty.

## Routes

| Method | Path              | Auth       | Description                                  |
| ------ | ----------------- | ---------- | --------------------------------------------- |
| GET    | `/health`         | —          | Postgres + Soroban RPC reachability check     |
| POST   | `/auth/challenge` | —          | Issue a signable challenge transaction        |
| POST   | `/auth/verify`    | —          | Verify a signed challenge, issue a JWT        |
| GET    | `/me`             | Bearer JWT | Echo the authenticated wallet address         |
| GET    | `/streams`        | —          | List indexed on-chain events as stream records |
| GET    | `/campaigns`      | —          | List campaigns                                |
| GET    | `/campaigns/:id`  | —          | Fetch one campaign                            |

### Auth flow

```bash
curl -sX POST localhost:8080/auth/challenge \
  -H 'content-type: application/json' \
  -d '{"address":"G..."}'
# -> { "transaction_xdr": "AAAA...", "expires_at": "..." }

# Sign transaction_xdr with the account's secret key (e.g. via the Stellar
# SDK, Stellar Laboratory, or the frontend's existing signTransaction()
# call) against NETWORK_PASSPHRASE, then:

curl -sX POST localhost:8080/auth/verify \
  -H 'content-type: application/json' \
  -d '{"address":"G...","transaction_xdr":"<signed envelope>"}'
# -> { "token": "<jwt>" }

curl -s localhost:8080/me -H "authorization: Bearer <jwt>"
# -> { "address": "G..." }
```

## Known v1 limitations

- **Event decoding is generic, not per-contract.** The 13 contracts in
  `contracts/` emit events in inconsistent shapes (typed `#[contractevent]`
  structs vs. raw topic tuples). `indexer/decode.rs` normalizes every event
  into `topics`/`data` JSONB rather than one typed table per contract —
  see that file's doc comment for why. `/streams` extracts common field
  names (`sender`/`from`, `recipient`/`to`, `amount`, ...) best-effort from
  whatever a given event actually contains.
- **Auth is a minimal challenge-transaction flow, not full SEP-10.** No
  home domain / web auth domain / client domain / signer-threshold support.
- Most of the ~50 mock/in-memory routes under `apps/web/src/app/api/` are
  **not yet ported** — only `campaigns` and the stream/analytics data feed
  are covered. Porting the rest incrementally should follow the pattern
  established in `src/routes/campaigns.rs`.

## Tests

```bash
cargo test
cargo clippy --all-targets -- -D warnings
cargo fmt --check
```
