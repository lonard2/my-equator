import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateCoretaxXml } from "@/services/tax/coretaxXmlGenerator";
import { TaxInvoice, CompanyTaxProfile } from "@/types/tax";

describe("Coretax XML Bulk Export Generator", () => {
  const mockCompany: CompanyTaxProfile = {
    id: "comp-1",
    companyName: "PT Equator Insole Indonesia & Mitra",
    npwp16: "0123456789012345",
    nitku22: "0123456789012345000000",
    kppCode: "421",
    kppName: "KPP Pratama Bandung Cibeunying",
    taxAddress: "Jl. Terusan Cibaduyut No. 88, Bandung, Jawa Barat",
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
      buyerName: "PT Bintang Footwear & Shoes",
      buyerNpwp16: "0987654321098765",
      buyerNitku22: "0987654321098765000000",
      buyerAddress: "Kawasan Industri Sentul Kav. 12, Bogor",
      dpp: 12500000,
      ppn: 1375000,
      taxRate: 11,
      isTaxIncluded: false,
      status: "READY",
      items: [
        {
          id: "item-1",
          taxInvoiceId: "inv-1",
          itemCode: "INS-EVA-ORTHO-42",
          itemName: "Insole Orthotic EVA 42 <Special Edition>",
          quantity: 250,
          unitPrice: 50000,
          totalPrice: 12500000,
          dpp: 12500000,
          ppn: 1375000,
          createdAt: "2026-09-08T00:00:00Z",
        },
      ],
      createdAt: "2026-09-08T00:00:00Z",
      updatedAt: "2026-09-08T00:00:00Z",
    },
  ];

  it("generates well-formed XML with standard Coretax namespace and headers", () => {
    const xml = generateCoretaxXml(mockInvoices, mockCompany);

    assert.ok(xml.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"));
    assert.ok(xml.includes("<TaxInvoiceBulk xmlns=\"http://www.pajak.go.id/coretax/efaktur/v1\">"));
    assert.ok(xml.includes("<TotalInvoices>1</TotalInvoices>"));
    assert.ok(xml.includes("<TotalDpp>12500000</TotalDpp>"));
    assert.ok(xml.includes("<TotalPpn>1375000</TotalPpn>"));
  });

  it("correctly includes seller and buyer 16-digit NPWP and 22-digit NITKU", () => {
    const xml = generateCoretaxXml(mockInvoices, mockCompany);

    assert.ok(xml.includes("<Seller>"));
    assert.ok(xml.includes("<Npwp16>0123456789012345</Npwp16>"));
    assert.ok(xml.includes("<Nitku22>0123456789012345000000</Nitku22>"));

    assert.ok(xml.includes("<Buyer>"));
    assert.ok(xml.includes("<Npwp16>0987654321098765</Npwp16>"));
    assert.ok(xml.includes("<Nitku22>0987654321098765000000</Nitku22>"));
  });

  it("safely escapes XML special characters in company names and item names (& and < >)", () => {
    const xml = generateCoretaxXml(mockInvoices, mockCompany);

    // & should become &amp;
    assert.ok(xml.includes("PT Equator Insole Indonesia &amp; Mitra"));
    assert.ok(xml.includes("PT Bintang Footwear &amp; Shoes"));
    // <Special Edition> should become &lt;Special Edition&gt;
    assert.ok(xml.includes("Insole Orthotic EVA 42 &lt;Special Edition&gt;"));
  });

  it("parses TaxPeriod and TaxYear into separate Coretax fields", () => {
    const xml = generateCoretaxXml(mockInvoices, mockCompany);

    assert.ok(xml.includes("<TaxPeriod>09</TaxPeriod>"));
    assert.ok(xml.includes("<TaxYear>2026</TaxYear>"));
  });
});
