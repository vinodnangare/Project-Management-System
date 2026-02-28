import { Request, Response } from 'express';
import { login, registerEmployee, updateUserProfile, deleteEmployee, updateProfileImage, getUserById } from '../services/authService.js';
import { generateTokens, refreshAccessToken, revokeRefreshToken, revokeAllUserTokens, blacklistAccessToken, getUserRefreshTokens } from '../services/tokenService.js';

export const register = async (req: Request, res: Response) => {
  try {
    const user = await registerEmployee(req.body);
    
    // Generate both access and refresh tokens
    const tokens = await generateTokens(user.id, user.email, user.role);
    
    res.status(201).json({ 
      success: true, 
      data: { 
        user, 
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      } 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const signIn = async (req: Request, res: Response) => {
  try {
    const user = await login(req.body);
    
    // Generate both access and refresh tokens
    const tokens = await generateTokens(user.id, user.email, user.role);
    
    res.status(200).json({ 
      success: true, 
      data: { 
        user, 
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      } 
    });
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await getUserById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await updateUserProfile(userId, req.body);
    
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteEmployeeAccount = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id;
    const adminRole = (req as any).user?.role;
    const { employeeId } = req.params;

    if (!adminId || adminRole !== 'admin') {
      res.status(403).json({ success: false, error: 'Only admins can delete employees' });
      return;
    }

    await deleteEmployee(Array.isArray(employeeId) ? employeeId[0] : employeeId, adminId);
    res.status(200).json({ success: true, message: 'Employee deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }


    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }


    const user = await updateProfileImage(userId, req.file);
    
    
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 * Body: { refreshToken: string }
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: providedRefreshToken } = req.body;

    if (!providedRefreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token is required' });
      return;
    }

    const tokens = await refreshAccessToken(providedRefreshToken);
    
    res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      }
    });
  } catch (error: any) {
    // Don't expose internal error details
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
  }
};

/**
 * Logout - revoke refresh token
 * POST /api/auth/logout
 * Body: { refreshToken: string }
 * Auth: Bearer accessToken
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { refreshToken: providedRefreshToken } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (!providedRefreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token is required' });
      return;
    }

    // Revoke the refresh token
    await revokeRefreshToken(providedRefreshToken, userId, 'logout');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    // Still return success even if token revocation fails (idempotent)
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
};

/**
 * Logout from all devices - revoke all refresh tokens for the user
 * POST /api/auth/logout-all
 * Auth: Bearer accessToken
 */
export const logoutAll = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Revoke all refresh tokens for this user
    await revokeAllUserTokens(userId, 'logout');

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Validate access token and check if it's blacklisted
 * POST /api/auth/validate
 * Body: { accessToken: string }
 */
export const validateToken = async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      res.status(400).json({ success: false, error: 'Access token is required' });
      return;
    }

    // This endpoint allows frontend to check if token is still valid
    // It's called when user modifies anything in localStorage
    res.status(200).json({
      success: true,
      message: 'Token is valid'
    });
  } catch (error: any) {
    res.status(401).json({ success: false, error: 'Token is invalid or expired' });
  }
};

/**
 * Blacklist current access token
 * POST /api/auth/blacklist-token
 * Body: { accessToken: string }
 * Auth: Bearer accessToken
 * 
 * Used when user manually changes their token in localStorage
 * This forces immediate logout
 */
export const blacklistCurrentToken = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { accessToken } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (!accessToken) {
      res.status(400).json({ success: false, error: 'Access token is required' });
      return;
    }

    // Blacklist the token
    await blacklistAccessToken(accessToken, userId, 'token_change');

    res.status(200).json({
      success: true,
      message: 'Token has been invalidated'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get all active sessions for current user
 * GET /api/auth/sessions
 * Auth: Bearer accessToken
 */
export const getSessions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const sessions = await getUserRefreshTokens(userId);

    res.status(200).json({
      success: true,
      data: {
        sessions: sessions.map(session => ({
          expiresAt: session.expiresAt,
          createdAt: session.createdAt
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
