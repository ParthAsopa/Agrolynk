import { pgTable, text, serial, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We don't need a complex schema for this application since we're using predefined data
// But we'll keep this basic user model for authentication if needed later

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("farmer"), // 'farmer' or 'company'
});
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),

  farmerId: integer("farmer_id")
    .notNull()
    .references(() => users.id),

  crop: text("crop").notNull(),

  wasteType: text("waste_type").notNull(),

  quantity: real("quantity").notNull(),

  unit: text("unit").notNull(),

  location: text("location").notNull(),

  price: real("price").notNull(),

  status: text("status").notNull().default("active"),
});
export const insertUserSchema = createInsertSchema(users).pick({
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

export type InsertListing = z.infer<typeof insertListingSchema>;

export type Listing = typeof listings.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
