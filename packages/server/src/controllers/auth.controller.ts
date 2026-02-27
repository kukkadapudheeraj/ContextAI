import type { Request, Response, NextFunction } from 'express';

/**
 * Auth controller — placeholder endpoints for future server-side token management.
 * In the current architecture, tokens are managed by the extension (chrome.storage).
 * These endpoints exist to support future features (e.g., token refresh, server-side sessions).
 */

export async function connectHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Future: initiate OAuth flow server-side, return redirect URL
    res.json({ message: 'Auth is managed by the browser extension.' });
  } catch (err) {
    next(err);
  }
}

export async function statusHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json({ status: 'ok', message: 'Clarify server is running.' });
  } catch (err) {
    next(err);
  }
}

export async function disconnectHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json({ message: 'Disconnect managed by the browser extension.' });
  } catch (err) {
    next(err);
  }
}
