import {
  users,
  listings,
  offers,
  type User,
  type InsertUser,
  type Listing,
  type InsertListing,
  type Offer,
  type InsertOffer,
} from "@shared/schema";

export interface IStorage {
  rejectPendingOffersForListing(
  listingId: number,
  exceptOfferId: number,
): Promise<void>;
  getOffer(id: number): Promise<Offer | undefined>;
  updateOfferStatus(
  id: number,
  status: "accepted" | "rejected",
): Promise<Offer | undefined>;
  getListing(id: number): Promise<Listing | undefined>;
  getUser(id: number): Promise<User | undefined>;

  getUserByUsername(username: string): Promise<User | undefined>;

  createUser(user: InsertUser): Promise<User>;

  createListing(listing: InsertListing): Promise<Listing>;

  getListingsByFarmer(farmerId: number): Promise<Listing[]>;
  updateListing(
  id: number,
  updates: Partial<InsertListing>,
): Promise<Listing | undefined>;
createOffer(offer: InsertOffer): Promise<Offer>;

getOffersByListing(listingId: number): Promise<Offer[]>;  
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private listings: Map<number, Listing>;
  private offers: Map<number, Offer>;

  currentId: number;
  private listingId: number;
  private offerId: number;

  constructor() {
    this.users = new Map();
    this.listings = new Map();
    this.offers = new Map();

    this.currentId = 1;
    this.listingId = 1;
    this.offerId = 1;
  }
async getListing(id: number): Promise<Listing | undefined> {
  return this.listings.get(id);
}
async getOffer(id: number): Promise<Offer | undefined> {
  return this.offers.get(id);
}
async updateOfferStatus(
  id: number,
  status: "accepted" | "rejected",
): Promise<Offer | undefined> {
  const existingOffer = this.offers.get(id);

  if (!existingOffer) {
    return undefined;
  }

  const updatedOffer: Offer = {
    ...existingOffer,
    status,
  };

  this.offers.set(id, updatedOffer);

  return updatedOffer;
}
async rejectPendingOffersForListing(
  listingId: number,
  exceptOfferId: number,
): Promise<void> {
this.offers.forEach((offer, id) => {
  if (
    offer.listingId === listingId &&
    offer.id !== exceptOfferId &&
    offer.status === "pending"
  ) {
    this.offers.set(id, {
      ...offer,
      status: "rejected",
    });
  }
});
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
  return Array.from(this.offers.values()).filter(
    (offer) => offer.listingId === listingId,
  );
}
  async updateListing(
  id: number,
  updates: Partial<InsertListing>,
): Promise<Listing | undefined> {
  const existingListing = this.listings.get(id);

  if (!existingListing) {
    return undefined;
  }

  const updatedListing: Listing = {
    ...existingListing,
    ...updates,
    id: existingListing.id,
    farmerId: existingListing.farmerId,
  };

  this.listings.set(id, updatedListing);

  return updatedListing;
}
}

export const storage = new MemStorage();