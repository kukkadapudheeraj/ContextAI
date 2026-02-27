import { createApp } from './app';
import { env } from './config/env';
import { logger } from './logger/logger';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`Clarify server running on http://localhost:${env.PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});
