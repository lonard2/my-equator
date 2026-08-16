import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// 1. Delivery Orders (Surat Jalan)
export const deliveryOrders = sqliteTable("delivery_orders", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  recipientName: text("recipient_name").notNull(),
  destinationAddress: text("destination_address").notNull(),
  poNumber: text("po_number"),
  vehicleNumber: text("vehicle_number"),
  driverName: text("driver_name"),
  status: text("status", {
    enum: ["DRAFT", "CONFIRMED", "PRINTED", "DISPATCHED", "DELIVERED", "CANCELLED"],
  }).notNull().default("DRAFT"),
  deliveryDate: text("delivery_date").notNull(),
  notes: text("notes"),
  totalQuantity: integer("total_quantity").notNull().default(0),
  totalAmount: integer("total_amount").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 2. Delivery Order Line Items with Footwear Size Matrix
export const deliveryOrderItems = sqliteTable("delivery_order_items", {
  id: text("id").primaryKey(),
  deliveryOrderId: text("delivery_order_id")
    .notNull()
    .references(() => deliveryOrders.id, { onDelete: "cascade" }),
  articleCode: text("article_code").notNull(),
  articleName: text("article_name").notNull(),
  colorway: text("colorway"),
  sizeBreakdown: text("size_breakdown").notNull(), // JSON string: { "38": 20, "39": 50, ... }
  totalPairs: integer("total_pairs").notNull().default(0),
  unitPrice: integer("unit_price").default(0),
  totalPrice: integer("total_price").default(0),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

// 3. Raw Materials & Stock Inventory
export const materials = sqliteTable("materials", {
  id: text("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  category: text("category", {
    enum: ["EVA_SHEET", "LATEX", "PU_CHEMICAL", "TPU_SHANK", "FABRIC", "CUTTING_DIE"],
  }).notNull(),
  unit: text("unit").notNull(), // Lembar, Roll, Drum, Pcs, Meter, Set
  currentStock: integer("current_stock").notNull().default(0),
  safetyThreshold: integer("safety_threshold").notNull().default(10),
  unitCost: integer("unit_cost").notNull().default(0),
  location: text("location"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 4. Inventory Movements (Stock IN/OUT Audit Trail)
export const inventoryMovements = sqliteTable("inventory_movements", {
  id: text("id").primaryKey(),
  materialId: text("material_id")
    .notNull()
    .references(() => materials.id, { onDelete: "restrict" }),
  type: text("type", {
    enum: ["IN_PURCHASE", "IN_RETURN", "OUT_PRODUCTION", "OUT_WASTAGE", "ADJUSTMENT"],
  }).notNull(),
  quantity: integer("quantity").notNull(),
  referenceNumber: text("reference_number"),
  operatorName: text("operator_name").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

// 5. Insole CAD Blueprints & Parametric Models
export const insoleBlueprints = sqliteTable("insole_blueprints", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  shoeSize: integer("shoe_size").notNull(),
  baseLengthMm: real("base_length_mm").notNull(),
  ballWidthMm: real("ball_width_mm").notNull(),
  heelWidthMm: real("heel_width_mm").notNull(),
  waistWidthMm: real("waist_width_mm").notNull(),
  archProfile: text("arch_profile", { enum: ["FLAT", "MEDIUM", "HIGH"] }).notNull(),
  archOffsetFactor: real("arch_offset_factor").notNull().default(1.0),
  thicknessForefootMm: real("thickness_forefoot_mm").notNull().default(3.0),
  thicknessHeelMm: real("thickness_heel_mm").notNull().default(5.0),
  materialType: text("material_type").notNull().default("EVA High Density"),
  svgPath: text("svg_path"),
  createdAt: text("created_at").notNull(),
});

// 6. Factory Security Audit Logs
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  action: text("action").notNull(), // CREATE, UPDATE, DELETE, DISPATCH, EXPORT_SNAPSHOT, RESTORE_SNAPSHOT
  entityType: text("entity_type").notNull(), // DELIVERY_ORDER, INVENTORY, CAD_BLUEPRINT, SYSTEM
  entityId: text("entity_id").notNull(),
  details: text("details"),
  timestamp: text("timestamp").notNull(),
});
