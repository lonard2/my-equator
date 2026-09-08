# Technical & Engineering Guide: Phase 6 — Coretax Tax Filing Preparation (Persiapan Pengisian Pajak)

## 1. Module Overview & Industrial Role

Phase 6 implements the complete **Tax Filing Preparation (Persiapan Pengisian Pajak)** subsystem for `MyEquator`, aligning factory operations with the Directorate General of Taxes' (**DJP**) latest tax modernization standard: **Coretax (PSIAP)**.

This module automates the fiscal bridge between factory floor operations and governmental tax filings:
1. Translates completed footwear **Delivery Orders (Surat Jalan)** into official **Sales Tax Invoices (Faktur Pajak Keluaran - FPK)**.
2. Formats and validates **16-digit NPWP** (NIK/Corporate NPWP) and **22-digit NITKU** (Nomor Identitas Tempat Kegiatan Usaha).
3. Directly stages incoming raw material purchases (`inventory_movements.type = 'IN_PURCHASE'`) as **Creditable Input VAT (Pajak Masukan - FPM)**.
4. Generates standard **Coretax-compliant XML payloads** (`.xml`) for direct batch import via the DJP Coretax web portal.
5. Generates official **DJP 2-sheet Excel workbooks** (`.xlsx`: `Faktur` + `DetailFaktur`) for conversion tools.
6. Provides an executive **SPT Masa PPN 1111 reconciliation card** displaying Net Tax Payable (**Kurang Bayar / Lebih Bayar**).

---

## 2. Regulatory & Architectural Standards

### 2.1 Coretax Identifiers (PMK 136/PMK.03/2023 & PER-06/PJ/2024)
- **16-digit NPWP:** Mandatory 16-digit format. For corporate entities, uses the newly issued 16-digit tax ID. For individuals, maps directly to 16-digit NIK. Legacy 15-digit NPWPs are normalized by prepending `0`.
- **22-digit NITKU:** Identifies the physical business location (factory vs head office). Formatted as:
  $$\text{NITKU (22 digits)} = \text{NPWP (16 digits)} + \text{Cabang (6 digits)}$$
  *(e.g., `0123456789012345000000` for Bandung central factory).*

### 2.2 Transaction Codes (PER-03/PJ/2022)
- `01`: Penyerahan BKP/JKP Umum (General footwear insole delivery).
- `02`: Pemungut Bendahara Pemerintah.
- `03`: Pemungut Lainnya (BUMN / K3S).
- `07`: Penyerahan BKP Tidak Dipungut (Kawasan Berikat / KEK).
- `08`: Penyerahan BKP Dibebaskan dari Pengenaan PPN.

---

## 3. Pure Calculation & Validation Engines (`src/services/tax/`)

### 3.1 DPP and VAT Precision Formula (`taxCalculationService.ts`)
Indonesian tax guidelines dictate that tax invoices must be rounded to the nearest whole Rupiah without fractional sen:

```typescript
export function calculateTax({
  totalAmount,
  taxRate = 11,
  isTaxIncluded = false,
  isExempt = false,
}: TaxCalculationParams): TaxCalculationResult {
  const safeTotal = Math.max(0, Math.round(totalAmount));

  if (isExempt || taxRate === 0) {
    return { dpp: safeTotal, ppn: 0, grandTotal: safeTotal, taxRate: 0, isTaxIncluded };
  }

  const rateFactor = taxRate / 100;

  if (isTaxIncluded) {
    // DPP = Total / (1 + Rate)
    const dpp = Math.round(safeTotal / (1 + rateFactor));
    const ppn = safeTotal - dpp;
    return { dpp, ppn, grandTotal: safeTotal, taxRate, isTaxIncluded: true };
  }

  // Tax exclusive: DPP is totalAmount, PPN is added
  const dpp = safeTotal;
  const ppn = Math.round(dpp * rateFactor);
  return { dpp, ppn, grandTotal: dpp + ppn, taxRate, isTaxIncluded: false };
}
```

