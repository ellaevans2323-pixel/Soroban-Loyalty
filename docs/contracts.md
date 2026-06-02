# Smart Contract Interface Reference

The Soroban Loyalty platform is made up of three contracts deployed on the Stellar network. This document covers each contract's public functions, argument types, return values, emitted events, and error conditions.

---

## Token Contract (`soroban-loyalty-token`)

Manages the **LYT** fungible token. The Rewards contract is the designated admin and is the only address permitted to mint.

### Functions

#### `initialize`

Sets up the token. Can only be called once.

| Argument | Type | Description |
|---|---|---|
| `admin` | `Address` | Address that can mint tokens (set to Rewards contract on deploy) |
| `name` | `String` | Full token name, e.g. `"LoyaltyToken"` |
| `symbol` | `String` | Ticker symbol, e.g. `"LYT"` |
| `decimals` | `u32` | Decimal places, e.g. `7` |

Returns: nothing  
Panics: `"already initialized"` if called more than once.

---

#### `mint`

Mints `amount` tokens to `to`. Admin-only.

| Argument | Type | Description |
|---|---|---|
| `to` | `Address` | Recipient address |
| `amount` | `i128` | Number of tokens to mint (must be > 0) |

Returns: nothing  
Panics: `"amount must be positive"` · overflow panic if total supply wraps.

---

#### `burn`

Burns `amount` tokens from `from`. Requires authorization from `from`.

| Argument | Type | Description |
|---|---|---|
| `from` | `Address` | Address to burn from |
| `amount` | `i128` | Number of tokens to burn (must be > 0) |

Returns: nothing  
Panics: `"amount must be positive"` · `"insufficient balance"`

---

#### `transfer`

Transfers `amount` from `from` to `to`. Requires authorization from `from`.

| Argument | Type | Description |
|---|---|---|
| `from` | `Address` | Sender address |
| `to` | `Address` | Recipient address |
| `amount` | `i128` | Amount to transfer (must be > 0) |

Returns: nothing  
Panics: `"amount must be positive"` · `"insufficient balance"` · overflow panic on recipient balance.

---

#### `balance`

Returns the token balance of `addr`.

| Argument | Type | Description |
|---|---|---|
| `addr` | `Address` | Address to query |

Returns: `i128`

---

#### `total_supply_view`

Returns the current total supply.

Returns: `i128`

---

#### `admin_address`

Returns the current admin address.

Returns: `Address`

---

#### `name` / `symbol` / `decimals`

Return token metadata set at initialization.

Returns: `String` / `String` / `u32`

---

#### `set_admin`

Transfers admin rights to `new_admin`. Requires current admin auth.

| Argument | Type | Description |
|---|---|---|
| `new_admin` | `Address` | New admin address |

Returns: nothing

---

### Events

| Topic tuple | Data | Description |
|---|---|---|
| `("MINT", "to", <to: Address>)` | `i128` amount | Emitted when tokens are minted |
| `("BURN", "from", <from: Address>)` | `i128` amount | Emitted when tokens are burned |
| `("TRANSFER", "from", <from: Address>)` | `(<to: Address>, i128 amount)` | Emitted on transfer |

---

### Error Codes

| Condition | Message | Function |
|---|---|---|
| Calling `initialize` twice | `"already initialized"` | `initialize` |
| Non-positive amount | `"amount must be positive"` | `mint`, `burn`, `transfer` |
| Insufficient balance | `"insufficient balance"` | `burn`, `transfer` |
| Integer overflow | runtime panic | `mint`, `transfer` |

---

### CLI Examples

```bash
# Initialize
stellar contract invoke --id <TOKEN_CONTRACT_ID> \
  -- initialize \
  --admin <ADMIN_ADDRESS> \
  --name "LoyaltyToken" \
  --symbol "LYT" \
  --decimals 7

# Check balance
stellar contract invoke --id <TOKEN_CONTRACT_ID> \
  -- balance \
  --addr <USER_ADDRESS>

# Mint (admin only)
stellar contract invoke --id <TOKEN_CONTRACT_ID> \
  --source <ADMIN_SECRET_KEY> \
  -- mint \
  --to <USER_ADDRESS> \
  --amount 1000

# Transfer
stellar contract invoke --id <TOKEN_CONTRACT_ID> \
  --source <SENDER_SECRET_KEY> \
  -- transfer \
  --from <SENDER_ADDRESS> \
  --to <RECIPIENT_ADDRESS> \
  --amount 200

# Burn
stellar contract invoke --id <TOKEN_CONTRACT_ID> \
  --source <USER_SECRET_KEY> \
  -- burn \
  --from <USER_ADDRESS> \
  --amount 100
```

