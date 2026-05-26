import { Router, Request, Response } from "express";
import { z } from "zod";
import { getCampaigns, getCampaignById, upsertCampaign } from "../services/campaign.service";
import { sanitizeBody } from "../middleware/sanitize";

export const campaignRouter = Router();

const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  reward_amount: z.number().int().positive(),
  expiration: z.number().int().positive(),
  merchant: z.string().length(56),
});

campaignRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const campaigns = await getCampaigns();
    res.json({ campaigns });
  } catch {
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

campaignRouter.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const campaign = await getCampaignById(id);
    if (!campaign) return res.status(404).json({ error: "Not found" });
    res.json({ campaign });
  } catch {
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});

campaignRouter.post("/", sanitizeBody, async (req: Request, res: Response) => {
  const parsed = CreateCampaignSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const { name: _name, description: _desc, ...rest } = parsed.data;
    await upsertCampaign({ ...rest, id: Date.now(), active: true, total_claimed: 0 });
    res.status(201).json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to create campaign" });
  }
});
