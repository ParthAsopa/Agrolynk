import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =========================
// Users
// =========================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("farmer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// =========================
// Farmer Listings & Offers
// =========================
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").notNull().references(() => users.id),
  crop: text("crop").notNull(),
  wasteType: text("waste_type").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  location: text("location").notNull(),
  price: real("price").notNull(),
  status: text("status").notNull().default("active"),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  companyId: integer("company_id").notNull().references(() => users.id),
  offeredPrice: real("offered_price").notNull(),
  message: text("message"),
  status: text("status").notNull().default("pending"),
});

// =========================
// Company Products
// =========================
export const companyProducts = pgTable("company_products", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  quantity: real("quantity").notNull(),
  description: text("description").notNull(),
  manufacturer: text("manufacturer"),
  specifications: text("specifications"),
  imageUrl: text("image_url"),
});

// =========================
// Company Orders
// =========================
export const companyOrders = pgTable("company_orders", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  crop: text("crop").notNull(),
  quantity: real("quantity").notNull(),
  gradeQuality: text("grade_quality").notNull(),
  totalCost: real("total_cost").notNull(),
  status: text("status").notNull().default("pending"),
});

// =========================
// Insert Schemas
// =========================
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  username: true,
  password: true,
  role: true,
});

export const insertListingSchema = createInsertSchema(listings).pick({
  farmerId: true,
  crop: true,
  wasteType: true,
  quantity: true,
  unit: true,
  location: true,
  price: true,
  status: true,
});

export const insertOfferSchema = createInsertSchema(offers).pick({
  listingId: true,
  companyId: true,
  offeredPrice: true,
  message: true,
  status: true,
});

export const insertCompanyProductSchema = createInsertSchema(companyProducts).pick({
  companyId: true,
  category: true,
  name: true,
  price: true,
  quantity: true,
  description: true,
  manufacturer: true,
  specifications: true,
  imageUrl: true,
});

export const insertCompanyOrderSchema = createInsertSchema(companyOrders).pick({
  companyId: true,
  crop: true,
  quantity: true,
  gradeQuality: true,
  totalCost: true,
  status: true,
});

// =========================
// Types
// =========================
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offers.$inferSelect;

export type InsertCompanyProduct = z.infer<typeof insertCompanyProductSchema>;
export type CompanyProduct = typeof companyProducts.$inferSelect;

export type InsertCompanyOrder = z.infer<typeof insertCompanyOrderSchema>;
export type CompanyOrder = typeof companyOrders.$inferSelect;