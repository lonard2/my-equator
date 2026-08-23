import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeItemTotals } from "@/services/orderService";

describe("Delivery Order Calculation & Sizing Matrix Arithmetic", () => {
  it("calculates total pairs accurately from size breakdown object", () => {
    const sizes = {
      36: 10,
      37: 20,
      38: 40,
      39: 50,
      40: 60,
      41: 50,
      42: 40,
      43: 20,
      44: 10,
      45: 0,
    };
    const unitPrice = 25000;

    const result = computeItemTotals(sizes, unitPrice);

    // Sum: 10+20+40+50+60+50+40+20+10 = 300 pairs
    assert.strictEqual(result.totalPairs, 300);
    // Price: 300 * 25000 = 7,500,000 IDR
    assert.strictEqual(result.totalPrice, 7500000);
  });

  it("handles empty or sparse size breakdowns gracefully", () => {
    const sparseSizes = {
      40: 100,
    };
    const unitPrice = 18000;

    const result = computeItemTotals(sparseSizes, unitPrice);

    assert.strictEqual(result.totalPairs, 100);
    assert.strictEqual(result.totalPrice, 1800000);
  });

  it("ignores negative or NaN quantities", () => {
    const invalidSizes = {
      38: -10,
      39: NaN,
      40: 50,
    } as any;
    const unitPrice = 20000;

    const result = computeItemTotals(invalidSizes, unitPrice);

    assert.strictEqual(result.totalPairs, 50);
    assert.strictEqual(result.totalPrice, 1000000);
  });
});
