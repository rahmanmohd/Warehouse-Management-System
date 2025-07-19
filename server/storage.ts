import { 
  users, skus, mskus, skuMappings, inventory, salesData, fileUploads,
  type User, type InsertUser, type Sku, type InsertSku, type Msku, type InsertMsku,
  type SkuMapping, type InsertSkuMapping, type Inventory, type InsertInventory,
  type SalesData, type InsertSalesData, type FileUpload, type InsertFileUpload,
  type SkuWithMapping, type MskuWithInventory, type SalesDataWithDetails, type DashboardMetrics
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sum, sql, and, or, like, isNull } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // SKU methods
  getAllSkus(): Promise<Sku[]>;
  getSkuByCode(sku: string): Promise<Sku | undefined>;
  createSku(sku: InsertSku): Promise<Sku>;
  getUnmappedSkus(): Promise<SkuWithMapping[]>;
  searchSkus(query: string): Promise<Sku[]>;

  // MSKU methods
  getAllMskus(): Promise<Msku[]>;
  getMskuByCode(msku: string): Promise<Msku | undefined>;
  createMsku(msku: InsertMsku): Promise<Msku>;
  getMskusWithInventory(): Promise<MskuWithInventory[]>;

  // SKU Mapping methods
  getAllMappings(): Promise<(SkuMapping & { sku: Sku; msku: Msku })[]>;
  createMapping(mapping: InsertSkuMapping): Promise<SkuMapping>;
  updateMapping(id: number, mapping: Partial<InsertSkuMapping>): Promise<SkuMapping | undefined>;
  deleteMapping(id: number): Promise<boolean>;
  getSuggestedMappings(skuId: number): Promise<Msku[]>;

  // Inventory methods
  getInventoryByMsku(mskuId: number): Promise<Inventory[]>;
  updateInventory(inventory: InsertInventory): Promise<Inventory>;

  // Sales Data methods
  getAllSalesData(): Promise<SalesDataWithDetails[]>;
  createSalesData(salesData: InsertSalesData): Promise<SalesData>;
  getSalesDataByDateRange(startDate: Date, endDate: Date): Promise<SalesDataWithDetails[]>;
  getTopSellingProducts(limit: number): Promise<{ msku: Msku; totalRevenue: string; totalQuantity: number }[]>;

  // File Upload methods
  createFileUpload(fileUpload: InsertFileUpload): Promise<FileUpload>;
  updateFileUpload(id: number, updates: Partial<InsertFileUpload>): Promise<FileUpload | undefined>;
  getFileUploads(): Promise<FileUpload[]>;

  // Dashboard methods
  getDashboardMetrics(): Promise<DashboardMetrics>;
  getSalesChartData(days: number): Promise<{ date: string; revenue: string }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllSkus(): Promise<Sku[]> {
    return await db.select().from(skus).orderBy(desc(skus.createdAt));
  }

  async getSkuByCode(sku: string): Promise<Sku | undefined> {
    const [result] = await db.select().from(skus).where(eq(skus.sku, sku));
    return result || undefined;
  }

  async createSku(insertSku: InsertSku): Promise<Sku> {
    const [sku] = await db.insert(skus).values(insertSku).returning();
    return sku;
  }

  async getUnmappedSkus(): Promise<SkuWithMapping[]> {
    const unmappedSkus = await db
      .select({
        id: skus.id,
        sku: skus.sku,
        name: skus.name,
        marketplace: skus.marketplace,
        createdAt: skus.createdAt,
      })
      .from(skus)
      .leftJoin(skuMappings, eq(skus.id, skuMappings.skuId))
      .where(isNull(skuMappings.id))
      .orderBy(desc(skus.createdAt));

    return unmappedSkus;
  }

  async searchSkus(query: string): Promise<Sku[]> {
    return await db
      .select()
      .from(skus)
      .where(or(
        like(skus.sku, `%${query}%`),
        like(skus.name, `%${query}%`)
      ))
      .orderBy(desc(skus.createdAt))
      .limit(10);
  }

  async getAllMskus(): Promise<Msku[]> {
    return await db.select().from(mskus).orderBy(desc(mskus.createdAt));
  }

  async getMskuByCode(msku: string): Promise<Msku | undefined> {
    const [result] = await db.select().from(mskus).where(eq(mskus.msku, msku));
    return result || undefined;
  }

  async createMsku(insertMsku: InsertMsku): Promise<Msku> {
    const [msku] = await db.insert(mskus).values(insertMsku).returning();
    return msku;
  }

  async getMskusWithInventory(): Promise<MskuWithInventory[]> {
    const results = await db
      .select({
        id: mskus.id,
        msku: mskus.msku,
        name: mskus.name,
        category: mskus.category,
        createdAt: mskus.createdAt,
        totalQuantity: sql<number>`COALESCE(SUM(${inventory.quantity}), 0)`.as('totalQuantity'),
      })
      .from(mskus)
      .leftJoin(inventory, eq(mskus.id, inventory.mskuId))
      .groupBy(mskus.id, mskus.msku, mskus.name, mskus.category, mskus.createdAt)
      .orderBy(desc(mskus.createdAt));

    return results.map(result => ({
      ...result,
      inventory: [], // Will be populated separately if needed
    }));
  }

  async getAllMappings(): Promise<(SkuMapping & { sku: Sku; msku: Msku })[]> {
    return await db
      .select({
        id: skuMappings.id,
        skuId: skuMappings.skuId,
        mskuId: skuMappings.mskuId,
        confidence: skuMappings.confidence,
        status: skuMappings.status,
        mappedBy: skuMappings.mappedBy,
        createdAt: skuMappings.createdAt,
        sku: skus,
        msku: mskus,
      })
      .from(skuMappings)
      .innerJoin(skus, eq(skuMappings.skuId, skus.id))
      .innerJoin(mskus, eq(skuMappings.mskuId, mskus.id))
      .orderBy(desc(skuMappings.createdAt));
  }

  async createMapping(mapping: InsertSkuMapping): Promise<SkuMapping> {
    const [result] = await db.insert(skuMappings).values(mapping).returning();
    return result;
  }

  async updateMapping(id: number, mapping: Partial<InsertSkuMapping>): Promise<SkuMapping | undefined> {
    const [result] = await db
      .update(skuMappings)
      .set(mapping)
      .where(eq(skuMappings.id, id))
      .returning();
    return result || undefined;
  }

  async deleteMapping(id: number): Promise<boolean> {
    const result = await db.delete(skuMappings).where(eq(skuMappings.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getSuggestedMappings(skuId: number): Promise<Msku[]> {
    // Simple suggestion based on name similarity
    const [sku] = await db.select().from(skus).where(eq(skus.id, skuId));
    if (!sku) return [];

    return await db
      .select()
      .from(mskus)
      .where(like(mskus.name, `%${sku.name.split('-')[0]}%`))
      .limit(5);
  }

  async getInventoryByMsku(mskuId: number): Promise<Inventory[]> {
    return await db.select().from(inventory).where(eq(inventory.mskuId, mskuId));
  }

  async updateInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const [result] = await db.insert(inventory).values(insertInventory).returning();
    return result;
  }

  async getAllSalesData(): Promise<SalesDataWithDetails[]> {
    const results = await db
      .select({
        id: salesData.id,
        skuId: salesData.skuId,
        mskuId: salesData.mskuId,
        orderDate: salesData.orderDate,
        quantity: salesData.quantity,
        revenue: salesData.revenue,
        marketplace: salesData.marketplace,
        rawData: salesData.rawData,
        processedAt: salesData.processedAt,
        sku: skus,
        msku: mskus,
      })
      .from(salesData)
      .innerJoin(skus, eq(salesData.skuId, skus.id))
      .leftJoin(mskus, eq(salesData.mskuId, mskus.id))
      .orderBy(desc(salesData.orderDate));

    return results.map(result => ({
      ...result,
      msku: result.msku || undefined,
    })) as SalesDataWithDetails[];
  }

  async createSalesData(insertSalesData: InsertSalesData): Promise<SalesData> {
    const [result] = await db.insert(salesData).values(insertSalesData).returning();
    return result;
  }

  async getSalesDataByDateRange(startDate: Date, endDate: Date): Promise<SalesDataWithDetails[]> {
    const results = await db
      .select({
        id: salesData.id,
        skuId: salesData.skuId,
        mskuId: salesData.mskuId,
        orderDate: salesData.orderDate,
        quantity: salesData.quantity,
        revenue: salesData.revenue,
        marketplace: salesData.marketplace,
        rawData: salesData.rawData,
        processedAt: salesData.processedAt,
        sku: skus,
        msku: mskus,
      })
      .from(salesData)
      .innerJoin(skus, eq(salesData.skuId, skus.id))
      .leftJoin(mskus, eq(salesData.mskuId, mskus.id))
      .where(and(
        sql`${salesData.orderDate} >= ${startDate}`,
        sql`${salesData.orderDate} <= ${endDate}`
      ))
      .orderBy(desc(salesData.orderDate));

    return results.map(result => ({
      ...result,
      msku: result.msku || undefined,
    })) as SalesDataWithDetails[];
  }

  async getTopSellingProducts(limit: number): Promise<{ msku: Msku; totalRevenue: string; totalQuantity: number }[]> {
    return await db
      .select({
        msku: mskus,
        totalRevenue: sql<string>`SUM(${salesData.revenue})::text`.as('totalRevenue'),
        totalQuantity: sql<number>`SUM(${salesData.quantity})`.as('totalQuantity'),
      })
      .from(salesData)
      .innerJoin(mskus, eq(salesData.mskuId, mskus.id))
      .groupBy(mskus.id, mskus.msku, mskus.name, mskus.category, mskus.createdAt)
      .orderBy(desc(sql`SUM(${salesData.revenue})`))
      .limit(limit);
  }

  async createFileUpload(fileUpload: InsertFileUpload): Promise<FileUpload> {
    const [result] = await db.insert(fileUploads).values(fileUpload).returning();
    return result;
  }

  async updateFileUpload(id: number, updates: Partial<InsertFileUpload>): Promise<FileUpload | undefined> {
    const [result] = await db
      .update(fileUploads)
      .set(updates)
      .where(eq(fileUploads.id, id))
      .returning();
    return result || undefined;
  }

  async getFileUploads(): Promise<FileUpload[]> {
    return await db.select().from(fileUploads).orderBy(desc(fileUploads.uploadedAt));
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [totalSkusResult] = await db.select({ count: count() }).from(skus);
    const [mappedSkusResult] = await db.select({ count: count() }).from(skuMappings);
    const [pendingMappingsResult] = await db
      .select({ count: count() })
      .from(skuMappings)
      .where(eq(skuMappings.status, 'pending'));
    
    const [revenueResult] = await db
      .select({ 
        total: sql<string>`SUM(${salesData.revenue})::text`.as('total'),
        lastWeek: sql<string>`SUM(CASE WHEN ${salesData.orderDate} >= NOW() - INTERVAL '7 days' THEN ${salesData.revenue} ELSE 0 END)::text`.as('lastWeek'),
        previousWeek: sql<string>`SUM(CASE WHEN ${salesData.orderDate} >= NOW() - INTERVAL '14 days' AND ${salesData.orderDate} < NOW() - INTERVAL '7 days' THEN ${salesData.revenue} ELSE 0 END)::text`.as('previousWeek')
      })
      .from(salesData);

    const totalRevenue = revenueResult?.total || '0';
    const lastWeekRevenue = parseFloat(revenueResult?.lastWeek || '0');
    const previousWeekRevenue = parseFloat(revenueResult?.previousWeek || '0');
    const revenueChange = previousWeekRevenue > 0 
      ? `${(((lastWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100).toFixed(1)}%`
      : '0%';

    const mappingRate = totalSkusResult.count > 0 
      ? `${((mappedSkusResult.count / totalSkusResult.count) * 100).toFixed(1)}%`
      : '0%';

    return {
      totalSkus: totalSkusResult.count,
      mappedSkus: mappedSkusResult.count,
      pendingMappings: pendingMappingsResult.count,
      totalRevenue,
      revenueChange,
      mappingRate,
    };
  }

  async getSalesChartData(days: number): Promise<{ date: string; revenue: string }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await db
      .select({
        date: sql<string>`DATE(${salesData.orderDate})::text`.as('date'),
        revenue: sql<string>`SUM(${salesData.revenue})::text`.as('revenue'),
      })
      .from(salesData)
      .where(sql`${salesData.orderDate} >= ${startDate}`)
      .groupBy(sql`DATE(${salesData.orderDate})`)
      .orderBy(sql`DATE(${salesData.orderDate})`);
  }
}

export const storage = new DatabaseStorage();
