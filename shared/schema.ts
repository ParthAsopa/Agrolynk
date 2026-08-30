import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import {
  pgTable,
  text,
  serial,
  integer,
  real,
} from "drizzle-orm/pg-core";

// =========================
// Users
// =========================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("farmer"),
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
  username: true,
  password: true,
  role: true,
});

export const insertCompanyProductSchema = createInsertSchema(
  companyProducts,
).pick({
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

export const insertCompanyOrderSchema = createInsertSchema(
  companyOrders,
).pick({
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

export type InsertCompanyProduct = z.infer<
  typeof insertCompanyProductSchema
>;

export type CompanyProduct =
  typeof companyProducts.$inferSelect;

export type InsertCompanyOrder = z.infer<
  typeof insertCompanyOrderSchema
>;

export type CompanyOrder =
  typeof companyOrders.$inferSelect;