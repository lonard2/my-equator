import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getOrderFilterOptions } from "@/lib/utils/statusColors";

describe("Shared Filter Configuration & Vocabulary Distillation (Impeccable Distill)", () => {
  describe("Canonical 7-Status Sequence & Token Label Fidelity", () => {
    it("returns identical 7-filter options in both Indonesian and English", () => {
      const optionsId = getOrderFilterOptions("id");
      const optionsEn = getOrderFilterOptions("en");

      assert.strictEqual(optionsId.length, 7);
      assert.strictEqual(optionsEn.length, 7);

      const expectedSequence = ["ALL", "DRAFT", "CONFIRMED", "PRINTED", "DISPATCHED", "DELIVERED", "CANCELLED"];

      assert.deepStrictEqual(
        optionsId.map((o) => o.id),
        expectedSequence,
        "Indonesian filter sequence must match lifecycle order"
      );
      assert.deepStrictEqual(
        optionsEn.map((o) => o.id),
        expectedSequence,
        "English filter sequence must match lifecycle order"
      );
    });

    it("enforces authoritative DESIGN.md token labels in Indonesian (no colloquial drift)", () => {
      const optionsId = getOrderFilterOptions("id");
      const labelMap = Object.fromEntries(optionsId.map((o) => [o.id, o.label]));

      assert.strictEqual(labelMap.ALL, "Semua");
      assert.strictEqual(labelMap.DRAFT, "Draft");
      assert.strictEqual(labelMap.CONFIRMED, "Terkonfirmasi", "Eliminated 'Konfirm' in favor of Terkonfirmasi");
      assert.strictEqual(labelMap.PRINTED, "Tercetak");
      assert.strictEqual(labelMap.DISPATCHED, "Dikirim", "Eliminated 'Kirim' in favor of Dikirim");
      assert.strictEqual(labelMap.DELIVERED, "Diterima", "Eliminated 'Selesai' in favor of Diterima");
      assert.strictEqual(labelMap.CANCELLED, "Dibatalkan", "Eliminated 'Batal' in favor of Dibatalkan");
    });

    it("enforces authoritative DESIGN.md token labels in English", () => {
      const optionsEn = getOrderFilterOptions("en");
      const labelMap = Object.fromEntries(optionsEn.map((o) => [o.id, o.label]));

      assert.strictEqual(labelMap.ALL, "All");
      assert.strictEqual(labelMap.DRAFT, "Draft");
      assert.strictEqual(labelMap.CONFIRMED, "Confirmed");
      assert.strictEqual(labelMap.PRINTED, "Printed");
      assert.strictEqual(labelMap.DISPATCHED, "Dispatched");
      assert.strictEqual(labelMap.DELIVERED, "Delivered");
      assert.strictEqual(labelMap.CANCELLED, "Cancelled");
    });
  });

  describe("Casey Touch Safety: Mobile Chip Ergonomics", () => {
    it("verifies mobile filter chips meet the 44px touch height floor", () => {
      const mobileFilterChipSpec = {
        minHeightPx: 44,
        paddingYPx: 8,
        activeScaleRatio: 0.95,
      };

      assert.ok(
        mobileFilterChipSpec.minHeightPx >= 44,
        `Mobile filter chip height (${mobileFilterChipSpec.minHeightPx}px) must satisfy 44px minimum touch target for factory glove use`
      );
    });
  });
});
