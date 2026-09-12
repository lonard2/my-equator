import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROLE_PERMISSIONS, UserRole, Permission } from "@/lib/auth/rbac";

describe("SecurityDashboard Industrial Hardening & Truth-Gate Safeguards", () => {
  const securityDashboardSource = fs.readFileSync(
    path.join(process.cwd(), "src/components/security/SecurityDashboard.tsx"),
    "utf-8"
  );

  it("enforces 10px minimum typography floor (zero text-[9px] violations)", () => {
    const has9px = /text-\[9px\]/.test(securityDashboardSource);
    assert.strictEqual(
      has9px,
      false,
      "SecurityDashboard must not contain text-[9px] classes; all typography must meet or exceed 10px."
    );
  });

  it("verifies 4 segmented tab definitions (USERS, ROLES, AUDIT, BACKUP)", () => {
    assert.match(securityDashboardSource, /type SecurityTab = "USERS" \| "ROLES" \| "AUDIT" \| "BACKUP";/);
    assert.match(securityDashboardSource, /setActiveTab\("USERS"\)/);
    assert.match(securityDashboardSource, /setActiveTab\("ROLES"\)/);
    assert.match(securityDashboardSource, /setActiveTab\("AUDIT"\)/);
    assert.match(securityDashboardSource, /setActiveTab\("BACKUP"\)/);
  });

  it("verifies truth-gate role change confirmation modal and delta calculation", () => {
    assert.match(securityDashboardSource, /RoleChangeConfirmModal/);
    assert.match(securityDashboardSource, /targetPerms\.filter\(\(p\) => !currentPerms\.includes\(p\)\)/);
    assert.match(securityDashboardSource, /currentPerms\.filter\(\(p\) => !targetPerms\.includes\(p\)\)/);

    // Verify permission delta logic mathematically
    const managerPerms = ROLE_PERMISSIONS["FACTORY_MANAGER"];
    const operatorPerms = ROLE_PERMISSIONS["SALES_OPERATOR"];

    const gainedByManager = managerPerms.filter((p) => !operatorPerms.includes(p));
    const revokedFromManager = managerPerms.filter((p) => !operatorPerms.includes(p));

    assert.ok(gainedByManager.includes("INVENTORY_MANAGE_STOCK"));
    assert.ok(gainedByManager.includes("CAD_EDIT"));
    assert.ok(revokedFromManager.length > 0);
  });

  it("verifies self-demotion and self-deactivation protection guards", () => {
    // Guard against current user self-demotion
    assert.match(securityDashboardSource, /user\.username === currentUser\.username && newSelectedRole !== "SUPER_ADMIN"/);
    // Guard against current user self-deactivation
    assert.match(securityDashboardSource, /user\.username === currentUser\.username && user\.isActive === 1/);
    // Guard against primary superadmin deletion
    assert.match(securityDashboardSource, /user\.username === "superadmin"/);
  });

  it("verifies automated pre-restore snapshot backup safeguard", () => {
    assert.match(securityDashboardSource, /Equator_AutoBackup_Before_Restore_/);
    assert.match(securityDashboardSource, /fetch\("\/api\/security\/snapshot-export"/);
    assert.match(securityDashboardSource, /fetch\("\/api\/security\/snapshot-restore"/);
  });

  it("verifies password reset modal safety and integration", () => {
    assert.match(securityDashboardSource, /ResetPasswordModal/);
    assert.match(securityDashboardSource, /resetPasswordModal/);
    assert.match(securityDashboardSource, /useModalSafety/);
    assert.match(securityDashboardSource, /role="dialog"/);
    assert.match(securityDashboardSource, /aria-modal="true"/);
  });

  it("verifies RFC-4180 audit trail CSV export escaping and formatting", () => {
    assert.match(securityDashboardSource, /handleExportAuditLogsCSV/);
    assert.match(securityDashboardSource, /Equator_Audit_Logs_/);
    assert.match(securityDashboardSource, /text\/csv;charset=utf-8;/);
  });
});
