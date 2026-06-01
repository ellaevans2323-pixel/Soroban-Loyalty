import { Router, Request, Response } from "express";
import { z } from "zod";
import { getAnalytics, getCampaignAnalytics } from "../services/analytics.service";
import { asyncHandler } from "../middleware/errorHandler";
import { validateQuery } from "../middleware/validation";

export const analyticsRouter = Router();

// Validation schema for analytics query
const AnalyticsQuerySchema = z.object({
  days: z.string().optional().transform(val => Math.min(Math.max(parseInt(val || "30", 10) || 30, 1), 365))
});

/**
 * @openapi
 * /analytics:
 *   get:
 *     summary: Get platform analytics
 *     description: Returns aggregated statistics about claims and rewards over a specified period.
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Number of days to look back.
 *     responses:
 *       200:
 *         description: Analytics data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsData'
 *       500:
 *         description: Server error.
 */

analyticsRouter.get("/", validateQuery(AnalyticsQuerySchema), asyncHandler(async (req: Request, res: Response) => {
  const { days } = req.query as any;
  const data = await getAnalytics(days);
  res.json(data);
}));

/**
 * @openapi
 * /analytics/campaigns:
 *   get:
 *     summary: Get campaign analytics
 *     description: Returns total_campaigns, total_claims, claims_per_day (last 30 days), and top_campaigns (top 5). Cached in Redis for 5 minutes.
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Campaign analytics data.
 *       503:
 *         description: Database unavailable.
 */
analyticsRouter.get("/campaigns", asyncHandler(async (_req: Request, res: Response) => {
  try {
    const data = await getCampaignAnalytics();
    res.json(data);
  } catch {
    res.status(503).json({ error: "Database unavailable" });
  }
}));
