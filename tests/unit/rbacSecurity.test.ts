import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hasPermission,
  canManageUsers,
  canRestoreDatabase,
  canExportDatabase,
  extractRequesterRole,
  assertPermission,
  ROLE_PERMISSIONS,
} from "@/lib/auth/rbac";

describe("Role-Based Access Control (RBAC) & Security Authorization Matrix", () => {
  it("restricts user role management and user creation exclusively to SUPER_ADMIN", () => {
    assert.strictEqual(canManageUsers("SUPER_ADMIN"), true);
    assert.strictEqual(canManageUsers("FACTORY_MANAGER"), false);
    assert.strictEqual(canManageUsers("WAREHOUSE_STAFF"), false);
    assert.strictEqual(canManageUsers("SALES_OPERATOR"), false);
    assert.strictEqual(canManageUsers(null), false);
    assert.strictEqual(canManageUsers(undefined), false);
    assert.strictEqual(canManageUsers("UNKNOWN_ROLE" as any), false);
  });

  it("restricts database snapshot restoration exclusively to SUPER_ADMIN", () => {
    assert.strictEqual(canRestoreDatabase("SUPER_ADMIN"), true);
    assert.strictEqual(canRestoreDatabase("FACTORY_MANAGER"), false);
    assert.strictEqual(canRestoreDatabase("WAREHOUSE_STAFF"), false);
    assert.strictEqual(canRestoreDatabase("SALES_OPERATOR"), false);
  });

  it("allows database snapshot export for SUPER_ADMIN and FACTORY_MANAGER", () => {
    assert.strictEqual(canExportDatabase("SUPER_ADMIN"), true);
    assert.strictEqual(canExportDatabase("FACTORY_MANAGER"), true);
    assert.strictEqual(canExportDatabase("WAREHOUSE_STAFF"), false);
    assert.strictEqual(canExportDatabase("SALES_OPERATOR"), false);
  });

  it("verifies granular permission matrix with hasPermission", () => {
    // Delivery Order creation
    assert.strictEqual(hasPermission("SUPER_ADMIN", "ORDERS_CREATE"), true);
    assert.strictEqual(hasPermission("FACTORY_MANAGER", "ORDERS_CREATE"), true);
    assert.strictEqual(hasPermission("SALES_OPERATOR", "ORDERS_CREATE"), true);
    assert.strictEqual(hasPermission("WAREHOUSE_STAFF", "ORDERS_CREATE"), false);

    // Stock management
    assert.strictEqual(hasPermission("WAREHOUSE_STAFF", "INVENTORY_MANAGE_STOCK"), true);
    assert.strictEqual(hasPermission("SALES_OPERATOR", "INVENTORY_MANAGE_STOCK"), false);

    // Financial analytics
    assert.strictEqual(hasPermission("SUPER_ADMIN", "ANALYTICS_VIEW_FINANCIAL"), true);
    assert.strictEqual(hasPermission("FACTORY_MANAGER", "ANALYTICS_VIEW_FINANCIAL"), true);
    assert.strictEqual(hasPermission("WAREHOUSE_STAFF", "ANALYTICS_VIEW_FINANCIAL"), false);
    assert.strictEqual(hasPermission("SALES_OPERATOR", "ANALYTICS_VIEW_FINANCIAL"), false);
  });

  it("extracts and validates requester role and identity from request headers", () => {
    const headersAdmin = new Headers({
      "x-user-role": "SUPER_ADMIN",
      "x-user-id": "usr-admin-01",
      "x-user-name": "Ir. Budi Hartono",
    });

    const requester = extractRequesterRole(headersAdmin);
    assert.strictEqual(requester.role, "SUPER_ADMIN");
    assert.strictEqual(requester.userId, "usr-admin-01");
    assert.strictEqual(requester.userName, "Ir. Budi Hartono");

    // Falls back safely to anonymous when headers are omitted
    const emptyHeaders = new Headers();
    const emptyRequester = extractRequesterRole(emptyHeaders);
    assert.strictEqual(emptyRequester.role, "SALES_OPERATOR");
  });

  it("authorizes valid permissions and rejects unauthorized roles with clear error message", () => {
    const adminHeaders = new Headers({ "x-user-role": "SUPER_ADMIN" });
    const authAdmin = assertPermission(adminHeaders, "SYSTEM_USER_MANAGEMENT");
    assert.strictEqual(authAdmin.authorized, true);
    assert.strictEqual(authAdmin.error, undefined);

    const salesHeaders = new Headers({ "x-user-role": "SALES_OPERATOR" });
    const authSales = assertPermission(salesHeaders, "SYSTEM_USER_MANAGEMENT");
    assert.strictEqual(authSales.authorized, false);
    assert.ok(authSales.error && authSales.error.length > 10, "Should provide actionable authorization error");
  });
});