### 3.2 Coretax XML Serialization (`coretaxXmlGenerator.ts`)
Generates standardized XML with deterministic entity escaping and XML namespace compliance:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<TaxInvoiceBulk xmlns="http://www.pajak.go.id/coretax/efaktur/v1">
  <Header>
    <TotalInvoices>1</TotalInvoices>
    <TotalDpp>20000000</TotalDpp>
    <TotalPpn>2200000</TotalPpn>
    <GeneratedAt>2026-09-08T13:30:00.000Z</GeneratedAt>
  </Header>
  <TaxInvoices>
    <TaxInvoice>
      <InvoiceType>OUTPUT</InvoiceType>
      <TransactionCode>01</TransactionCode>
      <NomorFaktur>010.001-26.77778888</NomorFaktur>
      <InvoiceDate>2026-09-08</InvoiceDate>
      <TaxPeriod>09</TaxPeriod>
      <TaxYear>2026</TaxYear>
      <Seller>
        <Npwp16>0123456789012345</Npwp16>
        <Nitku22>0123456789012345000000</Nitku22>
        <Name>PT Equator Insole Indonesia</Name>
        <Address>Jl. Terusan Cibaduyut No. 88, Bandung</Address>
      </Seller>
      <Buyer>
        <Npwp16>0987654321098765</Npwp16>
        <Nitku22>0987654321098765000000</Nitku22>
        <Name>PT Mitra Footwear Sejahtera</Name>
        <Address>Jl. Raya Narogong Km. 14, Bekasi</Address>
      </Buyer>
      <InvoiceLines>
        <Line>
          <ItemCode>INS-EVA-42</ItemCode>
          <ItemName>Insole Footwear EVA Density 42</ItemName>
          <Quantity>400</Quantity>
          <UnitPrice>50000</UnitPrice>
          <TotalPrice>20000000</TotalPrice>
          <Dpp>20000000</Dpp>
          <Ppn>2200000</Ppn>
        </Line>
      </InvoiceLines>
      <Summary>
        <Dpp>20000000</Dpp>
        <Ppn>2200000</Ppn>
        <TaxRate>11</TaxRate>
      </Summary>
    </TaxInvoice>
  </TaxInvoices>
</TaxInvoiceBulk>
```

---

## 4. Monthly VAT Reconciliation & Staging Architecture

The reconciliation engine matches operational database entities across modules:
1. **Pajak Keluaran (Output VAT):** Aggregates all `tax_invoices` for period `YYYY-MM`.
2. **Pajak Masukan (Input VAT):** Queries `inventory_movements` where `type = 'IN_PURCHASE'` within the period and multiplies material quantities by unit costs.
3. **Net Tax Calculation:**
   $$\text{Pajak Terutang} = \sum \text{PPN Keluaran} - \sum \text{PPN Masukan}$$
   - If positive: **Kurang Bayar** (Red badge with deposit warning before month-end).
   - If negative: **Lebih Bayar** (Emerald badge indicating future period carry-forward).
4. **Unbilled Detection:** Compares confirmed and delivered DOs against invoice records to display unbilled orders with a 1-click batch invoicing modal.

---

## 5. Security & Role-Based Access Control

The Tax module enforces strict two-tier authorization:
- **SUPER_ADMIN & FACTORY_MANAGER:** Granted `TAX_VIEW` and `TAX_MANAGE` permissions.
- **WAREHOUSE_STAFF & SALES_OPERATOR:** Restricted completely. The navigation item is hidden from the sidebar, and any direct API requests return `403 Forbidden`.

---

## 6. Verification & Test Metrics

- **Unit & Schema Tests:** 15 unit tests covering tax calculations, NPWP/NITKU formatters, and Drizzle relations.
- **Export Verification:** Multi-sheet Excel workbook assertions and Coretax XML schema checks.
- **API Integration Tests:** Role gating and full lifecycle CRUD via HTTP routes.
- **E2E Smoke Tests:** End-to-end simulation from delivery order to export verified.
- **Build Status:** Next.js production build compiling cleanly with zero errors across all 26 static & dynamic routes.
