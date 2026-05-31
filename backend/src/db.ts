import { Pool, PoolClient, PoolConfig } from "pg";
import dotenv from "dotenv";
import { logger } from "./logger";
import { env } from "./env";

dotenv.config();
const TEST_ENVIRONMENTS = new Set(["test", "integration"]);

function getPoolConfig(): PoolConfig {
  const isTestEnv = TEST_ENVIRONMENTS.has(process.env.NODE_ENV ?? "");
  const testUrl = process.env.TEST_DATABASE_URL;
  const defaultUrl = process.env.DATABASE_URL;
  const connectionString = isTestEnv && testUrl ? testUrl : defaultUrl;

  const poolOptions: PoolConfig = {
    max: env.DB_POOL_MAX ?? 10,
    min: env.DB_POOL_MIN ?? 2,
    idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT_MS ?? 30_000,
    connectionTimeoutMillis: env.DB_POOL_CONNECTION_TIMEOUT_MS ?? 5_000,
  };

  if (connectionString) {
    return { connectionString, ...poolOptions };
  }

  return {
    host: process.env.POSTGRES_HOST ?? "localhost",
    port: parseInt(process.env.POSTGRES_PORT ?? "5432", 10),
    user: process.env.POSTGRES_USER ?? "loyalty",
    password: process.env.POSTGRES_PASSWORD ?? "loyalty",
    database: process.env.POSTGRES_DB ?? "loyalty",
    ...poolOptions,
  };
}

export const pool = new Pool(getPoolConfig());

pool.on("error", (err) => {
  const message = err.message ?? "";
  if (message.includes("timeout") || message.includes("exhausted") || message.includes("no more")) {
    logger.error("DB pool exhausted or connection timeout", undefined, {
      error: message,
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    });
  } else {
    logger.critical("DB connection error", err);
  }
});

export async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}

export async function closeDb(): Promise<void> {
  await pool.end();
}

export async function withTransaction<T>(
  operation: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
