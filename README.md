# SorobanLoyalty

A modular, production-grade on-chain loyalty platform built on the **Stellar** network using **Soroban** smart contracts. Businesses create reward campaigns, users earn tokenized incentives (LYT), and everything is stored transparently on-chain.

See our [Glossary](docs/glossary.md) for definitions of domain-specific terms and our [Changelog](CHANGELOG.md) for recent updates.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Stellar Network                          │
│                                                                 │
│  ┌──────────────┐   ┌──────────────────┐   ┌────────────────┐  │
│  │ Token (LYT)  │◄──│  Rewards Contract│──►│Campaign Contract│ │
│  │  mint/burn   │   │  claim/redeem    │   │ create/manage  │  │
│  └──────────────┘   └──────────────────┘   └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          ▲                    ▲
          │ Soroban RPC        │ Events
          │                   │
┌─────────┴───────────────────┴──────────────────────────────────┐
│                     Backend (Node.js / Express)                 │
│                                                                 │
│  ┌──────────────┐   ┌──────────────────┐   ┌────────────────┐  │
│  │   Indexer    │   │ Campaign Service │   │ Reward Service │  │
│  │ (event poll) │   │  (DB read/write) │   │ (DB read/write)│  │
│  └──────┬───────┘   └────────┬─────────┘   └───────┬────────┘  │
│         └───────────────────┼─────────────────────┘            │
│                             ▼                                   │
│                      PostgreSQL DB                              │
└─────────────────────────────────────────────────────────────────┘
          ▲
          │ REST API
          │
┌─────────┴──────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                        │
│                                                                 │
│  /dashboard  — claim rewards, view balance                      │
│  /merchant   — create & manage campaigns                        │
│  /analytics  — campaign performance stats                       │
│                                                                 │
│  Freighter wallet integration (sign & submit transactions)      │
└────────────────────────────────────────────────────────────────┘
```

---

## Smart Contracts

| Contract | Description |
|---|---|
| `token` | Fungible LYT token — mint, burn, transfer. Admin-controlled mint. |
| `campaign` | Merchants create campaigns with reward amount + expiration. |
| `rewards` | Users claim rewards (mints LYT). Redeem burns LYT. Double-claim prevented. |

---

## Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) + `wasm32-unknown-unknown` target
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/install-stellar-cli)
- [Docker + Docker Compose](https://docs.docker.com/get-docker/)
- [Node.js 20+](https://nodejs.org/)

### 1. Clone & configure

```bash
git clone https://github.com/your-org/soroban-loyalty
cd soroban-loyalty
cp .env.example .env
```

### 2. Run with Docker

```bash
docker compose up --build
```

This command automatically picks up `docker-compose.override.yml` for development-only settings such as local source mounts and dev commands.

For production-style startup, use:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

Services:
- Soroban local node: `http://localhost:8000`
- Backend API: `http://localhost:3001`
- Frontend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

### 3. Run locally (without Docker)

**Start PostgreSQL** (or use Docker just for DB):
```bash
docker compose up postgres -d
```

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Deploy Contracts

### Add Rust wasm target
```bash
rustup target add wasm32-unknown-unknown
```

### Deploy to local network
```bash
./scripts/deploy-contracts.sh local <YOUR_SECRET_KEY>
```

### Deploy to testnet
```bash
./scripts/deploy-contracts.sh testnet <YOUR_SECRET_KEY>
```

The script builds all three contracts, deploys them, initializes them with correct cross-contract references, and updates your `.env` automatically.

---

## Run Tests

```bash
# All contracts
cargo test

# Individual contract
cargo test -p soroban-loyalty-token
cargo test -p soroban-loyalty-campaign
cargo test -p soroban-loyalty-rewards
```

Test coverage:
- Token: mint, transfer, burn, overflow/underflow guards
- Campaign: creation, expiry validation, deactivation, time-based expiry
- Rewards: claim, double-claim prevention, inactive campaign rejection, expired campaign rejection, redeem burns tokens

---

## API Reference

### Campaigns

| Method | Path | Description |
|---|---|---|
| `GET` | `/campaigns` | List all campaigns |
| `GET` | `/campaigns/:id` | Get campaign by ID |

### Rewards

| Method | Path | Description |
|---|---|---|
| `GET` | `/user/:address/rewards` | Get all rewards for a user |

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Service health check |

> Claim and redeem operations are submitted directly to the Soroban RPC from the frontend (signed by Freighter). The backend indexes the resulting on-chain events.

---

## Project Structure

```
soroban-loyalty/
├── contracts/
│   ├── token/src/lib.rs        # LYT fungible token
│   ├── campaign/src/lib.rs     # Campaign management
│   └── rewards/src/lib.rs      # Claim & redeem logic
├── backend/
│   └── src/
│       ├── index.ts            # Express server entry
│       ├── db.ts               # PostgreSQL pool
│       ├── soroban.ts          # RPC client
│       ├── indexer/indexer.ts  # Event indexer
│       ├── services/           # campaign + reward services
│       └── routes/             # REST route handlers
├── frontend/
│   └── src/
│       ├── app/                # Next.js App Router pages
│       ├── components/         # WalletConnector, CampaignCard, RewardList
│       ├── context/            # WalletContext (Freighter state)
│       └── lib/                # api.ts, soroban.ts, freighter.ts
├── database/schema.sql         # PostgreSQL schema
├── scripts/deploy-contracts.sh # One-shot deploy script
├── docker-compose.yml
└── .env.example
```

---

## PostgreSQL Connection Pool

The backend uses `pg.Pool`. All four sizing knobs are configurable via environment variables:

| Variable | Default | Description |
|---|---|---|
| `DB_POOL_MAX` | `10` | Maximum concurrent connections. |
| `DB_POOL_MIN` | `2` | Minimum idle connections kept alive. |
| `DB_POOL_IDLE_TIMEOUT_MS` | `30000` | Milliseconds before an idle connection is closed. |
| `DB_POOL_CONNECTION_TIMEOUT_MS` | `5000` | Milliseconds to wait for a free connection before throwing. |

**Sizing guidance**

- **`DB_POOL_MAX`** — A common starting formula is `(vCPUs × 2) + effective_spindle_count`. For a 2-vCPU app server talking to a `db.t3.medium` (2 vCPU), `10` is a safe default. Never exceed the database's `max_connections` (default 100 on RDS) across all app instances combined.
- **`DB_POOL_MIN`** — Keep at `2` so the first request after an idle period doesn't pay connection-setup latency. Set to `0` in serverless/ephemeral environments.
- **`DB_POOL_IDLE_TIMEOUT_MS`** — Lower to `10000` in low-traffic or serverless deployments to release connections back to the database sooner.
- **`DB_POOL_CONNECTION_TIMEOUT_MS`** — `5000` is a reasonable upper bound. Tune down to `2000` if you prefer fast-fail behaviour under pool exhaustion.

Pool exhaustion errors are logged at `error` level with `totalCount`, `idleCount`, and `waitingCount` for immediate observability.

---

## Security Notes

- All sensitive contract functions use `require_auth()`
- Double-claim prevention: claimed state is written **before** external calls (reentrancy guard)
- Overflow-safe arithmetic via `checked_add` / Rust's `overflow-checks = true` in release
- Token minting is restricted to the Rewards contract (set as admin during deploy)
- No secret keys in code — all keys via environment variables

---

## Code of Conduct

This project follows the [Code of Conduct](./CODE_OF_CONDUCT.md).  
By participating, you are expected to uphold these guidelines.
