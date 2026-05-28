import rateLimit from "express-rate-limit";

const windowMs = () =>
  Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);

/** Global limiter: 100 req/min per IP */
export const globalLimiter = rateLimit({
  windowMs: windowMs(),
  max: Number(process.env.RATE_LIMIT_GLOBAL_MAX ?? 100),
  standardHeaders: "draft-7", // Retry-After + RateLimit-* headers
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

/** Stricter limiter for the rewards endpoint: 20 req/min per IP */
export const rewardsLimiter = rateLimit({
  windowMs: windowMs(),
  max: Number(process.env.RATE_LIMIT_REWARDS_MAX ?? 20),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
