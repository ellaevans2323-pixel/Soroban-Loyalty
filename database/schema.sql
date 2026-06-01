-- SorobanLoyalty PostgreSQL Schema
-- This schema defines the core data model for the loyalty platform:
-- - Users: Stellar wallet addresses participating in the platform
-- - Campaigns: Merchant-created reward campaigns with expiration and claim limits
-- - Rewards: User claims of campaigns, tracking earned and redeemed LYT tokens
-- - Transactions: Audit log of all on-chain and off-chain transactions

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users Table ──────────────────────────────────────────────────────────────
-- Stores Stellar wallet addresses that have interacted with the platform.
-- Minimal data: only address and creation timestamp for privacy.
CREATE TABLE IF NOT EXISTS users (
    -- Stellar public key (56 chars, base32 encoded)
    address         VARCHAR(56) PRIMARY KEY,
    -- Timestamp when user first interacted with the platform
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Campaigns Table ──────────────────────────────────────────────────────────
-- Merchant-created reward campaigns. Each campaign offers a fixed LYT reward
-- to users who claim it before expiration.
CREATE TABLE IF NOT EXISTS campaigns (
    -- Unique campaign ID (assigned by smart contract)
    id              BIGINT PRIMARY KEY,
    -- Merchant's Stellar address (campaign creator)
    merchant        VARCHAR(56) NOT NULL,
    -- Campaign display name
    name            VARCHAR(255),
    -- LYT tokens awarded per claim (in stroops, 1 LYT = 10^7 stroops)
    reward_amount   BIGINT NOT NULL,
    -- Unix timestamp when campaign expires and can no longer be claimed
    expiration      BIGINT NOT NULL,
    -- Whether campaign is currently accepting claims (soft delete via deactivation)
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    -- Total number of times this campaign has been claimed
    total_claimed   BIGINT NOT NULL DEFAULT 0,
    -- Display order in UI (for sorting campaigns)
    display_order   INT NOT NULL DEFAULT 0,
    -- Soroban transaction hash when campaign was created on-chain
    tx_hash         VARCHAR(64),
    -- URL to campaign image/banner
    image_url       TEXT,
    -- Timestamp when campaign was created in database
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Timestamp of last update (name, image, etc.)
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Soft delete timestamp (NULL = not deleted)
    deleted_at      TIMESTAMPTZ
);

-- ── Rewards Table ────────────────────────────────────────────────────────────
-- Tracks user claims of campaigns. Each row represents one user claiming one campaign.
-- Enforces one claim per user per campaign via UNIQUE constraint.
CREATE TABLE IF NOT EXISTS rewards (
    -- Unique reward record ID
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- User's Stellar address (who claimed the reward)
    user_address    VARCHAR(56) NOT NULL REFERENCES users(address) ON DELETE CASCADE,
    -- Campaign ID that was claimed
    campaign_id     BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    -- LYT tokens awarded (copied from campaign.reward_amount at claim time)
    amount          BIGINT NOT NULL,
    -- Whether this reward has been fully redeemed (burned)
    redeemed        BOOLEAN NOT NULL DEFAULT FALSE,
    -- Amount of LYT actually redeemed/burned (may be partial)
    redeemed_amount BIGINT NOT NULL DEFAULT 0,
    -- Timestamp when user claimed this campaign
    claimed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Timestamp when reward was fully redeemed (NULL if not redeemed)
    redeemed_at     TIMESTAMPTZ,
    -- Soroban transaction hash for idempotent reward event indexing
    tx_hash         VARCHAR(64),
    -- Enforce one claim per user per campaign
    UNIQUE (user_address, campaign_id),
    UNIQUE (tx_hash)
);

-- ── Transactions Table ───────────────────────────────────────────────────────
-- Audit log of all on-chain and off-chain transactions for compliance and debugging.
-- Tracks claim, redeem, and transfer operations.
CREATE TABLE IF NOT EXISTS transactions (
    -- Unique transaction record ID
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Soroban transaction hash (unique identifier on-chain)
    tx_hash         VARCHAR(64) NOT NULL UNIQUE,
    -- Transaction type: 'claim' (user claims campaign), 'redeem' (user burns LYT), 'transfer' (user sends LYT)
    type            VARCHAR(32) NOT NULL,
    -- User's Stellar address (NULL for system transactions)
    user_address    VARCHAR(56),
    -- Campaign ID (NULL for redeem/transfer transactions)
    campaign_id     BIGINT,
    -- Amount of LYT involved (stroops)
    amount          BIGINT,
    -- Soroban ledger sequence number when transaction was finalized
    ledger          BIGINT,
    -- Timestamp when transaction was recorded
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
-- Performance indexes for common query patterns

-- Rewards queries by user (dashboard, user profile)
CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards(user_address);

-- Rewards queries by user with time ordering (recent claims first)
CREATE INDEX IF NOT EXISTS idx_rewards_user_claimed_at ON rewards(user_address, claimed_at DESC);

-- Rewards queries by campaign (campaign detail page, analytics)
CREATE INDEX IF NOT EXISTS idx_rewards_campaign ON rewards(campaign_id);

-- Transaction queries by user (transaction history)
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_address);

-- Campaign queries by merchant (merchant dashboard)
CREATE INDEX IF NOT EXISTS idx_campaigns_merchant ON campaigns(merchant);

-- Campaign search by name
CREATE INDEX IF NOT EXISTS idx_campaigns_name ON campaigns(name);

-- Campaign filtering by active status (homepage, listings)
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(active);

-- Campaign filtering by expiration (find expired campaigns, upcoming expirations)
CREATE INDEX IF NOT EXISTS idx_campaigns_expiration ON campaigns(expiration);
