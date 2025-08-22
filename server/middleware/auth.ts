import { storage } from "../storage";
import { verifyToken, JwtPayload } from "../utils/jwt";
import type { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isAdmin?: boolean;
  };
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    // No token provided, continue as unauthenticated
    req.user = undefined;
    return next();
  }

  // Verify JWT token
  const payload = verifyToken(token);
  if (!payload) {
    req.user = undefined;
    return next();
  }

  try {
    // Try to get user from storage to get current info, but don't fail if it doesn't work
    const user = await storage.getAuthUserById(payload.userId);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email || '',
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        isAdmin: user.isAdmin || false,
      };
    } else {
      // User not found in storage, but token is valid - create minimal user info
      req.user = {
        id: payload.userId,
        email: payload.email || '',
        isAdmin: payload.isAdmin || false,
      };
    }
  } catch (error) {
    console.error('Optional auth error:', error);
    // On error, treat as unauthenticated
    req.user = undefined;
  }
  
  next();
}


export async function authenticateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify JWT token
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    try {
      const user = await storage.getAuthUserById(payload.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = {
        id: user.id,
        email: user.email || '',
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        isAdmin: user.isAdmin || false,
      };

      next();
    } catch (dbError) {
      console.error('Database error during authentication:', dbError);
      return res.status(500).json({ message: "Authentication failed" });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: "Authentication failed" });
  }
}

// Middleware to require admin privileges
export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  // First authenticate the user
  await authenticateUser(req, res, () => {
    // Check if user is admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin privileges required" });
    }
    next();
  });
}