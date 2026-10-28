import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';

export const authService = {
  /**
   * Generates a signed JWT token
   */
  generateToken(user: { id: string; role: string; name: string }): string {
    return jwt.sign(
      {
        id: user.id,
        role: user.role,
        name: user.name,
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  },

  /**
   * Customer / Staff registration with email and password
   */
  async registerWithEmail(data: { name: string; email?: string; phone: string; password: string }) {
    const existingPhone = await prisma.user.findUnique({
      where: { phone: data.phone },
    });
    if (existingPhone) {
      throw new AppError('An account with this phone number already exists.', 400);
    }

    if (data.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new AppError('An account with this email already exists.', 400);
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        passwordHash,
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    const token = this.generateToken(user);
    return { user, token };
  },

  /**
   * Login with email & password
   */
  async loginWithEmail(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (user.isBlocked) {
      throw new AppError('Your account has been deactivated. Please contact store support.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = this.generateToken(user);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    };
  },

  /**
   * Request OTP for phone login (Mock/Extensible SMS Gateway)
   */
  async requestPhoneOtp(phone: string) {
    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 8);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Store in OtpVerification
    await prisma.otpVerification.create({
      data: {
        phone,
        otpHash,
        expiresAt,
      },
    });

    // In development or when SMS gateway not configured, log OTP clearly
    logger.info(`[SMS GATEWAY OTP DISPATCH] Phone: ${phone} | OTP: ${otp} (valid for 5 mins)`);

    return {
      message: 'OTP sent successfully to your mobile number.',
      // For local testing convenience in dev, include otp:
      ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
    };
  },

  /**
   * Verify phone OTP and authenticate or auto-register customer
   */
  async verifyPhoneOtp(phone: string, otp: string, customerName?: string) {
    const record = await prisma.otpVerification.findFirst({
      where: {
        phone,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new AppError('Invalid or expired OTP. Please request a new one.', 400);
    }

    const isMatch = await bcrypt.compare(otp, record.otpHash);
    if (!isMatch) {
      throw new AppError('Incorrect OTP entered.', 400);
    }

    // Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { isUsed: true },
    });

    // Find or create customer
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    if (user && user.isBlocked) {
      throw new AppError('Your account has been deactivated. Please contact store management.', 403);
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          name: customerName || `Customer ${phone.slice(-4)}`,
          role: 'CUSTOMER',
          isPhoneVerified: true,
        },
      });
    } else if (!user.isPhoneVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isPhoneVerified: true },
      });
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    };
  },
};
