import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { apiRateLimiter } from './middlewares/rateLimiter.middleware';
import { setupSwagger } from './config/swagger';
import { env } from './config/env';

export function createApp(): Express {
  const app = express();

  // Hide server version banners
  app.disable('x-powered-by');

  // Security HTTP headers (HSTS, X-Content-Type-Options, Frameguard, Referrer-Policy)
  app.use(helmet({
    contentSecurityPolicy: false, // Allows Swagger UI and embedded previews while keeping strict transport headers
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'sameorigin',
    },
    noSniff: true,
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
  }));

  // CORS configuration for storefront, admin portal, and driver portal
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, native requests)
        if (!origin) return callback(null, true);
        // Allow any localhost/127.0.0.1 on any port, local LAN IPs, or matching CORS_ORIGIN
        const configuredOrigins = (env.CORS_ORIGIN || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        if (
          process.env.NODE_ENV !== 'production' ||
          configuredOrigins.includes('*') ||
          configuredOrigins.includes(origin) ||
          /^http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin) ||
          /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin)
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
        'Pragma',
      ],
      exposedHeaders: ['Content-Disposition'],
    })
  );
  app.options('*', cors());

  // Request parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // HTTP Logger (Morgan in combined or dev format)
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Rate Limiting on general API
  app.use('/api', apiRateLimiter);
  app.use(apiRateLimiter);

  // Swagger Documentation
  setupSwagger(app);

  // Health check endpoint (for Render, uptime monitors, and load balancers)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'FreshCart API', timestamp: new Date().toISOString() });
  });
  app.get('/', (_req, res) => {
    res.json({ status: 'ok', service: 'FreshCart API', version: '1.0.1', docs: '/api-docs' });
  });

  // REST API Routes (mounted at both /api and root / to support any frontend URL configuration)
  app.use('/api', routes);
  app.use(routes);

  // Fallback 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Cannot ${req.method} ${req.originalUrl}. Route not found.`,
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp;

