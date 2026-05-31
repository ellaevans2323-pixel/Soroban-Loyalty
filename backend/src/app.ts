import express from "express";
import cors from "cors";
import { campaignRouter } from "./routes/campaign.routes";
import { rewardRouter } from "./routes/reward.routes";
import { analyticsRouter } from "./routes/analytics.routes";
import { authRouter } from "./routes/auth.routes";
import { requireAuth } from "./auth";
import { rpcServer } from "./soroban";
import { pool } from "./db";
import {
  registry,
  httpRequestsTotal,
  httpRequestDuration,
  dbPoolActive,
  dbPoolIdle,
  dbPoolWaiting,
} from "./metrics";
import { requestLogger } from "./logger";
import { correlationMiddleware } from "./correlation";
import { globalLimiter, rewardsLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(correlationMiddleware);
  app.use(requestLogger);
  app.use(globalLimiter);

  app.use((req, res, next) => {
    const end = httpRequestDuration.startTimer();
    res.on("finish", () => {
      const route = req.route?.path ?? req.path;
      const labels = { method: req.method, route, status: String(res.statusCode) };
      httpRequestsTotal.inc(labels);
      end(labels);
    });
    next();
  });

  app.get("/metrics", async (_req, res) => {
    dbPoolActive.set(pool.totalCount - pool.idleCount);
    dbPoolIdle.set(pool.idleCount);
    dbPoolWaiting.set(pool.waitingCount);

    res.set("Content-Type", registry.contentType);
    res.end(await registry.metrics());
  });

  app.get("/health", async (_req, res) => {
    const HEALTH_CHECK_TIMEOUT_MS = 400;

    const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Health check timed out")), ms),
        ),
      ]);

    let db: "ok" | "error" = "error";
    let rpc: "ok" | "error" = "error";

    await Promise.all([
      (async () => {
        try {
          await withTimeout(pool.query("SELECT 1"), HEALTH_CHECK_TIMEOUT_MS);
          db = "ok";
        } catch { /* db stays error */ }
      })(),
      (async () => {
        try {
          await withTimeout(rpcServer.getHealth(), HEALTH_CHECK_TIMEOUT_MS);
          rpc = "ok";
        } catch { /* rpc stays error */ }
      })(),
    ]);

    const allHealthy = db === "ok" && rpc === "ok";
    res.status(allHealthy ? 200 : 503).json({ status: allHealthy ? "ok" : "error", db, rpc });
  });

  app.use("/campaigns", campaignRouter);
  app.use("/", rewardRouter);
  app.use("/analytics", analyticsRouter);
  app.use("/auth", authRouter);
  // Merchant mutation routes require JWT
  app.use("/merchant/campaigns", requireAuth, campaignRouter);

  app.use(errorHandler);

  return app;
}
