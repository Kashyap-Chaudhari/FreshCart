import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import prisma from './config/prisma';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`FreshCart REST API Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`Swagger API Documentation available at http://localhost:${env.PORT}/api-docs`);
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received. Closing HTTP server and DB connections...');
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('HTTP server and Prisma disconnected cleanly.');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received. Gracefully exiting...');
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Clean shutdown completed.');
    process.exit(0);
  });
});
