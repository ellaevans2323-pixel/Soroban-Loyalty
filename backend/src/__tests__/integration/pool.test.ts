import { Pool } from "pg";
import { setupIntegrationDatabase, teardownIntegrationDatabase } from "./testDb";

const TEST_DB_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL!;

describe("connection pool behavior", () => {
  beforeAll(async () => {
    await setupIntegrationDatabase();
  });

  afterAll(async () => {
    await teardownIntegrationDatabase();
  });

  it("handles concurrent queries without exhausting a small pool", async () => {
    const pool = new Pool({ connectionString: TEST_DB_URL, max: 3, connectionTimeoutMillis: 5000 });

    try {
      // 10 concurrent queries against a pool of 3 — all should resolve
      const results = await Promise.all(
        Array.from({ length: 10 }, () => pool.query("SELECT 1 AS n"))
      );

      expect(results).toHaveLength(10);
      results.forEach((r) => expect(r.rows[0].n).toBe(1));
    } finally {
      await pool.end();
    }
  });

  it("throws when connection timeout is exceeded", async () => {
    // Pool of 1 with a 1 ms timeout — second concurrent query must time out
    const pool = new Pool({ connectionString: TEST_DB_URL, max: 1, connectionTimeoutMillis: 1 });

    const client = await pool.connect(); // hold the only connection
    try {
      await expect(pool.connect()).rejects.toThrow(/timeout/i);
    } finally {
      client.release();
      await pool.end();
    }
  });

  it("exposes accurate pool stats (totalCount, idleCount, waitingCount)", async () => {
    const pool = new Pool({ connectionString: TEST_DB_URL, max: 5 });

    try {
      expect(pool.totalCount).toBe(0);
      expect(pool.idleCount).toBe(0);

      const client = await pool.connect();
      expect(pool.totalCount).toBe(1);
      expect(pool.idleCount).toBe(0);

      client.release();
      expect(pool.idleCount).toBe(1);
    } finally {
      await pool.end();
    }
  });
});
