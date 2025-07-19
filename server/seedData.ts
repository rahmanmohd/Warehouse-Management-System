import { db } from "./db";
import { users, skus, mskus, skuMappings, inventory, salesData } from "@shared/schema";

export async function seedDatabase() {
  try {
    console.log("Seeding database with sample data...");

    // Create sample user
    const [user] = await db.insert(users).values({
      username: "admin",
      password: "password123", // In production, this would be hashed
    }).returning();

    // Create sample MSKUs
    const mskuData = [
      { msku: "CSTLE-PEN", name: "Castle Pen Collection", category: "Stationery" },
      { msku: "GOLDEN-APPLE", name: "Golden Apple Premium", category: "Electronics" },
      { msku: "TECH-GADGET", name: "Tech Gadget Pro", category: "Electronics" },
      { msku: "HOME-DECOR", name: "Home Decoration Set", category: "Home & Garden" },
      { msku: "SPORTS-GEAR", name: "Sports Equipment", category: "Sports" }
    ];

    const createdMskus = await db.insert(mskus).values(mskuData).returning();

    // Create sample SKUs
    const skuData = [
      { sku: "pen", name: "Basic Pen", marketplace: "flipkart" },
      { sku: "cstle-pen", name: "Castle Pen", marketplace: "flipkart" },
      { sku: "pen-blue", name: "Blue Pen", marketplace: "amazon" },
      { sku: "pen-blue2", name: "Blue Pen v2", marketplace: "shopify" },
      { sku: "golden-apple-1", name: "Golden Apple Device", marketplace: "amazon" },
      { sku: "tech-pro-x", name: "Tech Pro X", marketplace: "flipkart" },
      { sku: "home-set-basic", name: "Home Basic Set", marketplace: "amazon" },
      { sku: "sports-kit-1", name: "Sports Kit Essential", marketplace: "shopify" }
    ];

    const createdSkus = await db.insert(skus).values(skuData).returning();

    // Create SKU mappings
    const mappingData = [
      { skuId: createdSkus[0].id, mskuId: createdMskus[0].id, confidence: "0.95", mappedBy: "ai" },
      { skuId: createdSkus[1].id, mskuId: createdMskus[0].id, confidence: "0.98", mappedBy: "manual" },
      { skuId: createdSkus[2].id, mskuId: createdMskus[0].id, confidence: "0.85", mappedBy: "ai" },
      { skuId: createdSkus[3].id, mskuId: createdMskus[0].id, confidence: "0.90", mappedBy: "manual" },
      { skuId: createdSkus[4].id, mskuId: createdMskus[1].id, confidence: "0.99", mappedBy: "manual" },
      { skuId: createdSkus[5].id, mskuId: createdMskus[2].id, confidence: "0.92", mappedBy: "ai" },
      { skuId: createdSkus[6].id, mskuId: createdMskus[3].id, confidence: "0.88", mappedBy: "manual" }
    ];

    await db.insert(skuMappings).values(mappingData);

    // Create inventory data
    const inventoryData = [
      { mskuId: createdMskus[0].id, warehouse: "WH-001", quantity: 150, reservedQuantity: 10 },
      { mskuId: createdMskus[0].id, warehouse: "WH-002", quantity: 85, reservedQuantity: 5 },
      { mskuId: createdMskus[1].id, warehouse: "WH-001", quantity: 45, reservedQuantity: 8 },
      { mskuId: createdMskus[2].id, warehouse: "WH-001", quantity: 75, reservedQuantity: 12 },
      { mskuId: createdMskus[2].id, warehouse: "WH-003", quantity: 32, reservedQuantity: 2 },
      { mskuId: createdMskus[3].id, warehouse: "WH-002", quantity: 0, reservedQuantity: 0 },
      { mskuId: createdMskus[4].id, warehouse: "WH-001", quantity: 8, reservedQuantity: 3 }
    ];

    await db.insert(inventory).values(inventoryData);

    // Create sales data for the last 30 days
    const salesDataArray = [];
    const today = new Date();
    
    for (let i = 0; i < 50; i++) {
      const randomDays = Math.floor(Math.random() * 30);
      const orderDate = new Date(today);
      orderDate.setDate(today.getDate() - randomDays);
      
      const randomSkuIndex = Math.floor(Math.random() * createdSkus.length);
      const randomSku = createdSkus[randomSkuIndex];
      
      // Find mapping for this SKU
      const mapping = mappingData.find(m => m.skuId === randomSku.id);
      
      salesDataArray.push({
        skuId: randomSku.id,
        mskuId: mapping?.mskuId || null,
        orderDate,
        quantity: Math.floor(Math.random() * 5) + 1,
        revenue: (Math.random() * 100 + 10).toFixed(2),
        marketplace: randomSku.marketplace,
        rawData: {
          originalOrderId: `ORD-${Date.now()}-${i}`,
          customerRegion: ["North", "South", "East", "West"][Math.floor(Math.random() * 4)]
        }
      });
    }

    await db.insert(salesData).values(salesDataArray);

    console.log("Database seeding completed successfully!");
    console.log(`Created:
    - 1 user
    - ${createdMskus.length} MSKUs
    - ${createdSkus.length} SKUs
    - ${mappingData.length} mappings
    - ${inventoryData.length} inventory records
    - ${salesDataArray.length} sales records`);

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}