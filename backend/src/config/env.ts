import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/freshcart?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecret_jwt_key_change_in_production_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  STORE_NAME: process.env.STORE_NAME || 'FreshCart Supermarket',
  GSTIN: process.env.GSTIN || '29AAAAA0000A1Z5',
  FSSAI: process.env.FSSAI || '11223344556677',
  SUPPORT_PHONE: process.env.SUPPORT_PHONE || '+91 98765 43210',
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'support@freshcart.com',
  DEFAULT_INVOICE_PREFIX: process.env.DEFAULT_INVOICE_PREFIX || 'INV-',
};

