import { Router, Request, Response } from "express";
import { z } from "zod";
import { queryAuditLogs, AuditAction } from "../services/audit.service";
import { asyncHandler } from "../middleware/errorHandler";
import { validateQuery } from "../middleware/validation";

export const adminRouter = Router();

// Validation schema for audit logs query
const AuditLogsQuerySchema = z.object({
  limit: z.string().optional().transform(val => Math.min(parseInt(val || "50", 10) || 50, 200)),
  offset: z.string().optional().transform(val => parseInt(val || "0", 10) || 0),
  actor: z.string().optional(),
  action: z.string().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  since: z.string().optional().transform(val => val ? new Date(val) : undefined),
  until: z.string().optional().transform(val => val ? new Date(val) : undefined)
});

/**
 * GET /admin/audit-logs
 * Query params: actor, action, entity_type, entity_id, since, until, limit, offset
 */
adminRouter.get("/audit-logs", validateQuery(AuditLogsQuerySchema), asyncHandler(async (req: Request, res: Response) => {
  const { limit, offset, actor, action, entity_type, entity_id, since, until } = req.query as any;

  const result = await queryAuditLogs({
    actor,
    action: action as AuditAction,
    entity_type,
    entity_id,
    since,
    until,
    limit,
    offset,
  });

  res.json(result);
}));
