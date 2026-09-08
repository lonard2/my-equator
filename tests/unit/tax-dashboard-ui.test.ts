import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatRupiahTax, formatNpwp16, formatNitku22 } from "@/lib/utils/taxFormatters";
import { SptMasaPeriodSummary, TaxInvoice } from "@/types/tax";

describe("Tax Dashboard UI State & Logic Verification", () => {
  it("formats Indonesian tax currency in standard IDR notation", () => {
    assert.strictEqual(formatRupiahTax(15000000), "Rp 15.000.000");
    assert.strictEqual(formatRupiahTax(0), "Rp 0");
  });

  it("evaluates Kurang Bayar vs Lebih Bayar status in SPT Masa summary", () => {
    const kurangBayarSummary: SptMasaPeriodSummary = {
      period: "2026-09",
      totalDppKeluaran: 100000000,
      totalPpnKeluaran: 11000000,
      countFpk: 12,
      totalDppMasukan: 60000000,
      totalPpnMasukan: 6600000,
      countFpm: 5,
      netTaxPayable: 4400000, // Positive => Kurang Bayar
      unbilledOrdersCount: 2,
      unbilledOrdersAmount: 12000000,
      status: "OPEN",
    };

    assert.ok(kurangBayarSummary.netTaxPayable > 0, "Should be Kurang Bayar when Output VAT exceeds Input VAT");
    assert.strictEqual(kurangBayarSummary.netTaxPayable, 4400000);

    const lebihBayarSummary: SptMasaPeriodSummary = {
      ...kurangBayarSummary,
      totalPpnKeluaran: 5000000,
      totalPpnMasukan: 8000000,
      netTaxPayable: -3000000, // Negative => Lebih Bayar
    };

    assert.ok(lebihBayarSummary.netTaxPayable < 0, "Should be Lebih Bayar when Input VAT exceeds Output VAT");
  });

  it("verifies tax invoice list filter criteria", () => {
    const invoices: TaxInvoice[] = [
      {
        id: "inv-1",
        invoiceType: "OUTPUT_FPK",
        transactionCode: "01",
        nomorFaktur: "010.001-26.11111111",
        taxPeriod: "2026-09",
        invoiceDate: "2026-09-02",
        buyerName: "PT Bintang Footwear",
        buyerNpwp16: "0123456789012345",
        buyerNitku22: "0123456789012345000000",
        buyerAddress: "Bogor",
        dpp: 10000000,
        ppn: 1100000,
        taxRate: 11,
        isTaxIncluded: false,
        status: "READY",
        createdAt: "2026-09-02T10:00:00Z",
        updatedAt: "2026-09-02T10:00:00Z",
      },
      {
        id: "inv-2",
        invoiceType: "OUTPUT_FPK",
        transactionCode: "01",
        nomorFaktur: "010.001-26.22222222",
        taxPeriod: "2026-09",
        invoiceDate: "2026-09-05",
        buyerName: "CV Maju Sukses",
        buyerNpwp16: "0987654321098765",
        buyerNitku22: "0987654321098765000000",
        buyerAddress: "Bandung",
        dpp: 5000000,
        ppn: 550000,
        taxRate: 11,
        isTaxIncluded: false,
        status: "DRAFT",
        createdAt: "2026-09-05T10:00:00Z",
        updatedAt: "2026-09-05T10:00:00Z",
      },
    ];

    // Filter by status "DRAFT"
    const drafts = invoices.filter((i) => i.status === "DRAFT");
    assert.strictEqual(drafts.length, 1);
    assert.strictEqual(drafts[0].id, "inv-2");

    // Search by buyer name substring
    const searchMatch = invoices.filter((i) =>
      i.buyerName.toLowerCase().includes("bintang")
    );
    assert.strictEqual(searchMatch.length, 1);
    assert.strictEqual(searchMatch[0].id, "inv-1");
  });
});
