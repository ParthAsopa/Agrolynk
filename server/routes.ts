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
import { z } from "zod";

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

    // AI Price Recommendation
  app.post("/api/ai/price", async (req: Request, res: Response) => {
    try {
      const result = priceRecommendationSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Invalid listing data",
          details: result.error.format()
        });
      }

      const { crop, quantity, location, quality } = result.data;

      const prompt = `
You are an agricultural marketplace assistant.

Analyze this farmer listing and provide a reasonable
selling price recommendation.

Crop: ${crop}
Quantity: ${quantity} kg
Location: ${location}
Quality: ${quality}

Return ONLY valid JSON in this exact format:

{
  "recommendedPrice": number,
  "priceRange": {
    "min": number,
    "max": number
  },
  "reason": "short explanation"
}
`;

      const response = await askClaude(prompt);

      const recommendation = JSON.parse(response);

      return res.status(200).json(recommendation);
    } catch (error) {
      console.error("Error in /api/ai/price:", error);

      return res.status(500).json({
        error: "Failed to generate price recommendation"
      });
    }
  });

    // AI Company-Farmer Match Explanation
  app.post("/api/ai/match", async (req: Request, res: Response) => {
    try {
      const result = matchSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Invalid match data",
          details: result.error.format()
        });
      }

      const { listing, company } = result.data;

      const prompt = `
You are an agricultural marketplace matching assistant.

Evaluate how suitable this farmer listing is for this company.

FARMER LISTING:
Crop: ${listing.crop}
Quantity: ${listing.quantity} kg
Quality: ${listing.quality}
Location: ${listing.location || "Not provided"}

COMPANY:
Name: ${company.name}
Required Crop: ${company.requiredCrop}
Required Quantity: ${company.requiredQuantity} kg
Required Quality: ${company.requiredQuality}

Return ONLY valid JSON in this exact format:

{
  "matchScore": number,
  "reasons": [
    "reason 1",
    "reason 2",
    "reason 3"
  ],
  "summary": "short explanation"
}

Match score must be between 0 and 100.
`;

      const response = await askClaude(prompt);

      const matchResult = JSON.parse(response);

      return res.status(200).json(matchResult);
    } catch (error) {
      console.error("Error in /api/ai/match:", error);

      return res.status(500).json({
        error: "Failed to generate match explanation"
      });
    }
  });

  

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}