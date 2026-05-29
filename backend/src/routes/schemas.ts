import { z } from "zod";

/**
 * Common validation schemas used across multiple routes
 */

export const StellarAddressSchema = z.object({
  address: z.string().length(56, "Stellar address must be 56 characters")
});

export const IdParamsSchema = z.object({
  id: z.string().transform(val => {
    const num = parseInt(val, 10);
    if (isNaN(num)) throw new Error("Invalid ID");
    return num;
  })
});

export const PaginationQuerySchema = z.object({
  limit: z.string().optional().transform(val => parseInt(val || "20", 10) || 20),
  offset: z.string().optional().transform(val => parseInt(val || "0", 10) || 0)
});
