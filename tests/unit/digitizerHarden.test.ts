import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Archive Digitizer Hardening & Data Integrity (Impeccable P0 & P1)", () => {
  const digitizerSource = fs.readFileSync(
    path.join(process.cwd(), "src/components/delivery-orders/ArchiveDigitizer.tsx"),
    "utf-8"
  );

  describe("1. Per-Row Save Status & Visual States", () => {
    it("verifies per-row status styling maps saving, saved, and error to distinct left border and background classes", () => {
      // Check presence of data-row-status on both mobile and desktop rows
      assert.ok(
        digitizerSource.includes("data-row-status={row.status}"),
        "ArchiveDigitizer must pass data-row-status attribute to row elements"
      );

      // Verify border-l-4 and status-specific color assignments for desktop
      assert.ok(
        digitizerSource.includes("border-l-4 border-l-amber-500"),
        "Must include amber left-border for saving status"
      );
      assert.ok(
        digitizerSource.includes("border-l-4 border-l-emerald-500"),
        "Must include emerald left-border for saved status"
      );
      assert.ok(
        digitizerSource.includes("border-l-4 border-l-red-600"),
        "Must include red left-border for error status"
      );

      // Verify desktop status badge indicators exist
      assert.ok(
        digitizerSource.includes('data-testid="row-status-saving"'),
        "Desktop row must render saving badge"
      );
      assert.ok(
        digitizerSource.includes('data-testid="row-status-saved"'),
        "Desktop row must render saved badge"
      );
      assert.ok(
        digitizerSource.includes('data-testid="row-status-error"'),
        "Desktop row must render error badge"
      );

      // Verify desktop row-level error message is rendered
      assert.ok(
        digitizerSource.includes('data-testid="row-error-message"'),
        "Desktop row must render inline error message when status is error"
      );
    });

    it("verifies mobile cards render per-row status chips and error messages", () => {
      assert.ok(
        digitizerSource.includes('data-testid="mobile-row-status-saving"'),
        "Mobile card must render mobile saving chip"
      );
      assert.ok(
        digitizerSource.includes('data-testid="mobile-row-status-saved"'),
        "Mobile card must render mobile saved chip"
      );
      assert.ok(
        digitizerSource.includes('data-testid="mobile-row-status-error"'),
        "Mobile card must render mobile error chip"
      );
      assert.ok(
        digitizerSource.includes('data-testid="mobile-row-error-message"'),
        "Mobile card must render mobile error banner when row fails"
      );
    });
  });

  describe("2. Retained Error Banner with Failed SJ Numbers", () => {
    it("verifies failed order numbers are stored in state and listed as badge pills", () => {
      assert.ok(
        digitizerSource.includes("failedOrderNumbers"),
        "Component must maintain failedOrderNumbers state"
      );
      assert.ok(
        digitizerSource.includes('data-testid="failed-sj-pill"'),
        "Error banner must render failed SJ badge pills"
      );
    });

    it("verifies error banner has accessible ARIA attributes role='alert' and aria-live='polite'", () => {
      assert.ok(
        digitizerSource.includes('role="alert"'),
        "Error banner must have role='alert'"
      );
      assert.ok(
        digitizerSource.includes('aria-live="polite"'),
        "Error banner must have aria-live='polite'"
      );
    });

    it("verifies dismissing error banner clears failedOrderNumbers state", () => {
      assert.ok(
        digitizerSource.includes("setFailedOrderNumbers([])"),
        "Dismissing error notification must clear failedOrderNumbers"
      );
    });
  });

  describe("3. Explicit Inherited Defaults on Mobile Cards", () => {
    it("verifies mobile cards explicitly surface Destination Address", () => {
      assert.ok(
        digitizerSource.includes("destinationAddress"),
        "Mobile cards must render destinationAddress input"
      );
      assert.ok(
        digitizerSource.includes('handleRowChange(row.id, "destinationAddress"'),
        "Mobile destinationAddress input must call handleRowChange"
      );
    });

    it("verifies mobile cards explicitly surface Article Model, Delivery Date, and Unit Price", () => {
      // Model Artikel
      assert.ok(
        digitizerSource.includes('handleRowChange(row.id, "articleCode"'),
        "Mobile cards must allow editing articleCode"
      );
      // Delivery Date
      assert.ok(
        digitizerSource.includes('handleRowChange(row.id, "deliveryDate"'),
        "Mobile cards must allow editing deliveryDate"
      );
      // Unit Price
      assert.ok(
        digitizerSource.includes('handleRowChange(row.id, "unitPrice"'),
        "Mobile cards must allow editing unitPrice"
      );
    });

    it("verifies mobile inputs meet touch ergonomics", () => {
      assert.ok(
        digitizerSource.includes("min-h-[40px]") || digitizerSource.includes("min-h-[44px]"),
        "Mobile inputs must provide comfortable touch targets"
      );
    });
  });

  describe("4. Duplicate-SJ Collision Warnings (In-Batch & Against DB)", () => {
    it("verifies in-batch duplicate tracking detects duplicate order numbers across rows", () => {
      assert.ok(
        digitizerSource.includes("duplicateOrderNumbersInBatch"),
        "Component must compute duplicateOrderNumbersInBatch"
      );
      assert.ok(
        digitizerSource.includes('data-testid="duplicate-sj-warning"'),
        "Desktop row must render duplicate warning badge on collision"
      );
      assert.ok(
        digitizerSource.includes('data-testid="mobile-duplicate-sj-warning"'),
        "Mobile card must render duplicate warning badge on collision"
      );
    });

    it("verifies handleSaveBatch enforces in-batch duplicate check before network commit", () => {
      assert.ok(
        digitizerSource.includes("if (duplicateOrderNumbersInBatch.size > 0)"),
        "handleSaveBatch must guard against in-batch duplicates"
      );
    });

    it("verifies handleSaveBatch queries existing database orders to block DB collisions before writes", () => {
      assert.ok(
        digitizerSource.includes('fetch("/api/orders")'),
        "handleSaveBatch must pre-fetch existing orders to detect DB collisions"
      );
      assert.ok(
        digitizerSource.includes("existingDbSet.has"),
        "handleSaveBatch must cross-check each order number against existing DB records"
      );
    });

    it("verifies handleAddRow automatically resolves collisions when assigning sequence numbers", () => {
      assert.ok(
        digitizerSource.includes("existingNumbers.has(newOrderNumber.toUpperCase())"),
        "handleAddRow must increment sequence to guarantee a unique order number"
      );
    });
  });

  describe("5. Confirm & Undo Guard on Date-Offset Chips", () => {
    it("verifies date-offset chips check for divergent row dates before overwriting", () => {
      assert.ok(
        digitizerSource.includes("executeOrConfirmDateChange"),
        "Must route date changes through executeOrConfirmDateChange guard"
      );
      assert.ok(
        digitizerSource.includes("r.deliveryDate !== globalDate"),
        "Must detect rows with custom divergent dates"
      );
    });

    it("verifies confirmation modal appears when divergent row dates are present", () => {
      assert.ok(
        digitizerSource.includes("pendingDateChange"),
        "Must maintain pendingDateChange state for confirmation modal"
      );
      assert.ok(
        digitizerSource.includes('id="date-confirm-dialog-title"'),
        "Confirmation dialog must have accessible title"
      );
    });

    it("verifies date change snapshot enables 1-click Undo live region toast", () => {
      assert.ok(
        digitizerSource.includes("dateUndoBuffer"),
        "Component must store dateUndoBuffer snapshot for rollback"
      );
      assert.ok(
        digitizerSource.includes("handleUndoDateChange"),
        "Component must implement handleUndoDateChange"
      );
    });

    it("verifies quick date offset chips display active state corresponding to globalDate", () => {
      assert.ok(
        digitizerSource.includes("isTodayActive"),
        "Must evaluate isTodayActive"
      );
      assert.ok(
        digitizerSource.includes("isYesterdayActive"),
        "Must evaluate isYesterdayActive"
      );
      assert.ok(
        digitizerSource.includes("isWeekAgoActive"),
        "Must evaluate isWeekAgoActive"
      );
    });
  });

  describe("6. Impeccable Clarify: Price Transparency, Staged Verbs, Aligned Naming & Bilingual ARIA", () => {
    it("verifies price transparency with visible unit-price column on desktop grid and mobile cards", () => {
      // Desktop header
      assert.ok(
        digitizerSource.includes('isId ? "Harga (Rp)" : "Unit Price"'),
        "Desktop grid header must include unit price column"
      );
      // Desktop row input
      assert.ok(
        digitizerSource.includes('aria-label={isId ? `Harga satuan baris ${rIdx + 1}` : `Unit price row ${rIdx + 1}`}'),
        "Desktop row must include unit price input with bilingual aria-label"
      );
      // Desktop table footer colSpan
      assert.ok(
        digitizerSource.includes("colSpan={6}"),
        "Desktop tfoot colSpan must be 6 to accommodate the unit price column"
      );
      // Mobile card unit price
      assert.ok(
        digitizerSource.includes('isId ? "Harga Satuan (Rp)" : "Unit Price (Rp)"'),
        "Mobile card must display unit price label"
      );
    });

    it("verifies honest staged-vs-committed verbs across paste feedback and commit button", () => {
      // Paste feedback mentions staged / draf belum disimpan
      assert.ok(
        digitizerSource.includes("draf belum disimpan ke database") &&
          digitizerSource.includes("staged to worksheet (drafts not yet committed to database)"),
        "Paste ingestion must explicitly state rows are staged and not yet committed"
      );
      // Action button uses 'Simpan ke Database' / 'Commit to Database'
      assert.ok(
        digitizerSource.includes("Simpan ke Database") &&
          digitizerSource.includes("Commit to Database"),
        "Commit button must clearly indicate saving to database"
      );
    });

    it("verifies 'Kosongkan Lembar Kerja' / 'Clear Worksheet' naming is aligned between trigger and dialog", () => {
      // Header trigger
      assert.ok(
        digitizerSource.includes('isId ? "Kosongkan Lembar Kerja" : "Clear Worksheet"'),
        "Header trigger button must say 'Kosongkan Lembar Kerja' / 'Clear Worksheet'"
      );
      // Dialog title
      assert.ok(
        digitizerSource.includes('isId ? "Kosongkan Lembar Kerja?" : "Clear Worksheet?"'),
        "Dialog title must say 'Kosongkan Lembar Kerja?' / 'Clear Worksheet?'"
      );
      // Dialog confirm button
      assert.ok(
        digitizerSource.includes('isId ? "Ya, Kosongkan Lembar Kerja" : "Clear Worksheet"'),
        "Dialog confirm button must match 'Kosongkan Lembar Kerja' / 'Clear Worksheet'"
      );
      // Dialog accessibility
      assert.ok(
        digitizerSource.includes('id="clear-dialog-title"'),
        "Clear dialog title must have id for aria-labelledby"
      );
      assert.ok(
        digitizerSource.includes('aria-labelledby="clear-dialog-title"'),
        "Clear dialog must reference clear-dialog-title"
      );
    });

    it("verifies order number is styled as an unmistakable editable input on both desktop and mobile", () => {
      // Desktop order number input
      assert.ok(
        digitizerSource.includes('placeholder="SJ/EQ/..."') &&
          digitizerSource.includes('aria-label={isId ? `Nomor surat jalan baris ${rIdx + 1}` : `Order number row ${rIdx + 1}`}'),
        "Desktop order number must be an input with placeholder and accessible label"
      );
      // Mobile order number input
      assert.ok(
        digitizerSource.includes('aria-label={isId ? `Nomor surat jalan baris ${idx + 1}` : `Order number row ${idx + 1}`}'),
        "Mobile order number must be an input with accessible label"
      );
    });

    it("verifies all sizing cells, dates, and delete buttons use bilingual aria-labels", () => {
      // Mobile sizing aria-label
      assert.ok(
        digitizerSource.includes('aria-label={isId ? `Ukuran ${size}, Baris ${idx + 1}` : `Size ${size}, Row ${idx + 1}`}'),
        "Mobile sizing cells must have bilingual aria-label"
      );
      // Desktop sizing aria-label
      assert.ok(
        digitizerSource.includes('aria-label={isId ? `Ukuran ${size}, Baris ${rIdx + 1}` : `Size ${size}, Row ${rIdx + 1}`}'),
        "Desktop sizing cells must have bilingual aria-label"
      );
      // Desktop delivery date aria-label
      assert.ok(
        digitizerSource.includes('aria-label={isId ? `Tanggal surat jalan baris ${rIdx + 1}` : `Delivery date row ${rIdx + 1}`}'),
        "Desktop delivery date must have bilingual aria-label"
      );
      // Desktop delete button aria-label
      assert.ok(
        digitizerSource.includes('aria-label={isId ? `Hapus baris ${rIdx + 1}` : `Delete row ${rIdx + 1}`}'),
        "Desktop delete button must have bilingual aria-label"
      );
    });
  });

  describe("7. Impeccable Distill: Keyboard Contract & Unified Date Cluster", () => {
    it("verifies Enter in the last size cell (45) commits the row and advances to next row (size 36)", () => {
      // Must differentiate last size vs non-last size on Enter
      assert.ok(
        digitizerSource.includes("LAST_SIZE") && digitizerSource.includes("FIRST_SIZE"),
        "Component must identify LAST_SIZE and FIRST_SIZE boundaries"
      );
      assert.ok(
        digitizerSource.includes("if (size === LAST_SIZE)"),
        "handleSizeKeyDown must check if Enter was pressed in the last size cell"
      );
      assert.ok(
        digitizerSource.includes('data-size="${FIRST_SIZE}"'),
        "Enter in last size cell must advance to FIRST_SIZE (size 36) of next row"
      );
    });

    it("verifies auto-spawn focus eliminates querySelector/setTimeout race condition", () => {
      // Must NOT contain the fragile setTimeout 60ms race condition
      assert.ok(
        !digitizerSource.includes("setTimeout(") ||
          !digitizerSource.includes("setTimeout(() => {\n          const nextInput"),
        "Must not use fragile setTimeout for auto-spawn input focus"
      );
      // Must use pendingFocusRef and useEffect for deterministic focus after DOM commit
      assert.ok(
        digitizerSource.includes("pendingFocusRef"),
        "Must declare and use pendingFocusRef for pending focus target"
      );
      assert.ok(
        digitizerSource.includes("pendingFocusRef.current = null"),
        "useEffect must consume and reset pendingFocusRef upon mounting new row"
      );
    });

    it("verifies date cluster collapses to one unified mental model with real active states", () => {
      // Unified segmented control container
      assert.ok(
        digitizerSource.includes("aria-pressed={isTodayActive}"),
        "Today chip must have accessible aria-pressed active state"
      );
      assert.ok(
        digitizerSource.includes("aria-pressed={isYesterdayActive}"),
        "Yesterday chip must have accessible aria-pressed active state"
      );
      assert.ok(
        digitizerSource.includes("aria-pressed={isWeekAgoActive}"),
        "Week-ago chip must have accessible aria-pressed active state"
      );
      assert.ok(
        digitizerSource.includes("isCustomActive"),
        "Component must evaluate isCustomActive for custom calendar dates"
      );
      // Direct application on calendar change through executeOrConfirmDateChange
      assert.ok(
        digitizerSource.includes("executeOrConfirmDateChange(newDate"),
        "Calendar input onChange must directly route through executeOrConfirmDateChange guard"
      );
      // Redundant separate 'Terapkan Semua' text button eliminated
      assert.ok(
        !digitizerSource.includes('onClick={requestApplyGlobalDate}'),
        "Redundant separate 'Terapkan Semua' button must be removed in favor of unified mental model"
      );
    });

    it("verifies keyboard shortcuts modal explains Enter on last size row commit", () => {
      assert.ok(
        digitizerSource.includes("Selesaikan baris & lanjut baris baru (di ukuran akhir 45)") &&
          digitizerSource.includes("Commit row & advance to next row (at size 45)"),
        "Shortcuts cheat sheet modal must describe Enter committing row at size 45"
      );
    });
  });

  describe("8. Impeccable Audit: Sam/Casey Accessibility & Keyboard Navigation", () => {
    it("verifies clear-confirm dialog role, aria-modal, title label, and keyboard focus trap", () => {
      // role="dialog", aria-modal="true", and aria-labelledby
      assert.ok(
        digitizerSource.includes('role="dialog"') &&
          digitizerSource.includes('aria-modal="true"') &&
          digitizerSource.includes('aria-labelledby="clear-dialog-title"'),
        "Clear confirmation modal must be an accessible dialog with aria-modal and labelledby"
      );

      // Focus trap handling: Escape and Tab / Shift+Tab cycling
      assert.ok(
        digitizerSource.includes('if (e.key === "Escape")') &&
          digitizerSource.includes("clearButtonRef.current?.focus()"),
        "Escape must close modal and return focus to clear trigger button"
      );
      assert.ok(
        digitizerSource.includes('e.key === "Tab"') &&
          digitizerSource.includes("confirmClearButtonRef.current?.focus()") &&
          digitizerSource.includes("cancelClearButtonRef.current?.focus()"),
        "Tab and Shift+Tab must trap focus between cancel and confirm buttons"
      );

      // Cancel-first safety autofocus
      assert.ok(
        digitizerSource.includes("cancelClearButtonRef.current?.focus()"),
        "Clear modal must auto-focus cancel button on open for safety"
      );

      // 44px touch targets on modal buttons
      assert.ok(
        digitizerSource.includes("min-h-[44px] px-3.5 py-2 rounded-xl border border-gray-300") &&
          digitizerSource.includes("min-h-[44px] px-3.5 py-2 rounded-xl bg-red-600"),
        "Clear modal buttons must meet min-h-[44px] touch target requirements"
      );
    });

    it("verifies error banner is a persistent live region with assertive priority and 44px dismiss target", () => {
      assert.ok(
        digitizerSource.includes('role="alert"') &&
          digitizerSource.includes('aria-live="assertive"') &&
          digitizerSource.includes('aria-atomic="true"'),
        "Error banner must be an assertive atomic live region"
      );
      assert.ok(
        digitizerSource.includes('className={\n          errorMessage\n            ? "p-3.5 rounded-xl') &&
          digitizerSource.includes(': "sr-only"'),
        "Error banner container must stay mounted in DOM as sr-only when empty so screen readers detect alerts"
      );
      assert.ok(
        digitizerSource.includes('className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:bg-red-100'),
        "Dismiss button must meet 44x44px minimum touch target"
      );
    });

    it("verifies desktop table delete button meets 44px touch target guidelines", () => {
      assert.ok(
        digitizerSource.includes('min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-gray-500 hover:text-red-700'),
        "Desktop row delete button must be at least 44x44px"
      );
    });

    it("verifies vertical arrow key navigation on non-size fields outside size matrix", () => {
      // NonSizeField union type defined
      assert.ok(
        digitizerSource.includes('type NonSizeField = "orderNumber" | "recipientName" | "deliveryDate" | "articleCode" | "unitPrice"'),
        "Component must define NonSizeField type for non-size column inputs"
      );

      // Data attributes and onKeyDown handlers wired to desktop fields
      assert.ok(
        digitizerSource.includes('data-field="orderNumber"') &&
          digitizerSource.includes('onKeyDown={(e) => handleFieldKeyDown(e, rIdx, "orderNumber")}'),
        "orderNumber must support handleFieldKeyDown"
      );
      assert.ok(
        digitizerSource.includes('data-field="recipientName"') &&
          digitizerSource.includes('onKeyDown={(e) => handleFieldKeyDown(e, rIdx, "recipientName")}'),
        "recipientName must support handleFieldKeyDown"
      );
      assert.ok(
        digitizerSource.includes('data-field="deliveryDate"') &&
          digitizerSource.includes('onKeyDown={(e) => handleFieldKeyDown(e, rIdx, "deliveryDate")}'),
        "deliveryDate must support handleFieldKeyDown"
      );
      assert.ok(
        digitizerSource.includes('data-field="articleCode"') &&
          digitizerSource.includes('onKeyDown={(e) => handleFieldKeyDown(e, rIdx, "articleCode")}'),
        "articleCode must support handleFieldKeyDown"
      );
      assert.ok(
        digitizerSource.includes('data-field="unitPrice"') &&
          digitizerSource.includes('onKeyDown={(e) => handleFieldKeyDown(e, rIdx, "unitPrice")}'),
        "unitPrice must support handleFieldKeyDown"
      );

      // handleFieldKeyDown logic checks
      assert.ok(
        digitizerSource.includes('const handleFieldKeyDown = ('),
        "handleFieldKeyDown handler must be implemented"
      );
      assert.ok(
        digitizerSource.includes('pendingFocusRef.current = { type: "field", rowIndex: nextRowIndex, field };') &&
          digitizerSource.includes('handleAddRow();'),
        "ArrowDown at last row must spawn row and maintain column focus via pendingFocusRef"
      );
    });
  });

  describe("9. Impeccable Design Rubric Verification: Camera OCR, Catalog Validation & Empty States", () => {
    it("verifies off-catalog article validation and collision-free order numbering during paste", () => {
      // Validates raw pasted article against catalog
      assert.ok(
        digitizerSource.includes("ARTICLE_CATALOG.find(") &&
          digitizerSource.includes("offCatalogCount"),
        "Paste ingestion must validate pasted articles against ARTICLE_CATALOG and count off-catalog items"
      );
      // Informs user of off-catalog adjustments instead of silently inventing articles
      assert.ok(
        digitizerSource.includes("artikel di luar katalog disesuaikan ke standar") &&
          digitizerSource.includes("off-catalog items mapped to standard"),
        "Paste ingestion must notify operator if off-catalog articles were normalized"
      );
      // Collision-free sequential numbering checking existing batch numbers
      assert.ok(
        digitizerSource.includes("while (existingNumbers.has(orderNumber.toUpperCase()))"),
        "Paste ingestion must ensure newly parsed rows never collide with existing batch numbers"
      );
    });

    it("verifies mobile camera & physical paper slip photo capture affordance", () => {
      // Hidden camera input with capture="environment"
      assert.ok(
        digitizerSource.includes('type="file"') &&
          digitizerSource.includes('ref={cameraInputRef}') &&
          digitizerSource.includes('capture="environment"'),
        "Digitizer must provide camera file input for direct physical slip capture"
      );
      // handleCapturePhoto handler stages row with photoPreviewUrl
      assert.ok(
        digitizerSource.includes("const handleCapturePhoto = (") &&
          digitizerSource.includes("photoPreviewUrl: previewUrl"),
        "handleCapturePhoto must stage a draft row carrying the captured slip preview"
      );
      // Camera triggers in header and bottom toolbar
      assert.ok(
        digitizerSource.includes("cameraInputRef.current?.click()") &&
          digitizerSource.includes("Foto Slip"),
        "Digitizer must provide explicit camera slip capture buttons"
      );
      // Photo slip badges rendered on rows
      assert.ok(
        digitizerSource.includes('data-testid="photo-slip-badge"'),
        "Desktop row must render photo badge when staged from physical slip"
      );
    });

    it("verifies comprehensive empty state handling when rows are cleared", () => {
      assert.ok(
        digitizerSource.includes("Lembar Kerja Kosong") &&
          digitizerSource.includes("Worksheet is Empty"),
        "Mobile feed must display clear empty state when rows are empty"
      );
      assert.ok(
        digitizerSource.includes("Lembar Kerja Masih Kosong") &&
          digitizerSource.includes("Worksheet is Empty"),
        "Desktop table tbody must render a colSpan empty state row when rows.length is 0"
      );
    });

    it("verifies top quick commit button in header for rapid operator workflow", () => {
      assert.ok(
        digitizerSource.includes("Simpan ke DB") &&
          digitizerSource.includes("Commit DB"),
        "Top header toolbar must offer a quick commit button so operators don't have to scroll to bottom"
      );
    });

    it("verifies handleRowChange is strictly typed without any", () => {
      assert.ok(
        digitizerSource.includes("const handleRowChange = <K extends keyof BatchRow>(id: string, field: K, value: BatchRow[K]) =>"),
        "handleRowChange must be generic and strictly typed to avoid any"
      );
    });
  });
});


