import express, { type Express } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { authRouter } from './routes/auth.routes';
import { chatRouter } from './routes/chat.routes';

/**
 * Factory function — creates and configures the Express app without starting the server.
 * This separation makes the app easily testable with supertest.
 */
export function createApp(): Express {
  const app = express();

  // ── CORS: allow Chrome extension origins ────────────────────────────────────
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      methods: ['GET', 'POST'],
    })
  );

  // ── Body parsing ─────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));

  // ── Request logging ───────────────────────────────────────────────────────────
  app.use(requestLoggerMiddleware);

  // ── Routes ────────────────────────────────────────────────────────────────────
  app.use('/api/auth', authRouter);
  app.use('/api/chat', chatRouter);

  // ── Health check ──────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
  });

  // ── 404 handler ───────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // ── Centralized error handler (must be last) ──────────────────────────────────
  app.use(errorMiddleware);

  return app;
}
