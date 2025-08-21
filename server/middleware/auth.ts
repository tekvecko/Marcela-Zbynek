import { storage } from "../storage";
import type { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!sessionToken) {
    // No token provided, continue as unauthenticated
    req.user = undefined;
    return next();
  }

  // Simple token validation
  if (!sessionToken.startsWith('session_')) {
    req.user = undefined;
    return next();
  }

  // Extract user ID from token
  const tokenParts = sessionToken.split('_');
  if (tokenParts.length >= 2) {
    const userId = tokenParts[1];

    // Try to get user from storage, but don't fail if it doesn't work
    storage.getAuthUserById(userId)
      .then(user => {
        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          };
        } else {
          // Fallback for missing user
          req.user = {
            id: userId,
            email: `user_${userId}@example.com`,
          };
        }
        next();
      })
      .catch(error => {
        console.error('Optional auth error:', error);
        // On error, treat as unauthenticated
        req.user = undefined;
        next();
      });
  } else {
    req.user = undefined;
    next();
  }
}


export async function authenticateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!sessionToken) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Simple token validation - extract user ID from token
    if (!sessionToken.startsWith('session_')) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const tokenParts = sessionToken.split('_');
    if (tokenParts.length < 2) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const userId = tokenParts[1];
    
    try {
      const user = await storage.getAuthUserById(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
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