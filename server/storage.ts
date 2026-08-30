import {
  users,
  companyProducts,
  companyOrders,
  type User,
  type InsertUser,
  type CompanyProduct,
  type InsertCompanyProduct,
  type CompanyOrder,
  type InsertCompanyOrder,
} from "@shared/schema";

// =========================
// Storage Interface
// =========================

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;

  getUserByUsername(
    username: string,
  ): Promise<User | undefined>;

  createUser(
    user: InsertUser,
  ): Promise<User>;

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

  // Company Order methods
  createCompanyOrder(
    order: InsertCompanyOrder,
  ): Promise<CompanyOrder>;

  getCompanyOrders(
    companyId: number,
  ): Promise<CompanyOrder[]>;

  getCompanyOrder(
    id: number,
  ): Promise<CompanyOrder | undefined>;
}

// =========================
// Memory Storage
// =========================

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private companyProducts: Map<number, CompanyProduct>;
  private companyOrders: Map<number, CompanyOrder>;

  private userCurrentId: number;
  private companyProductCurrentId: number;
  private companyOrderCurrentId: number;

  constructor() {
    this.users = new Map();
    this.companyProducts = new Map();
    this.companyOrders = new Map();

    this.userCurrentId = 1;
    this.companyProductCurrentId = 1;
    this.companyOrderCurrentId = 1;
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
    return Array.from(
      this.users.values(),
    ).find(
      (user) =>
        user.username === username,
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
      role:
        insertUser.role ??
        "farmer",
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
    const id =
      this.companyProductCurrentId++;

    const companyProduct: CompanyProduct = {
      id,
      companyId: product.companyId,
      category: product.category,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      description: product.description,
      manufacturer:
        product.manufacturer ?? null,
      specifications:
        product.specifications ?? null,
      imageUrl:
        product.imageUrl ?? null,
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

  // =========================
  // Company Order methods
  // =========================

  async createCompanyOrder(
    order: InsertCompanyOrder,
  ): Promise<CompanyOrder> {
    const id =
      this.companyOrderCurrentId++;

    const companyOrder: CompanyOrder = {
      id,
      companyId: order.companyId,
      crop: order.crop,
      quantity: order.quantity,
      gradeQuality: order.gradeQuality,
      totalCost: order.totalCost,
      status:
        order.status ?? "pending",
    };

    this.companyOrders.set(
      id,
      companyOrder,
    );

    return companyOrder;
  }

  async getCompanyOrders(
    companyId: number,
  ): Promise<CompanyOrder[]> {
    return Array.from(
      this.companyOrders.values(),
    ).filter(
      (order) =>
        order.companyId === companyId,
    );
  }

  async getCompanyOrder(
    id: number,
  ): Promise<CompanyOrder | undefined> {
    return this.companyOrders.get(id);
  }
}

// =========================
// Storage instance
// =========================

export const storage =
  new MemStorage();