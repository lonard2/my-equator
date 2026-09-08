import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateTax,
  calculateItemTax,
  aggregateTaxInvoiceTotals,
} from "@/services/tax/taxCalculationService";

describe("Coretax Tax Calculation Service", () => {
  it("calculates standard 11% VAT for tax-exclusive total", () => {
    // DPP: Rp 10,000,000 -> PPN 11%: Rp 1,100,000 -> Grand Total: Rp 11,100,000
    const result = calculateTax({
      totalAmount: 10000000,
      taxRate: 11,
      isTaxIncluded: false,
    });

    assert.strictEqual(result.dpp, 10000000);
    assert.strictEqual(result.ppn, 1100000);
    assert.strictEqual(result.grandTotal, 11100000);
    assert.strictEqual(result.taxRate, 11);
  });

  it("calculates 11% VAT when price is tax-inclusive (DPP = Total / 1.11)", () => {
    // Total inclusive: Rp 11,100,000 -> DPP: Rp 10,000,000 -> PPN: Rp 1,100,000
    const result = calculateTax({
      totalAmount: 11100000,
      taxRate: 11,
      isTaxIncluded: true,
    });

    assert.strictEqual(result.dpp, 10000000);
    assert.strictEqual(result.ppn, 1100000);
    assert.strictEqual(result.grandTotal, 11100000);
  });

  it("handles rounding according to DJP standard integer Rupiah", () => {
    // Total: Rp 2,555,555 tax inclusive at 11%
    // DPP = 2555555 / 1.11 = 2302301.8018... -> 2302302
    // PPN = 2555555 - 2302302 = 253253
    const result = calculateTax({
      totalAmount: 2555555,
      taxRate: 11,
      isTaxIncluded: true,
    });

    assert.strictEqual(result.dpp, 2302302);
    assert.strictEqual(result.ppn, 253253);
    assert.strictEqual(result.dpp + result.ppn, 2555555);
  });

  it("supports future 12% VAT rate transition seamlessly", () => {
    const result = calculateTax({
      totalAmount: 10000000,
      taxRate: 12,
      isTaxIncluded: false,
    });

    assert.strictEqual(result.dpp, 10000000);
    assert.strictEqual(result.ppn, 1200000);
    assert.strictEqual(result.grandTotal, 11200000);
  });

  it("zeroes out PPN for tax-exempt transactions (07 Tidak Dipungut / 08 Dibebaskan)", () => {
    const result = calculateTax({
      totalAmount: 15000000,
      taxRate: 11,
      isTaxIncluded: false,
      isExempt: true,
    });

    assert.strictEqual(result.dpp, 15000000);
    assert.strictEqual(result.ppn, 0);
    assert.strictEqual(result.grandTotal, 15000000);
  });

  it("aggregates multiple invoice line items with consistent precision", () => {
    const items = [
      calculateItemTax({ quantity: 500, unitPrice: 25000, taxRate: 11, isTaxIncluded: false }),
      calculateItemTax({ quantity: 200, unitPrice: 40000, taxRate: 11, isTaxIncluded: false }),
    ];

    const aggregate = aggregateTaxInvoiceTotals(items);
    // Item 1: 500 * 25000 = 12,500,000 DPP, 1,375,000 PPN
    // Item 2: 200 * 40000 = 8,000,000 DPP, 880,000 PPN
    // Total DPP = 20,500,000, Total PPN = 2,255,000
    assert.strictEqual(aggregate.totalDpp, 20500000);
    assert.strictEqual(aggregate.totalPpn, 2255000);
    assert.strictEqual(aggregate.grandTotal, 22755000);
  });
});
