import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import prisma from './config/prisma';
import { initSocketIO } from './socket';

const app = createApp();
const server = http.createServer(app);

// Initialize real-time Socket.IO server
const io = initSocketIO(server);

server.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`FreshCart REST API & Socket.IO Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`Swagger API Documentation available at http://localhost:${env.PORT}/api-docs`);
  logger.info(`Real-Time WebSocket Engine active with rooms: 'admins', 'user:{id}', 'order:{id}'`);
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received. Closing HTTP/Socket server and DB connections...');
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('HTTP server, Socket.IO and Prisma disconnected cleanly.');
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

export { server, io };
