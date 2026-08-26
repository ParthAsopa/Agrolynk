import {
  users,
  listings,
  type User,
  type InsertUser,
  type Listing,
  type InsertListing,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;

  getUserByUsername(username: string): Promise<User | undefined>;

  createUser(user: InsertUser): Promise<User>;

  createListing(listing: InsertListing): Promise<Listing>;

  getListingsByFarmer(farmerId: number): Promise<Listing[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private listings: Map<number, Listing>;

  currentId: number;
  private listingId: number;

  constructor() {
    this.users = new Map();
    this.listings = new Map();

    this.currentId = 1;
    this.listingId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;

    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role ?? "farmer",
    };

    this.users.set(id, user);

    return user;
  }

  async createListing(insertListing: InsertListing): Promise<Listing> {
    const id = this.listingId++;

    const listing: Listing = {
      id,
      farmerId: insertListing.farmerId,
      crop: insertListing.crop,
      wasteType: insertListing.wasteType,
      quantity: insertListing.quantity,
      unit: insertListing.unit,
      location: insertListing.location,
      price: insertListing.price,
      status: insertListing.status ?? "active",
    };

    this.listings.set(id, listing);

    return listing;
  }

  async getListingsByFarmer(farmerId: number): Promise<Listing[]> {
    return Array.from(this.listings.values()).filter(
      (listing) => listing.farmerId === farmerId,
    );
  }
}

export const storage = new MemStorage();