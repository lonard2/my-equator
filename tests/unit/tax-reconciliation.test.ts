import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeMonthlyVatSummary,
  identifyUnbilledOrders,
  mapOrderToTaxInvoiceDraft,
} from "@/services/tax/taxReconciliationService";
import { DeliveryOrder, DeliveryOrderItem } from "@/types";
import { TaxInvoice } from "@/types/tax";

describe("Tax Reconciliation & Monthly VAT Staging Engine", () => {
  const mockOrders: Array<DeliveryOrder & { items: DeliveryOrderItem[] }> = [
    {
      id: "do-1",
      orderNumber: "SJ/EQ/2026/09/0001",
      recipientName: "PT Bintang Footwear",
      destinationAddress: "Jl. Industri Sentul No. 12, Bogor",
      poNumber: "PO-BT-9901",
      status: "DELIVERED",
      deliveryDate: "2026-09-02",
      totalQuantity: 500,
      totalAmount: 15000000,
      createdAt: "2026-09-02T10:00:00Z",
      updatedAt: "2026-09-02T10:00:00Z",
      items: [
        {
          id: "item-1",
          deliveryOrderId: "do-1",
          articleCode: "INS-EVA-40",
          articleName: "Insole EVA 40",
          sizeBreakdown: '{"40":500}',
          totalPairs: 500,
          unitPrice: 30000,
          totalPrice: 15000000,
          createdAt: "2026-09-02T10:00:00Z",
        },
      ],
    },
    {
      id: "do-2",
      orderNumber: "SJ/EQ/2026/09/0002",
      recipientName: "CV Maju Sport Shoes",
      destinationAddress: "Jl. Raya Cibaduyut No. 50, Bandung",
      poNumber: "PO-MJ-202",
      status: "CONFIRMED",
      deliveryDate: "2026-09-05",
      totalQuantity: 200,
      totalAmount: 6000000,
      createdAt: "2026-09-05T10:00:00Z",
      updatedAt: "2026-09-05T10:00:00Z",
      items: [
        {
          id: "item-2",
          deliveryOrderId: "do-2",
          articleCode: "INS-LATEX-39",
          articleName: "Insole Latex Comfort 39",
          sizeBreakdown: '{"39":200}',
          totalPairs: 200,
          unitPrice: 30000,
          totalPrice: 6000000,
          createdAt: "2026-09-05T10:00:00Z",
        },
      ],
    },
    {
      id: "do-3",
      orderNumber: "SJ/EQ/2026/09/0003",
      recipientName: "Draft Buyer Shoes",
      destinationAddress: "Jl. Anyar",
      status: "DRAFT", // DRAFT should not count as unbilled confirmed order
      deliveryDate: "2026-09-06",
      totalQuantity: 100,
      totalAmount: 2500000,
      createdAt: "2026-09-06T10:00:00Z",
      updatedAt: "2026-09-06T10:00:00Z",
      items: [],
    },
  ];

  const mockExistingInvoices: TaxInvoice[] = [
    {
      id: "inv-1",
      invoiceType: "OUTPUT_FPK",
      transactionCode: "01",
      nomorFaktur: "010.001-26.00000001",
      referenceNumber: "SJ/EQ/2026/09/0001",
      taxPeriod: "2026-09",
      invoiceDate: "2026-09-02",
      buyerName: "PT Bintang Footwear",
      buyerNpwp16: "0123456789012345",
      buyerNitku22: "0123456789012345000000",
      buyerAddress: "Jl. Industri Sentul No. 12, Bogor",
      dpp: 15000000,
      ppn: 1650000,
      taxRate: 11,
      isTaxIncluded: false,
      status: "APPROVED",
      deliveryOrderId: "do-1",
      createdAt: "2026-09-02T10:00:00Z",
      updatedAt: "2026-09-02T10:00:00Z",
    },
  ];

  it("identifies unbilled orders ready for tax invoice generation", () => {
    const unbilled = identifyUnbilledOrders(mockOrders, mockExistingInvoices);

    // do-1 has an invoice.
    // do-2 is CONFIRMED and has NO invoice -> unbilled!
    // do-3 is DRAFT -> excluded from official unbilled calculation.
    assert.strictEqual(unbilled.length, 1);
    assert.strictEqual(unbilled[0].id, "do-2");
    assert.strictEqual(unbilled[0].orderNumber, "SJ/EQ/2026/09/0002");
  });

  it("maps a Delivery Order directly into a draft Coretax Tax Invoice", () => {
    const draft = mapOrderToTaxInvoiceDraft(mockOrders[1], {
      transactionCode: "01",
      taxRate: 11,
      invoiceDate: "2026-09-08",
      isTaxIncluded: false,
    });

    assert.strictEqual(draft.deliveryOrderId, "do-2");
    assert.strictEqual(draft.referenceNumber, "SJ/EQ/2026/09/0002");
    assert.strictEqual(draft.buyerName, "CV Maju Sport Shoes");
    assert.strictEqual(draft.buyerAddress, "Jl. Raya Cibaduyut No. 50, Bandung");
    assert.strictEqual(draft.dpp, 6000000);
    assert.strictEqual(draft.ppn, 660000); // 11% of 6,000,000
    assert.strictEqual(draft.status, "DRAFT");
    assert.strictEqual(draft.items?.length, 1);
    assert.strictEqual(draft.items?.[0].itemName, "Insole Latex Comfort 39");
  });

  it("computes monthly VAT summary comparing Output VAT with Input VAT", () => {
    const outputInvoices = mockExistingInvoices; // Total DPP: 15,000,000, PPN: 1,650,000
    const rawMaterialPurchases = [
      {
        totalCost: 10000000,
        estimatedVat: 1100000,
      },
    ];

    const summary = computeMonthlyVatSummary(
      "2026-09",
      outputInvoices,
      rawMaterialPurchases,
      1, // 1 unbilled order (do-2)
      6000000 // 6,000,000 unbilled amount
    );

    assert.strictEqual(summary.period, "2026-09");
    assert.strictEqual(summary.totalDppKeluaran, 15000000);
    assert.strictEqual(summary.totalPpnKeluaran, 1650000);
    assert.strictEqual(summary.totalDppMasukan, 10000000);
    assert.strictEqual(summary.totalPpnMasukan, 1100000);
    // Net tax payable: 1,650,000 - 1,100,000 = 550,000 (Kurang Bayar)
    assert.strictEqual(summary.netTaxPayable, 550000);
    assert.strictEqual(summary.unbilledOrdersCount, 1);
    assert.strictEqual(summary.unbilledOrdersAmount, 6000000);
  });
});
