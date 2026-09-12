import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Complementary Common Components Hardening (Impeccable Polish & Safety)", () => {
  const settingsModalSource = fs.readFileSync(
    path.join(process.cwd(), "src/components/common/SettingsModal.tsx"),
    "utf-8"
  );
  const commandPaletteSource = fs.readFileSync(
    path.join(process.cwd(), "src/components/common/CommandPalette.tsx"),
    "utf-8"
  );
  const sidebarSource = fs.readFileSync(
    path.join(process.cwd(), "src/components/common/Sidebar.tsx"),
    "utf-8"
  );

  it("enforces 10px minimum typography floor across all common components (zero text-[9px] violations)", () => {
    assert.strictEqual(
      /text-\[9px\]/.test(settingsModalSource),
      false,
      "SettingsModal must not contain text-[9px] classes; must meet or exceed 10px."
    );
    assert.strictEqual(
      /text-\[9px\]/.test(commandPaletteSource),
      false,
      "CommandPalette must not contain text-[9px] classes; must meet or exceed 10px."
    );
    assert.strictEqual(
      /text-\[9px\]/.test(sidebarSource),
      false,
      "Sidebar must not contain text-[9px] classes; must meet or exceed 10px."
    );
  });

  it("verifies SettingsModal safety: useModalSafety, backdrop click dismissal, and dialog semantics", () => {
    assert.match(
      settingsModalSource,
      /useModalSafety/,
      "SettingsModal must use useModalSafety hook"
    );
    assert.match(
      settingsModalSource,
      /e\.target\s*===\s*e\.currentTarget/,
      "SettingsModal must dismiss on backdrop overlay click"
    );
    assert.match(
      settingsModalSource,
      /role="dialog"/,
      "SettingsModal must have role='dialog'"
    );
    assert.match(
      settingsModalSource,
      /aria-modal="true"/,
      "SettingsModal must have aria-modal='true'"
    );
    assert.match(
      settingsModalSource,
      /aria-labelledby="settings-modal-title"/,
      "SettingsModal must link aria-labelledby to modal title"
    );
  });

  it("verifies SettingsModal radio group semantics, dark mode active parity, and reset defaults", () => {
    assert.match(
      settingsModalSource,
      /role="radiogroup"/,
      "SettingsModal must use role='radiogroup' for single-select option clusters"
    );
    assert.match(
      settingsModalSource,
      /role="radio"/,
      "SettingsModal option buttons must have role='radio'"
    );
    assert.match(
      settingsModalSource,
      /aria-checked=\{isSelected\}/,
      "SettingsModal option buttons must declare aria-checked state"
    );
    // Dark mode active language styling
    assert.match(
      settingsModalSource,
      /dark:bg-red-950\/70[\s\S]*?dark:text-red-200/,
      "Active language buttons must have dark mode background tokens to prevent bright pink un-themed flash"
    );
    // Reset to defaults button
    assert.match(
      settingsModalSource,
      /Standar Pabrik|Reset to Defaults/,
      "SettingsModal must include a button to reset preferences to factory defaults"
    );
  });

  it("verifies Sidebar Inset Indicator rule (DESIGN.md compliance) and nav landmark", () => {
    assert.match(
      sidebarSource,
      /<nav\s+aria-label=/,
      "Sidebar must wrap navigation items in an accessible <nav> landmark"
    );
    assert.match(
      sidebarSource,
      /aria-current=\{isActive \? "page" : undefined\}/,
      "Sidebar buttons must declare aria-current='page' when active"
    );
    assert.match(
      sidebarSource,
      /w-1 rounded-r-full bg-brand/,
      "Sidebar must use the Inset Indicator Rule (w-1 rounded-r-full bg-brand) rather than full box borders"
    );
  });

  it("verifies CommandPalette live order search, RBAC gating, category chunking, and auto-scroll", () => {
    // Live orders support
    assert.match(
      commandPaletteSource,
      /orders\s*=\s*\[\]/,
      "CommandPalette must accept orders array prop"
    );
    assert.match(
      commandPaletteSource,
      /o\.orderNumber\.toLowerCase\(\)\.includes\(q\)/,
      "CommandPalette must search live order numbers"
    );
    assert.match(
      commandPaletteSource,
      /o\.recipientName\.toLowerCase\(\)\.includes\(q\)/,
      "CommandPalette must search live recipient / customer names"
    );

    // RBAC gating
    assert.match(
      commandPaletteSource,
      /canAccessTaxFiling/,
      "CommandPalette must check role permission before rendering tax filing shortcut"
    );

    // Category chunking
    assert.match(
      commandPaletteSource,
      /type CommandCategory = "ORDERS" \| "NAV" \| "ACTION" \| "AI"/,
      "CommandPalette must classify items into distinct categories"
    );
    assert.match(
      commandPaletteSource,
      /categoryOrder/,
      "CommandPalette must render items chunked by category"
    );

    // Modal safety & backdrop dismiss
    assert.match(
      commandPaletteSource,
      /useModalSafety/,
      "CommandPalette must use useModalSafety hook"
    );
    assert.match(
      commandPaletteSource,
      /e\.target\s*===\s*e\.currentTarget/,
      "CommandPalette must dismiss on backdrop overlay click"
    );

    // Auto scroll into view
    assert.match(
      commandPaletteSource,
      /scrollIntoView\(\{\s*block:\s*"nearest"\s*\}\)/,
      "CommandPalette must auto-scroll selected items into view"
    );

    // Combobox & Listbox WAI-ARIA
    assert.match(
      commandPaletteSource,
      /role="combobox"/,
      "CommandPalette search input must have role='combobox'"
    );
    assert.match(
      commandPaletteSource,
      /role="listbox"/,
      "CommandPalette container must have role='listbox'"
    );
    assert.match(
      commandPaletteSource,
      /role="option"/,
      "CommandPalette list items must have role='option'"
    );
  });
});
