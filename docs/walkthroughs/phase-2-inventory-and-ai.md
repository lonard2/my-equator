# Technical & Engineering Guide: Phase 2 — Materials Inventory, Stock Movements & Khatulistiwa AI Assistant

## 1. Module Overview & Industrial Role

Phase 2 introduces **Materials Inventory & Stock Health Monitoring** alongside **Khatulistiwa AI Assistant** — a conversational intelligence engine that connects natural language factory commands directly to ERP operations.

---

## 2. Materials & Stock Database Schema (`src/lib/db/schema.ts`)

```typescript
// materials Table
export const materials = sqliteTable("materials", {
  id: text("id").primaryKey(),
  sku: text("sku").notNull().unique(), // e.g. MAT-EVA-2MM-BLK
  name: text("name").notNull(),
  category: text("category").notNull(), // EVA_SHEET, LATEX, PU_CHEMICAL, TPU_SHANK, FABRIC, CUTTING_DIE
  unit: text("unit").notNull(), // Sheets (Lembar), Rolls, Kg, Pcs, Meters, Sets
  currentStock: integer("current_stock").notNull().default(0),
  safetyThreshold: integer("safety_threshold").notNull().default(10),
  unitCost: integer("unit_cost").notNull().default(0), // Unit cost in IDR
  location: text("location"), // e.g. Rak A-02
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// inventory_movements Table (Stock IN / OUT mutations with relational link)
export const inventoryMovements = sqliteTable("inventory_movements", {
  id: text("id").primaryKey(),
  materialId: text("material_id").notNull().references(() => materials.id, { onDelete: "restrict" }),
  type: text("type").notNull(), // IN_PURCHASE, IN_RETURN, OUT_PRODUCTION, OUT_WASTAGE, ADJUSTMENT
  quantity: integer("quantity").notNull(),
  referenceNumber: text("reference_number"), // PO or DO reference
  operatorName: text("operator_name").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});
```

---

## 3. Stock Health & Movement Business Logic (`src/services/inventoryService.ts`)

### 3.1 Three-Tier Stock Health Classification
```typescript
export function computeHealthStatus(currentStock: number, safetyThreshold: number): StockHealthStatus {
  if (currentStock <= safetyThreshold * 0.5) {
    return "CRITICAL"; // Red badge, urgent reorder flag
  }
  if (currentStock <= safetyThreshold) {
    return "WARNING";  // Amber badge, reorder recommended
  }
  return "HEALTHY";    // Green badge, stock safe
}
```

### 3.2 Atomic Stock IN/OUT Transactions
When material arrives from a supplier or is dispatched for insole production, the stock count and movement log are recorded within a single atomic database transaction:
```typescript
export async function recordStockMovement(params: {
  materialId: string;
  type: MovementType;
  quantity: number;
  referenceNumber?: string;
  operatorName: string;
  notes?: string;
}) {
  return await db.transaction(async (tx) => {
    const [material] = await tx.select().from(materials).where(eq(materials.id, params.materialId)).limit(1);
    if (!material) throw new Error("Material SKU not found");

    const isIncoming = params.type.startsWith("IN") || params.type === "ADJUSTMENT";
    const delta = isIncoming ? params.quantity : -params.quantity;
    const newStock = Math.max(0, material.currentStock + delta);

    // Update material currentStock
    await tx.update(materials).set({ currentStock: newStock, updatedAt: new Date().toISOString() }).where(eq(materials.id, material.id));

    // Insert audit movement log
    const movementId = `mov-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    await tx.insert(inventoryMovements).values({
      id: movementId,
      materialId: material.id,
      type: params.type,
      quantity: params.quantity,
      referenceNumber: params.referenceNumber,
      operatorName: params.operatorName,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    });

    return { materialId: material.id, newStock, movementId };
  });
}
```

---

## 4. Khatulistiwa AI Assistant Architecture (`src/lib/ai/`)

### 4.1 OpenRouter Multi-Model Roster
All AI operations route through OpenRouter (`https://openrouter.ai/api/v1/chat/completions`) using the model registry configured in [`AGENTS.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/AGENTS.md):
- `google/gemini-3.5-flash-lite`: Default agent engine for general chat and extraction.
- `google/gemini-3.7-flash`: Multimodal camera OCR parser for physical paper delivery slips.
- `qwen/qwen3.7-plus`: Bilingual factory dialect understanding (Indonesian, Sundanese slang, English).

### 4.2 Structured Tool Calling Schemas
The assistant can execute 3 predefined structured tools:

```typescript
export const FACTORY_TOOLS = [
  {
    type: "function",
    function: {
      name: "create_draft_delivery_order",
      description: "Generates a structured draft delivery order from customer request text",
      parameters: {
        type: "object",
        properties: {
          recipientName: { type: "string" },
          destinationAddress: { type: "string" },
          poNumber: { type: "string" },
          articleName: { type: "string" },
          sizes: {
            type: "object",
            description: "Footwear size breakdown mapping EU size to quantity (pairs)",
            properties: {
              "36": { type: "integer" }, "37": { type: "integer" }, "38": { type: "integer" },
              "39": { type: "integer" }, "40": { type: "integer" }, "41": { type: "integer" },
              "42": { type: "integer" }, "43": { type: "integer" }, "44": { type: "integer" },
              "45": { type: "integer" },
            },
          },
          unitPrice: { type: "integer" },
        },
        required: ["recipientName", "articleName", "sizes"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_material_stock",
      description: "Queries current raw material inventory levels by SKU or category",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
      },
    },
  },
];
```

### 4.3 Chat-to-DO 1-Click Staging Workflow
When the operator types:  
`"Tolong buatkan surat jalan untuk PT Bintang Sepatu Cimahi, insole ortho size 39 ada 50 pasang, size 40 ada 100 pasang, size 41 ada 100 pasang, harga 22.000"`  
1. Khatulistiwa AI invokes `create_draft_delivery_order`.
2. The UI renders an interactive preview card with total pairs calculated (250 pasang, Rp 5.500.000).
3. Clicking **"Terapkan ke Form DO"** opens `OrderFormModal` pre-filled and ready for 1-click confirmation.

---

## 5. How to Build & Test Phase 2

1. **Verify Inventory Endpoints:**
   `GET /api/inventory/materials`, `GET /api/inventory/movements`, `GET /api/inventory/summary`.
2. **Test Stock IN/OUT Mutation:**
   ```bash
   curl -X POST http://localhost:3000/api/inventory/movements \
     -H "Content-Type: application/json" \
     -d '{"materialId":"mat-eva-2mm-blk","type":"IN_PURCHASE","quantity":100,"operatorName":"Asep","referenceNumber":"PO-SUP-08"}'
   ```
3. **Verify Production Build:**
   ```bash
   npm run build
   ```
