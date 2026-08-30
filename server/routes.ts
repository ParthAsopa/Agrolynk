import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getRecommendations } from "./data/recommendations";
import { getMarketInsights } from "./data/market";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";

// Validation schemas
const buyQuerySchema = z.object({
  crop: z.string().min(1),
  location: z.string().min(1),
  farmSize: z.coerce.number().min(1)
});

const sellQuerySchema = z.object({
  crop: z.string().min(1),
  location: z.string().min(1),
  quantity: z.coerce.number().min(1)
});

const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
  role: z.enum(["farmer", "company"]),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid registration data",
        details: result.error.format(),
      });
    }

    if (!db) {
      return res.status(503).json({ error: "Database is not configured" });
    }

    const { name, password, role } = result.data;
    const email = result.data.email.toLowerCase();
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({ error: "Authentication is not configured" });
    }

    try {
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        return res.status(409).json({ error: "A user with that email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const [user] = await db
        .insert(users)
        .values({
          name,
          email,
          password: hashedPassword,
          role,
          username: email,
        })
        .returning({ id: users.id, role: users.role });

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        jwtSecret,
        { expiresIn: "7d" },
      );

      return res.status(201).json({ token });
    } catch (error) {
      console.error("Error in /api/auth/register:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid login credentials",
        details: result.error.format(),
      });
    }

    if (!db) {
      return res.status(503).json({ error: "Database is not configured" });
    }

    const email = result.data.email.toLowerCase();
    const password = result.data.password;
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({ error: "Authentication is not configured" });
    }

    try {
      const [user] = await db
        .select({
          id: users.id,
          password: users.password,
          role: users.role,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        jwtSecret,
        { expiresIn: "7d" },
      );

      return res.status(200).json({ token });
    } catch (error) {
      console.error("Error in /api/auth/login:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Farmer Buy Recommendations
  app.get("/api/farmer/buy", (req: Request, res: Response) => {
    try {
      const result = buyQuerySchema.safeParse(req.query);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid query parameters",
          details: result.error.format() 
        });
      }
      
      const { crop, location, farmSize } = result.data;
      const recommendations = getRecommendations(crop, location, farmSize);
      
      return res.status(200).json(recommendations);
    } catch (error) {
      console.error("Error in /api/farmer/buy:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Farmer Sell Market Insights
  app.get("/api/farmer/sell", (req: Request, res: Response) => {
    try {
      const result = sellQuerySchema.safeParse(req.query);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid query parameters",
          details: result.error.format() 
        });
      }
      
      const { crop, location, quantity } = result.data;
      const marketInsights = getMarketInsights(crop, location, quantity);
      
      return res.status(200).json(marketInsights);
    } catch (error) {
      console.error("Error in /api/farmer/sell:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
