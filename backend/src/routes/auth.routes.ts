import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware';
import {
  registerSchema,
  loginEmailSchema,
  requestOtpSchema,
  verifyOtpSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', authRateLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', authRateLimiter, validate({ body: loginEmailSchema }), authController.login);
router.post('/otp/request', authRateLimiter, validate({ body: requestOtpSchema }), authController.requestOtp);
router.post('/otp/verify', authRateLimiter, validate({ body: verifyOtpSchema }), authController.verifyOtp);
router.get('/me', authenticate, authController.getMe);

export default router;

