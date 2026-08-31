import { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getRecommendations } from "./data/recommendations";
import { getMarketInsights } from "./data/market";
import { askClaude } from "./utils/claude";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireAuth, requireRole } from "./middleware/auth";

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

const priceRecommendationSchema = z.object({
  crop: z.string().min(1),
  quantity: z.coerce.number().min(1),
  location: z.string().min(1),
  quality: z.string().min(1)
});

const matchSchema = z.object({
  listing: z.object({
    crop: z.string().min(1),
    quantity: z.coerce.number().min(1),
    quality: z.string().min(1),
    location: z.string().optional()
  }),
  company: z.object({
    name: z.string().min(1),
    requiredCrop: z.string().min(1),
    requiredQuantity: z.coerce.number().min(1),
    requiredQuality: z.string().min(1)
  })
});

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================
  // SECURE AUTHENTICATION (JWT)
  // ============================================
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid registration data",
        details: result.error.format(),
      });
    }

    const { name, password, role } = result.data;
    const email = result.data.email.toLowerCase();
    const jwtSecret = process.env.JWT_SECRET || "agrolynk_dev_secret_jwt_key";

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      if (db) {
        try {
          const [existingUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (existingUser) {
            return res.status(409).json({ error: "A user with that email already exists" });
          }

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
        } catch (dbErr) {
          console.warn("DB register failed, falling back to in-memory storage:", dbErr);
        }
      }

      // In-memory fallback
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "A user with that email already exists" });
      }

      const user = await storage.createUser({
        name,
        email,
        username: email,
        password: hashedPassword,
        role,
      });

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

    const email = result.data.email.toLowerCase();
    const password = result.data.password;
    const jwtSecret = process.env.JWT_SECRET || "agrolynk_dev_secret_jwt_key";

    try {
      let user: { id: number; password: string; role: string } | undefined;

      if (db) {
        try {
          const [dbUser] = await db
            .select({
              id: users.id,
              password: users.password,
              role: users.role,
            })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
          user = dbUser;
        } catch (dbErr) {
          console.warn("DB login lookup failed, trying in-memory storage:", dbErr);
        }
      }

      if (!user) {
        user = await storage.getUserByEmail(email);
      }

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

  // ============================================
  // FARMER BUY & SELL RECOMMENDATIONS
  // ============================================
  app.get("/api/farmer/buy", (req: Request, res: Response) => {
    try {
      const result = buyQuerySchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid query parameters", details: result.error.format() });
      }
      const { crop, location, farmSize } = result.data;
      return res.status(200).json(getRecommendations(crop, location, farmSize));
    } catch (error) {
      console.error("Error in /api/farmer/buy:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/farmer/sell", (req: Request, res: Response) => {
    try {
      const result = sellQuerySchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid query parameters", details: result.error.format() });
      }
      const { crop, location, quantity } = result.data;
      return res.status(200).json(getMarketInsights(crop, location, quantity));
    } catch (error) {
      console.error("Error in /api/farmer/sell:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================
  // AI ROUTES (CLAUDE INTEGRATION)
  // ============================================
  app.post("/api/ai/price", async (req: Request, res: Response) => {
    try {
      const result = priceRecommendationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid listing data", details: result.error.format() });
      }

      const { crop, quantity, location, quality } = result.data;
      const prompt = `You are an agricultural marketplace assistant. Analyze this farmer listing and provide a reasonable selling price recommendation. Crop: ${crop}, Quantity: ${quantity} kg, Location: ${location}, Quality: ${quality}. Return ONLY valid JSON in this exact format: { "recommendedPrice": number, "priceRange": { "min": number, "max": number }, "reason": "short explanation" }`;
      
      const response = await askClaude(prompt);
      return res.status(200).json(JSON.parse(response));
    } catch (error) {
      console.error("Error in /api/ai/price:", error);
      return res.status(500).json({ error: "Failed to generate price recommendation" });
    }
  });

  app.post("/api/ai/match", async (req: Request, res: Response) => {
    try {
      const result = matchSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid match data", details: result.error.format() });
      }

      const { listing, company } = result.data;
      const prompt = `You are an agricultural marketplace matching assistant. Evaluate how suitable this farmer listing is for this company. FARMER LISTING: Crop: ${listing.crop}, Quantity: ${listing.quantity} kg, Quality: ${listing.quality}, Location: ${listing.location || "Not provided"}. COMPANY: Name: ${company.name}, Required Crop: ${company.requiredCrop}, Required Quantity: ${company.requiredQuantity} kg, Required Quality: ${company.requiredQuality}. Return ONLY valid JSON in this exact format: { "matchScore": number, "reasons": [ "reason 1", "reason 2", "reason 3" ], "summary": "short explanation" }. Match score must be between 0 and 100.`;
      
      const response = await askClaude(prompt);
      return res.status(200).json(JSON.parse(response));
    } catch (error) {
      console.error("Error in /api/ai/match:", error);
      return res.status(500).json({ error: "Failed to generate match explanation" });
    }
  });

  // ============================================
  // PROTECTED ROUTES DEMO
  // ============================================
  app.get("/api/user/me", requireAuth, (req: Request, res: Response) => {
    return res.status(200).json({ message: "Authenticated successfully", user: req.user });
  });

  app.get("/api/farmer/protected-summary", requireAuth, requireRole(["farmer"]), (req: Request, res: Response) => {
    return res.status(200).json({ message: "Welcome Farmer! You have access to this exclusive farmer resource.", user: req.user });
  });

  app.get("/api/market/trading-desk", requireAuth, requireRole(["farmer", "company"]), (req: Request, res: Response) => {
    return res.status(200).json({ message: "Access granted to trading desk.", user: req.user });
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}