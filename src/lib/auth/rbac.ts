import { UserRole } from "@/types";

export type Permission =
  // Delivery Orders
  | "ORDERS_VIEW"
  | "ORDERS_CREATE"
  | "ORDERS_EDIT"
  | "ORDERS_DELETE"
  | "ORDERS_DISPATCH"
  | "ORDERS_PRINT"
  // Materials & Stock
  | "INVENTORY_VIEW"
  | "INVENTORY_MANAGE_STOCK"
  | "INVENTORY_MUTATIONS"
  // CAD Studio
  | "CAD_VIEW"
  | "CAD_EDIT"
  | "CAD_EXPORT"
  | "CAD_SAVE_BLUEPRINT"
  // Analytics
  | "ANALYTICS_VIEW_FINANCIAL"
  | "ANALYTICS_VIEW_OPERATIONAL"
  | "ANALYTICS_EXPORT"
  // Security & System
  | "SYSTEM_SNAPSHOT_BACKUP"
  | "SYSTEM_SNAPSHOT_RESTORE"
  | "SYSTEM_USER_MANAGEMENT"
  | "SYSTEM_AUDIT_LOGS";

export const ALL_PERMISSIONS: Permission[] = [
  "ORDERS_VIEW",
  "ORDERS_CREATE",
  "ORDERS_EDIT",
  "ORDERS_DELETE",
  "ORDERS_DISPATCH",
  "ORDERS_PRINT",
  "INVENTORY_VIEW",
  "INVENTORY_MANAGE_STOCK",
  "INVENTORY_MUTATIONS",
  "CAD_VIEW",
  "CAD_EDIT",
  "CAD_EXPORT",
  "CAD_SAVE_BLUEPRINT",
  "ANALYTICS_VIEW_FINANCIAL",
  "ANALYTICS_VIEW_OPERATIONAL",
  "ANALYTICS_EXPORT",
  "SYSTEM_SNAPSHOT_BACKUP",
  "SYSTEM_SNAPSHOT_RESTORE",
  "SYSTEM_USER_MANAGEMENT",
  "SYSTEM_AUDIT_LOGS",
];

export interface PermissionDetail {
  id: Permission;
  nameId: string;
  nameEn: string;
  category: "DELIVERY_ORDERS" | "INVENTORY" | "CAD_STUDIO" | "ANALYTICS" | "SECURITY";
  categoryLabelId: string;
  categoryLabelEn: string;
  descriptionId: string; // What: Action scope
  descriptionEn: string;
  effectId: string; // Effect: Impact & audit
  effectEn: string;
  securityTier: "STANDARD" | "RESTRICTED" | "CRITICAL";
  defaultRoles: UserRole[];
}

