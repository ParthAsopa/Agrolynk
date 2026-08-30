import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getRecommendations } from "./data/recommendations";
import { getMarketInsights } from "./data/market";
import { z } from "zod";

// =========================
// Validation schemas
// =========================

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

  category: z.enum([
    "seeds",
    "fertilizers",
    "pesticides",
    "instruments",
  ]),

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

  gradeQuality: z.enum([
    "premium",
    "standard",
    "economy",
  ]),

  totalCost: z.coerce.number().positive(),
});

// =========================
// Register Routes
// =========================

export async function registerRoutes(
  app: Express,
): Promise<Server> {

  // =========================
  // Farmer Buy Recommendations
  // =========================

  app.get(
    "/api/farmer/buy",
    (req: Request, res: Response) => {
      try {
        const result =
          buyQuerySchema.safeParse(req.query);

        if (!result.success) {
          return res.status(400).json({
            error: "Invalid query parameters",
            details: result.error.format(),
          });
        }

        const {
          crop,
          location,
          farmSize,
        } = result.data;

        const recommendations =
          getRecommendations(
            crop,
            location,
            farmSize,
          );

        return res.status(200).json(
          recommendations,
        );
      } catch (error) {
        console.error(
          "Error in /api/farmer/buy:",
          error,
        );

        return res.status(500).json({
          error: "Internal server error",
        });
      }
    },
  );

  // =========================
  // Farmer Sell Market Insights
  // =========================

  app.get(
    "/api/farmer/sell",
    (req: Request, res: Response) => {
      try {
        const result =
          sellQuerySchema.safeParse(req.query);

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

        const marketInsights =
          getMarketInsights(
            crop,
            location,
            quantity,
          );

        return res.status(200).json(
          marketInsights,
        );
      } catch (error) {
        console.error(
          "Error in /api/farmer/sell:",
          error,
        );

        return res.status(500).json({
          error: "Internal server error",
        });
      }
    },
  );

  // =========================
  // Company Product Listings
  // =========================

  // Create Company Product
  app.post(
    "/api/company/products",
    async (
      req: Request,
      res: Response,
    ) => {
      try {
        const result =
          createCompanyProductSchema.safeParse(
            req.body,
          );

        if (!result.success) {
          return res.status(400).json({
            error: "Invalid product data",
            details: result.error.format(),
          });
        }

        const product =
          await storage.createCompanyProduct(
            result.data,
          );

        return res.status(201).json(product);
      } catch (error) {
        console.error(
          "Error in POST /api/company/products:",
          error,
        );

        return res.status(500).json({
          error: "Internal server error",
        });
      }
    },
  );

  // Get all Company Products
  app.get(
    "/api/company/products",
    async (
      req: Request,
      res: Response,
    ) => {
      try {
        const companyId =
          z.coerce
            .number()
            .int()
            .positive()
            .safeParse(
              req.query.companyId,
            );

        if (!companyId.success) {
          return res.status(400).json({
            error: "Invalid companyId",
          });
        }

        const products =
          await storage.getCompanyProducts(
            companyId.data,
          );

        return res.status(200).json(
          products,
        );
      } catch (error) {
        console.error(
          "Error in GET /api/company/products:",
          error,
        );

        return res.status(500).json({
          error: "Internal server error",
        });
      }
    },
  );

  // Get single Company Product
  app.get(
    "/api/company/products/:id",
    async (
      req: Request,
      res: Response,
    ) => {
      try {
        const productId =
          z.coerce
            .number()
            .int()
            .positive()
            .safeParse(
              req.params.id,
            );

        if (!productId.success) {
          return res.status(400).json({
            error: "Invalid product id",
          });
        }

        const product =
          await storage.getCompanyProduct(
            productId.data,
          );

        if (!product) {
          return res.status(404).json({
            error: "Product not found",
          });
        }

        return res.status(200).json(
          product,
        );
      } catch (error) {
        console.error(
          "Error in GET /api/company/products/:id:",
          error,
        );

        return res.status(500).json({
          error: "Internal server error",
        });
      }
    },
  );

  // =========================
  // Company Orders
  // =========================

  // Create Company Order
  app.post(
    "/api/company/orders",
    async (
      req: Request,
      res: Response,
    ) => {
      try {
        const result =
          createCompanyOrderSchema.safeParse(
            req.body,
          );

        if (!result.success) {
          return res.status(400).json({
            error: "Invalid order data",
            details: result.error.format(),
          });
        }

        const order =
          await storage.createCompanyOrder(
            result.data,
          );

        return res.status(201).json(order);
      } catch (error) {
        console.error(
          "Error in POST /api/company/orders:",
          error,
        );

        return res.status(500).json({
          error: "Internal server error",
        });
      }
    },
  );

  // Get all Company Orders
  app.get(
    "/api/company/orders",
    async (
      req: Request,
      res: Response,
    ) => {
      try {
        const companyId =
          z.coerce
            .number()
            .int()
            .positive()
            .safeParse(
              req.query.companyId,
            );

        if (!companyId.success) {
          return res.status(400).json({
            error: "Invalid companyId",
          });
        }

        const orders =
          await storage.getCompanyOrders(
            companyId.data,
          );

        return res.status(200).json(
          orders,
        );
      } catch (error) {
        console.error(
          "Error in GET /api/company/orders:",
          error,
        );

        return res.status(500).json({
          error: "Internal server error",
        });
      }
    },
  );

  // Get single Company Order
  app.get(
    "/api/company/orders/:id",
    async (
      req: Request,
      res: Response,
    ) => {
      try {
        const orderId =
          z.coerce
            .number()
            .int()
            .positive()
            .safeParse(
              req.params.id,
            );

        if (!orderId.success) {
          return res.status(400).json({
            error: "Invalid order id",
          });
        }

        const order =
          await storage.getCompanyOrder(
            orderId.data,
          );

        if (!order) {
          return res.status(404).json({
            error: "Order not found",
          });
        }

        return res.status(200).json(
          order,
        );
      } catch (error) {
        console.error(
          "Error in GET /api/company/orders/:id:",
          error,
        );

        return res.status(500).json({
          error: "Internal server error",
        });
      }
    },
  );

  // =========================
  // Create HTTP Server
  // =========================

  const httpServer = createServer(app);

  return httpServer;
}