---

## Campaign Contract (`soroban-loyalty-campaign`)

Merchants create and manage reward campaigns. Each campaign specifies a reward amount in LYT and an expiration timestamp.

### Types

#### `Campaign`

```rust
struct Campaign {
    id: u64,
    merchant: Address,
    reward_amount: i128,   // LYT tokens awarded per claim
    expiration: u64,       // Unix timestamp (seconds) after which no claims are accepted
    active: bool,          // Merchant-controlled on/off switch
    total_claimed: u64,    // Running count of successful claims
}
```

---

### Functions

#### `initialize`

Sets up the campaign contract. Can only be called once.

| Argument | Type | Description |
|---|---|---|
| `admin` | `Address` | Admin address |

Returns: nothing  
Panics: `"already initialized"`

---

#### `create_campaign`

Creates a new campaign. Requires authorization from `merchant`.

| Argument | Type | Description |
|---|---|---|
| `merchant` | `Address` | The campaign owner |
| `reward_amount` | `i128` | LYT tokens awarded per claim (must be > 0) |
| `expiration` | `u64` | Unix timestamp when the campaign expires (must be in the future) |

Returns: `u64` — the new campaign's ID (auto-incremented from 1).  
Panics: `"reward_amount must be positive"` · `"expiration must be in the future"`

---

#### `set_active`

Activates or deactivates a campaign. Only the original merchant can call this.

| Argument | Type | Description |
|---|---|---|
| `campaign_id` | `u64` | ID of the campaign to update |
| `active` | `bool` | New active state |

Returns: nothing  
Panics: `"campaign not found"` · auth panic if caller is not the merchant.

---

#### `record_claim`

Increments `total_claimed` counter. Called internally by the Rewards contract.

| Argument | Type | Description |
|---|---|---|
| `campaign_id` | `u64` | ID of the campaign |

Returns: nothing  
Panics: `"campaign not found"` · overflow panic.

---

#### `get_campaign`

Returns the full `Campaign` struct for `campaign_id`.

| Argument | Type | Description |
|---|---|---|
| `campaign_id` | `u64` | ID of the campaign |

Returns: `Campaign`  
Panics: `"campaign not found"`

---

#### `is_active`

Returns `true` if the campaign's `active` flag is set **and** the current ledger time is before `expiration`.

| Argument | Type | Description |
|---|---|---|
| `campaign_id` | `u64` | ID of the campaign |

Returns: `bool`

---

### Events

| Topic tuple | Data | Description |
|---|---|---|
| `("CAM_CRT", "id", <id: u64>)` | `Address` merchant | Emitted when a campaign is created |
| `("CAM_UPD", "id", <id: u64>)` | `bool` active | Emitted when a campaign's active state changes |

---

### Error Codes

| Condition | Message | Function |
|---|---|---|
| Calling `initialize` twice | `"already initialized"` | `initialize` |
| Campaign does not exist | `"campaign not found"` | `get_campaign`, `set_active`, `record_claim`, `is_active` |
| Non-positive reward amount | `"reward_amount must be positive"` | `create_campaign` |
| Expiration not in the future | `"expiration must be in the future"` | `create_campaign` |

---

### CLI Examples

```bash
# Initialize
stellar contract invoke --id <CAMPAIGN_CONTRACT_ID> \
  -- initialize \
  --admin <ADMIN_ADDRESS>

# Create a campaign expiring in 30 days
EXPIRATION=$(date -d "+30 days" +%s)
stellar contract invoke --id <CAMPAIGN_CONTRACT_ID> \
  --source <MERCHANT_SECRET_KEY> \
  -- create_campaign \
  --merchant <MERCHANT_ADDRESS> \
  --reward-amount 500 \
  --expiration $EXPIRATION

# Get campaign details
stellar contract invoke --id <CAMPAIGN_CONTRACT_ID> \
  -- get_campaign \
  --campaign-id 1

# Deactivate a campaign
stellar contract invoke --id <CAMPAIGN_CONTRACT_ID> \
  --source <MERCHANT_SECRET_KEY> \
  -- set_active \
  --campaign-id 1 \
  --active false

# Check if campaign is currently claimable
stellar contract invoke --id <CAMPAIGN_CONTRACT_ID> \
  -- is_active \
  --campaign-id 1
```

