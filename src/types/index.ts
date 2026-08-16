// Shared TypeScript Types — MyEquator

export type UserRole = "SUPER_ADMIN" | "FACTORY_MANAGER" | "WAREHOUSE_STAFF" | "SALES_OPERATOR";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Delivery Order & Size Matrix Types
export type DeliveryOrderStatus = "DRAFT" | "CONFIRMED" | "PRINTED" | "DISPATCHED" | "DELIVERED" | "CANCELLED";

export type FootwearSize = 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45;

export type SizeBreakdown = {
  [size in FootwearSize]?: number;
};

export interface DeliveryOrderItem {
  id: string;
  deliveryOrderId: string;
  articleCode: string;
  articleName: string;
  colorway?: string;
  sizes: SizeBreakdown;
  totalPairs: number;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
}

export interface DeliveryOrder {
  id: string;
  orderNumber: string; // e.g. SJ/EQ/2026/08/0001
  recipientName: string;
  destinationAddress: string;
  poNumber?: string;
  vehicleNumber?: string;
  driverName?: string;
  status: DeliveryOrderStatus;
  deliveryDate: string; // YYYY-MM-DD
  notes?: string;
  totalQuantity: number;
  totalAmount?: number;
  items?: DeliveryOrderItem[];
  createdAt: string;
  updatedAt: string;
}

// Inventory & Material Types
export type MaterialCategory = "EVA_SHEET" | "LATEX" | "PU_CHEMICAL" | "TPU_SHANK" | "FABRIC" | "CUTTING_DIE";

export type StockHealthStatus = "HEALTHY" | "WARNING" | "CRITICAL";

export interface MaterialItem {
  id: string;
  sku: string;
  name: string;
  category: MaterialCategory;
  unit: string; // Lembar, Roll, Drum, Pcs, Meter
  currentStock: number;
  safetyThreshold: number;
  unitCost: number;
  location?: string;
  healthStatus?: StockHealthStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = "IN_PURCHASE" | "IN_RETURN" | "OUT_PRODUCTION" | "OUT_WASTAGE" | "ADJUSTMENT";

export interface StockMovement {
  id: string;
  materialId: string;
  materialName?: string;
  type: MovementType;
  quantity: number;
  referenceNumber?: string; // PO number, Work Order number
  operatorName: string;
  notes?: string;
  createdAt: string;
}

// CAD & Insole Types
export type ArchProfile = "FLAT" | "MEDIUM" | "HIGH";

export interface InsoleParameters {
  shoeSize: number; // EU 35-46
  baseLengthMm: number;
  ballWidthMm: number;
  heelWidthMm: number;
  waistWidthMm: number;
  archProfile: ArchProfile;
  archOffsetFactor: number;
  thicknessForefootMm: number;
  thicknessHeelMm: number;
  materialType: string;
}

export interface Point2D {
  x: number;
  y: number;
}

// UI State & Typography Scaling Types
export type DensityMode = "xs" | "compact" | "normal" | "large" | "xl";
export type LayoutWidth = "fluid" | "boxed";
export type ThemeMode = "light" | "dark";
export type Language = "id" | "en";
