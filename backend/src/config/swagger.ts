import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'FreshCart Grocery Store REST API',
    version: '1.0.0',
    description:
      'Production-grade REST API for customer grocery ordering, inventory management, PDF billing, and admin control.',
    contact: {
      name: 'FreshCart Engineering',
      email: 'support@freshcart.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new customer account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'phone', 'password'],
                properties: {
                  name: { type: 'string', example: 'Aarav Sharma' },
                  email: { type: 'string', example: 'aarav@example.com' },
                  phone: { type: 'string', example: '9876543210' },
                  password: { type: 'string', example: 'Password123' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Registration successful' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login with email and password',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'owner@freshcart.com' },
                  password: { type: 'string', example: 'OwnerPass@2026' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Login successful' } },
      },
    },
    '/auth/otp/request': {
      post: {
        summary: 'Request 6-digit OTP for phone login',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone'],
                properties: { phone: { type: 'string', example: '9876543210' } },
              },
            },
          },
        },
        responses: { 200: { description: 'OTP dispatched' } },
      },
    },
    '/auth/otp/verify': {
      post: {
        summary: 'Verify OTP and authenticate',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone', 'otp'],
                properties: {
                  phone: { type: 'string', example: '9876543210' },
                  otp: { type: 'string', example: '123456' },
                  name: { type: 'string', example: 'Aarav Sharma' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Authenticated successfully' } },
      },
    },
    '/products': {
      get: {
        summary: 'List products with search and category filters',
        tags: ['Products'],
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'inStock', in: 'query', schema: { type: 'boolean' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Paginated product list' } },
      },
    },
    '/orders/checkout': {
      post: {
        summary: 'Transactional order creation with row locking and sequential invoice',
        tags: ['Orders'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customerName', 'customerPhone', 'shippingAddress', 'items'],
                properties: {
                  customerName: { type: 'string' },
                  customerPhone: { type: 'string' },
                  deliveryType: { type: 'string', enum: ['DELIVERY', 'PICKUP'], default: 'DELIVERY' },
                  deliverySlot: { type: 'string', example: 'Morning (8 AM - 11 AM)' },
                  couponCode: { type: 'string', example: 'FRESH15' },
                  shippingAddress: {
                    type: 'object',
                    properties: {
                      street: { type: 'string' },
                      city: { type: 'string' },
                      state: { type: 'string' },
                      pincode: { type: 'string', example: '560034' },
                    },
                  },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        productId: { type: 'string' },
                        quantity: { type: 'integer', minimum: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Order placed' } },
      },
    },
    '/orders/{id}/invoice': {
      get: {
        summary: 'Download auto-generated PDF tax invoice',
        tags: ['Invoices'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'PDF Document',
            content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
          },
        },
      },
    },
    '/admin/dashboard-summary': {
      get: {
        summary: 'Admin KPIs (Revenue, pending orders, low-stock count)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Dashboard metrics' } },
      },
    },
    '/reports/sales': {
      get: {
        summary: 'Aggregated sales reports (Day / Week / Month)',
        tags: ['Reports'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Sales report data' } },
      },
    },
  },
};

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

