# Database Schema Documentation

This document describes the PostgreSQL database schema for the SorobanLoyalty platform, including detailed field descriptions, relationships, and index rationale.

## Overview

The SorobanLoyalty database is designed to track:
- **Users**: Stellar wallet addresses participating in the platform
- **Campaigns**: Merchant-created reward campaigns with expiration and claim limits
- **Rewards**: User claims of campaigns, tracking earned and redeemed LYT tokens
- **Transactions**: Audit log of all on-chain and off-chain transactions

All amounts are stored in **stroops** (1 LYT = 10^7 stroops) to maintain precision without floating-point arithmetic.

## Entity Relationship Diagram

```
┌─────────────┐
│   users     │
├─────────────┤
│ address (PK)│
│ created_at  │
└──────┬──────┘
       │
       │ 1:N
       │
       ├─────────────────────────────────┐
       │                                 │
       │                                 │
┌──────▼──────────┐          ┌──────────▼──────┐
│   rewards       │          │  transactions   │
├─────────────────┤          ├─────────────────┤
│ id (PK)         │          │ id (PK)         │
│ user_address(FK)│          │ tx_hash (UNIQUE)│
│ campaign_id(FK) │          │ type            │
│ amount          │          │ user_address    │
│ redeemed        │          │ campaign_id     │
│ claimed_at      │          │ amount          │
│ redeemed_at     │          │ ledger          │
└────────┬────────┘          │ created_at      │
         │                   └─────────────────┘
         │ N:1
         │
┌────────▼──────────┐
│   campaigns       │
├───────────────────┤
│ id (PK)           │
│ merchant          │
│ name              │
│ reward_amount     │
│ expiration        │
│ active            │
│ total_claimed     │
│ display_order     │
│ tx_hash           │
│ image_url         │
│ created_at        │
│ updated_at        │
│ deleted_at        │
└───────────────────┘
```

## Tables

### `users`

**Purpose**: Tracks unique Stellar wallet addresses that have interacted with the platform.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `address` | VARCHAR(56) | PRIMARY KEY | Stellar public key (base32 encoded, starts with 'G'). Uniquely identifies a user. |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp when user first interacted with the platform. Used for analytics and user cohort analysis. |

**Notes**:
- Users are created implicitly when they first claim a campaign or perform a transaction.
- No explicit user registration is required; the platform is fully self-service.
- User data is minimal for privacy; no personal information is stored.

---

### `campaigns`

**Purpose**: Stores loyalty campaigns created by merchants. Each campaign offers a fixed LYT reward to users who claim it before expiration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY | Unique campaign ID assigned by the Soroban smart contract. Immutable. |
| `merchant` | VARCHAR(56) | NOT NULL | Stellar address of the merchant who created the campaign. Used to filter campaigns by merchant. |
| `name` | VARCHAR(255) | | Campaign display name (e.g., "Summer Promo 2026"). Nullable for backward compatibility. |
| `reward_amount` | BIGINT | NOT NULL | LYT tokens awarded per claim (in stroops). Fixed at campaign creation; does not change. |
| `expiration` | BIGINT | NOT NULL | Unix timestamp (seconds since epoch) when campaign expires. After this time, no new claims are accepted. |
| `active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Soft-delete flag. When FALSE, campaign cannot be claimed even if not expired. Allows merchants to deactivate campaigns early. |
| `total_claimed` | BIGINT | NOT NULL, DEFAULT 0 | Running count of how many times this campaign has been claimed. Incremented by the indexer when processing claim events. |
| `display_order` | INT | NOT NULL, DEFAULT 0 | Display priority in UI (lower = higher priority). Allows merchants to control campaign ordering on the homepage. |
| `tx_hash` | VARCHAR(64) | | Soroban transaction hash when campaign was created on-chain. Used for audit trail and debugging. |
| `image_url` | TEXT | | URL to campaign image/banner. Displayed in campaign cards. |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp when campaign was inserted into the database (may differ from on-chain creation time). |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp of last update (name, image, display_order changes). |
| `deleted_at` | TIMESTAMPTZ | | Soft-delete timestamp. NULL = not deleted. Used for compliance and audit trails. |

**Notes**:
- Campaigns are immutable once created (except for `active`, `display_order`, `image_url`, `name`).
- `reward_amount` is fixed at creation and cannot be changed.
- `total_claimed` is updated by the indexer and should not be manually modified.

---

### `rewards`

**Purpose**: Maps users to the rewards they have claimed from specific campaigns. Tracks both claimed and redeemed amounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique internal identifier for this reward record. |
| `user_address` | VARCHAR(56) | NOT NULL, FK → users.address, ON DELETE CASCADE | Stellar address of the user who claimed the reward. |
| `campaign_id` | BIGINT | NOT NULL, FK → campaigns.id, ON DELETE CASCADE | Campaign ID that was claimed. |
| `amount` | BIGINT | NOT NULL | LYT tokens awarded (copied from campaign.reward_amount at claim time). Immutable. |
| `redeemed` | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether this reward has been fully redeemed (burned). |
| `redeemed_amount` | BIGINT | NOT NULL, DEFAULT 0 | Amount of LYT actually redeemed/burned. May be less than `amount` for partial redemptions. |
| `claimed_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp when user claimed this campaign. |
| `redeemed_at` | TIMESTAMPTZ | | Timestamp when reward was fully redeemed. NULL if not redeemed. |
| **UNIQUE** | (user_address, campaign_id) | | Enforces one claim per user per campaign. Prevents double-claiming. |

