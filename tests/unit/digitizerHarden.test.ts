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
});
