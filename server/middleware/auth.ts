
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
      return res.status(401).json({ message: "Přístup odepřen. Přihlaste se prosím." });
    }

    const session = await storage.getAuthSessionByToken(sessionToken);
    if (!session) {
      return res.status(401).json({ message: "Neplatná nebo vypršená relace." });
    }

    const user = await storage.getAuthUserById(session.userId);
    if (!user) {
      return res.status(401).json({ message: "Uživatel nenalezen." });
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
    };

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
