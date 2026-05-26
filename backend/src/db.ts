import { Pool } from "pg";
import dotenv from "dotenv";
import { logger } from "./logger";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  logger.error("Unexpected DB pool error", { error: err.message });
});
