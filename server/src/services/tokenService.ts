import jwt from 'jsonwebtoken';
import { RefreshToken, TokenBlacklist } from '../models/index.js';
import mongoose from 'mongoose';

export interface TokenPayload {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  type: 'access' | 'refresh';
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
}

const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Generate both access and refresh tokens
 */
export const generateTokens = async (
  userId: string,
  email: string,
  role: 'admin' | 'manager' | 'employee'
): Promise<TokenResponse> => {
  const accessTokenSecret = process.env.JWT_SECRET || 'dev-secret-change-me';
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-change-me';

  // Generate access token (short-lived)
  const accessToken = jwt.sign(
    { id: userId, email, role, type: 'access' },
    accessTokenSecret,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  // Generate refresh token (long-lived)
  const refreshToken = jwt.sign(
    { id: userId, email, role, type: 'refresh' },
    refreshTokenSecret,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  // Store refresh token in database
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
  
  await RefreshToken.create({
    userId: new mongoose.Types.ObjectId(userId),
    token: refreshToken,
    expiresAt,
    isRevoked: false
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60 // 15 minutes in seconds
  };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  const payload = jwt.verify(token, secret) as TokenPayload;
  
  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }
  
  return payload;
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  const secret = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-change-me';
  const payload = jwt.verify(token, secret) as TokenPayload;
  
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  
  return payload;
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<TokenResponse> => {
  // Verify refresh token signature
  let payload: TokenPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }

  // Check if token exists in database and is not revoked
  const storedToken = await RefreshToken.findOne({
    token: refreshToken,
    isRevoked: false
  });

  if (!storedToken) {
    throw new Error('Refresh token has been revoked or does not exist');
  }

  // Check if token is expired
  if (new Date() > storedToken.expiresAt) {
    throw new Error('Refresh token has expired');
  }

  // Check if token is blacklisted
  const isBlacklisted = await TokenBlacklist.findOne({ token: refreshToken });
  if (isBlacklisted) {
    throw new Error('Refresh token has been invalidated');
  }

  // Generate new tokens
  const tokens = await generateTokens(payload.id, payload.email, payload.role);
  
  return tokens;
};

/**
 * Logout - revoke refresh token
 */
export const revokeRefreshToken = async (refreshToken: string, userId: string, reason: string = 'logout'): Promise<void> => {
  // Revoke the refresh token
  await RefreshToken.updateOne(
    { token: refreshToken },
    { isRevoked: true }
  );

  // Add to blacklist for immediate invalidation
  try {
    const payload = verifyRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    
    await TokenBlacklist.create({
      token: refreshToken,
      expiresAt,
      userId: new mongoose.Types.ObjectId(userId),
      reason
    });
  } catch (error) {
    // Token might be already expired, but we still revoke it
    console.log('Could not verify token for blacklisting:', error);
  }
};

/**
 * Revoke all refresh tokens for a user (useful for logout everywhere)
 */
export const revokeAllUserTokens = async (userId: string, reason: string = 'logout'): Promise<void> => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  // Get all active refresh tokens for this user
  const tokens = await RefreshToken.find({
    userId: userObjectId,
    isRevoked: false
  });

  // Revoke all tokens
  await RefreshToken.updateMany(
    { userId: userObjectId, isRevoked: false },
    { isRevoked: true }
  );

  // Add all to blacklist
  const blacklistEntries = tokens.map(token => ({
    token: token.token,
    expiresAt: token.expiresAt,
    userId: userObjectId,
    reason
  }));

  if (blacklistEntries.length > 0) {
    await TokenBlacklist.insertMany(blacklistEntries);
  }
};

/**
 * Check if token is blacklisted
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const entry = await TokenBlacklist.findOne({ token });
  return !!entry;
};

/**
 * Blacklist an access token (for immediate invalidation on token change)
 */
export const blacklistAccessToken = async (
  token: string,
  userId: string,
  reason: string = 'token_change'
): Promise<void> => {
  try {
    const payload = verifyAccessToken(token);
    // Access tokens expire in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    await TokenBlacklist.create({
      token,
      expiresAt,
      userId: new mongoose.Types.ObjectId(userId),
      reason
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Get all active refresh tokens for a user
 */
export const getUserRefreshTokens = async (userId: string): Promise<any[]> => {
  return await RefreshToken.find({
    userId: new mongoose.Types.ObjectId(userId),
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).select('token expiresAt createdAt -_id');
};

/**
 * Cleanup expired tokens from database (can be run as a cron job)
 */
export const cleanupExpiredTokens = async (): Promise<{ deleted: number }> => {
  const result = await RefreshToken.deleteMany({
    expiresAt: { $lt: new Date() }
  });

  return { deleted: result.deletedCount };
};
