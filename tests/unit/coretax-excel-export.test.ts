import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { generateCoretaxExcel } from "@/services/tax/coretaxExcelGenerator";
import { TaxInvoice, CompanyTaxProfile } from "@/types/tax";

describe("Coretax Excel DJP Template Export Generator", () => {
  const mockCompany: CompanyTaxProfile = {
    id: "comp-1",
    companyName: "PT Equator Insole Indonesia",
    npwp16: "0123456789012345",
    nitku22: "0123456789012345000000",
    kppCode: "421",
    taxAddress: "Jl. Terusan Cibaduyut No. 88, Bandung",
    signatoryName: "Hendrawan Pratama",
    signatoryRole: "Direktur Utama",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  const mockInvoices: TaxInvoice[] = [
    {
      id: "inv-1",
      invoiceType: "OUTPUT_FPK",
      transactionCode: "01",
      nomorFaktur: "010.001-26.00000001",
      referenceNumber: "SJ/EQ/2026/09/0001",
      taxPeriod: "2026-09",
      invoiceDate: "2026-09-08",
      buyerName: "PT Bintang Footwear",
      buyerNpwp16: "0987654321098765",
      buyerNitku22: "0987654321098765000000",
      buyerAddress: "Kawasan Industri Sentul, Bogor",
      dpp: 10000000,
      ppn: 1100000,
      taxRate: 11,
      isTaxIncluded: false,
      status: "READY",
      items: [
        {
          id: "item-1",
          taxInvoiceId: "inv-1",
          itemCode: "INS-EVA-40",
          itemName: "Insole EVA 40",
          quantity: 200,
          unitPrice: 50000,
          totalPrice: 10000000,
          dpp: 10000000,
          ppn: 1100000,
          createdAt: "2026-09-08T00:00:00Z",
        },
      ],
      createdAt: "2026-09-08T00:00:00Z",
      updatedAt: "2026-09-08T00:00:00Z",
    },
  ];

  it("generates a multi-sheet Excel workbook with official DJP Coretax sheet names", async () => {
    const buffer = await generateCoretaxExcel(mockInvoices, mockCompany);
    assert.ok(buffer, "Buffer should not be empty");
    assert.ok(buffer.length > 0, "Buffer should contain bytes");

    // Read back with xlsx to verify workbook structure
    const workbook = XLSX.read(buffer, { type: "buffer" });
    assert.ok(workbook.SheetNames.includes("Faktur"), "Sheet 'Faktur' must exist");
    assert.ok(workbook.SheetNames.includes("DetailFaktur"), "Sheet 'DetailFaktur' must exist");

    // Verify row data in Faktur sheet
    const fakturSheet = workbook.Sheets["Faktur"];
    const fakturJson = XLSX.utils.sheet_to_json(fakturSheet) as Record<string, unknown>[];
    assert.strictEqual(fakturJson.length, 1);
    assert.strictEqual(fakturJson[0]["NOMOR_FAKTUR"], "010.001-26.00000001");
    assert.strictEqual(fakturJson[0]["NPWP_PEMBELI"], "0987654321098765");
    assert.strictEqual(fakturJson[0]["JUMLAH_DPP"], 10000000);

    // Verify row data in DetailFaktur sheet
    const detailSheet = workbook.Sheets["DetailFaktur"];
    const detailJson = XLSX.utils.sheet_to_json(detailSheet) as Record<string, unknown>[];
    assert.strictEqual(detailJson.length, 1);
    assert.strictEqual(detailJson[0]["KODE_OBJEK"], "INS-EVA-40");
    assert.strictEqual(detailJson[0]["HARGA_TOTAL"], 10000000);

    // Verify Petunjuk_Pengisian guide sheet
    assert.ok(workbook.SheetNames.includes("Petunjuk_Pengisian"), "Guide sheet must exist");
    const guideSheet = workbook.Sheets["Petunjuk_Pengisian"];
    const guideJson = XLSX.utils.sheet_to_json(guideSheet) as Record<string, unknown>[];
    assert.ok(guideJson.length >= 5, "Should include at least 5 DJP instruction entries");
  });

  it("generates an official blank DJP template with sample guide rows when invoices array is empty", async () => {
    const buffer = await generateCoretaxExcel([], mockCompany);
    assert.ok(buffer.length > 0, "Buffer should not be empty");

    const workbook = XLSX.read(buffer, { type: "buffer" });
    assert.deepStrictEqual(workbook.SheetNames, ["Faktur", "DetailFaktur", "Petunjuk_Pengisian"]);

    // Verify sample row is populated
    const fakturSheet = workbook.Sheets["Faktur"];
    const fakturJson = XLSX.utils.sheet_to_json(fakturSheet) as Record<string, unknown>[];
    assert.strictEqual(fakturJson.length, 1);
    assert.strictEqual(fakturJson[0]["NAMA_PENJUAL"], "PT Equator Insole Indonesia");
    assert.ok(fakturJson[0]["NAMA_PEMBELI"]?.toString().includes("CONTOH FORMAT"));

    // Verify columns exist in the generated template
    const headers = Object.keys(fakturJson[0]);
    assert.ok(headers.includes("NOMOR_FAKTUR"));
    assert.ok(headers.includes("NPWP_PENJUAL"));
    assert.ok(headers.includes("NPWP_PEMBELI"));
    assert.ok(headers.includes("JUMLAH_DPP"));
    assert.ok(headers.includes("JUMLAH_PPN"));
  });
});
