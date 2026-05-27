/**
 * Seeds the campaigns table with rows for GET /campaigns performance testing.
 *
 * Usage (from backend/):
 *   DATABASE_URL=postgresql://... npm run seed:perf
 *
 * Default: 1000 campaigns. Override with PERF_CAMPAIGN_COUNT.
 */
import dotenv from "dotenv";
import path from "path";
import { Pool } from "pg";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const COUNT = parseInt(process.env.PERF_CAMPAIGN_COUNT ?? "1000", 10);
const MERCHANT = process.env.PERF_MERCHANT ?? `G${"M".repeat(55)}`;
const BATCH_SIZE = 200;

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log(`Seeding ${COUNT} campaigns for merchant ${MERCHANT}...`);

    await client.query("BEGIN");
    await client.query(`
      TRUNCATE TABLE rewards, transactions, campaigns, users RESTART IDENTITY CASCADE
    `);
    await client.query(`INSERT INTO users (address) VALUES ($1) ON CONFLICT DO NOTHING`, [
      MERCHANT,
    ]);

    const expiration = Math.floor(Date.now() / 1000) + 86_400 * 365;
    let inserted = 0;

    while (inserted < COUNT) {
      const batch = Math.min(BATCH_SIZE, COUNT - inserted);
      const values: unknown[] = [];
      const placeholders: string[] = [];

      for (let i = 0; i < batch; i++) {
        const id = inserted + i + 1;
        const offset = values.length;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`
        );
        values.push(
          id,
          MERCHANT,
          `Perf Campaign ${id}`,
          100 + (id % 50),
          expiration,
          true,
          id % 10,
          id
        );
      }

      await client.query(
        `INSERT INTO campaigns (id, merchant, name, reward_amount, expiration, active, total_claimed, display_order)
         VALUES ${placeholders.join(", ")}`,
        values
      );
      inserted += batch;
      process.stdout.write(`\r  ${inserted}/${COUNT}`);
    }

    await client.query("COMMIT");
    console.log("\nDone.");

    const { rows } = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM campaigns WHERE deleted_at IS NULL`
    );
    console.log(`Campaigns in DB: ${rows[0].count}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
