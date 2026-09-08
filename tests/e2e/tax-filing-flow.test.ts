import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TaxInvoiceService } from "@/services/tax/taxInvoiceService";
import { generateCoretaxXml } from "@/services/tax/coretaxXmlGenerator";
import { generateCoretaxExcel } from "@/services/tax/coretaxExcelGenerator";
import { validateTaxInvoiceForCoretax } from "@/services/tax/taxValidator";
import * as XLSX from "xlsx";

describe("End-to-End Coretax Tax Filing Preparation Flow", () => {
  it("executes the complete factory tax workflow: profile setup, invoice generation, reconciliation, XML, and Excel export", async () => {
    // 1. Setup Company Tax Profile
    const profile = await TaxInvoiceService.saveCompanyTaxProfile({
      companyName: "PT Equator Insole Indonesia",
      npwp16: "0123456789012345",
      nitku22: "0123456789012345000000",
      kppCode: "421",
      taxAddress: "Jl. Terusan Cibaduyut No. 88, Bandung",
      signatoryName: "Hendrawan Pratama",
      signatoryRole: "Direktur Utama",
    });

    assert.strictEqual(profile.companyName, "PT Equator Insole Indonesia");
    assert.strictEqual(profile.npwp16, "0123456789012345");

    const uniqueSuffix = Math.floor(10000000 + Math.random() * 90000000);
    const testNomorFaktur = `010.001-26.${uniqueSuffix}`;

    // 2. Create sample Tax Invoice representing September 2026 delivery
    const createdInvoice = await TaxInvoiceService.createTaxInvoice({
      nomorFaktur: testNomorFaktur,
      referenceNumber: "SJ/EQ/2026/09/8888",
      taxPeriod: "2026-09",
      invoiceDate: "2026-09-08",
      buyerName: "PT Mitra Footwear Sejahtera",
      buyerNpwp16: "0987654321098765",
      buyerNitku22: "0987654321098765000000",
      buyerAddress: "Jl. Raya Narogong Km. 14, Bekasi",
      dpp: 20000000,
      ppn: 2200000,
      taxRate: 11,
      isTaxIncluded: false,
      status: "READY",
      items: [
        {
          itemCode: "INS-EVA-42",
          itemName: "Insole Footwear EVA Density 42",
          quantity: 400,
          unitPrice: 50000,
          totalPrice: 20000000,
          dpp: 20000000,
          ppn: 2200000,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    assert.ok(createdInvoice.id);
    assert.strictEqual(createdInvoice.dpp, 20000000);
    assert.strictEqual(createdInvoice.ppn, 2200000);

    // 3. Pre-export validation
    const check = validateTaxInvoiceForCoretax(createdInvoice);
    assert.strictEqual(check.isValid, true);
    assert.strictEqual(check.errors.length, 0);

    // 4. Monthly reconciliation check
    const reconciliation = await TaxInvoiceService.getMonthlyReconciliation("2026-09");
    assert.ok(reconciliation.summary);
    assert.ok(reconciliation.summary.totalDppKeluaran >= 20000000);
    assert.ok(reconciliation.summary.totalPpnKeluaran >= 2200000);

    // 5. Generate Coretax XML Bulk Upload payload
    const xml = generateCoretaxXml([createdInvoice], profile);
    assert.ok(xml.includes("<TaxInvoiceBulk"));
    assert.ok(xml.includes("<TotalInvoices>1</TotalInvoices>"));
    assert.ok(xml.includes("<Npwp16>0123456789012345</Npwp16>"));
    assert.ok(xml.includes("<Nitku22>0123456789012345000000</Nitku22>"));
    assert.ok(xml.includes(`<NomorFaktur>${testNomorFaktur}</NomorFaktur>`));
    assert.ok(xml.includes("<Dpp>20000000</Dpp>"));
    assert.ok(xml.includes("<Ppn>2200000</Ppn>"));

    // 6. Generate DJP Coretax Excel Template
    const excelBuffer = await generateCoretaxExcel([createdInvoice], profile);
    assert.ok(excelBuffer.length > 0);

    const workbook = XLSX.read(excelBuffer, { type: "buffer" });
    assert.ok(workbook.SheetNames.includes("Faktur"));
    assert.ok(workbook.SheetNames.includes("DetailFaktur"));

    const fakturData = XLSX.utils.sheet_to_json(workbook.Sheets["Faktur"]) as any[];
    assert.strictEqual(fakturData.length, 1);
    assert.strictEqual(fakturData[0].NOMOR_FAKTUR, testNomorFaktur);
    assert.strictEqual(fakturData[0].JUMLAH_DPP, 20000000);
    assert.strictEqual(fakturData[0].JUMLAH_PPN, 2200000);
  });
});