---

## Rewards Contract (`soroban-loyalty-rewards`)

Handles claiming and redeeming rewards. Cross-calls both the Token and Campaign contracts. Double-claim prevention is enforced on-chain using persistent storage written **before** any external calls.

### Functions

#### `initialize`

Sets up the rewards contract with references to Token and Campaign contracts.

| Argument | Type | Description |
|---|---|---|
| `admin` | `Address` | Admin address |
| `token_contract` | `Address` | Deployed Token contract address |
| `campaign_contract` | `Address` | Deployed Campaign contract address |

Returns: nothing  
Panics: `"already initialized"`

---

#### `claim_reward`

Claims a reward for `user` from campaign `campaign_id`. Mints `reward_amount` LYT to `user`. Requires authorization from `user`.

| Argument | Type | Description |
|---|---|---|
| `user` | `Address` | Claimant's address |
| `campaign_id` | `u64` | ID of the campaign to claim from |

Returns: nothing  
Panics: `"already claimed"` · `"campaign not active"`

Flow:
1. Checks double-claim flag (panics if already claimed).
2. Verifies the campaign is active via `CampaignContract::is_active`.
3. Reads campaign to get `reward_amount`.
4. **Writes** the claimed flag to storage (reentrancy guard).
5. Calls `CampaignContract::record_claim`.
6. Calls `TokenContract::mint` to issue LYT.
7. Emits `RWD_CLM` event.

---

#### `redeem_reward`

Burns `amount` LYT from `user`, representing redemption of earned tokens. Requires authorization from `user`.

| Argument | Type | Description |
|---|---|---|
| `user` | `Address` | Redeemer's address |
| `amount` | `i128` | LYT to burn (must be > 0) |

Returns: nothing  
Panics: `"amount must be positive"` · `"insufficient balance"` (from Token contract)

---

#### `has_claimed_view`

Read-only check whether `user` has already claimed from `campaign_id`.

| Argument | Type | Description |
|---|---|---|
| `user` | `Address` | Address to check |
| `campaign_id` | `u64` | Campaign ID |

Returns: `bool`

---

### Events

| Topic tuple | Data | Description |
|---|---|---|
| `("RWD_CLM", "user", <user: Address>)` | `(u64 campaign_id, i128 reward_amount)` | Emitted when a reward is successfully claimed |
| `("RWD_RDM", "user", <user: Address>)` | `i128` amount | Emitted when LYT is redeemed (burned) |

---

### Error Codes

| Condition | Message | Function |
|---|---|---|
| Calling `initialize` twice | `"already initialized"` | `initialize` |
| User already claimed this campaign | `"already claimed"` | `claim_reward` |
| Campaign is inactive or expired | `"campaign not active"` | `claim_reward` |
| Non-positive redeem amount | `"amount must be positive"` | `redeem_reward` |
| Insufficient LYT balance | `"insufficient balance"` | `redeem_reward` (via Token) |

---

### CLI Examples

```bash
# Initialize
stellar contract invoke --id <REWARDS_CONTRACT_ID> \
  -- initialize \
  --admin <ADMIN_ADDRESS> \
  --token-contract <TOKEN_CONTRACT_ID> \
  --campaign-contract <CAMPAIGN_CONTRACT_ID>

# Claim a reward
stellar contract invoke --id <REWARDS_CONTRACT_ID> \
  --source <USER_SECRET_KEY> \
  -- claim_reward \
  --user <USER_ADDRESS> \
  --campaign-id 1

# Redeem (burn) LYT
stellar contract invoke --id <REWARDS_CONTRACT_ID> \
  --source <USER_SECRET_KEY> \
  -- redeem_reward \
  --user <USER_ADDRESS> \
  --amount 200

# Check if user has already claimed from a campaign
stellar contract invoke --id <REWARDS_CONTRACT_ID> \
  -- has_claimed_view \
  --user <USER_ADDRESS> \
  --campaign-id 1
```

---

## Cross-Contract Dependency Graph

```
RewardsContract
  ├── calls → TokenContract::mint       (on claim)
  ├── calls → TokenContract::burn       (on redeem)
  ├── calls → CampaignContract::is_active   (on claim)
  ├── calls → CampaignContract::get_campaign (on claim)
  └── calls → CampaignContract::record_claim (on claim)
```

The Token contract's admin must be set to the Rewards contract address after deployment (see `scripts/deploy-contracts.sh`).
