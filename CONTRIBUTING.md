# Contributing to Azable

Thanks for taking the time to contribute. This is a pnpm + Cargo monorepo
with three independently buildable parts — contracts, frontend, and backend —
plus a published TypeScript SDK. Pick the section that matches what you're
touching.

## Ground rules

- Be respectful and constructive in issues, PRs, and reviews.
- Open an issue before starting on anything non-trivial, so we can align on
  approach before you invest time.
- Keep PRs focused — one logical change per PR is easier to review and
  easier to revert if something's wrong.
- Found a security issue? Don't open a public issue — see [SECURITY.md](SECURITY.md).

## Project layout

```
contracts/        Soroban smart contracts (Rust, one Cargo workspace)
apps/web/          Next.js frontend
packages/sdk/     @azable/sdk — TypeScript bindings for the contracts
services/backend/ Rust/Axum backend — indexer, auth, off-chain data API
docs/             Architecture, API, and contract documentation
```

## Getting set up

```bash
git clone https://github.com/anitajordan22244-afk/mitros.git
cd mitros
pnpm install
cp .env.example .env
```

See the root [README.md](README.md#-quickstart-5-minutes) for the full
quickstart, including funding a testnet account and running the backend.

## Working on the contracts (`contracts/`)

```bash
cd contracts
cargo build --release
cargo test --all
```

- Each contract is its own crate; add new ones to `contracts/Cargo.toml`'s
  `members` list.
- Follow the existing patterns for events: prefer the typed `#[contractevent]`
  macro over raw `env.events().publish(...)` tuples where practical — it
  keeps the backend indexer's job simpler (see
  `services/backend/src/indexer/decode.rs`).
- Run `cargo clippy --all-targets -- -D warnings` before opening a PR.

## Working on the frontend (`apps/web/`)

```bash
pnpm --filter @azable/web dev
pnpm --filter @azable/web test
pnpm --filter @azable/web lint
```

- Components live under `src/components/`, grouped by atomic-ish tiers
  (`ui/`, `molecules/`, `organisms/`, `modules/`). Match the tier of what's
  around the thing you're adding.
- Tailwind theme tokens (colors, radii) are defined in `src/app/globals.css`
  under `--azable-*` — reuse those instead of hardcoding hex values.
- New API routes go under `src/app/api/`; most existing ones are still
  backed by in-memory or mock data (see `src/services/*`) rather than the
  real backend — that's a known, intentional gap being migrated
  incrementally onto `services/backend`, not something to silently "fix" in
  an unrelated PR.

## Working on the SDK (`packages/sdk/`)

```bash
pnpm --filter @azable/sdk build
pnpm --filter @azable/sdk test
pnpm --filter @azable/sdk generate   # regenerate bindings from built contract WASM
```

- `src/generated/` is auto-generated per-contract; don't hand-edit it — hand-written
  high-level clients (`PaymentStreamClient.ts`, etc.) live alongside it in `src/`.

## Working on the backend (`services/backend/`)

```bash
cd services/backend
docker compose -f ../../docker-compose.yml up -d postgres
cp .env.example .env
sqlx migrate run
cargo test
cargo clippy --all-targets -- -D warnings
cargo fmt --check
```

- New tables get a new numbered file under `migrations/` — never edit an
  already-merged migration.
- Prefer `sqlx::query`/`query_as` (runtime) over the `query!` compile-time
  macros, so `cargo check` doesn't require a live database.
- See `services/backend/README.md` for the full route reference and its
  "Known v1 limitations" section before assuming a gap is a bug.

## Commit and PR conventions

- Commit messages: short, imperative summary line (`fix(campaigns): ...`,
  `feat(backend): ...`); reference the issue number when there is one.
- PRs: describe *what* changed and *why*, and how you verified it (tests
  run, screenshots for UI changes, curl output for API changes). Link the
  issue it closes.
- CI must be green: `contracts.yml`, `backend.yml`, `frontend.yml`,
  `sdk-ci.yml` run automatically based on which paths your PR touches.

## Reporting bugs / requesting features

Open a GitHub issue with:

- What you expected to happen vs. what actually happened.
- Steps to reproduce (for bugs) or the use case it unblocks (for features).
- Which part of the repo it affects (contracts / frontend / SDK / backend).

Thanks again for contributing — we read every issue and PR.
