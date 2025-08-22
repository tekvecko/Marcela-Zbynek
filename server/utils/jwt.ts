import jwt from 'jsonwebtoken';

// Use a secure secret in production - this should be from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 days

export interface JwtPayload {
  userId: string;
  email: string;
  isAdmin?: boolean;
  iat?: number;
  exp?: number;
}

export function generateToken(payload: { userId: string; email: string; isAdmin?: boolean }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
}