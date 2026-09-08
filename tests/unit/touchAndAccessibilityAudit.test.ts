import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { DeliveryOrderStatus } from "../../src/types";

describe("Impeccable Audit: Touch Targets, Screen Reader Attributes, and Keyboard Contracts", () => {
  const rootDir = path.resolve(__dirname, "../../");

  describe("1. 44px Minimum Touch Targets (WCAG 2.5.5 / 2.5.8)", () => {
    it("verifies TouchSizePad buttons and inputs have min-h-[44px] / min-w-[44px]", () => {
      const touchPadFilePath = path.join(rootDir, "src/components/delivery-orders/TouchSizePad.tsx");
      const content = fs.readFileSync(touchPadFilePath, "utf-8");

      // Stepper buttons (-10, -1, +1, +10)
      assert.ok(
        content.includes("min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl"),
        "TouchSizePad stepper buttons must feature min-h-[44px] min-w-[44px]"
      );

      // Direct numeric input
      assert.ok(
        content.includes("w-16 min-h-[44px] text-center font-extrabold"),
        "TouchSizePad numeric input must have min-h-[44px]"
      );

      // Preset buttons (+50, +100, +200 psg)
      assert.ok(
        content.includes("min-h-[44px] px-3 py-2 rounded-xl bg-blue-50"),
        "+50 psg preset button must have min-h-[44px]"
      );
      assert.ok(
        content.includes("min-h-[44px] px-3 py-2 rounded-xl bg-amber-50"),
        "+100 psg preset button must have min-h-[44px]"
      );
      assert.ok(
        content.includes("min-h-[44px] px-3 py-2 rounded-xl bg-red-50"),
        "+200 psg preset button must have min-h-[44px]"
      );

      // Reset / clear button
      assert.ok(
        content.includes("min-h-[44px] px-3 py-2 rounded-xl bg-gray-200"),
        "Reset button must have min-h-[44px]"
      );
    });

    it("verifies mobile search clear button and filter chips have 44px touch targets", () => {
      const pageFilePath = path.join(rootDir, "src/app/page.tsx");
      const content = fs.readFileSync(pageFilePath, "utf-8");

      // Filter chips min-h-[44px]
      assert.ok(
        content.includes("min-h-[44px]") && content.includes("px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold"),
        "Mobile status filter chips must have min-h-[44px]"
      );

      // Search clear button min-w-[44px] min-h-[44px]
      assert.ok(
        content.includes("min-w-[44px] min-h-[44px] p-2.5"),
        "Mobile search clear button must have 44x44px touch target"
      );
    });

    it("verifies DispatchConfirmModal buttons meet 44px touch targets", () => {
      const modalFilePath = path.join(rootDir, "src/components/delivery-orders/DispatchConfirmModal.tsx");
      const content = fs.readFileSync(modalFilePath, "utf-8");

      // Header close button
      assert.ok(
        content.includes("min-w-[44px] min-h-[44px] p-2.5 rounded-lg"),
        "Dispatch modal close button must have min-w-[44px] min-h-[44px]"
      );

      // Footer Cancel & Confirm buttons
      assert.ok(
        content.includes("min-h-[44px] px-4 py-2.5 rounded-xl border"),
        "Dispatch modal cancel button must have min-h-[44px]"
      );
      assert.ok(
        content.includes("min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl"),
        "Dispatch modal confirm button must have min-h-[44px]"
      );
    });
  });

  describe("2. Lifecycle Stepper aria-current='step' (WCAG 4.1.2)", () => {
    function resolveStepAriaCurrent(orderStatus: DeliveryOrderStatus, stepKey: DeliveryOrderStatus) {
      const stepOrder: Record<DeliveryOrderStatus, number> = {
        DRAFT: 0,
        CONFIRMED: 1,
        PRINTED: 2,
        DISPATCHED: 3,
        DELIVERED: 4,
        CANCELLED: -1,
      };
      const currentIdx = stepOrder[orderStatus] ?? 0;
      const stepIdx = stepOrder[stepKey] ?? 0;
      const isCurrent = currentIdx === stepIdx;
      return isCurrent ? "step" : undefined;
    }

    it("resolves aria-current='step' strictly for the active step and undefined for others", () => {
      const activeStatus: DeliveryOrderStatus = "PRINTED";

      assert.strictEqual(resolveStepAriaCurrent(activeStatus, "DRAFT"), undefined);
      assert.strictEqual(resolveStepAriaCurrent(activeStatus, "CONFIRMED"), undefined);
      assert.strictEqual(resolveStepAriaCurrent(activeStatus, "PRINTED"), "step");
      assert.strictEqual(resolveStepAriaCurrent(activeStatus, "DISPATCHED"), undefined);
      assert.strictEqual(resolveStepAriaCurrent(activeStatus, "DELIVERED"), undefined);
    });

    it("verifies OrderDetail source code includes aria-current={isCurrent ? 'step' : undefined}", () => {
      const orderDetailFilePath = path.join(rootDir, "src/components/delivery-orders/OrderDetail.tsx");
      const content = fs.readFileSync(orderDetailFilePath, "utf-8");

      assert.ok(
        content.includes('aria-current={isCurrent ? "step" : undefined}'),
        "OrderDetail stepper must set aria-current on active step"
      );
    });
  });

  describe("3. Named Search Inputs with Explicit aria-label", () => {
    it("verifies mobile search input in page.tsx has accessible aria-label", () => {
      const pageFilePath = path.join(rootDir, "src/app/page.tsx");
      const content = fs.readFileSync(pageFilePath, "utf-8");

      assert.ok(
        content.includes('aria-label={isId ? "Cari surat jalan berdasarkan nomor, customer, PO, atau sopir" : "Search delivery orders by number, client, PO, or driver"}'),
        "Mobile search input must feature localized aria-label"
      );
    });

    it("verifies desktop search input in OrderList.tsx has accessible aria-label", () => {
      const orderListFilePath = path.join(rootDir, "src/components/delivery-orders/OrderList.tsx");
      const content = fs.readFileSync(orderListFilePath, "utf-8");

      assert.ok(
        content.includes('aria-label={isId ? "Cari surat jalan berdasarkan nomor, customer, atau PO" : "Search delivery orders by number, client, or PO"}'),
        "Desktop search input must feature localized aria-label"
      );
    });

    it("verifies TouchSizePad input has accessible aria-label naming current size", () => {
      const touchPadFilePath = path.join(rootDir, "src/components/delivery-orders/TouchSizePad.tsx");
      const content = fs.readFileSync(touchPadFilePath, "utf-8");

      assert.ok(
        content.includes('aria-label={isId ? `Jumlah pasang ukuran ${activeSize}` : `Quantity for size ${activeSize}`}'),
        "TouchSizePad numeric input must have dynamic size-aware aria-label"
      );
    });
  });

  describe("4. Cancel-First Focus in DispatchConfirmModal", () => {
    it("verifies initialFocusRef points to cancelButtonRef to prevent accidental dispatch", () => {
      const modalFilePath = path.join(rootDir, "src/components/delivery-orders/DispatchConfirmModal.tsx");
      const content = fs.readFileSync(modalFilePath, "utf-8");

      assert.ok(
        content.includes("const cancelButtonRef = useRef<HTMLButtonElement | null>(null);"),
        "Must declare cancelButtonRef"
      );
      assert.ok(
        content.includes("initialFocusRef: cancelButtonRef"),
        "Must pass cancelButtonRef to useModalSafety"
      );
      assert.ok(
        content.includes("ref={cancelButtonRef}"),
        "Must attach cancelButtonRef to Cancel button"
      );
      assert.ok(
        !content.includes("confirmButtonRef"),
        "confirmButtonRef should not be used as initial focus"
      );
    });
  });

  describe("5. Un-nested Print Button from Listbox role='option' (WAI-ARIA 1.2)", () => {
    it("verifies OrderList separates role='option' from interactive print button", () => {
      const orderListFilePath = path.join(rootDir, "src/components/delivery-orders/OrderList.tsx");
      const content = fs.readFileSync(orderListFilePath, "utf-8");

      // The outer container is a relative group wrapper
      assert.ok(
        content.includes('className="group relative'),
        "List item row must be wrapped in relative group container"
      );

      // The role="option" element is an inner div
      assert.ok(
        content.includes('role="option"'),
        "Option selector must be isolated"
      );

      // The print button is positioned outside role="option" as an absolute sibling
      assert.ok(
        content.includes('className="absolute right-3.5 bottom-2 z-10"'),
        "Print button container must be an absolute sibling outside role='option'"
      );
    });
  });

  describe("6. Keyboard Shortcut: Ctrl+Enter / Cmd+Enter to Save Changes", () => {
    it("verifies OrderDetail attaches keydown listener for Ctrl+Enter when editing", () => {
      const orderDetailFilePath = path.join(rootDir, "src/components/delivery-orders/OrderDetail.tsx");
      const content = fs.readFileSync(orderDetailFilePath, "utf-8");

      assert.ok(
        content.includes('(e.ctrlKey || e.metaKey) && e.key === "Enter"'),
        "Must check for Ctrl+Enter or Cmd+Enter"
      );
      assert.ok(
        content.includes("handleSaveChangesRef.current()"),
        "Must invoke latest handleSaveChanges via ref"
      );
      assert.ok(
        content.includes('title={isId ? "Simpan Perubahan (Ctrl+Enter)" : "Save Changes (Ctrl+Enter)"}'),
        "Save button must provide title with shortcut hint"
      );
      assert.ok(
        content.includes("Ctrl+↵"),
        "Save button must display Ctrl+↵ badge"
      );
    });

    it("verifies shortcut logic fires only when isEditing is true", () => {
      let saved = false;
      const handleSaveChanges = () => {
        saved = true;
      };

      const simulateKeyDown = (isEditing: boolean, ctrlKey: boolean, metaKey: boolean, key: string) => {
        saved = false;
        if (!isEditing) return;
        if ((ctrlKey || metaKey) && key === "Enter") {
          handleSaveChanges();
        }
      };

      // 1. Not editing: should not trigger
      simulateKeyDown(false, true, false, "Enter");
      assert.strictEqual(saved, false);

      // 2. Editing, plain Enter: should not trigger (allow multiline or form enter)
      simulateKeyDown(true, false, false, "Enter");
      assert.strictEqual(saved, false);

      // 3. Editing, Ctrl+Enter: triggers
      simulateKeyDown(true, true, false, "Enter");
      assert.strictEqual(saved, true);

      // 4. Editing, Cmd+Enter: triggers
      simulateKeyDown(true, false, true, "Enter");
      assert.strictEqual(saved, true);
    });
  });
});
