import pinoHttp from 'pino-http';
import { logger } from '../logger/logger';

/** Logs every incoming request with method, URL, status code, and response time */
export const requestLoggerMiddleware = pinoHttp({ logger });
