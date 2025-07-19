import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const skus = sqliteTable("skus", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  marketplace: text("marketplace").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const mskus = sqliteTable("mskus", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  msku: text("msku").notNull().unique(),
  name: text("name").notNull(),
  category: text("category"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const skuMappings = sqliteTable("sku_mappings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skuId: integer("sku_id").notNull().references(() => skus.id),
  mskuId: integer("msku_id").notNull().references(() => mskus.id),
  confidence: real("confidence").default(1.00),
  status: text("status").notNull().default("active"), // active, pending, inactive
  mappedBy: text("mapped_by").default("manual"), // manual, ai, auto
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const inventory = sqliteTable("inventory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mskuId: integer("msku_id").notNull().references(() => mskus.id),
  warehouse: text("warehouse").notNull(),
  quantity: integer("quantity").notNull().default(0),
  reservedQuantity: integer("reserved_quantity").notNull().default(0),
  lastUpdated: integer("last_updated", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const salesData = sqliteTable("sales_data", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skuId: integer("sku_id").notNull().references(() => skus.id),
  mskuId: integer("msku_id").references(() => mskus.id),
  orderDate: integer("order_date", { mode: "timestamp" }).notNull(),
  quantity: integer("quantity").notNull(),
  revenue: real("revenue").notNull(),
  marketplace: text("marketplace").notNull(),
  rawData: text("raw_data", { mode: "json" }), // Store original CSV row data as JSON text
  processedAt: integer("processed_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const fileUploads = sqliteTable("file_uploads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  progress: integer("progress").default(0),
  rowsProcessed: integer("rows_processed").default(0),
  totalRows: integer("total_rows").default(0),
  errorMessage: text("error_message"),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
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
