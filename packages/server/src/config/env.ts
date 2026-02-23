export const env = {
  PORT: parseInt(process.env['PORT'] ?? '3001', 10),
  /** Comma-separated list of allowed origins, e.g. chrome-extension://abc123 */
  CORS_ORIGIN: process.env['CORS_ORIGIN'] ?? '*',
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  LOG_LEVEL: process.env['LOG_LEVEL'] ?? 'info',
} as const;
