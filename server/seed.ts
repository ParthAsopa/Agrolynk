import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { db } from "./db";
import { users as usersTable } from "@shared/schema";

// Define table references (matches the branch schema for users, listings, and offers)
export const users = usersTable;

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").references(() => users.id, { onDelete: "cascade" }),
  cropName: text("crop_name").notNull(),
  wasteType: text("waste_type").notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity").notNull(), // in tons or quintals
  unit: text("unit").notNull().default("Tons"),
  pricePerUnit: numeric("price_per_unit").notNull(), // in INR
  location: text("location").notNull(),
  state: text("state").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'pending', 'sold'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => listings.id, { onDelete: "cascade" }),
  companyId: integer("company_id").references(() => users.id, { onDelete: "cascade" }),
  offeredPrice: numeric("offered_price").notNull(),
  quantityRequested: numeric("quantity_requested").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'rejected'
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export async function seedDatabase() {
  console.log("🌱 Starting database seed script...");

  if (!db) {
    console.error("❌ Database connection (DATABASE_URL) is not configured or unavailable.");
    process.exit(1);
  }

  try {
    // 1. Clear existing data safely (handling foreign key dependencies)
    console.log("🧹 Clearing existing data (offers, listings, users)...");
    
    // Safely execute CASCADE truncate or sequential deletes with raw SQL or Drizzle
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'offers') THEN
          TRUNCATE TABLE offers CASCADE;
        END IF;
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'listings') THEN
          TRUNCATE TABLE listings CASCADE;
        END IF;
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
          TRUNCATE TABLE users CASCADE;
        END IF;
      END $$;
    `);

    console.log("✅ Cleared existing tables successfully.");

    // 2. Hash passwords with bcrypt (using standard cost factor)
    const defaultPassword = "password123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 3. Create 2 demo Farmer accounts & 2 demo Company accounts
    console.log("👨‍🌾 Creating demo users...");
    const demoUsers = [
      {
        name: "Rajesh Kumar (Farmer)",
        email: "rajesh.farmer@agrolynk.com",
        username: "rajesh_farmer",
        password: hashedPassword,
        role: "farmer",
      },
      {
        name: "Sukhwinder Singh (Farmer)",
        email: "sukhwinder.farmer@agrolynk.com",
        username: "sukhwinder_farmer",
        password: hashedPassword,
        role: "farmer",
      },
      {
        name: "BioEnergy Green Corp",
        email: "procurement@bioenergycorp.com",
        username: "bioenergy_corp",
        password: hashedPassword,
        role: "company",
      },
      {
        name: "AgriPaper & Pulp Ltd",
        email: "contact@agripaperltd.com",
        username: "agripaper_ltd",
        password: hashedPassword,
        role: "company",
      },
    ];

    const insertedUsers = await db
      .insert(users)
      .values(demoUsers)
      .returning({ id: users.id, name: users.name, role: users.role, email: users.email });

    console.log(`✅ Inserted ${insertedUsers.length} users:`);
    insertedUsers.forEach((u) => console.log(`   - [${u.role.toUpperCase()}] ${u.name} (${u.email})`));

    const farmer1 = insertedUsers.find((u) => u.email === "rajesh.farmer@agrolynk.com")!;
    const farmer2 = insertedUsers.find((u) => u.email === "sukhwinder.farmer@agrolynk.com")!;

    // 4. Create 4 realistic crop waste listings tied to farmers
    console.log("🌾 Creating demo crop waste listings...");
    const demoListings = [
      {
        farmerId: farmer1.id,
        cropName: "Paddy / Rice",
        wasteType: "Rice Stubble (Parali)",
        description:
          "High-dry-matter golden rice stubble baled and ready for transport. Ideal for biomass pellets, biofuel generation, and thermal plants.",
        quantity: "150.00",
        unit: "Tons",
        pricePerUnit: "1850.00", // INR per ton
        location: "Ludhiana District, GT Road",
        state: "Punjab",
        status: "active",
      },
      {
        farmerId: farmer1.id,
        cropName: "Wheat",
        wasteType: "Wheat Chaff & Straw (Bhusa)",
        description:
          "Fine dry wheat straw with minimal moisture content. Suitable for cardboard manufacturing, mushroom compost, and cattle feed enrichment.",
        quantity: "85.50",
        unit: "Tons",
        pricePerUnit: "2400.00", // INR per ton
        location: "Karnal Mandi Area",
        state: "Haryana",
        status: "active",
      },
      {
        farmerId: farmer2.id,
        cropName: "Sugarcane",
        wasteType: "Sugarcane Bagasse & Trash",
        description:
          "Sun-dried sugarcane fibrous waste residue. Excellent calorific value for co-generation boilers, eco-packaging, and paper pulp processing.",
        quantity: "220.00",
        unit: "Tons",
        pricePerUnit: "1600.00", // INR per ton
        location: "Muzaffarnagar Sugar Belt",
        state: "Uttar Pradesh",
        status: "active",
      },
      {
        farmerId: farmer2.id,
        cropName: "Cotton",
        wasteType: "Cotton Stalks & Stems",
        description:
          "Coarse woody cotton stalks post-harvest. Shredded and stored under sheds, ideal for industrial particle board and briquetting.",
        quantity: "60.00",
        unit: "Tons",
        pricePerUnit: "2100.00", // INR per ton
        location: "Bathinda Rural",
        state: "Punjab",
        status: "active",
      },
    ];

    const insertedListings = await db.insert(listings).values(demoListings).returning();

    console.log(`✅ Inserted ${insertedListings.length} crop waste listings:`);
    insertedListings.forEach((l) =>
      console.log(`   - ${l.wasteType} (${l.cropName}): ${l.quantity} ${l.unit} @ ₹${l.pricePerUnit}/${l.unit} in ${l.location}, ${l.state}`)
    );

    console.log("\n🎉 Database seeded successfully!");
    console.log("--------------------------------------------------");
    console.log("Demo Credentials (Password for all: password123):");
    console.log("  1. Farmer:  rajesh.farmer@agrolynk.com");
    console.log("  2. Farmer:  sukhwinder.farmer@agrolynk.com");
    console.log("  3. Company: procurement@bioenergycorp.com");
    console.log("  4. Company: contact@agripaperltd.com");
    console.log("--------------------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error while seeding database:", error);
    process.exit(1);
  }
}

// Auto-execute if run directly via tsx
seedDatabase();
