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
  userRole: text("user_role").notNull().default("SALES_OPERATOR"),
  action: text("action").notNull(), // USER_LOGIN, ORDER_CREATE, ORDER_UPDATE, ORDER_STATUS, STOCK_MOVE, CAD_SAVE, SNAPSHOT_EXPORT, SNAPSHOT_RESTORE
  entityType: text("entity_type").notNull(), // AUTH, DELIVERY_ORDER, INVENTORY, CAD_BLUEPRINT, SYSTEM
  entityId: text("entity_id").notNull(),
  details: text("details"),
  timestamp: text("timestamp").notNull(),
});

// 7. Factory Users & Role-Based Authentication
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  salt: text("salt").notNull(),
  role: text("role", {
    enum: ["SUPER_ADMIN", "FACTORY_MANAGER", "WAREHOUSE_STAFF", "SALES_OPERATOR"],
  }).notNull().default("SALES_OPERATOR"),
  avatarUrl: text("avatar_url"),
  isActive: integer("is_active").notNull().default(1),
  lastLoginAt: text("last_login_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 8. Company PKP & Coretax Tax Profile
export const companyTaxProfiles = sqliteTable("company_tax_profiles", {
  id: text("id").primaryKey(),
  companyName: text("company_name").notNull(),
  npwp16: text("npwp16").notNull(),
  nitku22: text("nitku22").notNull(),
  kppCode: text("kpp_code").notNull(),
  kppName: text("kpp_name"),
  taxAddress: text("tax_address").notNull(),
  signatoryName: text("signatory_name").notNull(),
  signatoryRole: text("signatory_role").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 9. Coretax Tax Invoices (Faktur Pajak Keluaran & Masukan)
export const taxInvoices = sqliteTable("tax_invoices", {
  id: text("id").primaryKey(),
  invoiceType: text("invoice_type", {
    enum: ["OUTPUT_FPK", "INPUT_FPM"],
  }).notNull().default("OUTPUT_FPK"),
  transactionCode: text("transaction_code", {
    enum: ["01", "02", "03", "04", "05", "07", "08", "09"],
  }).notNull().default("01"),
  nomorFaktur: text("nomor_faktur").notNull(),
  referenceNumber: text("reference_number"),
  taxPeriod: text("tax_period").notNull(), // YYYY-MM
  invoiceDate: text("invoice_date").notNull(), // YYYY-MM-DD
  buyerName: text("buyer_name").notNull(),
  buyerNpwp16: text("buyer_npwp16").notNull(),
  buyerNitku22: text("buyer_nitku22").notNull(),
  buyerAddress: text("buyer_address").notNull(),
  dpp: integer("dpp").notNull().default(0),
  ppn: integer("ppn").notNull().default(0),
  taxRate: integer("tax_rate").notNull().default(11), // 11% standard, 12% configured
  isTaxIncluded: integer("is_tax_included").notNull().default(0),
  status: text("status", {
    enum: [
      "DRAFT",
      "READY",
      "EXPORTED_XML",
      "EXPORTED_EXCEL",
      "UPLOADED_CORETAX",
      "APPROVED",
      "CANCELLED",
    ],
  }).notNull().default("DRAFT"),
  deliveryOrderId: text("delivery_order_id").references(() => deliveryOrders.id, {
    onDelete: "set null",
  }),
  inventoryMovementId: text("inventory_movement_id").references(() => inventoryMovements.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 10. Tax Invoice Line Items (Detail Transaksi BKP / JKP)
export const taxInvoiceItems = sqliteTable("tax_invoice_items", {
  id: text("id").primaryKey(),
  taxInvoiceId: text("tax_invoice_id")
    .notNull()
    .references(() => taxInvoices.id, { onDelete: "cascade" }),
  itemCode: text("item_code").notNull(),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull().default(0),
  totalPrice: integer("total_price").notNull().default(0),
  dpp: integer("dpp").notNull().default(0),
  ppn: integer("ppn").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

// 11. Monthly SPT Masa PPN Reconciliation Staging
export const sptMasaPeriods = sqliteTable("spt_masa_periods", {
  id: text("id").primaryKey(),
  period: text("period").notNull().unique(), // YYYY-MM
  totalDppKeluaran: integer("total_dpp_keluaran").notNull().default(0),
  totalPpnKeluaran: integer("total_ppn_keluaran").notNull().default(0),
  countFpk: integer("count_fpk").notNull().default(0),
  totalDppMasukan: integer("total_dpp_masukan").notNull().default(0),
  totalPpnMasukan: integer("total_ppn_masukan").notNull().default(0),
  countFpm: integer("count_fpm").notNull().default(0),
  netTaxPayable: integer("net_tax_payable").notNull().default(0),
  unbilledOrdersCount: integer("unbilled_orders_count").notNull().default(0),
  unbilledOrdersAmount: integer("unbilled_orders_amount").notNull().default(0),
  status: text("status", {
    enum: ["OPEN", "RECONCILED", "REPORTED"],
  }).notNull().default("OPEN"),
  updatedAt: text("updated_at").notNull(),
});

