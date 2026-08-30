import { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getRecommendations } from "./data/recommendations";
import { getMarketInsights } from "./data/market";

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

export async function registerRoutes(app: Express): Promise<Server> {

  // ============================================
  // LOGIN
  // ============================================

  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          error: "Username and password are required"
        });
      }

      const result = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (result.length === 0) {
        return res.status(401).json({
          error: "Invalid username or password"
        });
      }

      const user = result[0];

      if (user.password !== password) {
        return res.status(401).json({
          error: "Invalid username or password"
        });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });

    } catch (error) {
      console.error("Login error:", error);

      return res.status(500).json({
        error: "Internal server error"
      });
    }
  });


  // ============================================
  // FARMER BUY RECOMMENDATIONS
  // ============================================

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

      const recommendations = getRecommendations(
        crop,
        location,
        farmSize
      );

      return res.status(200).json(recommendations);

    } catch (error) {
      console.error("Error in /api/farmer/buy:", error);

      return res.status(500).json({
        error: "Internal server error"
      });
    }
  });


  // ============================================
  // FARMER SELL MARKET INSIGHTS
  // ============================================

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

      const marketInsights = getMarketInsights(
        crop,
        location,
        quantity
      );

      return res.status(200).json(marketInsights);

    } catch (error) {
      console.error("Error in /api/farmer/sell:", error);

      return res.status(500).json({
        error: "Internal server error"
      });
    }
  });


  // ============================================
  // CREATE HTTP SERVER
  // ============================================

  const httpServer = createServer(app);

  return httpServer;
}