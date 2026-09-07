# Azable

Azable is a Stellar/Soroban platform for payment streaming and clean-water-access
crowdfunding: creators run recurring payment streams, launch milestone-based
funding campaigns, and get on-chain, donor-verifiable credit for the wells
their campaigns fund.

![Contracts CI](https://github.com/skiboso/Azable/actions/workflows/contracts.yml/badge.svg)
![Backend CI](https://github.com/skiboso/Azable/actions/workflows/backend.yml/badge.svg)
![Frontend CI](https://github.com/skiboso/Azable/actions/workflows/frontend.yml/badge.svg)

## 🚀 Quickstart (5 minutes)

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [pnpm](https://pnpm.io) v9+ (`npm install -g pnpm`)
- [Rust](https://rustup.rs) (for the Soroban contracts and the backend)
- [Soroban CLI / stellar-cli](https://soroban.stellar.org/docs/getting-started/setup) v25.0.0+:
  ```bash
  cargo install --locked stellar-cli@25.0.0
  ```
- [Docker](https://docs.docker.com/get-docker/) (optional — only needed to run `services/backend` locally)

### 1. Clone and install

```bash
git clone https://github.com/skiboso/Azable.git
cd Azable
pnpm install
```

### 2. Fund a Stellar testnet account

```bash
stellar keys generate my-account --network testnet --fund
cp .env.example .env
# set STELLAR_SECRET_KEY in .env to the secret printed above
```

### 3. Build the contracts

```bash
pnpm build:contracts
```

### 4. (Optional) Run the backend

```bash
docker compose up -d postgres
cp services/backend/.env.example services/backend/.env
pnpm dev:backend
```

### 5. Run the frontend

```bash
pnpm dev
```

The app starts at http://localhost:3000. Connect a wallet (e.g. Freighter) to interact with the contracts on testnet.

> Need more detail? See [docs/getting-started.md](docs/getting-started.md), [services/backend/README.md](services/backend/README.md), and [scripts/README.md](scripts/README.md).

## 🏗️ Project structure

```
azable/
├── apps/
│   └── web/                    # Next.js frontend
│
├── contracts/                  # Soroban smart contracts (Rust), one Cargo workspace
│   ├── payment-stream/         # Payment streaming
│   ├── distributor/            # Token distribution
│   ├── campaign-funding/       # Campaign fundraising
│   ├── nft-stream/             # NFT-gated streams
│   ├── soulbound-badge/        # Contributor badges
│   ├── water-technician/       # Well-completion job tracking & referral rewards
│   ├── dispute-arbiter/        # Stream/campaign dispute resolution
│   ├── verifier-penalty/       # Verifier staking & slashing
│   ├── timelock/                # Timelocked admin actions
│   ├── upgrade-proxy/          # Contract upgrade proxy
│   ├── sponsor-crowdfunding/   # Sponsor pool crowdfunding
│   ├── sponsor-insurance/      # Sponsor insurance pools
│   └── donor-verification/     # ZK nullifier-based donor verification
│
├── services/
│   └── backend/                # Rust/Axum: Soroban event indexer, wallet auth, off-chain data API
│
├── packages/
│   └── sdk/                    # @azable/sdk — TypeScript bindings for the contracts
│
├── docs/                       # Architecture, API, and contract documentation
├── scripts/                    # Operational scripts (TTL renewal bot, digests, deploy helpers)
├── migrations/                 # See services/backend/migrations/ (moved there)
└── docker-compose.yml          # Local Postgres + backend for development
```

## 🌟 Features

- **Payment streaming** — continuous, revocable token streams for subscriptions, salaries, and recurring transfers
- **Campaign funding** — milestone-based on-chain fundraising with escrow, refunds, and creator payouts
- **Clean water access tracking** — verified well-completion records, liters-per-year impact estimates, and donor-facing certificates
- **Donor verification** — ZK nullifier-based proof of contribution without exposing donor identity
- **Sponsor tools** — crowdfunded sponsor pools, insurance pools, and leaderboard/referral rewards
- **Multi-asset support** — USDC, XLM, and other Stellar assets
- **Offramp integration** — convert crypto to fiat

## 🛠️ Tech stack

| Component    | Technology                                         |
| ------------ | --------------------------------------------------- |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4    |
| **Contracts**| Soroban SDK, Rust                                    |
| **Backend**  | Rust, Axum, sqlx/Postgres                            |
| **SDK**      | TypeScript, @stellar/stellar-sdk                     |

## 📐 Campaign contract architecture

The `campaign-funding` Soroban contract powers on-chain fundraising campaigns.

**State machine**: `Draft → Active → Paused → Successful/Failed → PaidOut/Refunded`

- `Draft` — creator configures the campaign and milestone payout schedule.
- `Active` — contributions are accepted.
- `Paused` — emergency stop; contributions suspended, state preserved.
- `Successful` — all milestones verified and claimed by the creator.
- `Failed` — end time reached without meeting the funding goal, or cancelled by an admin.
- `PaidOut` — final milestone released and the campaign fully settled.
- `Refunded` — backers can claim proportional refunds after failure.

Only the `admin` or `campaign_owner` may invoke restricted transitions.

**Security model**

- Admin-guarded privileged operations, validated per state transition.
- Checks-effects-interactions: external token calls happen after internal state updates.
- Checked/overflow-safe arithmetic throughout.
- Escrow accounting — contributions are only released via explicit `payout`/`refund` calls.
- Milestone approvals require reviewer sign-off before a creator can claim funds.

**Scalability**

- Campaigns are stored as persistent map entries keyed by campaign id — no unbounded collections.
- Contributions are aggregated rather than stored as individual ledger entries.
- Payouts batch milestone claims to minimize transaction count.
- The contract is stateless with respect to off-chain indexing; `services/backend`'s indexer replicates event data into Postgres for the frontend and analytics.

See [docs/CAMPAIGN_CONTRACT_ARCHITECTURE.md](docs/CAMPAIGN_CONTRACT_ARCHITECTURE.md) for the full design doc.

## 💡 Usage examples

### Horizon client (classic Stellar)

```typescript
import { Horizon } from "@stellar/stellar-sdk";

const server = new Horizon.Server("https://horizon-testnet.stellar.org");

async function checkAccount(address: string) {
  const account = await server.loadAccount(address);
  console.log(`Account ID: ${account.id}`);
  account.balances.forEach((balance) => {
    console.log(`Type: ${balance.asset_type}, Balance: ${balance.balance}`);
  });
}
```

### Soroban client (smart contracts)

```typescript
import { PaymentStreamClient, signAndWait } from "@azable/sdk";

const client = new PaymentStreamClient({
  contractId: "C...", // deployed contract ID
  networkPassphrase: "Test SDF Network ; September 2015",
  rpcUrl: "https://soroban-testnet.stellar.org",
});

const tx = await client.createStream({
  sender: "GAAA...",
  recipient: "GBBB...",
  token: "CDDD...",
  total_amount: 1_000_000_000n,
  initial_amount: 0n,
  start_time: BigInt(Math.floor(Date.now() / 1000)),
  end_time: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30),
});

const result = await signAndWait(tx, "https://soroban-testnet.stellar.org", async (xdr) => {
  return wallet.signTransaction(xdr); // e.g. Freighter
});
```

### Backend API

See [services/backend/README.md](services/backend/README.md) for the full route
reference (wallet-signature auth, indexed stream events, campaigns).

### S3 presigned uploads (milestone proof photos)

`POST /api/presign-upload` issues a short-lived AWS S3 presigned PUT URL so
clients can upload milestone proof photos directly to a private evidence
bucket. See `.env.example` for the required `AWS_*` variables.

## 📦 Packages

| Package | Description |
| --- | --- |
| [`apps/web`](apps/web) | Next.js frontend |
| [`contracts/`](contracts) | 13 Soroban contracts (payment streaming, campaigns, badges, insurance, ...) |
| [`packages/sdk`](packages/sdk) | `@azable/sdk` — generated + hand-written TypeScript bindings |
| [`services/backend`](services/backend) | Rust/Axum indexer, auth, and data API |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md) to report a vulnerability.

## 📄 License

MIT
