import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { randomBytes } from 'crypto';

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  familyId: string; // For token family tracking
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const generateRefreshToken = (payload: JwtPayload, familyId?: string): string => {
  // Generate a new family ID if not provided
  const tokenFamilyId = familyId || randomBytes(16).toString('hex');

  const refreshPayload: RefreshTokenPayload = {
    ...payload,
    familyId: tokenFamilyId,
  };

  return jwt.sign(refreshPayload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
};

// Backward compatibility - uses access token secret
export const verifyToken = (token: string): JwtPayload => {
  return verifyAccessToken(token);
};
