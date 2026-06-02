# Project Folder Structure

This document describes the layout of the Soroban Loyalty repository and the purpose of each directory and key file.

---

## Overview

The project is split into three independent layers:

| Layer | Directory | Language / Runtime |
|---|---|---|
| Smart contracts | `contracts/` | Rust / Soroban SDK |
| Backend API | `backend/` | Node.js / TypeScript / Express |
| Frontend | `frontend/` | Next.js 14 / TypeScript |

Supporting assets (database schema, deployment scripts, infrastructure config, end-to-end tests) live in dedicated top-level directories.

---

## Full Tree

```
soroban-loyalty/
│
├── contracts/                  # Soroban smart contracts (Rust)
│   ├── token/
│   │   ├── src/lib.rs          # LYT fungible token — mint, burn, transfer
│   │   └── Cargo.toml
│   ├── campaign/
│   │   ├── src/lib.rs          # Campaign management — create, deactivate, query
│   │   └── Cargo.toml
│   └── rewards/
│       ├── src/lib.rs          # Claim & redeem logic, cross-contract calls
│       └── Cargo.toml
│
├── backend/                    # Node.js REST API + on-chain event indexer
│   ├── src/
│   │   ├── index.ts            # Express server entry point, route mounting
│   │   ├── db.ts               # PostgreSQL connection pool (pg)
│   │   ├── soroban.ts          # Soroban RPC client configuration
│   │   ├── logger.ts           # Structured logger
│   │   ├── indexer/
│   │   │   └── indexer.ts      # Polls Soroban RPC for contract events, writes to DB
│   │   ├── services/
│   │   │   ├── campaign.service.ts   # DB read/write for campaigns
│   │   │   └── reward.service.ts     # DB read/write for rewards
│   │   └── routes/
│   │       ├── campaign.routes.ts    # GET /campaigns, GET /campaigns/:id
│   │       └── reward.routes.ts      # GET /user/:address/rewards
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # Next.js 14 App Router web app
│   ├── src/
│   │   ├── app/                # Next.js pages (App Router)
│   │   │   ├── layout.tsx      # Root layout — header, wallet provider, i18n provider
│   │   │   ├── globals.css     # Global CSS — design tokens, component styles
│   │   │   ├── page.tsx        # Home / landing page
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx    # User dashboard — browse campaigns, claim & redeem rewards
│   │   │   ├── merchant/
│   │   │   │   └── page.tsx    # Merchant portal — create and manage campaigns
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx    # Analytics — campaign performance stats table
│   │   │   └── transactions/
│   │   │       └── page.tsx    # Transaction history — filter, export CSV, print view
│   │   ├── components/         # Shared UI components
│   │   │   ├── WalletConnector.tsx        # Connect / disconnect Freighter wallet button
│   │   │   ├── CampaignCard.tsx           # Card displaying a single campaign with claim button
│   │   │   ├── RewardList.tsx             # List of earned rewards with redeem buttons
│   │   │   ├── NetworkStatusIndicator.tsx # Live network health dot indicator
│   │   │   ├── NetworkBanner.tsx          # Banner shown when network is degraded / offline
│   │   │   └── LanguageSwitcher.tsx       # EN / ES locale dropdown
│   │   ├── context/
│   │   │   ├── WalletContext.tsx  # Freighter wallet state — publicKey, connect, disconnect
│   │   │   └── I18nContext.tsx    # Internationalisation — locale, t() translation helper
│   │   ├── hooks/
│   │   │   └── useNetworkStatus.ts  # Polls backend /health and returns connection state
│   │   ├── lib/
│   │   │   ├── api.ts           # Typed fetch wrappers for the backend REST API
│   │   │   ├── soroban.ts       # Soroban SDK helpers — build, sign, and submit transactions
│   │   │   ├── freighter.ts     # Freighter browser wallet integration (sign XDR)
│   │   │   └── export.ts        # CSV export and date-range filtering for transactions
│   │   └── locales/
│   │       ├── en.json          # English translation strings
│   │       └── es.json          # Spanish translation strings
│   ├── Dockerfile
│   ├── next.config.js           # Next.js config — standalone output, env vars
│   ├── package.json
│   └── tsconfig.json
│
├── database/
│   └── schema.sql              # PostgreSQL schema — campaigns and rewards tables
│
├── scripts/
│   ├── deploy-contracts.sh     # Build, deploy, and initialize all three contracts (local or testnet)
│   └── renew-certs.sh          # TLS certificate renewal helper
│
├── infra/
│   └── cert-manager/           # Kubernetes cert-manager YAML manifests
│
├── e2e/                        # End-to-end tests (Playwright)
│   ├── tests/                  # Wallet connection, campaign listing, campaign detail specs
│   ├── playwright.config.ts
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── e2e.yml             # GitHub Actions CI — runs Playwright e2e suite
│
├── docs/
│   ├── contracts.md            # Smart contract interface reference (functions, events, errors)
│   ├── structure.md            # This file — repository layout guide
│   ├── glossary.md             # Domain-specific term definitions
│   └── user-guide.md           # End-user guide for the web app
│
├── docker-compose.yml          # Spins up all services — frontend, backend, postgres, soroban node
├── Cargo.toml                  # Workspace Cargo manifest referencing all three contracts
├── .env.example                # Template for required environment variables
└── README.md                   # Project overview, quick-start, API reference
```

---

## Layer Separation

### Contracts (`contracts/`)

Each contract is an independent Rust crate compiled to WebAssembly. They communicate via **cross-contract calls** (see `rewards/src/lib.rs`). Contracts have no knowledge of the backend or frontend.

### Backend (`backend/`)

A lightweight Express API with two responsibilities:

1. **Indexer** — polls the Soroban RPC for contract events and persists them to PostgreSQL.
2. **REST API** — serves pre-indexed data to the frontend (read-only). Claim and redeem operations are submitted directly from the frontend to the Soroban RPC, not proxied through the backend.

### Frontend (`frontend/`)

A Next.js 14 App Router application. Users sign transactions locally with the Freighter browser extension and submit them directly to the Soroban RPC. The backend is queried only for read operations (campaign list, reward history).
