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

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
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

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
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

