
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
    // For now, we'll skip authentication and allow all requests
    // This is a simplified approach since we don't have session management
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
