import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for Authentication & OTP routes
 * Spec: 5 attempts per 15 minutes per IP to prevent brute-force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication or OTP attempts. For security reasons, please try again after 15 minutes.',
  },
});

/**
 * Strict rate limiter for Checkout / Order creation
 * Spec: Limit orders per hour per IP/user to prevent automated checkout spam and inventory exhaustion
 */
export const orderRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Hourly order limit reached. Please wait before placing additional orders.',
  },
});

/**
 * Global API rate limiter for general routes
 * Spec: 100 requests per minute per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down and try again in a moment.',
  },
});

