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
});
