import { Router, Request, Response } from "express";
import { z } from "zod";
import { getTransactionsByUser } from "../services/transaction.service";
import { asyncHandler } from "../middleware/errorHandler";
import { validateParams, validateQuery } from "../middleware/validation";
import { StellarAddressSchema, PaginationQuerySchema } from "./schemas";

export const transactionRouter = Router();

/**
 * GET /user/:address/transactions
 * Returns paginated transaction history for a specific user.
 */
transactionRouter.get("/user/:address/transactions", 
  validateParams(StellarAddressSchema),
  validateQuery(PaginationQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params as any;
    const { limit, offset } = req.query as any;

    const data = await getTransactionsByUser(address, limit, offset);
    res.json(data);
  })
);
