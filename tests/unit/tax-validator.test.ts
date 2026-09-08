import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cleanTaxDigits,
  formatNpwp16,
  formatNitku22,
} from "@/lib/utils/taxFormatters";
import {
  validateNpwp16,
  validateNitku22,
  validateTaxInvoiceForCoretax,
} from "@/services/tax/taxValidator";

describe("Coretax Tax Validation & Identifier Formatting", () => {
  it("cleans non-numeric characters from formatted tax strings", () => {
    assert.strictEqual(cleanTaxDigits("01.234.567.8-901.000"), "012345678901000");
    assert.strictEqual(cleanTaxDigits(" 0812-3456-7890-1234 "), "0812345678901234");
  });

  it("formats 16-digit NPWP into canonical Indonesian tax display pattern", () => {
    const raw16 = "0123456789012345";
    const formatted = formatNpwp16(raw16);
    assert.strictEqual(formatted, "01.234.567.8-901.2345");
  });

  it("normalizes legacy 15-digit NPWP into 16-digit format with leading zero", () => {
    const raw15 = "123456789012345";
    const res = validateNpwp16(raw15);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.cleaned, "0123456789012345");
  });

  it("validates 16-digit NIK or Corporate NPWP correctly", () => {
    const valid16 = "3273012304950001";
    const res = validateNpwp16(valid16);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.cleaned, valid16);
  });

  it("rejects invalid NPWP with characters or incorrect length", () => {
    const invalidShort = "123456";
    const res = validateNpwp16(invalidShort);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.error?.includes("16 digit"));

    const invalidAlpha = "0123456789ABCDEF";
    const res2 = validateNpwp16(invalidAlpha);
    assert.strictEqual(res2.isValid, false);
  });

  it("validates 22-digit NITKU and appends default 000000 branch if missing", () => {
    const validNitku = "0123456789012345000000";
    const res = validateNitku22(validNitku);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.cleaned, validNitku);

    // If only 16-digit NPWP is supplied for a central branch, normalize with '000000'
    const from16 = validateNitku22("0123456789012345");
    assert.strictEqual(from16.isValid, true);
    assert.strictEqual(from16.cleaned, "0123456789012345000000");
  });

  it("formats 22-digit NITKU with separator for readability", () => {
    const nitku = "0123456789012345000000";
    assert.strictEqual(formatNitku22(nitku), "0123456789012345-000000");
  });

  it("validates complete tax invoice readiness for Coretax portal upload", () => {
    const validInvoice = {
      nomorFaktur: "010.001-26.00000001",
      buyerName: "PT Sejahtera Sepatu Abadi",
      buyerNpwp16: "0123456789012345",
      buyerNitku22: "0123456789012345000000",
      buyerAddress: "Jl. Soekarno Hatta No. 450 Bandung",
      dpp: 10000000,
      ppn: 1100000,
      taxRate: 11,
      items: [
        {
          id: "item-1",
          taxInvoiceId: "inv-1",
          itemCode: "INS-EVA-40",
          itemName: "Insole EVA High Density Size 40",
          quantity: 200,
          unitPrice: 50000,
          totalPrice: 10000000,
          dpp: 10000000,
          ppn: 1100000,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    const check = validateTaxInvoiceForCoretax(validInvoice);
    assert.strictEqual(check.isValid, true);
    assert.strictEqual(check.errors.length, 0);
  });

  it("flags missing mandatory buyer tax fields before Coretax export", () => {
    const incompleteInvoice = {
      nomorFaktur: "",
      buyerName: "",
      buyerNpwp16: "invalid",
      buyerNitku22: "",
      dpp: 0,
      ppn: 0,
      items: [],
    };

    const check = validateTaxInvoiceForCoretax(incompleteInvoice);
    assert.strictEqual(check.isValid, false);
    assert.ok(check.errors.length >= 3);
  });
});
