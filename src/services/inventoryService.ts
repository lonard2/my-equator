import { db } from "@/lib/db";
import { materials, inventoryMovements } from "@/lib/db/schema";
import { MaterialItem, MaterialCategory, StockHealthStatus, StockMovement, MovementType } from "@/types";
import { eq, desc, sql } from "drizzle-orm";
import crypto from "crypto";

export class InventoryService {
  /**
   * Helper to compute stock health status based on current stock vs safety threshold
   */
  static computeHealthStatus(currentStock: number, safetyThreshold: number): StockHealthStatus {
    if (currentStock <= safetyThreshold * 0.5) {
      return "CRITICAL";
    }
    if (currentStock <= safetyThreshold) {
      return "WARNING";
    }
    return "HEALTHY";
  }

  /**
   * Retrieves all materials with computed health status
   */
  static async getAllMaterials(): Promise<MaterialItem[]> {
    const rows = await db.select().from(materials).orderBy(desc(materials.createdAt));

    return rows.map((m) => ({
      id: m.id,
      sku: m.sku,
      name: m.name,
      category: m.category as MaterialCategory,
      unit: m.unit,
      currentStock: m.currentStock,
      safetyThreshold: m.safetyThreshold,
      unitCost: m.unitCost,
      location: m.location || undefined,
      healthStatus: this.computeHealthStatus(m.currentStock, m.safetyThreshold),
      notes: m.notes || undefined,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }

  /**
   * Retrieves single material by ID
   */
  static async getMaterialById(id: string): Promise<MaterialItem | null> {
    const rows = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
    if (rows.length === 0) return null;
    const m = rows[0];

    return {
      id: m.id,
      sku: m.sku,
      name: m.name,
      category: m.category as MaterialCategory,
      unit: m.unit,
      currentStock: m.currentStock,
      safetyThreshold: m.safetyThreshold,
      unitCost: m.unitCost,
      location: m.location || undefined,
      healthStatus: this.computeHealthStatus(m.currentStock, m.safetyThreshold),
      notes: m.notes || undefined,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  }

  /**
   * Creates a new material SKU
   */
  static async createMaterial(data: {
    sku: string;
    name: string;
    category: MaterialCategory;
    unit: string;
    currentStock?: number;
    safetyThreshold?: number;
    unitCost?: number;
    location?: string;
    notes?: string;
  }): Promise<MaterialItem> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const currentStock = data.currentStock || 0;
    const safetyThreshold = data.safetyThreshold !== undefined ? data.safetyThreshold : 10;
    const unitCost = data.unitCost || 0;

    await db.insert(materials).values({
      id,
      sku: data.sku.toUpperCase(),
      name: data.name,
      category: data.category,
      unit: data.unit,
      currentStock,
      safetyThreshold,
      unitCost,
      location: data.location || null,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
    });

    // If initial stock was provided > 0, log an initial intake movement
    if (currentStock > 0) {
      await db.insert(inventoryMovements).values({
        id: crypto.randomUUID(),
        materialId: id,
        type: "IN_PURCHASE",
        quantity: currentStock,
        referenceNumber: "INIT-STOCK",
        operatorName: "System Initialization",
        notes: "Saldo awal inventaris pabrik",
        createdAt: now,
      });
    }

    const created = await this.getMaterialById(id);
    return created!;
  }

  /**
   * Updates an existing material
   */
  static async updateMaterial(
    id: string,
    data: {
      name?: string;
      category?: MaterialCategory;
      unit?: string;
      safetyThreshold?: number;
      unitCost?: number;
      location?: string;
      notes?: string;
    }
  ): Promise<MaterialItem | null> {
    const existing = await this.getMaterialById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    await db
      .update(materials)
      .set({
        name: data.name !== undefined ? data.name : existing.name,
        category: data.category !== undefined ? data.category : existing.category,
        unit: data.unit !== undefined ? data.unit : existing.unit,
        safetyThreshold: data.safetyThreshold !== undefined ? data.safetyThreshold : existing.safetyThreshold,
        unitCost: data.unitCost !== undefined ? data.unitCost : existing.unitCost,
        location: data.location !== undefined ? data.location : existing.location,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        updatedAt: now,
      })
      .where(eq(materials.id, id));

    return this.getMaterialById(id);
  }

  /**
   * Records a stock movement (IN/OUT/ADJUSTMENT) and updates material currentStock atomically
   */
  static async recordMovement(data: {
    materialId: string;
    type: MovementType;
    quantity: number; // positive number
    referenceNumber?: string;
    operatorName: string;
    notes?: string;
  }): Promise<{ movement: StockMovement; updatedMaterial: MaterialItem }> {
    const material = await this.getMaterialById(data.materialId);
    if (!material) {
      throw new Error(`Material with ID ${data.materialId} not found`);
    }

    const qty = Math.abs(data.quantity);
    let newStock = material.currentStock;

    switch (data.type) {
      case "IN_PURCHASE":
      case "IN_RETURN":
        newStock += qty;
        break;
      case "OUT_PRODUCTION":
      case "OUT_WASTAGE":
        newStock = Math.max(0, newStock - qty);
        break;
      case "ADJUSTMENT":
        // For adjustment, quantity represents the new absolute stock count
        newStock = qty;
        break;
    }

    const now = new Date().toISOString();
    const movementId = crypto.randomUUID();

    // Perform database updates
    await db
      .update(materials)
      .set({
        currentStock: newStock,
        updatedAt: now,
      })
      .where(eq(materials.id, data.materialId));

    await db.insert(inventoryMovements).values({
      id: movementId,
      materialId: data.materialId,
      type: data.type,
      quantity: data.quantity,
      referenceNumber: data.referenceNumber || null,
      operatorName: data.operatorName,
      notes: data.notes || null,
      createdAt: now,
    });

    const updated = (await this.getMaterialById(data.materialId))!;

    const movement: StockMovement = {
      id: movementId,
      materialId: data.materialId,
      materialName: material.name,
      type: data.type,
      quantity: data.quantity,
      referenceNumber: data.referenceNumber,
      operatorName: data.operatorName,
      notes: data.notes,
      createdAt: now,
    };

    return { movement, updatedMaterial: updated };
  }

  /**
   * Retrieves movement history log with material names
   */
  static async getMovements(materialId?: string): Promise<StockMovement[]> {
    const baseQuery = db
      .select({
        id: inventoryMovements.id,
        materialId: inventoryMovements.materialId,
        materialName: materials.name,
        type: inventoryMovements.type,
        quantity: inventoryMovements.quantity,
        referenceNumber: inventoryMovements.referenceNumber,
        operatorName: inventoryMovements.operatorName,
        notes: inventoryMovements.notes,
        createdAt: inventoryMovements.createdAt,
      })
      .from(inventoryMovements)
      .leftJoin(materials, eq(inventoryMovements.materialId, materials.id))
      .orderBy(desc(inventoryMovements.createdAt));

    const rows = materialId
      ? await baseQuery.where(eq(inventoryMovements.materialId, materialId)).limit(100)
      : await baseQuery.limit(100);

    return rows.map((r) => ({
      id: r.id,
      materialId: r.materialId,
      materialName: r.materialName || "Unknown Material",
      type: r.type as MovementType,
      quantity: r.quantity,
      referenceNumber: r.referenceNumber || undefined,
      operatorName: r.operatorName,
      notes: r.notes || undefined,
      createdAt: r.createdAt,
    }));
  }

  /**
   * Retrieves overall inventory KPI summary
   */
  static async getInventorySummary(): Promise<{
    totalSkus: number;
    totalValuationIDR: number;
    lowStockCount: number;
    criticalStockCount: number;
    categoryCounts: Record<MaterialCategory, number>;
  }> {
    const allMaterials = await this.getAllMaterials();

    let totalValuationIDR = 0;
    let lowStockCount = 0;
    let criticalStockCount = 0;

    const categoryCounts: Record<MaterialCategory, number> = {
      EVA_SHEET: 0,
      LATEX: 0,
      PU_CHEMICAL: 0,
      TPU_SHANK: 0,
      FABRIC: 0,
      CUTTING_DIE: 0,
    };

    for (const m of allMaterials) {
      totalValuationIDR += m.currentStock * m.unitCost;
      if (m.healthStatus === "CRITICAL") criticalStockCount++;
      if (m.healthStatus === "WARNING") lowStockCount++;
      if (categoryCounts[m.category] !== undefined) {
        categoryCounts[m.category]++;
      }
    }

    return {
      totalSkus: allMaterials.length,
      totalValuationIDR,
      lowStockCount,
      criticalStockCount,
      categoryCounts,
    };
  }

  /**
   * Deletes a material SKU
   */
  static async deleteMaterial(id: string): Promise<boolean> {
    await db.delete(materials).where(eq(materials.id, id));
    return true;
  }
}
