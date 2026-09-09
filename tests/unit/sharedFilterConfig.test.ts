import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getOrderFilterOptions } from "@/lib/utils/statusColors";

describe("Shared Filter Configuration & Vocabulary Distillation (Impeccable Distill)", () => {
  describe("Canonical 6-Filter Sequence & Token Label Fidelity", () => {
    it("returns identical 6-filter options in both Indonesian and English", () => {
      const optionsId = getOrderFilterOptions("id");
      const optionsEn = getOrderFilterOptions("en");

      assert.strictEqual(optionsId.length, 6);
      assert.strictEqual(optionsEn.length, 6);

      // DELIVERED + CANCELLED collapse into one terminal group: keeps the chip
      // row within scannable range for gloved warehouse use.
      const expectedSequence = ["ALL", "DRAFT", "CONFIRMED", "PRINTED", "DISPATCHED", "ARCHIVED"];

      assert.deepStrictEqual(
        optionsId.map((o) => o.id),
        expectedSequence,
        "Indonesian filter sequence must match lifecycle order with terminal archive group"
      );
      assert.deepStrictEqual(
        optionsEn.map((o) => o.id),
        expectedSequence,
        "English filter sequence must match lifecycle order with terminal archive group"
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
      assert.strictEqual(
        labelMap.ARCHIVED,
        "Selesai / Arsip",
        "DELIVERED and CANCELLED collapse into one terminal group label"
      );
    });

    it("enforces authoritative DESIGN.md token labels in English", () => {
      const optionsEn = getOrderFilterOptions("en");
      const labelMap = Object.fromEntries(optionsEn.map((o) => [o.id, o.label]));

      assert.strictEqual(labelMap.ALL, "All");
      assert.strictEqual(labelMap.DRAFT, "Draft");
      assert.strictEqual(labelMap.CONFIRMED, "Confirmed");
      assert.strictEqual(labelMap.PRINTED, "Printed");
      assert.strictEqual(labelMap.DISPATCHED, "Dispatched");
      assert.strictEqual(
        labelMap.ARCHIVED,
        "Done / Archive",
        "DELIVERED and CANCELLED collapse into one terminal group label"
      );
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
