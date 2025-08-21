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
    return next();
  }

  // Try to authenticate but don't fail if it doesn't work
  // The authenticateUser function will handle setting req.user or not
  authenticateUser(req, res, () => {
    // Continue regardless of auth success/failure
    next();
  });
}


export async function authenticateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!sessionToken) {
      // If no token is provided, the user is not authenticated, but we don't necessarily fail.
      // This case is handled by optionalAuth, but if called directly without a token, we should proceed.
      req.user = undefined; // Explicitly set to undefined if no token
      return next();
    }

    // Assuming storage.getAuthSessionByToken and storage.getAuthUserById are correctly implemented
    const sessionData = await storage.getAuthSessionByToken(sessionToken);
    if (!sessionData) {
      req.user = undefined; // Session not found
      return next();
    }

    const user = await storage.getAuthUserById(sessionData.userId);
    if (!user) {
      req.user = undefined; // User not found for the session
      return next();
    }

    // Assign the found user to req.user
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    // On error, treat as unauthenticated
    req.user = undefined;
    // We should not send a response here if called via next() chain,
    // but if this is the primary auth for a route, it might need error handling.
    // For now, we proceed as if unauthenticated.
    next();
  }
}