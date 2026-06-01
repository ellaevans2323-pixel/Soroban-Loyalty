import { Request, Response } from 'express';

/**
 * Catch-all 404 handler. Must be registered after all other route definitions.
 * Returns a JSON response so unmatched routes are consistent with the rest of the API.
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}
