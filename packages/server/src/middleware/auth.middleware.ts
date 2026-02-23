import type { Request, Response, NextFunction } from 'express';

/**
 * Validates that every chat request includes a non-empty token.
 * The token is a Google OAuth access token (Gemini) or API key (OpenAI/Claude).
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const { token, provider } = req.body as { token?: string; provider?: string };

  if (!provider) {
    res.status(400).json({ error: 'Missing required field: provider' });
    return;
  }

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    res.status(401).json({
      error: 'Missing or empty auth token. Connect your AI account in the extension popup.',
    });
    return;
  }

  next();
}
