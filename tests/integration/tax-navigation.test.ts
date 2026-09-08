import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canAccessTaxFiling, hasPermission } from "@/lib/auth/rbac";

describe("Tax Navigation & Role-Based Access Control Integration", () => {
  it("authorizes Super Admin and Factory Manager to access Tax Filing", () => {
    assert.strictEqual(canAccessTaxFiling("SUPER_ADMIN"), true);
    assert.strictEqual(canAccessTaxFiling("FACTORY_MANAGER"), true);

    assert.strictEqual(hasPermission("SUPER_ADMIN", "TAX_VIEW"), true);
    assert.strictEqual(hasPermission("SUPER_ADMIN", "TAX_MANAGE"), true);

    assert.strictEqual(hasPermission("FACTORY_MANAGER", "TAX_VIEW"), true);
    assert.strictEqual(hasPermission("FACTORY_MANAGER", "TAX_MANAGE"), true);
  });

  it("strictly prohibits Sales Operator and Warehouse Staff from accessing Tax Filing", () => {
    assert.strictEqual(canAccessTaxFiling("SALES_OPERATOR"), false);
    assert.strictEqual(canAccessTaxFiling("WAREHOUSE_STAFF"), false);
    assert.strictEqual(canAccessTaxFiling(null), false);
    assert.strictEqual(canAccessTaxFiling(undefined), false);

    assert.strictEqual(hasPermission("SALES_OPERATOR", "TAX_VIEW"), false);
    assert.strictEqual(hasPermission("SALES_OPERATOR", "TAX_MANAGE"), false);

    assert.strictEqual(hasPermission("WAREHOUSE_STAFF", "TAX_VIEW"), false);
    assert.strictEqual(hasPermission("WAREHOUSE_STAFF", "TAX_MANAGE"), false);
  });
});