export const PERMISSION_METADATA: Record<Permission, PermissionDetail> = {
  ORDERS_VIEW: {
    id: "ORDERS_VIEW",
    nameId: "Lihat Daftar Surat Jalan",
    nameEn: "View Delivery Orders",
    category: "DELIVERY_ORDERS",
    categoryLabelId: "Surat Jalan (DO)",
    categoryLabelEn: "Delivery Orders",
    descriptionId: "Membaca arsip surat jalan, detail pesanan, dan rekap matriks ukuran insole.",
    descriptionEn: "Read delivery order archives, line item breakdown, and size matrices.",
    effectId: "Menampilkan data dokumen tanpa memodifikasi catatan di basis data.",
    effectEn: "Displays document records without modifying stored database entries.",
    securityTier: "STANDARD",
    defaultRoles: ["SUPER_ADMIN", "FACTORY_MANAGER", "WAREHOUSE_STAFF", "SALES_OPERATOR"],
  },
  ORDERS_CREATE: {
    id: "ORDERS_CREATE",
    nameId: "Buat Draft Surat Jalan Baru",
    nameEn: "Create New Delivery Order",
    category: "DELIVERY_ORDERS",
    categoryLabelId: "Surat Jalan (DO)",
    categoryLabelEn: "Delivery Orders",
    descriptionId: "Menerbitkan draft nomor surat jalan otomatis (SJ/EQ/YYYY/MM/XXXX) dan input perincian ukuran.",
    descriptionEn: "Issue automated delivery order sequence numbers and input size matrix breakdowns.",
    effectId: "Menambah rekaman dokumen baru pada tabel delivery_orders dan mencatat audit pembuatan.",
    effectEn: "Inserts new record into delivery_orders table and logs creation audit trail.",
    securityTier: "STANDARD",
    defaultRoles: ["SUPER_ADMIN", "FACTORY_MANAGER", "SALES_OPERATOR"],
  },
  ORDERS_EDIT: {
    id: "ORDERS_EDIT",
    nameId: "Edit & Koreksi Surat Jalan",
    nameEn: "Edit & Modify Delivery Order",
    category: "DELIVERY_ORDERS",
    categoryLabelId: "Surat Jalan (DO)",
    categoryLabelEn: "Delivery Orders",
    descriptionId: "Mengubah perincian ukuran sepatu, alamat tujuan, nomor PO, atau nama penerima.",
    descriptionEn: "Update shoe size quantities, destination address, PO numbers, or customer names.",
    effectId: "Memperbarui isi dokumen surat jalan dan merekam log modifikasi operasional.",
    effectEn: "Updates existing delivery order items and logs modification audit trail.",
    securityTier: "RESTRICTED",
    defaultRoles: ["SUPER_ADMIN", "FACTORY_MANAGER", "SALES_OPERATOR"],
  },
  ORDERS_DELETE: {
    id: "ORDERS_DELETE",
    nameId: "Hapus Surat Jalan",
    nameEn: "Delete Delivery Order",
    category: "DELIVERY_ORDERS",
    categoryLabelId: "Surat Jalan (DO)",
    categoryLabelEn: "Delivery Orders",
    descriptionId: "Menghapus dokumen surat jalan dan seluruh rincian barang dari sistem.",
    descriptionEn: "Permanently purge a delivery order and its associated line items from the database.",
    effectId: "Menghapus data secara permanen dari basis data; tercatat dalam log audit penghapusan.",
    effectEn: "Permanently deletes records from database; recorded in security audit logs.",
    securityTier: "CRITICAL",
    defaultRoles: ["SUPER_ADMIN"],
  },
  ORDERS_DISPATCH: {
    id: "ORDERS_DISPATCH",
    nameId: "Ubah Status Kirim & Rollback DO",
    nameEn: "Dispatch & Status Rollback",
    category: "DELIVERY_ORDERS",
    categoryLabelId: "Surat Jalan (DO)",
    categoryLabelEn: "Delivery Orders",
    descriptionId: "Memperbarui siklus hidup DO (Draft -> Konfirmasi -> Kirim -> Selesai) atau membatalkan/rollback jika salah input.",
    descriptionEn: "Transition order lifecycle (Draft -> Confirmed -> Dispatched -> Delivered) or rollback/cancel if misprocessed.",
    effectId: "Mengubah status pengiriman resmi, memicu alokasi stok gudang, dan mencatat log status.",
    effectEn: "Updates formal dispatch status, triggers stock movement logs, and creates audit entries.",
    securityTier: "RESTRICTED",
    defaultRoles: ["SUPER_ADMIN", "FACTORY_MANAGER", "WAREHOUSE_STAFF"],
  },
  ORDERS_PRINT: {
    id: "ORDERS_PRINT",
    nameId: "Cetak Dokumen & ESC/P Dot-Matrix",
    nameEn: "Print DO & Dot-Matrix Stream",
    category: "DELIVERY_ORDERS",
    categoryLabelId: "Surat Jalan (DO)",
    categoryLabelEn: "Delivery Orders",
    descriptionId: "Mencetak lembar surat jalan fisik (Laser/Inkjet) dan menghasilkan aliran biner ESC/P untuk printer Epson LX-310.",
    descriptionEn: "Generate printable physical slips and binary ESC/P continuous form stream for Epson LX-310.",
    effectId: "Mengirimkan data ke hardware printer pabrik dan memperbarui status dokumen menjadi PRINTED.",
    effectEn: "Sends data stream to factory printer hardware and sets document status to PRINTED.",
    securityTier: "STANDARD",
    defaultRoles: ["SUPER_ADMIN", "FACTORY_MANAGER", "WAREHOUSE_STAFF", "SALES_OPERATOR"],
  },
  INVENTORY_VIEW: {
    id: "INVENTORY_VIEW",
    nameId: "Lihat Saldo Stok Bahan Baku",
    nameEn: "View Raw Material Stocks",
    category: "INVENTORY",
    categoryLabelId: "Inventori & Bahan",
    categoryLabelEn: "Materials & Stock",
    descriptionId: "Melihat daftar bahan baku (EVA foam, lateks, pelat TPU, lem) beserta saldo stok dan ambang batas minimum.",
    descriptionEn: "Inspect raw material inventories (EVA sheets, latex, TPU shanks, adhesives) and safety thresholds.",
    effectId: "Membaca data inventori tanpa melakukan mutasi fisik.",
    effectEn: "Read-only access to warehouse stock balances.",
    securityTier: "STANDARD",
    defaultRoles: ["SUPER_ADMIN", "FACTORY_MANAGER", "WAREHOUSE_STAFF", "SALES_OPERATOR"],
  },
  INVENTORY_MANAGE_STOCK: {
    id: "INVENTORY_MANAGE_STOCK",
    nameId: "Tambah & Edit Master Bahan Baku",
    nameEn: "Manage Material Catalog",
    category: "INVENTORY",
    categoryLabelId: "Inventori & Bahan",
    categoryLabelEn: "Materials & Stock",
    descriptionId: "Menambahkan jenis material baru, memperbarui harga satuan beli, dan mengatur ambang batas stok aman.",
    descriptionEn: "Create new raw material SKUs, update unit purchase prices, and configure safety thresholds.",
    effectId: "Membuat atau memperbarui master SKU bahan pada tabel materials.",
    effectEn: "Inserts or modifies material master records in materials table.",
    securityTier: "RESTRICTED",
    defaultRoles: ["SUPER_ADMIN", "FACTORY_MANAGER", "WAREHOUSE_STAFF"],
  },
  INVENTORY_MUTATIONS: {
    id: "INVENTORY_MUTATIONS",
    nameId: "Pencatatan Mutasi Masuk/Keluar",
    nameEn: "Record Stock In/Out Movements",
    category: "INVENTORY",
    categoryLabelId: "Inventori & Bahan",
    categoryLabelEn: "Materials & Stock",
    descriptionId: "Mencatat penerimaan bahan dari supplier (IN), pemakaian lini produksi (OUT), atau penyesuaian opname (ADJUST).",
    descriptionEn: "Record incoming supplier batches (IN), production floor consumption (OUT), and audit adjustments (ADJUST).",
    effectId: "Menghitung ulang saldo stok riil, memperbarui status kesehatan stok, dan mencatat log mutasi.",
    effectEn: "Recalculates real inventory balances, updates stock health status, and writes movement ledger.",
    securityTier: "RESTRICTED",
    defaultRoles: ["SUPER_ADMIN", "FACTORY_MANAGER", "WAREHOUSE_STAFF"],
  },
  CAD_VIEW: {
    id: "CAD_VIEW",
    nameId: "Akses Studio Desain Insole",
    nameEn: "Access Insole Design Studio",
    category: "CAD_STUDIO",
    categoryLabelId: "Studio Insole CAD",
    categoryLabelEn: "Insole CAD Studio",
    descriptionId: "Melihat visualisasi kurva insole parametrik 2D, kontur arch support, dan mangkok tumit.",
    descriptionEn: "View 2D parametric insole curves, arch support contours, and anatomical heel cups.",
    effectId: "Merender kurva Bézier di kanvas klien tanpa memodifikasi blueprint pabrik.",
    effectEn: "Renders Bézier spline geometry in browser canvas without modifying saved blueprints.",
    securityTier: "STANDARD",
    defaultRoles: ["SUPER_ADMIN", "FACTORY_MANAGER", "SALES_OPERATOR"],
  },
  CAD_EDIT: {
    id: "CAD_EDIT",
    nameId: "Modifikasi Geometri & Parameter CAD",
    nameEn: "Modify CAD Geometry Parameters",
    category: "CAD_STUDIO",
    categoryLabelId: "Studio Insole CAD",
    categoryLabelEn: "Insole CAD Studio",
    descriptionId: "Mengatur parameter panjang anatomis, ketebalan forefoot/heel, profil arch support, dan sayap lateral.",
    descriptionEn: "Tune millimeter sizing, forefoot/heel thickness, medial arch heights, and lateral wings.",
    effectId: "Menghitung ulang model matematika spline kurva insole.",
    effectEn: "Recalculates mathematical spline vectors in real-time.",
    securityTier: "RESTRICTED",
    defaultRoles: ["SUPER_ADMIN", "FACTORY_MANAGER"],
  },
  CAD_EXPORT: {
    id: "CAD_EXPORT",
    nameId: "Ekspor File DXF & Vektor SVG",
    nameEn: "Export AutoCAD DXF & SVG Vectors",
    category: "CAD_STUDIO",
    categoryLabelId: "Studio Insole CAD",
    categoryLabelEn: "Insole CAD Studio",
    descriptionId: "Mengunduh file vektor standar AutoCAD R12 DXF (kompatibel CorelDRAW & mesin CNC cutter) dan file SVG.",
    descriptionEn: "Download industry-standard AutoCAD R12 DXF vector streams (CorelDRAW & CNC cutters ready) and SVG files.",
    effectId: "Menghasilkan binary file vector untuk pemotongan pisau pons atau pisau CNC di lantai produksi.",
    effectEn: "Generates production-ready cutting vector streams for factory CNC knife tables.",
    securityTier: "STANDARD",
    defaultRoles: ["SUPER_ADMIN", "FACTORY_MANAGER", "SALES_OPERATOR"],
  },
  CAD_SAVE_BLUEPRINT: {
    id: "CAD_SAVE_BLUEPRINT",
    nameId: "Simpan Master Blueprint Insole",
    nameEn: "Save Master Insole Blueprint",
    category: "CAD_STUDIO",
    categoryLabelId: "Studio Insole CAD",
    categoryLabelEn: "Insole CAD Studio",
    descriptionId: "Menyimpan cetak biru desain insole khusus ke pustaka model pabrik permanen.",
    descriptionEn: "Persist custom insole parameters to the factory master blueprint library.",
    effectId: "Menyimpan entri baru ke tabel cad_blueprints dan mencatat jejak audit desain.",
    effectEn: "Inserts new blueprint row into cad_blueprints table and logs design audit event.",
    securityTier: "RESTRICTED",
    defaultRoles: ["SUPER_ADMIN", "FACTORY_MANAGER"],
  },
  ANALYTICS_VIEW_FINANCIAL: {
    id: "ANALYTICS_VIEW_FINANCIAL",
    nameId: "Lihat Analitik Finansial & Omzet IDR",
    nameEn: "View Financial Revenue (IDR)",
    category: "ANALYTICS",
    categoryLabelId: "Analitik & Finansial",
    categoryLabelEn: "Analytics & Financials",
    descriptionId: "Melihat total omzet penjualan IDR bulanan, estimasi nilai aset gudang, dan pendapatan per merek sepatu.",
    descriptionEn: "Access monthly IDR sales turnover, warehouse asset valuations, and buyer revenue distribution.",
    effectId: "Memberikan visibilitas ke data keuangan rahasia perusahaan.",
    effectEn: "Provides executive visibility into confidential company financial metrics.",
    securityTier: "CRITICAL",
    defaultRoles: ["SUPER_ADMIN", "FACTORY_MANAGER"],
  },
  ANALYTICS_VIEW_OPERATIONAL: {
    id: "ANALYTICS_VIEW_OPERATIONAL",
    nameId: "Lihat Analitik Volume & Distribusi Ukuran",
    nameEn: "View Volume & Size Bell Curves",
    category: "ANALYTICS",
    categoryLabelId: "Analitik & Finansial",
    categoryLabelEn: "Analytics & Financials",
    descriptionId: "Melihat kurva lonceng sebaran ukuran sepatu (EU 36-45), total pasang terkirim, dan utilisasi cetakan.",
    descriptionEn: "Inspect sizing bell curve distributions (EU 36-45), shipped pair volumes, and mold utilization.",
    effectId: "Membantu perencanaan kapasitas cetak dan estimasi konsumsi bahan baku.",
    effectEn: "Assists factory capacity planning and raw material consumption forecasting.",
    securityTier: "STANDARD",
    defaultRoles: ["SUPER_ADMIN", "FACTORY_MANAGER", "WAREHOUSE_STAFF", "SALES_OPERATOR"],
  },
  ANALYTICS_EXPORT: {
    id: "ANALYTICS_EXPORT",
    nameId: "Ekspor Laporan Analitik CSV",
    nameEn: "Export Analytics Report (CSV)",
    category: "ANALYTICS",
    categoryLabelId: "Analitik & Finansial",
    categoryLabelEn: "Analytics & Financials",
    descriptionId: "Mengunduh lembar rekapitulasi data tren bulanan, sebaran ukuran, dan utilisasi dalam format spreadsheet CSV.",
    descriptionEn: "Download monthly trends, size distributions, and mold metrics in standard CSV spreadsheet format.",
    effectId: "Mengekstrak data ringkasan pabrik ke perangkat lokal pengguna.",
    effectEn: "Extracts operational report summaries to user local storage.",
    securityTier: "RESTRICTED",
    defaultRoles: ["SUPER_ADMIN", "FACTORY_MANAGER"],
  },
  SYSTEM_SNAPSHOT_BACKUP: {
    id: "SYSTEM_SNAPSHOT_BACKUP",
    nameId: "Ekspor Cadangan Snapshot JSON",
    nameEn: "Export Database JSON Snapshot",
    category: "SECURITY",
    categoryLabelId: "Keamanan & Sistem",
    categoryLabelEn: "Security & System",
    descriptionId: "Mengunduh salinan lengkap seluruh relasi basis data pabrik dalam satu berkas JSON terenkapsulasi.",
    descriptionEn: "Download complete encrypted JSON snapshot bundle of all relational database tables.",
    effectId: "Menghasilkan berkas cadangan offline untuk pemulihan darurat.",
    effectEn: "Produces complete offline backup file for zero-config disaster recovery.",
    securityTier: "CRITICAL",
    defaultRoles: ["SUPER_ADMIN", "FACTORY_MANAGER"],
  },
  SYSTEM_SNAPSHOT_RESTORE: {
    id: "SYSTEM_SNAPSHOT_RESTORE",
    nameId: "Restorasi Basis Data dari Snapshot",
    nameEn: "Restore Database from Snapshot",
    category: "SECURITY",
    categoryLabelId: "Keamanan & Sistem",
    categoryLabelEn: "Security & System",
    descriptionId: "Menimpa dan memulihkan seluruh data basis data pabrik dari berkas cadangan snapshot JSON.",
    descriptionEn: "Overwrite and restore entire factory database schema and tables from JSON backup file.",
    effectId: "Menimpa seluruh data sistem yang ada; tindakan berisiko tinggi yang direkam di log audit.",
    effectEn: "Replaces current system records; high-impact destructive action logged in audit trail.",
    securityTier: "CRITICAL",
    defaultRoles: ["SUPER_ADMIN"],
  },
  SYSTEM_USER_MANAGEMENT: {
    id: "SYSTEM_USER_MANAGEMENT",
    nameId: "Manajemen Akun & Penugasan Peran",
    nameEn: "User Directory & Role Assignment",
    category: "SECURITY",
    categoryLabelId: "Keamanan & Sistem",
    categoryLabelEn: "Security & System",
    descriptionId: "Membuat akun staf baru, mengubah peran/otorisasi, menonaktifkan pengguna, dan menghapus kredensial.",
    descriptionEn: "Provision new staff accounts, assign/modify RBAC roles, toggle active status, and purge credentials.",
    effectId: "Mengendalikan hak akses seluruh staf terhadap fitur dan data sensitif pabrik.",
    effectEn: "Controls organizational security access across all factory operational modules.",
    securityTier: "CRITICAL",
    defaultRoles: ["SUPER_ADMIN"],
  },
  SYSTEM_AUDIT_LOGS: {
    id: "SYSTEM_AUDIT_LOGS",
    nameId: "Lihat Jejak Audit Keamanan Sistem",
    nameEn: "View System Security Audit Trail",
    category: "SECURITY",
    categoryLabelId: "Keamanan & Sistem",
    categoryLabelEn: "Security & System",
    descriptionId: "Melihat rekam jejak kronologis aktivitas login, penghapusan data, dan eksekusi instruksi kritis.",
    descriptionEn: "Inspect immutable chronological log of login attempts, data mutations, and critical actions.",
    effectId: "Menyediakan transparansi dan akuntabilitas kepatuhan operasional pabrik.",
    effectEn: "Provides full accountability and compliance transparency for factory operations.",
    securityTier: "RESTRICTED",
    defaultRoles: ["SUPER_ADMIN", "FACTORY_MANAGER"],
  },
};

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "ORDERS_VIEW",
    "ORDERS_CREATE",
    "ORDERS_EDIT",
    "ORDERS_DELETE",
    "ORDERS_DISPATCH",
    "ORDERS_PRINT",
    "INVENTORY_VIEW",
    "INVENTORY_MANAGE_STOCK",
    "INVENTORY_MUTATIONS",
    "CAD_VIEW",
    "CAD_EDIT",
    "CAD_EXPORT",
    "CAD_SAVE_BLUEPRINT",
    "ANALYTICS_VIEW_FINANCIAL",
    "ANALYTICS_VIEW_OPERATIONAL",
    "ANALYTICS_EXPORT",
    "SYSTEM_SNAPSHOT_BACKUP",
    "SYSTEM_SNAPSHOT_RESTORE",
    "SYSTEM_USER_MANAGEMENT",
    "SYSTEM_AUDIT_LOGS",
  ],
  FACTORY_MANAGER: [
    "ORDERS_VIEW",
    "ORDERS_CREATE",
    "ORDERS_EDIT",
    "ORDERS_DISPATCH",
    "ORDERS_PRINT",
    "INVENTORY_VIEW",
    "INVENTORY_MANAGE_STOCK",
    "INVENTORY_MUTATIONS",
    "CAD_VIEW",
    "CAD_EDIT",
    "CAD_EXPORT",
    "CAD_SAVE_BLUEPRINT",
    "ANALYTICS_VIEW_FINANCIAL",
    "ANALYTICS_VIEW_OPERATIONAL",
    "ANALYTICS_EXPORT",
    "SYSTEM_SNAPSHOT_BACKUP",
    "SYSTEM_AUDIT_LOGS",
  ],
  WAREHOUSE_STAFF: [
    "ORDERS_VIEW",
    "ORDERS_DISPATCH",
    "ORDERS_PRINT",
    "INVENTORY_VIEW",
    "INVENTORY_MANAGE_STOCK",
    "INVENTORY_MUTATIONS",
    "ANALYTICS_VIEW_OPERATIONAL",
  ],
  SALES_OPERATOR: [
    "ORDERS_VIEW",
    "ORDERS_CREATE",
    "ORDERS_EDIT",
    "ORDERS_PRINT",
    "INVENTORY_VIEW",
    "CAD_VIEW",
    "CAD_EXPORT",
    "ANALYTICS_VIEW_OPERATIONAL",
  ],
};

