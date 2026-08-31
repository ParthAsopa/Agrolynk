import {
  users,
  companyProducts,
  companyOrders,
  listings,
  offers,
  type User,
  type InsertUser,
  type CompanyProduct,
  type InsertCompanyProduct,
  type CompanyOrder,
  type InsertCompanyOrder,
  type Listing,
  type InsertListing,
  type Offer,
  type InsertOffer,
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Company Product methods
  createCompanyProduct(product: InsertCompanyProduct): Promise<CompanyProduct>;
  getCompanyProducts(companyId: number): Promise<CompanyProduct[]>;
  getCompanyProduct(id: number): Promise<CompanyProduct | undefined>;

  // Company Order methods
  createCompanyOrder(order: InsertCompanyOrder): Promise<CompanyOrder>;
  getCompanyOrders(companyId: number): Promise<CompanyOrder[]>;
  getCompanyOrder(id: number): Promise<CompanyOrder | undefined>;

  // Listing & Offer methods
  rejectPendingOffersForListing(listingId: number, exceptOfferId: number): Promise<void>;
  getOffer(id: number): Promise<Offer | undefined>;
  updateOfferStatus(id: number, status: "accepted" | "rejected"): Promise<Offer | undefined>;
  getListing(id: number): Promise<Listing | undefined>;
  createListing(listing: InsertListing): Promise<Listing>;
  getListingsByFarmer(farmerId: number): Promise<Listing[]>;
  updateListing(id: number, updates: Partial<InsertListing>): Promise<Listing | undefined>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  getOffersByListing(listingId: number): Promise<Offer[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private companyProducts: Map<number, CompanyProduct>;
  private companyOrders: Map<number, CompanyOrder>;
  private listings: Map<number, Listing>;
  private offers: Map<number, Offer>;

  private userCurrentId: number;
  private companyProductCurrentId: number;
  private companyOrderCurrentId: number;
  private listingId: number;
  private offerId: number;

  constructor() {
    this.users = new Map();
    this.companyProducts = new Map();
    this.companyOrders = new Map();
    this.listings = new Map();
    this.offers = new Map();

    this.userCurrentId = 1;
    this.companyProductCurrentId = 1;
    this.companyOrderCurrentId = 1;
    this.listingId = 1;
    this.offerId = 1;
  }

  // =========================
  // User methods
  // =========================
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email.toLowerCase() === email.toLowerCase());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role ?? "farmer",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // =========================
  // Company Product methods
  // =========================
  async createCompanyProduct(product: InsertCompanyProduct): Promise<CompanyProduct> {
    const id = this.companyProductCurrentId++;
    const companyProduct: CompanyProduct = {
      id,
      companyId: product.companyId,
      category: product.category,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      description: product.description,
      manufacturer: product.manufacturer ?? null,
      specifications: product.specifications ?? null,
      imageUrl: product.imageUrl ?? null,
    };
    this.companyProducts.set(id, companyProduct);
    return companyProduct;
  }

  async getCompanyProducts(companyId: number): Promise<CompanyProduct[]> {
    return Array.from(this.companyProducts.values()).filter((product) => product.companyId === companyId);
  }

  async getCompanyProduct(id: number): Promise<CompanyProduct | undefined> {
    return this.companyProducts.get(id);
  }

  // =========================
  // Company Order methods
  // =========================
  async createCompanyOrder(order: InsertCompanyOrder): Promise<CompanyOrder> {
    const id = this.companyOrderCurrentId++;
    const companyOrder: CompanyOrder = {
      id,
      companyId: order.companyId,
      crop: order.crop,
      quantity: order.quantity,
      gradeQuality: order.gradeQuality,
      totalCost: order.totalCost,
      status: order.status ?? "pending",
    };
    this.companyOrders.set(id, companyOrder);
    return companyOrder;
  }

  async getCompanyOrders(companyId: number): Promise<CompanyOrder[]> {
    return Array.from(this.companyOrders.values()).filter((order) => order.companyId === companyId);
  }

  async getCompanyOrder(id: number): Promise<CompanyOrder | undefined> {
    return this.companyOrders.get(id);
  }

  // =========================
  // Listing & Offer methods
  // =========================
  async getListing(id: number): Promise<Listing | undefined> {
    return this.listings.get(id);
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
    return Array.from(this.listings.values()).filter((listing) => listing.farmerId === farmerId);
  }

  async updateListing(id: number, updates: Partial<InsertListing>): Promise<Listing | undefined> {
    const existingListing = this.listings.get(id);
    if (!existingListing) return undefined;

    const updatedListing: Listing = {
      ...existingListing,
      ...updates,
      id: existingListing.id,
      farmerId: existingListing.farmerId,
    };
    this.listings.set(id, updatedListing);
    return updatedListing;
  }

  async getOffer(id: number): Promise<Offer | undefined> {
    return this.offers.get(id);
  }

  async createOffer(insertOffer: InsertOffer): Promise<Offer> {
    const id = this.offerId++;
    const offer: Offer = {
      id,
      listingId: insertOffer.listingId,
      companyId: insertOffer.companyId,
      offeredPrice: insertOffer.offeredPrice,
      message: insertOffer.message ?? null,
      status: insertOffer.status ?? "pending",
    };
    this.offers.set(id, offer);
    return offer;
  }

  async getOffersByListing(listingId: number): Promise<Offer[]> {
    return Array.from(this.offers.values()).filter((offer) => offer.listingId === listingId);
  }

  async updateOfferStatus(id: number, status: "accepted" | "rejected"): Promise<Offer | undefined> {
    const existingOffer = this.offers.get(id);
    if (!existingOffer) return undefined;

    const updatedOffer: Offer = {
      ...existingOffer,
      status,
    };
    this.offers.set(id, updatedOffer);
    return updatedOffer;
  }

  async rejectPendingOffersForListing(listingId: number, exceptOfferId: number): Promise<void> {
    this.offers.forEach((offer, id) => {
      if (offer.listingId === listingId && offer.id !== exceptOfferId && offer.status === "pending") {
        this.offers.set(id, { ...offer, status: "rejected" });
      }
    });
  }
}

export const storage = new MemStorage();