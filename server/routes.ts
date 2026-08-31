import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { getRecommendations } from "./data/recommendations";
import { getMarketInsights } from "./data/market";
import { askGemini } from "./utils/claude";
import { z } from "zod";

// ================================
// Validation Schemas
// ================================

const buyQuerySchema = z.object({
  crop: z.string().min(1),
  location: z.string().min(1),
  farmSize: z.coerce.number().min(1),
});

const sellQuerySchema = z.object({
  crop: z.string().min(1),
  location: z.string().min(1),
  quantity: z.coerce.number().min(1),
});

const priceRecommendationSchema = z.object({
  crop: z.string().min(1),
  quantity: z.coerce.number().min(1),
  location: z.string().min(1),
  quality: z.string().min(1),
});

const matchSchema = z.object({
  listing: z.object({
    crop: z.string().min(1),
    quantity: z.coerce.number().min(1),
    quality: z.string().min(1),
    location: z.string().optional(),
  }),

  company: z.object({
    name: z.string().min(1),
    requiredCrop: z.string().min(1),
    requiredQuantity: z.coerce.number().min(1),
    requiredQuality: z.string().min(1),
  }),
});

// ================================
// Helper Function
// ================================

function cleanGeminiJson(response: string): string {
  let cleaned = response.trim();

  // Remove ```json and ``` if Gemini returns markdown
  cleaned = cleaned.replace(/```json/gi, "");
  cleaned = cleaned.replace(/```/g, "");

  cleaned = cleaned.trim();

  // Sometimes Gemini may return extra text before/after JSON.
  // Extract only the JSON object.
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

// ================================
// Register Routes
// ================================

export async function registerRoutes(app: Express): Promise<Server> {

  // ==========================================
  // Farmer Buy Recommendations
  // ==========================================

  app.get("/api/farmer/buy", (req: Request, res: Response) => {
    try {
      const result = buyQuerySchema.safeParse(req.query);

      if (!result.success) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: result.error.format(),
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
        error: "Internal server error",
      });
    }
  });

  // ==========================================
  // Farmer Sell Market Insights
  // ==========================================

  app.get("/api/farmer/sell", (req: Request, res: Response) => {
    try {
      const result = sellQuerySchema.safeParse(req.query);

      if (!result.success) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: result.error.format(),
        });
      }

      const {
        crop,
        location,
        quantity,
      } = result.data;

      const marketInsights = getMarketInsights(
        crop,
        location,
        quantity
      );

      return res.status(200).json(marketInsights);

    } catch (error) {
      console.error("Error in /api/farmer/sell:", error);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  });

  // ==========================================
  // AI Price Recommendation
  // ==========================================

  app.post("/api/ai/price", async (req: Request, res: Response) => {
    try {

      console.log("Received price request:", req.body);

      const result = priceRecommendationSchema.safeParse(req.body);

      if (!result.success) {
        console.error(
          "Invalid price request:",
          result.error.format()
        );

        return res.status(400).json({
          error: "Invalid listing data",
          details: result.error.format(),
        });
      }

      const {
        crop,
        quantity,
        location,
        quality,
      } = result.data;

      const prompt = `
You are an agricultural marketplace AI assistant.

Analyze the following farmer crop listing and recommend
a reasonable selling price.

Farmer Listing:

Crop: ${crop}
Quantity: ${quantity} quintals
Location: ${location}
Quality: ${quality}

Return ONLY valid JSON.

Do not use markdown.
Do not use code blocks.
Do not add any explanation outside the JSON.

Use exactly this format:

{
  "recommendedPrice": 29,
  "priceRange": {
    "min": 27,
    "max": 31
  },
  "reason": "Short explanation"
}

The recommendedPrice, min and max must be numbers.
The reason must be a short sentence.
`;

      console.log("Sending request to Gemini...");

      const response = await askGemini(prompt);

      console.log("Gemini raw response:", response);

      const cleanedResponse = cleanGeminiJson(response);

      console.log(
        "Gemini cleaned response:",
        cleanedResponse
      );

      let recommendation;

      try {
        recommendation = JSON.parse(cleanedResponse);
      } catch (parseError) {

        console.error(
          "Failed to parse Gemini price response:",
          parseError
        );

        console.error(
          "Response received from Gemini:",
          response
        );

        return res.status(500).json({
          error: "Gemini returned an invalid JSON response",
        });
      }

      return res.status(200).json(recommendation);

    } catch (error) {

      console.error(
        "Error in /api/ai/price:",
        error
      );

      return res.status(500).json({
        error: "Failed to generate price recommendation",
      });
    }
  });

  // ==========================================
  // AI Company-Farmer Match Explanation
  // ==========================================

  app.post("/api/ai/match", async (req: Request, res: Response) => {
    try {

      console.log("Received match request:", req.body);

      const result = matchSchema.safeParse(req.body);

      if (!result.success) {
        console.error(
          "Invalid match request:",
          result.error.format()
        );

        return res.status(400).json({
          error: "Invalid match data",
          details: result.error.format(),
        });
      }

      const {
        listing,
        company,
      } = result.data;

      const prompt = `
You are an agricultural marketplace AI matching assistant.

Evaluate how suitable the farmer listing is for the company.

FARMER LISTING:

Crop: ${listing.crop}
Quantity: ${listing.quantity} quintals
Quality: ${listing.quality}
Location: ${listing.location || "Not provided"}

COMPANY:

Company Name: ${company.name}
Required Crop: ${company.requiredCrop}
Required Quantity: ${company.requiredQuantity} quintals
Required Quality: ${company.requiredQuality}

Analyze:

1. Crop compatibility
2. Quantity compatibility
3. Quality compatibility
4. Location if available

Return ONLY valid JSON.

Do not use markdown.
Do not use code blocks.
Do not add any text outside the JSON.

Use exactly this format:

{
  "matchScore": 94,
  "reasons": [
    "Crop matches the company requirement",
    "Quantity is sufficient",
    "Quality matches the requirement"
  ],
  "summary": "This listing is a strong match based on crop, quantity and quality."
}

matchScore must be a number between 0 and 100.
reasons must contain exactly 3 short reasons.
summary must be a short explanation.
`;

      console.log("Sending match request to Gemini...");

      const response = await askGemini(prompt);

      console.log(
        "Gemini raw match response:",
        response
      );

      const cleanedResponse = cleanGeminiJson(response);

      console.log(
        "Gemini cleaned match response:",
        cleanedResponse
      );

      let matchResult;

      try {
        matchResult = JSON.parse(cleanedResponse);
      } catch (parseError) {

        console.error(
          "Failed to parse Gemini match response:",
          parseError
        );

        console.error(
          "Response received from Gemini:",
          response
        );

        return res.status(500).json({
          error: "Gemini returned an invalid JSON response",
        });
      }

      return res.status(200).json(matchResult);

    } catch (error) {

      console.error(
        "Error in /api/ai/match:",
        error
      );

      return res.status(500).json({
        error: "Failed to generate match explanation",
      });
    }
  });

  // ==========================================
  // Create HTTP Server
  // ==========================================

  const httpServer = createServer(app);

  return httpServer;
}