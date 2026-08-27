import {
  users,
  companyProducts,
  type User,
  type InsertUser,
  type CompanyProduct,
  type InsertCompanyProduct,
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(
    username: string,
  ): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Company Product methods
  createCompanyProduct(
    product: InsertCompanyProduct,
  ): Promise<CompanyProduct>;

  getCompanyProducts(
    companyId: number,
  ): Promise<CompanyProduct[]>;

  getCompanyProduct(
    id: number,
  ): Promise<CompanyProduct | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private companyProducts: Map<number, CompanyProduct>;

  private userCurrentId: number;
  private companyProductCurrentId: number;

  constructor() {
    this.users = new Map();
    this.companyProducts = new Map();

    this.userCurrentId = 1;
    this.companyProductCurrentId = 1;
  }

  // =========================
  // User methods
  // =========================

  async getUser(
    id: number,
  ): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(
    username: string,
  ): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(
    insertUser: InsertUser,
  ): Promise<User> {
    const id = this.userCurrentId++;

    const user: User = {
  id,
  username: insertUser.username,
  password: insertUser.password,
  role: insertUser.role ?? "farmer",
};

    this.users.set(id, user);

    return user;
  }

  // =========================
  // Company Product methods
  // =========================

  async createCompanyProduct(
    product: InsertCompanyProduct,
  ): Promise<CompanyProduct> {
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

    this.companyProducts.set(
      id,
      companyProduct,
    );

    return companyProduct;
  }

  async getCompanyProducts(
    companyId: number,
  ): Promise<CompanyProduct[]> {
    return Array.from(
      this.companyProducts.values(),
    ).filter(
      (product) =>
        product.companyId === companyId,
    );
  }

  async getCompanyProduct(
    id: number,
  ): Promise<CompanyProduct | undefined> {
    return this.companyProducts.get(id);
  }
}

export const storage = new MemStorage();