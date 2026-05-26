import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  getCampaigns,
  getCampaignById,
  reorderCampaigns,
  softDeleteCampaign,
  restoreCampaign,
  CampaignFilters,
} from "../services/campaign.service";
import { redisClient } from "../lib/redis";
import { logger } from "../logger";
import { asyncHandler } from "../middleware/errorHandler";
import { validateBody, validateParams, validateQuery } from "../middleware/validation";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { IdParamsSchema } from "./schemas";

export const campaignRouter = Router();

// Route-specific validation schemas
const CampaignQuerySchema = z.object({
  limit: z.string().optional().transform(val => Math.min(parseInt(val || "20", 10) || 20, 100)),
  offset: z.string().optional().transform(val => parseInt(val || "0", 10) || 0),
  search: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  expires_before: z.string().optional().transform(val => {
    if (!val) return undefined;
    const num = parseInt(val, 10);
    return isNaN(num) ? undefined : num;
  }),
  expires_after: z.string().optional().transform(val => {
    if (!val) return undefined;
    const num = parseInt(val, 10);
    return isNaN(num) ? undefined : num;
  })
});

const ReorderSchema = z.object({
  order: z.array(z.number().int().positive()),
});

/**
 * @openapi
 * /campaigns:
 *   get:
 *     summary: List campaigns
 *     description: Returns a paginated, filterable list of campaigns.
 *     tags: [Campaigns]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of campaigns to return.
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of campaigns to skip.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive substring match on campaign name.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by campaign active status.
 *       - in: query
 *         name: expires_before
 *         schema:
 *           type: integer
 *         description: Return campaigns expiring at or before this unix timestamp.
 *       - in: query
 *         name: expires_after
 *         schema:
 *           type: integer
 *         description: Return campaigns expiring at or after this unix timestamp.
 *     responses:
 *       200:
 *         description: A list of campaigns.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 campaigns:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Campaign'
 *                 total:
 *                   type: integer
 *       400:
 *         description: Invalid query parameters.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
campaignRouter.get("/", validateQuery(CampaignQuerySchema), asyncHandler(async (req: Request, res: Response) => {
  const { limit, offset, search, status, expires_before, expires_after } = req.query as any;
  
  const cacheKey = `campaigns:list:${limit}:${offset}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.debug(`Cache hit for ${cacheKey}`);
      return res.json(JSON.parse(cached));
    }
  } catch (err) {
    logger.error("Redis cache read error", err as Error);
  }

  logger.debug(`Cache miss for ${cacheKey}`);
  
  const filters: CampaignFilters = {};
  if (search) filters.search = search;
  if (status) filters.status = status;
  if (expires_before) filters.expires_before = expires_before;
  if (expires_after) filters.expires_after = expires_after;

  const result = await getCampaigns(limit, offset, filters);
  
  try {
    await redisClient.setex(cacheKey, 30, JSON.stringify(result));
  } catch (err) {
    logger.error("Redis cache write error", err as Error);
  }

  res.json(result);
}));

/**
 * @openapi
 * /campaigns/{id}:
 *   get:
 *     summary: Get campaign by ID
 *     description: Returns a single campaign by its unique identifier.
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The campaign ID.
 *     responses:
 *       200:
 *         description: Campaign details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 campaign:
 *                   $ref: '#/components/schemas/Campaign'
 *       400:
 *         description: Invalid ID.
 *       404:
 *         description: Campaign not found.
 *       500:
 *         description: Server error.
 */
campaignRouter.get("/:id", validateParams(IdParamsSchema), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as any;
  const campaign = await getCampaignById(id);
  if (!campaign) {
    throw new NotFoundError("Campaign");
  }
  res.json({ campaign });
}));

/**
 * @openapi
 * /campaigns/reorder:
 *   patch:
 *     summary: Reorder campaigns
 *     description: Persists the display order of campaigns for a merchant.
 *     tags: [Campaigns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order
 *             properties:
 *               order:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of campaign IDs in the desired display order.
 *     responses:
 *       200:
 *         description: Reorder successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *       400:
 *         description: Invalid request body.
 *       500:
 *         description: Server error.
 */
campaignRouter.patch("/reorder", validateBody(ReorderSchema), asyncHandler(async (req: Request, res: Response) => {
  const { order } = req.body;
  await reorderCampaigns(order);
  res.json({ ok: true });
}));

/**
 * DELETE /campaigns/:id
 * Soft-deletes a campaign by setting deleted_at.
 */
campaignRouter.delete("/:id", validateParams(IdParamsSchema), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as any;
  const deleted = await softDeleteCampaign(id);
  if (!deleted) {
    throw new NotFoundError("Campaign");
  }
  res.json({ ok: true });
}));

/**
 * POST /campaigns/:id/restore
 * Restores a soft-deleted campaign.
 */
campaignRouter.post("/:id/restore", validateParams(IdParamsSchema), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as any;
  const restored = await restoreCampaign(id);
  if (!restored) {
    throw new NotFoundError("Campaign not found or not deleted");
  }
  res.json({ ok: true });
}));
