import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Insole CAD Studio P0 Hardenings (Impeccable Harden)", () => {
  const cadStudioPath = path.resolve(process.cwd(), "src/components/design-studio/CadStudio.tsx");
  const cadAiModalPath = path.resolve(process.cwd(), "src/components/design-studio/CadAiModal.tsx");

  const cadStudioSource = fs.readFileSync(cadStudioPath, "utf-8");
  const cadAiModalSource = fs.readFileSync(cadAiModalPath, "utf-8");

  describe("P0-1: Blueprint-Save Failure Toast Re-toning", () => {
    it("verifies blueprint-save API failure re-tones showToast to error", () => {
      // Must pass "error" tone on json.success === false
      assert.ok(
        cadStudioSource.includes(
          'showToast(json.error || (isId ? "Gagal menyimpan blueprint." : "Failed to save blueprint."), "error");'
        ),
        "API failure branch must explicitly pass 'error' tone to showToast"
      );
    });

    it("verifies blueprint-save network catch re-tones showToast to error", () => {
      // Must pass "error" tone on catch (err)
      assert.ok(
        cadStudioSource.includes(
          'showToast(isId ? "Terjadi kesalahan saat menyimpan blueprint." : "Error saving blueprint.", "error");'
        ),
        "Network catch block must explicitly pass 'error' tone to showToast"
      );
    });

    it("verifies showToast properly clears existing timeout to prevent ghost auto-dismissal", () => {
      assert.ok(
        cadStudioSource.includes("toastTimeoutRef.current") &&
          cadStudioSource.includes("clearTimeout(toastTimeoutRef.current)"),
        "showToast must clear prior timeout ref before establishing new auto-dismiss timer"
      );
    });
  });

  describe("P0-2: AI Modal success:false Branch & Red Error Card with Retry", () => {
    it("verifies success:false branch in AI modal sets explicit error state instead of silent failure", () => {
      assert.ok(
        cadAiModalSource.includes("const [error, setError] = useState<string | null>(null);"),
        "CadAiModal must maintain an error state"
      );
      assert.ok(
        cadAiModalSource.includes("setError(") &&
          cadAiModalSource.includes("Gagal menghasilkan rancangan insole AI dari server.") &&
          cadAiModalSource.includes("Failed to generate AI insole design from server."),
        "CadAiModal must set error when json.success is false or data is missing"
      );
    });

    it("verifies AI modal error card mirrors the library error card with role=alert and AlertTriangle", () => {
      assert.ok(
        cadAiModalSource.includes('role="alert"') &&
          cadAiModalSource.includes("border-red-900/60") &&
          cadAiModalSource.includes("bg-red-950/30") &&
          cadAiModalSource.includes("text-red-300"),
        "Error card must have role=alert and match the library card's red styling"
      );
      assert.ok(
        cadAiModalSource.includes("<AlertTriangle className="),
        "Error card must render the AlertTriangle icon"
      );
    });

    it("verifies AI modal error card provides an accessible 44px Retry button", () => {
      assert.ok(
        cadAiModalSource.includes("min-h-[44px]") &&
          cadAiModalSource.includes('isId ? "Coba Lagi" : "Retry"'),
        "Retry button must meet 44px touch target guidelines and support bilingual labels"
      );
      assert.ok(
        cadAiModalSource.includes("setError(null);") &&
          cadAiModalSource.includes("handleGenerate();"),
        "Retry button must clear error and re-trigger generation"
      );
    });
  });

  describe("P1: Sizing-System Switch Migrates rawSizeValue & Clamps to Target Slider Bounds", () => {
    it("verifies CadStudio imports SIZING_BOUNDS and migrateSizingValue", () => {
      assert.ok(
        cadStudioSource.includes("SIZING_BOUNDS") &&
          cadStudioSource.includes("migrateSizingValue"),
        "CadStudio must import SIZING_BOUNDS and migrateSizingValue from insoleEngine"
      );
    });

    it("verifies clicking sizing buttons migrates rawSizeValue or customLengthMm", () => {
      assert.ok(
        cadStudioSource.includes("migrateSizingValue(sizingSystem, sys, currentVal)"),
        "CadStudio must call migrateSizingValue with current sizing system, target system, and current value"
      );
      assert.ok(
        cadStudioSource.includes("setCustomLengthMm(nextVal)") &&
          cadStudioSource.includes("setRawSizeValue(nextVal)"),
        "CadStudio must set customLengthMm when switching to CUSTOM_MM, or rawSizeValue otherwise"
      );
    });

    it("verifies slider and custom input use SIZING_BOUNDS for min, max, and step", () => {
      assert.ok(
        cadStudioSource.includes("SIZING_BOUNDS[sizingSystem]?.min") &&
          cadStudioSource.includes("SIZING_BOUNDS[sizingSystem]?.max") &&
          cadStudioSource.includes("SIZING_BOUNDS[sizingSystem]?.step"),
        "Slider range input must bind min, max, and step from SIZING_BOUNDS"
      );
      assert.ok(
        cadStudioSource.includes("SIZING_BOUNDS.CUSTOM_MM.min") &&
          cadStudioSource.includes("SIZING_BOUNDS.CUSTOM_MM.max") &&
          cadStudioSource.includes("SIZING_BOUNDS.CUSTOM_MM.step"),
        "Custom length input must bind min, max, and step from SIZING_BOUNDS.CUSTOM_MM"
      );
    });
  });
});

