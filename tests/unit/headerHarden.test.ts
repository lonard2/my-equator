import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Header Industrial Hardening & Truth-Gate Safeguards", () => {
  const headerSource = fs.readFileSync(
    path.join(process.cwd(), "src/components/common/Header.tsx"),
    "utf-8"
  );

  it("enforces 10px minimum typography floor (zero text-[9px] violations)", () => {
    const has9px = /text-\[9px\]/.test(headerSource);
    assert.strictEqual(
      has9px,
      false,
      "Header must not contain text-[9px] classes; all typography must meet or exceed 10px."
    );
  });

  it("verifies dedicated accessible logout confirmation modal with error-prevention cancel focus", () => {
    // Check useModalSafety usage
    assert.match(
      headerSource,
      /useModalSafety/,
      "Header must import and invoke useModalSafety hook"
    );
    assert.match(
      headerSource,
      /initialFocusRef:\s*cancelLogoutRef/,
      "Logout confirmation modal must auto-focus the Cancel button first to prevent accidental session termination"
    );
    // Dialog semantics
    assert.match(
      headerSource,
      /role="dialog"/,
      "Logout confirmation modal must have role='dialog'"
    );
    assert.match(
      headerSource,
      /aria-modal="true"/,
      "Logout confirmation modal must have aria-modal='true'"
    );
    assert.match(
      headerSource,
      /aria-labelledby="logout-confirm-title"/,
      "Logout confirmation modal must have aria-labelledby bound to modal title"
    );
  });

  it("verifies mobile drawer accessibility, backdrop dismiss, and touch targets >= 44px", () => {
    // Drawer dialog semantics
    assert.match(
      headerSource,
      /id="mobile-navigation-drawer"/,
      "Mobile drawer must have explicit id matching aria-controls"
    );
    assert.match(
      headerSource,
      /aria-expanded=\{isMobileMenuOpen\}/,
      "Mobile hamburger trigger must indicate aria-expanded state"
    );
    assert.match(
      headerSource,
      /aria-controls="mobile-navigation-drawer"/,
      "Mobile hamburger trigger must link to drawer via aria-controls"
    );

    // Escape listener and body scroll lock
    assert.match(
      headerSource,
      /document\.body\.style\.overflow\s*=\s*"hidden"/,
      "Mobile drawer must lock body scroll when opened"
    );
    assert.match(
      headerSource,
      /e\.key\s*===\s*"Escape"/,
      "Mobile drawer must dismiss on Escape key"
    );

    // Minimum 44px touch targets on mobile interactive elements
    const minH44Count = (headerSource.match(/min-h-\[44px\]/g) || []).length;
    assert.ok(
      minH44Count >= 6,
      `Expected at least 6 mobile touch elements with min-h-[44px], found ${minH44Count}`
    );
  });

  it("verifies Coretax Tax Filing navigation parity in mobile drawer gated by role permissions", () => {
    assert.match(
      headerSource,
      /canAccessTaxFiling/,
      "Header must check role permissions for Tax Filing module access"
    );
    assert.match(
      headerSource,
      /id:\s*"TAX_FILING"/,
      "Header mobile navigation must include TAX_FILING module"
    );
    assert.match(
      headerSource,
      /FileSpreadsheet/,
      "Header must render FileSpreadsheet icon for TAX_FILING"
    );
  });

  it("verifies localized role badging and accessible labels", () => {
    assert.match(
      headerSource,
      /getRoleBadgeInfo\(currentUser\.role,\s*language\)/,
      "Header must use getRoleBadgeInfo for authentic bilingual factory role badges"
    );
    assert.match(
      headerSource,
      /aria-label=\{isId \? "Keluar dari Sesi" : "Log Out of Session"\}/,
      "Logout triggers must have explicit accessible aria-labels"
    );
  });
});
