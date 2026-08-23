import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALL_PERMISSIONS,
  PERMISSION_METADATA,
  getEffectiveRolePermissions,
  setCustomRolePermissions,
  resetRolePermissions,
  Permission,
} from "@/lib/auth/rbac";

describe("Granular Permission Metadata, Inspector & Custom Role Configuration", () => {
  it("provides comprehensive metadata (what, who, effect, security tier) for every single permission", () => {
    assert.ok(ALL_PERMISSIONS.length >= 20, "Must define at least 20 granular permissions");

    ALL_PERMISSIONS.forEach((perm) => {
      const meta = PERMISSION_METADATA[perm];
      assert.ok(meta, `Permission ${perm} must have metadata`);
      assert.ok(meta.nameId && meta.nameEn, `Permission ${perm} must have bilingual name`);
      assert.ok(meta.category, `Permission ${perm} must have category`);
      assert.ok(meta.descriptionId && meta.descriptionEn, `Permission ${perm} must have bilingual description (What)`);
      assert.ok(meta.effectId && meta.effectEn, `Permission ${perm} must have bilingual effect explanation (Effect)`);
      assert.ok(["STANDARD", "RESTRICTED", "CRITICAL"].includes(meta.securityTier), `Permission ${perm} must have valid security tier`);
    });
  });

  it("returns default role permissions when no custom overrides exist", () => {
    resetRolePermissions();
    const adminPerms = getEffectiveRolePermissions("SUPER_ADMIN");
    assert.ok(adminPerms.includes("SYSTEM_USER_MANAGEMENT"));
    assert.ok(adminPerms.includes("SYSTEM_SNAPSHOT_RESTORE"));

    const salesPerms = getEffectiveRolePermissions("SALES_OPERATOR");
    assert.ok(salesPerms.includes("ORDERS_CREATE"));
    assert.strictEqual(salesPerms.includes("SYSTEM_USER_MANAGEMENT"), false);
  });

  it("allows Super Admins to customize and override permissions for a role", () => {
    resetRolePermissions();
    // Grant extra CAD_EDIT permission to SALES_OPERATOR
    const updatedSalesPerms: Permission[] = [
      "ORDERS_VIEW",
      "ORDERS_CREATE",
      "ORDERS_EDIT",
      "ORDERS_PRINT",
      "INVENTORY_VIEW",
      "CAD_VIEW",
      "CAD_EDIT", // newly granted
      "CAD_EXPORT",
      "ANALYTICS_VIEW_OPERATIONAL",
    ];

    setCustomRolePermissions("SALES_OPERATOR", updatedSalesPerms);

    const effective = getEffectiveRolePermissions("SALES_OPERATOR");
    assert.ok(effective.includes("CAD_EDIT"), "Should include custom granted permission");

    // Reset back
    resetRolePermissions();
    const restored = getEffectiveRolePermissions("SALES_OPERATOR");
    assert.strictEqual(restored.includes("CAD_EDIT"), false, "Should be restored to default");
  });
});
