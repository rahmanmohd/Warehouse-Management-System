import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const skus = pgTable("skus", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  marketplace: text("marketplace").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mskus = pgTable("mskus", {
  id: serial("id").primaryKey(),
  msku: text("msku").notNull().unique(),
  name: text("name").notNull(),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const skuMappings = pgTable("sku_mappings", {
  id: serial("id").primaryKey(),
  skuId: integer("sku_id").notNull().references(() => skus.id),
  mskuId: integer("msku_id").notNull().references(() => mskus.id),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("1.00"),
  status: text("status").notNull().default("active"), // active, pending, inactive
  mappedBy: text("mapped_by").default("manual"), // manual, ai, auto
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  mskuId: integer("msku_id").notNull().references(() => mskus.id),
  warehouse: text("warehouse").notNull(),
  quantity: integer("quantity").notNull().default(0),
  reservedQuantity: integer("reserved_quantity").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const salesData = pgTable("sales_data", {
  id: serial("id").primaryKey(),
  skuId: integer("sku_id").notNull().references(() => skus.id),
  mskuId: integer("msku_id").references(() => mskus.id),
  orderDate: timestamp("order_date").notNull(),
  quantity: integer("quantity").notNull(),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).notNull(),
  marketplace: text("marketplace").notNull(),
  rawData: jsonb("raw_data"), // Store original CSV row data
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});

export const fileUploads = pgTable("file_uploads", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  progress: integer("progress").default(0),
  rowsProcessed: integer("rows_processed").default(0),
  totalRows: integer("total_rows").default(0),
  errorMessage: text("error_message"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Relations
export const skuRelations = relations(skus, ({ many }) => ({
  mappings: many(skuMappings),
  salesData: many(salesData),
}));

export const mskuRelations = relations(mskus, ({ many }) => ({
  mappings: many(skuMappings),
  inventory: many(inventory),
  salesData: many(salesData),
}));

export const skuMappingRelations = relations(skuMappings, ({ one }) => ({
  sku: one(skus, {
    fields: [skuMappings.skuId],
    references: [skus.id],
  }),
  msku: one(mskus, {
    fields: [skuMappings.mskuId],
    references: [mskus.id],
  }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  msku: one(mskus, {
    fields: [inventory.mskuId],
    references: [mskus.id],
  }),
}));

export const salesDataRelations = relations(salesData, ({ one }) => ({
  sku: one(skus, {
    fields: [salesData.skuId],
    references: [skus.id],
  }),
  msku: one(mskus, {
    fields: [salesData.mskuId],
    references: [mskus.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSkuSchema = createInsertSchema(skus).pick({
  sku: true,
  name: true,
  marketplace: true,
});

export const insertMskuSchema = createInsertSchema(mskus).pick({
  msku: true,
  name: true,
  category: true,
});

export const insertSkuMappingSchema = createInsertSchema(skuMappings).pick({
  skuId: true,
  mskuId: true,
  confidence: true,
  status: true,
  mappedBy: true,
});

export const insertInventorySchema = createInsertSchema(inventory).pick({
  mskuId: true,
  warehouse: true,
  quantity: true,
  reservedQuantity: true,
});

export const insertSalesDataSchema = createInsertSchema(salesData).pick({
  skuId: true,
  mskuId: true,
  orderDate: true,
  quantity: true,
  revenue: true,
  marketplace: true,
  rawData: true,
});

export const insertFileUploadSchema = createInsertSchema(fileUploads).pick({
  filename: true,
  originalName: true,
  fileSize: true,
  mimeType: true,
  status: true,
  progress: true,
  rowsProcessed: true,
  totalRows: true,
  errorMessage: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSku = z.infer<typeof insertSkuSchema>;
export type Sku = typeof skus.$inferSelect;

export type InsertMsku = z.infer<typeof insertMskuSchema>;
export type Msku = typeof mskus.$inferSelect;

export type InsertSkuMapping = z.infer<typeof insertSkuMappingSchema>;
export type SkuMapping = typeof skuMappings.$inferSelect;

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

export type InsertSalesData = z.infer<typeof insertSalesDataSchema>;
export type SalesData = typeof salesData.$inferSelect;

export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;
export type FileUpload = typeof fileUploads.$inferSelect;

// Additional types for API responses
export type SkuWithMapping = Sku & {
  mapping?: SkuMapping & { msku: Msku };
};

export type MskuWithInventory = Msku & {
  inventory: Inventory[];
  totalQuantity: number;
};

export type SalesDataWithDetails = SalesData & {
  sku: Sku;
  msku?: Msku;
};

export type DashboardMetrics = {
  totalSkus: number;
  mappedSkus: number;
  pendingMappings: number;
  totalRevenue: string;
  revenueChange: string;
  mappingRate: string;
};
