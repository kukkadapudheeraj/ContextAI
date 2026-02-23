import { vi } from 'vitest';

// Suppress pino logs during tests
vi.mock('../src/logger/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));

// pino-http deep-inspects real pino logger internals at init time.
// Replace the entire middleware with a no-op passthrough for tests.
vi.mock('../src/middleware/request-logger.middleware', () => ({
  requestLoggerMiddleware: (
    _req: unknown,
    _res: unknown,
    next: () => void
  ) => next(),
}));
