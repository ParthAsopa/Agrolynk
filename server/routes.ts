import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getRecommendations } from "./data/recommendations";
import { getMarketInsights } from "./data/market";
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

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  
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
