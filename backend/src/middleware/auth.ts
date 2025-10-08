import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { tokenRevocationService } from '../services/tokenRevocationService.js';
import { logger } from '../utils/logger.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if token has been revoked (for refresh tokens)
    // Note: Access tokens are short-lived (1h) so revocation check is optional
    // Uncomment below if you want to check access token revocation too
    // const isRevoked = await tokenRevocationService.isTokenRevoked(token);
    // if (isRevoked) {
    //   logger.warn('Attempted to use revoked access token');
    //   return res.status(401).json({ error: 'Token has been revoked' });
    // }

    const payload = verifyToken(token);

    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
