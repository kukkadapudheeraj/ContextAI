import type { Request, Response, NextFunction } from 'express';
import { logger } from '../logger/logger';

interface ApiError extends Error {
  statusCode?: number;
}

/**
 * Centralized error handler — must be registered last in Express.
 * Converts any thrown error into a consistent JSON response.
 */
export function errorMiddleware(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? 'Internal server error';

  logger.error({ err, statusCode }, message);

  res.status(statusCode).json({
    error: message,
    ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack }),
  });
}
