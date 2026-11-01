import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/prisma';

export interface AuthUser {
  id: string;
  role: 'OWNER' | 'STAFF' | 'CUSTOMER' | 'DELIVERY_PERSON' | string;
  email?: string | null;
  phone?: string | null;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access denied. No authentication token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; role: any };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, phone: true, role: true, isBlocked: true },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid token. User account does not exist.' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ success: false, message: 'Account is suspended. Please contact store management.' });
      return;
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Session expired or invalid token.' });
  }
}

export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; role: any };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, phone: true, role: true, isBlocked: true },
    });

    if (user && !user.isBlocked) {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      };
    }
  } catch {
    // Ignore invalid token for optional auth (e.g. guest mode)
  }
  next();
}

