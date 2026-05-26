import winston from "winston";

const REDACTED = "[REDACTED]";
const SENSITIVE_KEYS = /secret|key|token|password|authorization/i;

function redact(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) return obj;
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
      k,
      SENSITIVE_KEYS.test(k) ? REDACTED : redact(v),
    ])
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format((info) => ({ ...info, ...(info.meta ? { meta: redact(info.meta) } : {}) }))(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});
