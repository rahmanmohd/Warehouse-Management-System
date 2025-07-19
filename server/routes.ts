import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSkuSchema, insertMskuSchema, insertSkuMappingSchema } from "@shared/schema";
import { openaiService } from "./services/openai";
import { fileProcessor } from "./services/fileProcessor";
import multer from "multer";
import path from "path";

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  app.get("/api/dashboard/sales-chart", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const chartData = await storage.getSalesChartData(days);
      res.json(chartData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sales chart data" });
    }
  });

  // SKU routes
  app.get("/api/skus", async (req, res) => {
    try {
      const skus = await storage.getAllSkus();
      res.json(skus);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch SKUs" });
    }
  });

  app.get("/api/skus/unmapped", async (req, res) => {
    try {
      const unmappedSkus = await storage.getUnmappedSkus();
      res.json(unmappedSkus);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unmapped SKUs" });
    }
  });

  app.post("/api/skus", async (req, res) => {
    try {
      const validatedData = insertSkuSchema.parse(req.body);
      const sku = await storage.createSku(validatedData);
      res.status(201).json(sku);
    } catch (error) {
      res.status(400).json({ error: "Invalid SKU data" });
    }
  });

  app.get("/api/skus/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }
      const skus = await storage.searchSkus(query);
      res.json(skus);
    } catch (error) {
      res.status(500).json({ error: "Failed to search SKUs" });
    }
  });

  // MSKU routes
  app.get("/api/mskus", async (req, res) => {
    try {
      const mskus = await storage.getAllMskus();
      res.json(mskus);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch MSKUs" });
    }
  });

  app.post("/api/mskus", async (req, res) => {
    try {
      const validatedData = insertMskuSchema.parse(req.body);
      const msku = await storage.createMsku(validatedData);
      res.status(201).json(msku);
    } catch (error) {
      res.status(400).json({ error: "Invalid MSKU data" });
    }
  });

  app.get("/api/mskus/with-inventory", async (req, res) => {
    try {
      const mskusWithInventory = await storage.getMskusWithInventory();
      res.json(mskusWithInventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch MSKUs with inventory" });
    }
  });

  // SKU Mapping routes
  app.get("/api/mappings", async (req, res) => {
    try {
      const mappings = await storage.getAllMappings();
      res.json(mappings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mappings" });
    }
  });

  app.post("/api/mappings", async (req, res) => {
    try {
      const validatedData = insertSkuMappingSchema.parse(req.body);
      const mapping = await storage.createMapping(validatedData);
      res.status(201).json(mapping);
    } catch (error) {
      res.status(400).json({ error: "Invalid mapping data" });
    }
  });

  app.put("/api/mappings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSkuMappingSchema.partial().parse(req.body);
      const mapping = await storage.updateMapping(id, validatedData);
      if (!mapping) {
        return res.status(404).json({ error: "Mapping not found" });
      }
      res.json(mapping);
    } catch (error) {
      res.status(400).json({ error: "Invalid mapping data" });
    }
  });

  app.delete("/api/mappings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMapping(id);
      if (!success) {
        return res.status(404).json({ error: "Mapping not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete mapping" });
    }
  });

  app.get("/api/mappings/suggestions/:skuId", async (req, res) => {
    try {
      const skuId = parseInt(req.params.skuId);
      const suggestions = await storage.getSuggestedMappings(skuId);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get mapping suggestions" });
    }
  });

  // AI-powered mapping suggestions
  app.post("/api/mappings/ai-suggestions", async (req, res) => {
    try {
      const { skuName, availableMskus } = req.body;
      const suggestions = await openaiService.suggestSkuMapping(skuName, availableMskus);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate AI suggestions" });
    }
  });

  // File upload and processing
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileUpload = await storage.createFileUpload({
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        status: "pending",
        progress: 0,
        rowsProcessed: 0,
        totalRows: 0,
      });

      // Start processing file asynchronously
      fileProcessor.processFile(fileUpload.id, req.file.path, req.file.originalname);

      res.status(201).json(fileUpload);
    } catch (error) {
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  app.get("/api/uploads", async (req, res) => {
    try {
      const uploads = await storage.getFileUploads();
      res.json(uploads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch uploads" });
    }
  });

  app.get("/api/uploads/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const uploads = await storage.getFileUploads();
      const upload = uploads.find(u => u.id === id);
      if (!upload) {
        return res.status(404).json({ error: "Upload not found" });
      }
      res.json(upload);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch upload status" });
    }
  });

  // Sales data routes
  app.get("/api/sales", async (req, res) => {
    try {
      const salesData = await storage.getAllSalesData();
      res.json(salesData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sales data" });
    }
  });

  app.get("/api/sales/top-products", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topProducts = await storage.getTopSellingProducts(limit);
      res.json(topProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top products" });
    }
  });

  // AI Query interface
  app.post("/api/ai/query", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const result = await openaiService.processTextToSQL(query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to process AI query" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", async (req, res) => {
    try {
      const inventory = await storage.getMskusWithInventory();
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  // Seed database endpoint (development only)
  app.post("/api/seed", async (req, res) => {
    try {
      if (process.env.NODE_ENV !== "development") {
        return res.status(403).json({ error: "Seeding only allowed in development" });
      }
      
      const { seedDatabase } = await import("./seedData");
      await seedDatabase();
      res.json({ message: "Database seeded successfully" });
    } catch (error: any) {
      console.error("Seeding error:", error);
      res.status(500).json({ error: "Failed to seed database", details: error?.message || "Unknown error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