**Notes**:
- The `UNIQUE (user_address, campaign_id)` constraint is critical for preventing double-claims.
- `amount` is immutable and represents the LYT balance at claim time.
- `redeemed_amount` can be less than `amount` if the user performs a partial redemption.
- Cascading deletes ensure that if a user or campaign is deleted, their reward history is also removed.

---

### `transactions`

**Purpose**: Append-only audit log of all on-chain and off-chain transactions. Used for compliance, debugging, and transaction history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique internal identifier for this transaction record. |
| `tx_hash` | VARCHAR(64) | NOT NULL, UNIQUE | Soroban transaction hash on the Stellar network. Uniquely identifies the on-chain transaction. |
| `type` | VARCHAR(32) | NOT NULL | Transaction type: 'claim' (user claims campaign), 'redeem' (user burns LYT), 'transfer' (user sends LYT to another address). |
| `user_address` | VARCHAR(56) | | Stellar address of the user involved. NULL for system transactions. |
| `campaign_id` | BIGINT | | Campaign ID involved (only for 'claim' transactions). NULL for 'redeem' and 'transfer'. |
| `amount` | BIGINT | | Amount of LYT involved (in stroops). NULL for transactions without an amount. |
| `ledger` | BIGINT | | Soroban ledger sequence number when transaction was finalized. Used to order transactions chronologically. |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp when transaction was indexed (may lag behind on-chain finalization by a few seconds). |

**Notes**:
- This table is append-only; transactions are never updated or deleted.
- `tx_hash` uniqueness prevents duplicate indexing of the same transaction.
- The indexer polls Soroban RPC for new transactions and inserts them here.
- `ledger` provides a canonical ordering of transactions across the network.

---

## Foreign Key Relationships

### `rewards.user_address` → `users.address`
- **Cardinality**: N:1 (many rewards per user)
- **Cascade**: ON DELETE CASCADE
- **Purpose**: Ensures that a reward is always tied to a known user. If a user is deleted (rare), their reward history is also removed.

### `rewards.campaign_id` → `campaigns.id`
- **Cardinality**: N:1 (many rewards per campaign)
- **Cascade**: ON DELETE CASCADE
- **Purpose**: Ensures that a reward belongs to a valid campaign. If a campaign is deleted, its reward history is also removed.

### `transactions.user_address` → `users.address` (implicit)
- **Cardinality**: N:1 (many transactions per user)
- **Purpose**: Transactions reference user addresses but do not have a formal foreign key constraint (for flexibility with system transactions).

---

## Indexes

### Performance Indexes

