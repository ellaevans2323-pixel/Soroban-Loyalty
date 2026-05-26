import sanitizeHtml from "sanitize-html";
import { Request, Response, NextFunction } from "express";

/** Strip all HTML tags from string values in req.body (shallow). */
export function sanitizeBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === "object") {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === "string") {
        req.body[key] = sanitizeHtml(req.body[key], { allowedTags: [], allowedAttributes: {} });
      }
    }
  }
  next();
}
