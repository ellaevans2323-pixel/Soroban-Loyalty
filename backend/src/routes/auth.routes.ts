import { Router } from "express";
import { z } from "zod";
import { challengeHandler, verifyHandler } from "../auth";
import { validateBody } from "../middleware/validation";
import { asyncHandler } from "../middleware/errorHandler";

export const authRouter = Router();

// Validation schemas
const ChallengeSchema = z.object({
  publicKey: z.string().length(56, "Stellar public key must be 56 characters")
});

const VerifySchema = z.object({
  publicKey: z.string().length(56, "Stellar public key must be 56 characters"),
  signature: z.string().min(1, "Signature is required")
});

authRouter.post("/challenge", validateBody(ChallengeSchema), asyncHandler(challengeHandler));
authRouter.post("/verify", validateBody(VerifySchema), asyncHandler(verifyHandler));
