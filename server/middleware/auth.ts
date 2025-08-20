
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

    // For now, we'll allow any valid-format session token
    // In production, you'd validate against a database or session store
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
