import React, { createContext, useState, useEffect, useCallback } from "react";

export interface DecodedToken {
  userId: number;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  user: DecodedToken | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Decodes a JWT token without verifying the signature.
 * Only use for client-side role/userId extraction.
 * DO NOT trust the decoded values for security decisions on the backend.
 */
function decodeToken(token: string): DecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("Invalid token format");
      return null;
    }
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
}

/**
 * Checks if a token is expired.
 */
function isTokenExpired(token: DecodedToken): boolean {
  const now = Math.floor(Date.now() / 1000);
  return token.exp < now;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      const decoded = decodeToken(storedToken);
      if (decoded && !isTokenExpired(decoded)) {
        setToken(storedToken);
        setUser(decoded);
      } else {
        // Token is expired or invalid, clear it
        localStorage.removeItem("authToken");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newToken: string) => {
    const decoded = decodeToken(newToken);
    if (decoded && !isTokenExpired(decoded)) {
      localStorage.setItem("authToken", newToken);
      setToken(newToken);
      setUser(decoded);
    } else {
      console.error("Invalid or expired token");
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    token,
    isAuthenticated: !!token && !!user,
    user,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context.
 * Must be used within AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