| Index Name | Columns | Purpose | Query Pattern |
|------------|---------|---------|----------------|
| `idx_rewards_user` | `rewards(user_address)` | Fetch all rewards for a specific user | Dashboard, user profile, reward history |
| `idx_rewards_user_claimed_at` | `rewards(user_address, claimed_at DESC)` | Fetch recent rewards for a user | Dashboard (sorted by recency) |
| `idx_rewards_campaign` | `rewards(campaign_id)` | Fetch all claims for a specific campaign | Campaign detail, merchant analytics |
| `idx_transactions_user` | `transactions(user_address)` | Fetch transaction history for a user | User transaction history page |
| `idx_campaigns_merchant` | `campaigns(merchant)` | Fetch all campaigns created by a merchant | Merchant dashboard |
| `idx_campaigns_name` | `campaigns(name)` | Search campaigns by name | Global search, campaign filtering |
| `idx_campaigns_active` | `campaigns(active)` | Fetch active campaigns | Homepage, campaign listings |
| `idx_campaigns_expiration` | `campaigns(expiration)` | Find expired or upcoming campaigns | Expiration filtering, analytics |

### Index Rationale

- **`idx_rewards_user`**: Optimizes the most common query: "Show me all rewards for user X". Used on every dashboard load.
- **`idx_rewards_user_claimed_at`**: Composite index for sorted queries: "Show me the 10 most recent rewards for user X". Avoids sorting in application code.
- **`idx_rewards_campaign`**: Optimizes campaign-level analytics: "How many times has campaign Y been claimed?". Used in merchant dashboards.
- **`idx_transactions_user`**: Accelerates transaction history queries: "Show me all transactions for user X". Used in audit logs and user history pages.
- **`idx_campaigns_merchant`**: Optimizes merchant dashboard: "Show me all campaigns I created". Critical for merchant UX.
- **`idx_campaigns_name`**: Enables efficient campaign search: "Find campaigns matching 'summer'". Used in global search.
- **`idx_campaigns_active`**: Optimizes filtering: "Show me only active campaigns". Used on homepage and listings.
- **`idx_campaigns_expiration`**: Optimizes expiration-based queries: "Find campaigns expiring in the next 24 hours". Used for notifications and analytics.

---

## Data Integrity Constraints

### Unique Constraints
- **`rewards(user_address, campaign_id)`**: Prevents a user from claiming the same campaign twice. Enforced at the database level.
- **`transactions(tx_hash)`**: Prevents duplicate indexing of the same on-chain transaction.

### Foreign Key Constraints
- **`rewards.user_address` → `users.address`**: Ensures referential integrity.
- **`rewards.campaign_id` → `campaigns.id`**: Ensures referential integrity.

### Check Constraints (implicit)
- **`campaigns.reward_amount > 0`**: Enforced by smart contract; campaigns cannot have zero or negative rewards.
- **`campaigns.expiration > NOW()`**: Enforced by smart contract; campaigns cannot be created with past expiration times.

---

## Backup and Recovery

- **Backup Strategy**: Full PostgreSQL backups are taken daily and stored in S3.
- **Recovery**: Use `pg_restore` to restore from backup. See [postgres-backup-restore.md](runbooks/postgres-backup-restore.md) for detailed procedures.
- **Point-in-Time Recovery**: WAL archiving is enabled; recovery to any point in time is possible within the retention window.

---

## Performance Tuning

### Connection Pooling
- **Pool Size**: Configured via `DB_POOL_MAX` (default: 10)
- **Idle Timeout**: Configured via `DB_POOL_IDLE_TIMEOUT_MS` (default: 30000ms)
- See [README.md](../README.md#postgresql-connection-pool) for detailed pool configuration.

### Query Optimization
- All indexes are analyzed regularly via `ANALYZE` in the CI/CD pipeline.
- Slow queries are logged and monitored via CloudWatch.
- See [EXPLAIN_ANALYZE.md](EXPLAIN_ANALYZE.md) for query performance analysis.

---

## Migration History

Migrations are stored in `database/migrations/` and applied in order:
- `001_add_campaigns_deleted_at.sql`: Added soft-delete support for campaigns.
- `002_add_performance_indexes.sql`: Added indexes for common query patterns.
- `003_create_audit_logs.sql`: Added audit logging for compliance.

See `database/migrations/` for the full migration history.