export const ROLE_PERMISSIONS = DEFAULT_ROLE_PERMISSIONS;

let customRolePermissions: Partial<Record<UserRole, Permission[]>> = {};

export function getEffectiveRolePermissions(role: UserRole): Permission[] {
  if (customRolePermissions[role]) {
    return customRolePermissions[role]!;
  }
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

export function setCustomRolePermissions(role: UserRole, permissions: Permission[]): void {
  customRolePermissions[role] = [...permissions];
}

export function resetRolePermissions(role?: UserRole): void {
  if (role) {
    delete customRolePermissions[role];
  } else {
    customRolePermissions = {};
  }
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const perms = getEffectiveRolePermissions(role);
  return perms.includes(permission);
}

export function getRoleBadgeInfo(role: UserRole, language: "id" | "en" = "id") {
  const isId = language === "id";

  switch (role) {
    case "SUPER_ADMIN":
      return {
        label: isId ? "Super Admin (Owner)" : "Super Admin",
        description: isId ? "Akses penuh sistem, finansial & backup" : "Full system access & financial controls",
        colorClass: "bg-red-900 text-white border-red-700",
        badgeBg: "bg-red-100 dark:bg-red-950 text-[#8B0000] dark:text-red-300",
      };
    case "FACTORY_MANAGER":
      return {
        label: isId ? "Manajer Pabrik" : "Factory Manager",
        description: isId ? "Manajemen produksi, CAD & inventori" : "Production management & CAD operations",
        colorClass: "bg-blue-900 text-white border-blue-700",
        badgeBg: "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300",
      };
    case "WAREHOUSE_STAFF":
      return {
        label: isId ? "Staff Gudang" : "Warehouse Crew",
        description: isId ? "Mutasi stok, status kirim & cetak slip" : "Stock movements & dispatch fulfillment",
        colorClass: "bg-amber-900 text-white border-amber-700",
        badgeBg: "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300",
      };
    case "SALES_OPERATOR":
      return {
        label: isId ? "Operator Penjualan" : "Sales Operator",
        description: isId ? "Entri DO, quick digitizer & preview" : "Order entry & rapid intake",
        colorClass: "bg-emerald-900 text-white border-emerald-700",
        badgeBg: "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300",
      };
  }
}

export function canManageUsers(role?: string | null): boolean {
  if (!role) return false;
  return role === "SUPER_ADMIN";
}

export function canRestoreDatabase(role?: string | null): boolean {
  if (!role) return false;
  return role === "SUPER_ADMIN";
}

export function canExportDatabase(role?: string | null): boolean {
  if (!role) return false;
  return role === "SUPER_ADMIN" || role === "FACTORY_MANAGER";
}

export function extractRequesterRole(headers: Headers | Record<string, string>): {
  role: UserRole;
  userId: string;
  userName: string;
} {
  let roleHeader: string | null = null;
  let userIdHeader: string | null = null;
  let userNameHeader: string | null = null;

  if (typeof (headers as Headers).get === "function") {
    const h = headers as Headers;
    roleHeader = h.get("x-user-role");
    userIdHeader = h.get("x-user-id");
    userNameHeader = h.get("x-user-name");
  } else {
    const h = headers as Record<string, string>;
    roleHeader = h["x-user-role"] || h["X-User-Role"] || null;
    userIdHeader = h["x-user-id"] || h["X-User-Id"] || null;
    userNameHeader = h["x-user-name"] || h["X-User-Name"] || null;
  }

  const validRoles: UserRole[] = ["SUPER_ADMIN", "FACTORY_MANAGER", "WAREHOUSE_STAFF", "SALES_OPERATOR"];
  const role = validRoles.includes(roleHeader as UserRole) ? (roleHeader as UserRole) : "SALES_OPERATOR";
  const userId = userIdHeader || "ANONYMOUS";
  const userName = userNameHeader || "Operator";

  return { role, userId, userName };
}

export function assertPermission(
  headers: Headers | Record<string, string>,
  permission: Permission
): { authorized: boolean; role: UserRole; error?: string } {
  const { role } = extractRequesterRole(headers);
  const authorized = hasPermission(role, permission);

  if (!authorized) {
    return {
      authorized: false,
      role,
      error: `Akses ditolak: Peran '${role}' tidak memiliki izin '${permission}'. Diperlukan hak akses administratif Super Admin.`,
    };
  }

  return { authorized: true, role };
}
