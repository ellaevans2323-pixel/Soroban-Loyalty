import { Router, Request, Response } from "express";
import { z } from "zod";
import { getTransactionsByUser } from "../services/transaction.service";
import { isValidStellarAddress } from "../utils/validation";
import { asyncHandler } from "../middleware/errorHandler";
import { validateParams, validateQuery } from "../middleware/validation";
import { BadRequestError } from "../utils/errors";

export const transactionRouter = Router();

const StellarAddressSchema = z.object({
  address: z.string().length(56),
});

const PaginationQuerySchema = z.object({
  limit: z.string().optional().transform(val => Math.min(Math.max(parseInt(val || "20", 10) || 20, 1), 100)),
  offset: z.string().optional().transform(val => Math.max(parseInt(val || "0", 10) || 0, 0)),
});

/**
 * GET /user/:address/transactions
 * Returns paginated transaction history for a specific user.
 */
transactionRouter.get("/user/:address/transactions", 
  asyncHandler(async (req: Request, res: Response) => {
    const address = String(req.params.address);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || "20"), 10) || 20, 1), 100);
    const offset = Math.max(parseInt(String(req.query.offset || "0"), 10) || 0, 0);

    if (!isValidStellarAddress(address)) {
      throw new BadRequestError("Invalid Stellar address", { address });
    }

    const data = await getTransactionsByUser(address, limit, offset);
    res.json(data);
  })
);
