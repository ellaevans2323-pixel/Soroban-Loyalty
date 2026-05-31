import request from "supertest";
import { createApp } from "../../app";
import {
  setupIntegrationDatabase,
  teardownIntegrationDatabase,
  SEEDED_USER_ADDRESS,
} from "./testDb";
import { pool } from "../../db";

const VALID_ADDRESS = SEEDED_USER_ADDRESS; // G + 55 A's — seeded with one reward
const OTHER_ADDRESS = `G${"B".repeat(55)}`;
const INVALID_ADDRESS = "not-a-stellar-address";
const SHORT_ADDRESS = "GABC123";

describe("Rewards API integration tests", () => {
  const app = createApp();

  beforeAll(async () => {
    await setupIntegrationDatabase();
  });

  afterAll(async () => {
    await teardownIntegrationDatabase();
    await pool.end();
  });

  // ─── 200 with paginated rewards ────────────────────────────────────────────

  describe("GET /user/:address/rewards — 200 responses", () => {
    it("returns 200 with rewards array for a known address", async () => {
      const res = await request(app).get(`/user/${VALID_ADDRESS}/rewards`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("rewards");
      expect(Array.isArray(res.body.rewards)).toBe(true);
      expect(res.body.rewards.length).toBeGreaterThan(0);
    });

    it("returns reward objects with expected fields", async () => {
      const res = await request(app).get(`/user/${VALID_ADDRESS}/rewards`);

      expect(res.status).toBe(200);
      const reward = res.body.rewards[0];
      expect(reward).toHaveProperty("id");
      expect(reward).toHaveProperty("user_address");
      expect(reward).toHaveProperty("campaign_id");
      expect(reward).toHaveProperty("amount");
      expect(reward).toHaveProperty("redeemed");
    });

    it("returns 200 with empty array for address with no rewards", async () => {
      const res = await request(app).get(`/user/${OTHER_ADDRESS}/rewards`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("rewards");
      expect(res.body.rewards).toHaveLength(0);
    });
  });

  // ─── 400 for invalid address ────────────────────────────────────────────────

  describe("GET /user/:address/rewards — 400 for invalid address", () => {
    it("returns 400 for a non-Stellar address string", async () => {
      const res = await request(app).get(`/user/${INVALID_ADDRESS}/rewards`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("returns 400 for an address that is too short", async () => {
      const res = await request(app).get(`/user/${SHORT_ADDRESS}/rewards`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("returns 400 for an address starting with wrong letter", async () => {
      const res = await request(app).get(`/user/${"A".repeat(56)}/rewards`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("returns 400 for an address with invalid base32 characters", async () => {
      const res = await request(app).get(`/user/G${"0".repeat(55)}/rewards`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  // ─── Pagination ─────────────────────────────────────────────────────────────

  describe("GET /user/:address/rewards — pagination", () => {
    const PAGINATED_ADDRESS = `G${"C".repeat(55)}`;

    beforeAll(async () => {
      // Insert user and 5 rewards across 2 campaigns to test pagination
      await pool.query(`INSERT INTO users (address) VALUES ($1) ON CONFLICT DO NOTHING`, [
        PAGINATED_ADDRESS,
      ]);

      // Need 5 distinct campaigns for 5 rewards (unique constraint on user+campaign)
      for (let i = 10; i <= 14; i++) {
        await pool.query(
          `INSERT INTO campaigns (id, merchant, name, reward_amount, expiration, active, total_claimed, display_order)
           VALUES ($1, $2, $3, 50, 1999999999, TRUE, 0, $1)
           ON CONFLICT (id) DO NOTHING`,
          [i, PAGINATED_ADDRESS, `Pagination Campaign ${i}`]
        );
        await pool.query(
          `INSERT INTO rewards (user_address, campaign_id, amount, redeemed, redeemed_amount)
           VALUES ($1, $2, 50, FALSE, 0)
           ON CONFLICT (user_address, campaign_id) DO NOTHING`,
          [PAGINATED_ADDRESS, i]
        );
      }
    });

    it("returns all rewards without pagination params", async () => {
      const res = await request(app).get(`/user/${PAGINATED_ADDRESS}/rewards`);

      expect(res.status).toBe(200);
      expect(res.body.rewards.length).toBe(5);
    });

    it("respects limit query param", async () => {
      const res = await request(app).get(
        `/user/${PAGINATED_ADDRESS}/rewards?limit=2`
      );

      expect(res.status).toBe(200);
      expect(res.body.rewards.length).toBeLessThanOrEqual(2);
    });

    it("returns second page with offset", async () => {
      const page1 = await request(app).get(
        `/user/${PAGINATED_ADDRESS}/rewards?limit=2&offset=0`
      );
      const page2 = await request(app).get(
        `/user/${PAGINATED_ADDRESS}/rewards?limit=2&offset=2`
      );

      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);

      const ids1 = page1.body.rewards.map((r: any) => r.id);
      const ids2 = page2.body.rewards.map((r: any) => r.id);

      // Pages must not overlap
      const overlap = ids1.filter((id: string) => ids2.includes(id));
      expect(overlap).toHaveLength(0);
    });

    it("returns empty array when offset exceeds total rewards", async () => {
      const res = await request(app).get(
        `/user/${PAGINATED_ADDRESS}/rewards?limit=10&offset=100`
      );

      expect(res.status).toBe(200);
      expect(res.body.rewards).toHaveLength(0);
    });
  });

  // ─── Database reset between runs ────────────────────────────────────────────

  describe("Database isolation", () => {
    it("reflects newly inserted rewards immediately", async () => {
      const FRESH_ADDRESS = `G${"D".repeat(55)}`;

      // Confirm no rewards before insert
      const before = await request(app).get(`/user/${FRESH_ADDRESS}/rewards`);
      expect(before.status).toBe(200);
      expect(before.body.rewards).toHaveLength(0);

      // Insert user + campaign + reward directly
      await pool.query(
        `INSERT INTO users (address) VALUES ($1) ON CONFLICT DO NOTHING`,
        [FRESH_ADDRESS]
      );
      await pool.query(
        `INSERT INTO campaigns (id, merchant, name, reward_amount, expiration, active, total_claimed, display_order)
         VALUES (20, $1, 'Fresh Campaign', 75, 1999999999, TRUE, 0, 20)
         ON CONFLICT (id) DO NOTHING`,
        [FRESH_ADDRESS]
      );
      await pool.query(
        `INSERT INTO rewards (user_address, campaign_id, amount, redeemed, redeemed_amount)
         VALUES ($1, 20, 75, FALSE, 0)`,
        [FRESH_ADDRESS]
      );

      const after = await request(app).get(`/user/${FRESH_ADDRESS}/rewards`);
      expect(after.status).toBe(200);
      expect(after.body.rewards).toHaveLength(1);
      expect(after.body.rewards[0].amount).toBe(75);
    });
  });
});
