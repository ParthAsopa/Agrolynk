import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUserPayload {
  userId: number;
  role: string;
  [key: string]: any;
}

// Augment Express Request interface to include the user payload
declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

/**
 * Middleware that extracts the JWT from the Authorization header,
 * verifies it using JWT_SECRET, and attaches the decoded payload (userId, role) to req.user.
 * Returns 401 if authentication fails.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization header with Bearer token is required" });
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return res.status(401).json({ error: "Bearer token is missing" });
  }

  const jwtSecret = process.env.JWT_SECRET || "agrolynk_dev_secret_jwt_key";

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthUserPayload;
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Factory function that accepts an array of allowed roles (e.g. ['farmer', 'company'])
 * and returns a middleware checking req.user.role.
 * Returns 403 if unauthorized.
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of the following roles: ${allowedRoles.join(", ")}`,
      });
    }

    return next();
  };
}
