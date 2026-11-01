import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for Authentication & OTP routes
 * Max 10 attempts per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login or OTP requests from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Strict rate limiter for Checkout / Order creation
 * Max 20 orders per 10 minutes per IP to prevent automated checkout spam
 */
export const orderRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many order attempts in a short timeframe. Please wait a few minutes.',
  },
});

/**
 * Standard API rate limiter for general routes
 * Max 200 requests per minute
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

