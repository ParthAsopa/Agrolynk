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
  farmSize: z.coerce.number().min(1),
});

const sellQuerySchema = z.object({
  crop: z.string().min(1),
  location: z.string().min(1),
  quantity: z.coerce.number().min(1),
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

export async function registerRoutes(app: Express): Promise<Server> {
  // ==========================================
  // FARMER BUY RECOMMENDATIONS
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
        farmSize,
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
  // CREATE FARMER LISTING
  // ==========================================

  app.post("/api/listings", async (req: Request, res: Response) => {
    try {
      const result = createListingSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Invalid listing data",
          details: result.error.format(),
        });
      }

      const listing = await storage.createListing(result.data);

      return res.status(201).json(listing);
    } catch (error) {
      console.error("Error in POST /api/listings:", error);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  });

  // ==========================================
  // GET FARMER'S LISTINGS
  // ==========================================

  app.get("/api/listings/mine", async (req: Request, res: Response) => {
    try {
      const farmerId = z.coerce
        .number()
        .int()
        .positive()
        .safeParse(req.query.farmerId);

      if (!farmerId.success) {
        return res.status(400).json({
          error: "Invalid farmerId",
        });
      }

      const listings = await storage.getListingsByFarmer(
        farmerId.data,
      );

      return res.status(200).json(listings);
    } catch (error) {
      console.error("Error in GET /api/listings/mine:", error);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  });

  // ==========================================
  // UPDATE FARMER LISTING
  // ==========================================

  app.patch("/api/listings/:id", async (req: Request, res: Response) => {
    try {
      const listingId = z.coerce
        .number()
        .int()
        .positive()
        .safeParse(req.params.id);

      if (!listingId.success) {
        return res.status(400).json({
          error: "Invalid listing id",
        });
      }

      const result = createListingSchema.partial().safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Invalid listing data",
          details: result.error.format(),
        });
      }

      const listing = await storage.updateListing(
        listingId.data,
        result.data,
      );

      if (!listing) {
        return res.status(404).json({
          error: "Listing not found",
        });
      }

      return res.status(200).json(listing);
    } catch (error) {
      console.error("Error in PATCH /api/listings/:id:", error);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  });

  // ==========================================
  // UPDATE LISTING STATUS
  // ==========================================

  app.patch(
    "/api/listings/:id/status",
    async (req: Request, res: Response) => {
      try {
        const listingId = z.coerce
          .number()
          .int()
          .positive()
          .safeParse(req.params.id);

        if (!listingId.success) {
          return res.status(400).json({
            error: "Invalid listing id",
          });
        }

        const result = updateListingStatusSchema.safeParse(req.body);

        if (!result.success) {
          return res.status(400).json({
            error: "Invalid status",
            details: result.error.format(),
          });
        }

        const listing = await storage.updateListing(
          listingId.data,
          result.data,
        );

        if (!listing) {
          return res.status(404).json({
            error: "Listing not found",
          });
        }

        return res.status(200).json(listing);
      } catch (error) {
        console.error(
          "Error in PATCH /api/listings/:id/status:",
          error,
        );

        return res.status(500).json({
          error: "Internal server error",
        });
      }
    },
  );

  // ==========================================
  // CREATE COMPANY OFFER
  // ==========================================

  app.post("/api/offers", async (req: Request, res: Response) => {
    try {
      const result = createOfferSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Invalid offer data",
          details: result.error.format(),
        });
      }

      const listing = await storage.getListing(result.data.listingId);

      if (!listing) {
        return res.status(404).json({
          error: "Listing not found",
        });
      }

      if (listing.status !== "active") {
        return res.status(400).json({
          error:
            "Cannot make an offer on an inactive or sold listing",
        });
      }

      const offer = await storage.createOffer({
        ...result.data,
        status: "pending",
      });

      return res.status(201).json(offer);
    } catch (error) {
      console.error("Error in POST /api/offers:", error);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  });

  // ==========================================
  // GET OFFERS FOR A LISTING
  // ==========================================

  app.get(
    "/api/listings/:id/offers",
    async (req: Request, res: Response) => {
      try {
        const listingId = z.coerce
          .number()
          .int()
          .positive()
          .safeParse(req.params.id);

        if (!listingId.success) {
          return res.status(400).json({
            error: "Invalid listing id",
          });
        }

        const listing = await storage.getListing(listingId.data);

        if (!listing) {
          return res.status(404).json({
            error: "Listing not found",
          });
        }

        const offers = await storage.getOffersByListing(
          listingId.data,
        );

        return res.status(200).json(offers);
      } catch (error) {
        console.error(
          "Error in GET /api/listings/:id/offers:",
          error,
        );

        return res.status(500).json({
          error: "Internal server error",
        });
      }
    },
  );
  const updateOfferStatusSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
});

app.patch(
  "/api/offers/:id/status",
  async (req: Request, res: Response) => {
    try {
      const offerId = z.coerce
        .number()
        .int()
        .positive()
        .safeParse(req.params.id);

      if (!offerId.success) {
        return res.status(400).json({
          error: "Invalid offer id",
        });
      }

      const result = updateOfferStatusSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Invalid offer status",
          details: result.error.format(),
        });
      }

      const existingOffer = await storage.getOffer(offerId.data);

      if (!existingOffer) {
        return res.status(404).json({
          error: "Offer not found",
        });
      }

      if (existingOffer.status !== "pending") {
        return res.status(400).json({
          error: "Only pending offers can be accepted or rejected",
        });
      }

      const updatedOffer = await storage.updateOfferStatus(
        offerId.data,
        result.data.status,
      );

      if (!updatedOffer) {
        return res.status(404).json({
          error: "Offer not found",
        });
      }

      // If offer is accepted, mark the listing as sold
     if (result.data.status === "accepted") {
  await storage.updateListing(existingOffer.listingId, {
    status: "sold",
  });

  await storage.rejectPendingOffersForListing(
    existingOffer.listingId,
    existingOffer.id,
  );
}

      return res.status(200).json(updatedOffer);
    } catch (error) {
      console.error(
        "Error in PATCH /api/offers/:id/status:",
        error,
      );

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  },
);

  // ==========================================
  // FARMER SELL MARKET INSIGHTS
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

      const { crop, location, quantity } = result.data;

      const marketInsights = getMarketInsights(
        crop,
        location,
        quantity,
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
  // CREATE HTTP SERVER
  // ==========================================

  const httpServer = createServer(app);

  return httpServer;
}