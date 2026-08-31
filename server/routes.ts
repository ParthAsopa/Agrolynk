import { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getRecommendations } from "./data/recommendations";
import { getMarketInsights } from "./data/market";
import { askGemini } from "./utils/claude"; 
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireAuth, requireRole } from "./middleware/auth";

// ============================================
// VALIDATION SCHEMAS
// ============================================
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

const createCompanyProductSchema = z.object({
  companyId: z.coerce.number().int().positive(),
  category: z.enum(["seeds", "fertilizers", "pesticides", "instruments"]),
  name: z.string().min(3),
  price: z.coerce.number().positive(),
  quantity: z.coerce.number().positive(),
  description: z.string().min(10),
  manufacturer: z.string().nullable().optional(),
  specifications: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
});

const createCompanyOrderSchema = z.object({
  companyId: z.coerce.number().int().positive(),
  crop: z.string().min(1),
  quantity: z.coerce.number().min(10),
  gradeQuality: z.enum(["premium", "standard", "economy"]),
  totalCost: z.coerce.number().positive(),
});

const createListingSchema = z.object({
  farmerId: z.coerce.number().int().positive(),
  crop: z.string().min(1),
  wasteType: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
  location: z.string().min(1),
  price: z.coerce.number().positive(),
});

const createOfferSchema = z.object({
  listingId: z.coerce.number().int().positive(),
  companyId: z.coerce.number().int().positive(),
  offeredPrice: z.coerce.number().positive(),
  message: z.string().optional(),
});

const updateListingStatusSchema = z.object({
  status: z.enum(["active", "inactive", "sold"]),
});

const updateOfferStatusSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
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
  cleaned = cleaned.replace(/```json/gi, "");
  cleaned = cleaned.replace(/```/g, "");
  cleaned = cleaned.trim();

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
  // ============================================
  // SECURE AUTHENTICATION (JWT)
  // ============================================
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid registration data", details: result.error.format() });
    }
    const { name, password, role } = result.data;
    const email = result.data.email.toLowerCase();
    const jwtSecret = process.env.JWT_SECRET || "agrolynk_dev_secret_jwt_key";
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      if (db) {
        try {
          const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
          if (existingUser) return res.status(409).json({ error: "A user with that email already exists" });

          const [user] = await db.insert(users).values({ name, email, password: hashedPassword, role, username: email }).returning({ id: users.id, role: users.role });
          const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn: "7d" });
          return res.status(201).json({ token });
        } catch (dbErr) {
          console.warn("DB register failed, falling back to in-memory storage:", dbErr);
        }
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) return res.status(409).json({ error: "A user with that email already exists" });

      const user = await storage.createUser({ name, email, username: email, password: hashedPassword, role });
      const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn: "7d" });
      return res.status(201).json({ token });
    } catch (error) {
      console.error("Error in /api/auth/register:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid login credentials", details: result.error.format() });
    }
    const email = result.data.email.toLowerCase();
    const password = result.data.password;
    const jwtSecret = process.env.JWT_SECRET || "agrolynk_dev_secret_jwt_key";
    try {
      let user: { id: number; password: string; role: string } | undefined;
      if (db) {
        try {
          const [dbUser] = await db.select({ id: users.id, password: users.password, role: users.role }).from(users).where(eq(users.email, email)).limit(1);
          user = dbUser;
        } catch (dbErr) {
          console.warn("DB login lookup failed, trying in-memory storage:", dbErr);
        }
      }
      if (!user) user = await storage.getUserByEmail(email);
      if (!user) return res.status(401).json({ error: "Invalid email or password" });

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return res.status(401).json({ error: "Invalid email or password" });

      const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn: "7d" });
      return res.status(200).json({ token });
    } catch (error) {
      console.error("Error in /api/auth/login:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==========================================
  // FARMER LISTINGS & MARKET ROUTES
  // ==========================================
  app.get("/api/farmer/buy", (req: Request, res: Response) => {
    try {
      const result = buyQuerySchema.safeParse(req.query);
      if (!result.success) return res.status(400).json({ error: "Invalid query parameters", details: result.error.format() });
      return res.status(200).json(getRecommendations(result.data.crop, result.data.location, result.data.farmSize));
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/farmer/sell", (req: Request, res: Response) => {
    try {
      const result = sellQuerySchema.safeParse(req.query);
      if (!result.success) return res.status(400).json({ error: "Invalid query parameters", details: result.error.format() });
      return res.status(200).json(getMarketInsights(result.data.crop, result.data.location, result.data.quantity));
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/listings", async (req: Request, res: Response) => {
    try {
      const result = createListingSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ error: "Invalid listing data", details: result.error.format() });
      const listing = await storage.createListing(result.data);
      return res.status(201).json(listing);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/listings/mine", async (req: Request, res: Response) => {
    try {
      const farmerId = z.coerce.number().int().positive().safeParse(req.query.farmerId);
      if (!farmerId.success) return res.status(400).json({ error: "Invalid farmerId" });
      const listings = await storage.getListingsByFarmer(farmerId.data);
      return res.status(200).json(listings);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/listings/:id", async (req: Request, res: Response) => {
    try {
      const listingId = z.coerce.number().int().positive().safeParse(req.params.id);
      if (!listingId.success) return res.status(400).json({ error: "Invalid listing id" });
      const result = createListingSchema.partial().safeParse(req.body);
      if (!result.success) return res.status(400).json({ error: "Invalid listing data" });
      const listing = await storage.updateListing(listingId.data, result.data);
      if (!listing) return res.status(404).json({ error: "Listing not found" });
      return res.status(200).json(listing);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/listings/:id/status", async (req: Request, res: Response) => {
    try {
      const listingId = z.coerce.number().int().positive().safeParse(req.params.id);
      if (!listingId.success) return res.status(400).json({ error: "Invalid listing id" });
      const result = updateListingStatusSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ error: "Invalid status" });
      const listing = await storage.updateListing(listingId.data, result.data);
      if (!listing) return res.status(404).json({ error: "Listing not found" });
      return res.status(200).json(listing);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/offers", async (req: Request, res: Response) => {
    try {
      const result = createOfferSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ error: "Invalid offer data" });
      const listing = await storage.getListing(result.data.listingId);
      if (!listing) return res.status(404).json({ error: "Listing not found" });
      if (listing.status !== "active") return res.status(400).json({ error: "Cannot make an offer on an inactive or sold listing" });
      const offer = await storage.createOffer({ ...result.data, status: "pending" });
      return res.status(201).json(offer);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/listings/:id/offers", async (req: Request, res: Response) => {
    try {
      const listingId = z.coerce.number().int().positive().safeParse(req.params.id);
      if (!listingId.success) return res.status(400).json({ error: "Invalid listing id" });
      const listing = await storage.getListing(listingId.data);
      if (!listing) return res.status(404).json({ error: "Listing not found" });
      const offers = await storage.getOffersByListing(listingId.data);
      return res.status(200).json(offers);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/offers/:id/status", async (req: Request, res: Response) => {
    try {
      const offerId = z.coerce.number().int().positive().safeParse(req.params.id);
      if (!offerId.success) return res.status(400).json({ error: "Invalid offer id" });
      const result = updateOfferStatusSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ error: "Invalid offer status" });
      const existingOffer = await storage.getOffer(offerId.data);
      if (!existingOffer) return res.status(404).json({ error: "Offer not found" });
      if (existingOffer.status !== "pending") return res.status(400).json({ error: "Only pending offers can be accepted or rejected" });
      
      const updatedOffer = await storage.updateOfferStatus(offerId.data, result.data.status);
      if (!updatedOffer) return res.status(404).json({ error: "Offer not found" });

      if (result.data.status === "accepted") {
        await storage.updateListing(existingOffer.listingId, { status: "sold" });
        await storage.rejectPendingOffersForListing(existingOffer.listingId, existingOffer.id);
      }
      return res.status(200).json(updatedOffer);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // =========================
  // COMPANY PRODUCT LISTINGS 
  // =========================
  app.post("/api/company/products", async (req: Request, res: Response) => {
    try {
      const result = createCompanyProductSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ error: "Invalid product data", details: result.error.format() });
      const product = await storage.createCompanyProduct(result.data);
      return res.status(201).json(product);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/company/products", async (req: Request, res: Response) => {
    try {
      const companyId = z.coerce.number().int().positive().safeParse(req.query.companyId);
      if (!companyId.success) return res.status(400).json({ error: "Invalid companyId" });
      const products = await storage.getCompanyProducts(companyId.data);
      return res.status(200).json(products);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/company/products/:id", async (req: Request, res: Response) => {
    try {
      const productId = z.coerce.number().int().positive().safeParse(req.params.id);
      if (!productId.success) return res.status(400).json({ error: "Invalid product id" });
      const product = await storage.getCompanyProduct(productId.data);
      if (!product) return res.status(404).json({ error: "Product not found" });
      return res.status(200).json(product);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // =========================
  // COMPANY ORDERS
  // =========================
  app.post("/api/company/orders", async (req: Request, res: Response) => {
    try {
      const result = createCompanyOrderSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ error: "Invalid order data", details: result.error.format() });
      const order = await storage.createCompanyOrder(result.data);
      return res.status(201).json(order);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/company/orders", async (req: Request, res: Response) => {
    try {
      const companyId = z.coerce.number().int().positive().safeParse(req.query.companyId);
      if (!companyId.success) return res.status(400).json({ error: "Invalid companyId" });
      const orders = await storage.getCompanyOrders(companyId.data);
      return res.status(200).json(orders);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/company/orders/:id", async (req: Request, res: Response) => {
    try {
      const orderId = z.coerce.number().int().positive().safeParse(req.params.id);
      if (!orderId.success) return res.status(400).json({ error: "Invalid order id" });
      const order = await storage.getCompanyOrder(orderId.data);
      if (!order) return res.status(404).json({ error: "Order not found" });
      return res.status(200).json(order);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================
  // AI ROUTES (GEMINI INTEGRATION)
  // ============================================
  app.post("/api/ai/price", async (req: Request, res: Response) => {
    try {
      console.log("Received price request:", req.body);
      const result = priceRecommendationSchema.safeParse(req.body);

      if (!result.success) {
        console.error("Invalid price request:", result.error.format());
        return res.status(400).json({
          error: "Invalid listing data",
          details: result.error.format(),
        });
      }

      const { crop, quantity, location, quality } = result.data;
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
      console.log("Gemini cleaned response:", cleanedResponse);

      let recommendation;
      try {
        recommendation = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("Failed to parse Gemini price response:", parseError);
        console.error("Response received from Gemini:", response);
        return res.status(500).json({
          error: "Gemini returned an invalid JSON response",
        });
      }

      return res.status(200).json(recommendation);
    } catch (error) {
      console.error("Error in /api/ai/price:", error);
      return res.status(500).json({
        error: "Failed to generate price recommendation",
      });
    }
  });

  app.post("/api/ai/match", async (req: Request, res: Response) => {
    try {
      console.log("Received match request:", req.body);
      const result = matchSchema.safeParse(req.body);

      if (!result.success) {
        console.error("Invalid match request:", result.error.format());
        return res.status(400).json({
          error: "Invalid match data",
          details: result.error.format(),
        });
      }

      const { listing, company } = result.data;
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
      console.log("Gemini raw match response:", response);
      const cleanedResponse = cleanGeminiJson(response);
      console.log("Gemini cleaned match response:", cleanedResponse);

      let matchResult;
      try {
        matchResult = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("Failed to parse Gemini match response:", parseError);
        console.error("Response received from Gemini:", response);
        return res.status(500).json({
          error: "Gemini returned an invalid JSON response",
        });
      }

      return res.status(200).json(matchResult);
    } catch (error) {
      console.error("Error in /api/ai/match:", error);
      return res.status(500).json({
        error: "Failed to generate match explanation",
      });
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

  const httpServer = createServer(app);
  return httpServer;
}