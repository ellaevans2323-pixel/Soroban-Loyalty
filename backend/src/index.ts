import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { campaignRouter } from "./routes/campaign.routes";
import { rewardRouter } from "./routes/reward.routes";
import { startIndexer } from "./indexer/indexer";
import { logger } from "./logger";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// HTTP request/response logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info("http", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Date.now() - start,
    });
  });
  next();
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/campaigns", campaignRouter);
app.use("/", rewardRouter);

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, async () => {
  logger.info(`server listening on port ${PORT}`);
  if (process.env.ENABLE_INDEXER !== "false") {
    await startIndexer();
  }
});

export default app;
