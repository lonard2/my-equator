import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  companyTaxProfiles,
  taxInvoices,
  taxInvoiceItems,
  sptMasaPeriods,
} from "@/lib/db/schema";

describe("Coretax Tax Database Schema Definitions", () => {
  it("defines companyTaxProfiles table with Coretax 16-digit NPWP and 22-digit NITKU columns", () => {
    assert.ok(companyTaxProfiles, "companyTaxProfiles table should be exported");
    assert.ok(companyTaxProfiles.id, "id column must exist");
    assert.ok(companyTaxProfiles.companyName, "companyName column must exist");
    assert.ok(companyTaxProfiles.npwp16, "npwp16 column must exist");
    assert.ok(companyTaxProfiles.nitku22, "nitku22 column must exist");
    assert.ok(companyTaxProfiles.kppCode, "kppCode column must exist");
    assert.ok(companyTaxProfiles.taxAddress, "taxAddress column must exist");
    assert.ok(companyTaxProfiles.signatoryName, "signatoryName column must exist");
    assert.ok(companyTaxProfiles.signatoryRole, "signatoryRole column must exist");
  });

  it("defines taxInvoices table with standard Coretax status, codes, and currency fields", () => {
    assert.ok(taxInvoices, "taxInvoices table should be exported");
    assert.ok(taxInvoices.id, "id column must exist");
    assert.ok(taxInvoices.invoiceType, "invoiceType column must exist (OUTPUT_FPK / INPUT_FPM)");
    assert.ok(taxInvoices.transactionCode, "transactionCode column must exist (01..09)");
    assert.ok(taxInvoices.nomorFaktur, "nomorFaktur column must exist");
    assert.ok(taxInvoices.taxPeriod, "taxPeriod column must exist (YYYY-MM)");
    assert.ok(taxInvoices.invoiceDate, "invoiceDate column must exist");
    assert.ok(taxInvoices.buyerName, "buyerName column must exist");
    assert.ok(taxInvoices.buyerNpwp16, "buyerNpwp16 column must exist");
    assert.ok(taxInvoices.buyerNitku22, "buyerNitku22 column must exist");
    assert.ok(taxInvoices.dpp, "dpp (Dasar Pengenaan Pajak) column must exist");
    assert.ok(taxInvoices.ppn, "ppn column must exist");
    assert.ok(taxInvoices.taxRate, "taxRate column must exist (e.g. 11 or 12)");
    assert.ok(taxInvoices.status, "status column must exist");
    assert.ok(taxInvoices.deliveryOrderId, "deliveryOrderId foreign reference must exist");
  });

  it("defines taxInvoiceItems table with footwear BKP detail fields", () => {
    assert.ok(taxInvoiceItems, "taxInvoiceItems table should be exported");
    assert.ok(taxInvoiceItems.id, "id column must exist");
    assert.ok(taxInvoiceItems.taxInvoiceId, "taxInvoiceId column must exist");
    assert.ok(taxInvoiceItems.itemCode, "itemCode column must exist");
    assert.ok(taxInvoiceItems.itemName, "itemName column must exist");
    assert.ok(taxInvoiceItems.quantity, "quantity column must exist");
    assert.ok(taxInvoiceItems.unitPrice, "unitPrice column must exist");
    assert.ok(taxInvoiceItems.totalPrice, "totalPrice column must exist");
    assert.ok(taxInvoiceItems.dpp, "dpp column must exist");
    assert.ok(taxInvoiceItems.ppn, "ppn column must exist");
  });

  it("defines sptMasaPeriods table for monthly VAT reconciliation", () => {
    assert.ok(sptMasaPeriods, "sptMasaPeriods table should be exported");
    assert.ok(sptMasaPeriods.id, "id column must exist");
    assert.ok(sptMasaPeriods.period, "period (YYYY-MM) column must exist");
    assert.ok(sptMasaPeriods.totalDppKeluaran, "totalDppKeluaran column must exist");
    assert.ok(sptMasaPeriods.totalPpnKeluaran, "totalPpnKeluaran column must exist");
    assert.ok(sptMasaPeriods.totalDppMasukan, "totalDppMasukan column must exist");
    assert.ok(sptMasaPeriods.totalPpnMasukan, "totalPpnMasukan column must exist");
    assert.ok(sptMasaPeriods.netTaxPayable, "netTaxPayable column must exist");
    assert.ok(sptMasaPeriods.status, "status column must exist");
  });
});
