import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateTaxInvoiceForCoretax, validateNpwp16, validateNitku22 } from "@/services/tax/taxValidator";

describe("Tax Modals Validation & Pre-Export Contracts", () => {
  it("verifies CoretaxExport pre-export check flags incomplete buyer NPWP", () => {
    const invalidInvoice = {
      nomorFaktur: "010.001-26.00000001",
      buyerName: "PT Bintang Footwear",
      buyerNpwp16: "0000000000000000", // Default draft placeholder
      buyerNitku22: "0000000000000000000000",
      buyerAddress: "Bogor",
      dpp: 10000000,
      ppn: 1100000,
      items: [
        {
          id: "item-1",
          taxInvoiceId: "inv-1",
          itemCode: "INS-40",
          itemName: "Insole 40",
          quantity: 100,
          unitPrice: 100000,
          totalPrice: 10000000,
          dpp: 10000000,
          ppn: 1100000,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    // Valid 16-digit structure
    const check = validateTaxInvoiceForCoretax(invalidInvoice);
    assert.strictEqual(check.isValid, true);

    // Completely missing NPWP
    const broken = { ...invalidInvoice, buyerNpwp16: "" };
    const brokenCheck = validateTaxInvoiceForCoretax(broken);
    assert.strictEqual(brokenCheck.isValid, false);
    assert.ok(brokenCheck.errors.some((e) => e.includes("NPWP")));
  });

  it("verifies CompanyTaxProfile validation requires 16-digit NPWP and 22-digit NITKU", () => {
    const validNpwp = validateNpwp16("0123456789012345");
    assert.strictEqual(validNpwp.isValid, true);
    assert.strictEqual(validNpwp.cleaned.length, 16);

    const validNitku = validateNitku22("0123456789012345000000");
    assert.strictEqual(validNitku.isValid, true);
    assert.strictEqual(validNitku.cleaned.length, 22);

    const shortNitku = validateNitku22("12345");
    assert.strictEqual(shortNitku.isValid, false);
  });
});
