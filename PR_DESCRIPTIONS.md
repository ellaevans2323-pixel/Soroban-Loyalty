# Pull Request Descriptions

---

## PR: Redeem Flow UI

**Branch:** `feat/redeem-flow-38`

### What
Adds a full LYT redemption flow accessible from the dashboard.

### Changes
- `RedeemForm.tsx` — balance display, amount input, client-side validation, two-step burn confirmation
- `dashboard/page.tsx` — integrates `RedeemForm`, computes live `lytBalance` from unredeemed rewards

### Acceptance Criteria
- [x] Redeem form accessible from dashboard
- [x] Current LYT balance displayed above amount input
- [x] Amount validated against balance (client-side)
- [x] Confirmation step shows amount to be burned
- [x] Transaction submitted via Freighter
- [x] Balance updates after successful redemption

Closes #38

---

## PR: Frontend Unit Tests

**Branch:** `feat/frontend-tests-43`

### What
Configures Jest + React Testing Library and adds unit tests for all key components and context.

### Changes
- `jest.config.js` + `jest.setup.ts` — Jest configured with ts-jest and jsdom
- `__mocks__/freighter.ts` + `__mocks__/stellar-sdk.ts` — module mocks
- Fixed package name `@freighter-api/freighter-api` → `@stellar/freighter-api`
- Exported `WalletContext` for test injection
- 5 test suites, 28 tests: `WalletConnector`, `CampaignCard`, `RewardList`, `RedeemForm`, `WalletContext`

### Acceptance Criteria
- [x] Jest and React Testing Library configured
- [x] Tests for `WalletConnector`, `CampaignCard`, `RewardList` components
- [x] Tests for all form validation logic (`RedeemForm`)
- [x] Tests for `WalletContext` state transitions

Closes #43

---

## PR: Campaign Data Table

**Branch:** `feat/campaign-table-51`

### What
Replaces the merchant campaign card grid with a structured data table for managing campaigns at scale.

### Changes
- `CampaignTable.tsx` — sortable columns, search filter, 20-row pagination, inline deactivate with confirmation
- `merchant/page.tsx` — swaps card grid for `CampaignTable`

### Acceptance Criteria
- [x] Columns: ID, reward amount, claims, expiry, status, actions
- [x] Sortable columns (click header to toggle asc/desc)
- [x] Search/filter by campaign name or ID
- [x] Inline deactivate with confirm/cancel step
- [x] Pagination at 20 rows per page
- [x] Horizontal scroll on mobile via `overflow-x: auto`

Closes #51

---

## PR: Claim Micro-Animation

**Branch:** `feat/claim-animation-52`

### What
Adds a confetti burst and animated LYT balance counter on successful reward claim.

### Changes
- `Confetti.tsx` — canvas particle burst (60 particles, gravity, fade-out, ~1.4s)
- `useCountUp.ts` — ease-out cubic counter hook (~1.2s duration)
- `CampaignCard.tsx` — renders `<Confetti>` and "✓ Claimed!" on successful claim
- `dashboard/page.tsx` — animated balance counter via `useCountUp`

### Acceptance Criteria
- [x] Confetti animation plays on successful claim
- [x] LYT balance counter animates from old to new value
- [x] Animation duration under 1.5 seconds
- [x] Respects `prefers-reduced-motion` (disabled if set)
- [x] Animation does not block UI interaction

Closes #52
