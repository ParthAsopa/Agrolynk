import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { pgTable, text, serial, integer, real } from "drizzle-orm/pg-core";

// We don't need a complex schema for this application since we're using predefined data
// But we'll keep this basic user model for authentication if needed later

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("farmer"), // 'farmer' or 'company'
});
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCompanyProduct = z.infer<
  typeof insertCompanyProductSchema
>;

export type CompanyProduct =
  typeof companyProducts.$inferSelect;