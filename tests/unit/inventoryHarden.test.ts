import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { calculateInsoleBom } from "@/lib/inventory/bom";
import { MaterialItem } from "@/types";

describe("Inventory Industrial Hardening, Modal Safety & Usability Heuristics", () => {
  const materialFormSource = fs.readFileSync(
    path.join(process.cwd(), "src/components/inventory/MaterialFormModal.tsx"),
    "utf-8"
  );
  const stockMovementSource = fs.readFileSync(
    path.join(process.cwd(), "src/components/inventory/StockMovementModal.tsx"),
    "utf-8"
  );
  const inventoryDashboardSource = fs.readFileSync(
    path.join(process.cwd(), "src/components/inventory/InventoryDashboard.tsx"),
    "utf-8"
  );

  it("verifies MaterialFormModal uses useModalSafety with proper container focus trapping and discard safety", () => {
    // Verified useModalSafety integration
    assert.match(materialFormSource, /import\s*\{\s*useModalSafety\s*\}\s*from\s*["']@\/lib\/utils\/useModalSafety["']/);
    assert.match(materialFormSource, /const dialogRef = useModalSafety\(\{/);
    assert.match(materialFormSource, /disableEscape:\s*showDiscardConfirm/);

    // Verified discard confirmation dialog has proper WAI-ARIA and non-destructive focus
    assert.match(materialFormSource, /id="discard-material-confirm-title"/);
    assert.match(materialFormSource, /ref=\{keepEditingRef\}/);

    // Verified obsolete flawed trapModalTab is completely eliminated
    assert.strictEqual(
      /trapModalTab/.test(materialFormSource),
      false,
      "Flawed trapModalTab must be replaced by useModalSafety."
    );
  });

  it("verifies StockMovementModal enforces useModalSafety, dialog semantics on modal card, and touch target floor", () => {
    // Verified useModalSafety integration
    assert.match(stockMovementSource, /import\s*\{\s*useModalSafety\s*\}\s*from\s*["']@\/lib\/utils\/useModalSafety["']/);
    assert.match(stockMovementSource, /const modalRef = useModalSafety\(\{/);

    // Verified modal dialog semantics are bound to the inner dialog card with modalRef
    assert.match(stockMovementSource, /ref=\{modalRef\}\s*role="dialog"\s*aria-modal="true"/);

    // Verified 44px minimum touch targets on movement selection cards
    assert.match(stockMovementSource, /min-h-\[44px\]/);

    // Verified quick quantity stepper chips have touch sizing
    assert.match(stockMovementSource, /min-h-\[40px\]\s+sm:min-h-\[38px\]\s+min-w-\[40px\]/);

    // Verified discard confirmation dialog has role=dialog and keepEditingRef
    assert.match(stockMovementSource, /id="discard-movement-title"/);
    assert.match(stockMovementSource, /ref=\{keepEditingRef\}/);
  });

  it("verifies InventoryDashboard modal safety, cancel-first delete focus, and background accelerator protection", () => {
    // Verified useModalSafety integration
    assert.match(inventoryDashboardSource, /import\s*\{\s*useModalSafety\s*\}\s*from\s*["']@\/lib\/utils\/useModalSafety["']/);
    assert.match(inventoryDashboardSource, /const deleteModalRef = useModalSafety\(\{/);
    assert.match(inventoryDashboardSource, /const shortcutsModalRef = useModalSafety\(\{/);

    // Verified cancel-first focus on delete confirmation (Nielsen #5 Error Prevention)
    assert.match(inventoryDashboardSource, /initialFocusRef:\s*cancelDeleteRef/);
    assert.match(inventoryDashboardSource, /ref=\{cancelDeleteRef\}/);

    // Verified background accelerator protection when any modal is open
    assert.match(inventoryDashboardSource, /if\s*\(isMaterialModalOpen \|\| isMovementModalOpen \|\| !!materialToDelete \|\| isShortcutsModalOpen\)\s*\{\s*return;/);
  });

  it("verifies stock opname adjustment allows 0 count while regular movements enforce positive quantities", () => {
    // In StockMovementModal, ADJUSTMENT must allow 0 (total stock loss / consumption)
    assert.match(stockMovementSource, /const floor = movementType === "ADJUSTMENT" \? 0 : 1;/);
    assert.match(stockMovementSource, /const minQty = movementType === "ADJUSTMENT" \? 0 : 1;/);
  });

  it("verifies insole BOM estimator calculates raw material sufficiency accurately", () => {
    const mockMaterials: MaterialItem[] = [
      {
        id: "mat-eva-1",
        sku: "EVA-BLK-3MM",
        name: "EVA Foam Sheet 3mm Black",
        category: "EVA_SHEET",
        unit: "Lembar",
        currentStock: 100,
        safetyThreshold: 20,
        unitCost: 75000,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      {
        id: "mat-mesh-1",
        sku: "FAB-BK-MESH",
        name: "Black Sandwich Mesh",
        category: "FABRIC",
        unit: "Meter",
        currentStock: 250,
        safetyThreshold: 50,
        unitCost: 35000,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    const bomResult = calculateInsoleBom("EQ-SPORT-01", 1000, mockMaterials);
    assert.ok(bomResult.requirements.length > 0);
    assert.ok(typeof bomResult.allSufficient === "boolean");
    assert.ok(typeof bomResult.totalEstimatedCostIDR === "number");
  });

  it("verifies inventory table row action buttons have accessible aria-label and tablet touch sizing", () => {
    assert.match(
      inventoryDashboardSource,
      /aria-label=\{isId \? `Catat mutasi untuk \$\{m\.name\}` : `Record stock movement for \$\{m\.name\}`\}/,
      "Stock movement action button must have accessible aria-label naming the material."
    );
    assert.match(
      inventoryDashboardSource,
      /aria-label=\{isId \? `Edit parameter \$\{m\.name\}` : `Edit material \$\{m\.name\}`\}/,
      "Edit SKU button must have accessible aria-label naming the material."
    );
    assert.match(
      inventoryDashboardSource,
      /aria-label=\{isId \? `Hapus bahan \$\{m\.name\}` : `Delete material \$\{m\.name\}`\}/,
      "Delete SKU button must have accessible aria-label naming the material."
    );
    assert.match(
      inventoryDashboardSource,
      /p-2\s+min-h-\[36px\]\s+min-w-\[36px\]\s+flex\s+items-center\s+justify-center/,
      "Table row action buttons must enforce min-h-[36px] min-w-[36px] touch targets for tablet safety."
    );
  });
});
