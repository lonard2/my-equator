import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Archive Digitizer Hardening (Impeccable P0)", () => {
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
});
