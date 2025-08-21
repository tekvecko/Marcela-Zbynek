
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

export async function authenticateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!sessionToken) {
      return res.status(401).json({ message: "Chybí autentizační token." });
    }

    // Simple token validation - in production you'd want to store and validate these properly
    if (!sessionToken.startsWith('session_')) {
      return res.status(401).json({ message: "Neplatný autentizační token." });
    }

    // Extract user ID from token for basic user info
    const tokenParts = sessionToken.split('_');
    if (tokenParts.length >= 2) {
      const userId = tokenParts[1];
      
      try {
        // Try to get user from storage
        const user = await storage.getAuthUserById(userId);
        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          };
        } else {
          // Fallback for missing user - create a basic user object
          req.user = {
            id: userId,
            email: `user_${userId}@example.com`,
          };
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        // Fallback for errors
        req.user = {
          id: userId,
          email: `user_${userId}@example.com`,
        };
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Chyba při ověřování." });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!sessionToken) {
    return next();
  }

  // Try to authenticate but don't fail if it doesn't work
  authenticateUser(req, res, (error) => {
    // Continue regardless of auth success/failure
    next();
  });
}
