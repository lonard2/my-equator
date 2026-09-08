/**
 * taxReconciliationService.ts
 * Reconciles factory Delivery Orders (Surat Jalan) against Tax Invoices (Faktur Pajak)
 * and computes monthly VAT summaries (SPT Masa PPN).
 */
import { DeliveryOrder, DeliveryOrderItem } from "@/types";
import {
  TaxInvoice,
  TaxInvoiceItem,
  SptMasaPeriodSummary,
  BatchGenerateOptions,
} from "@/types/tax";
import { calculateTax, calculateItemTax } from "./taxCalculationService";

export interface MaterialPurchaseRecord {
  totalCost: number;
  estimatedVat: number;
}

/**
 * Filter and identify Delivery Orders eligible for tax invoicing that have not yet been billed.
 * Eligibility: Status must NOT be DRAFT or CANCELLED.
 */
export function identifyUnbilledOrders<T extends DeliveryOrder>(
  orders: T[],
  existingInvoices: TaxInvoice[]
): T[] {
  const invoicedDoIds = new Set(
    existingInvoices
      .map((inv) => inv.deliveryOrderId)
      .filter((id): id is string => Boolean(id))
  );

  return orders.filter((order) => {
    const isEligibleStatus =
      order.status !== "DRAFT" && order.status !== "CANCELLED";
    const isNotYetInvoiced = !invoicedDoIds.has(order.id);
    return isEligibleStatus && isNotYetInvoiced;
  });
}

/**
 * Transforms a Delivery Order with items into a draft Coretax Tax Invoice structure.
 */
export function mapOrderToTaxInvoiceDraft(
  order: DeliveryOrder & { items?: DeliveryOrderItem[] },
  options: BatchGenerateOptions
): Partial<TaxInvoice> & { items: Array<Partial<TaxInvoiceItem>> } {
  const safeItems = order.items || [];
  const taxRate = options.taxRate ?? 11;
  const isTaxIncluded = options.isTaxIncluded ?? false;

  // Compute items
  const taxItems: Array<Partial<TaxInvoiceItem>> = safeItems.map((item, index) => {
    const itemCalculation = calculateItemTax({
      quantity: item.totalPairs || 1,
      unitPrice: item.unitPrice || 0,
      taxRate,
      isTaxIncluded,
    });

    return {
      itemCode: item.articleCode || `ITEM-${index + 1}`,
      itemName: item.articleName || "Insole Footwear",
      quantity: item.totalPairs || 1,
      unitPrice: item.unitPrice || 0,
      totalPrice: item.totalPrice || itemCalculation.totalPrice,
      dpp: itemCalculation.dpp,
      ppn: itemCalculation.ppn,
      createdAt: new Date().toISOString(),
    };
  });

  // Calculate order-level totals
  const totalAmount = order.totalAmount || 0;
  const orderTax = calculateTax({
    totalAmount,
    taxRate,
    isTaxIncluded,
  });

  // Extract period from deliveryDate or fallback to current
  const dateStr = order.deliveryDate || new Date().toISOString().split("T")[0];
  const taxPeriod = dateStr.slice(0, 7); // YYYY-MM

  // Generate temporary draft number
  const draftSuffix = Math.floor(10000000 + Math.random() * 90000000);
  const nomorFaktur = `010.001-${taxPeriod.slice(2, 4)}.${draftSuffix}`;

  return {
    invoiceType: "OUTPUT_FPK",
    transactionCode: options.transactionCode || "01",
    nomorFaktur,
    referenceNumber: order.orderNumber,
    taxPeriod,
    invoiceDate: options.invoiceDate || dateStr,
    buyerName: order.recipientName,
    buyerNpwp16: "0000000000000000", // Default placeholder for draft, validated before export
    buyerNitku22: "0000000000000000000000",
    buyerAddress: order.destinationAddress,
    dpp: orderTax.dpp,
    ppn: orderTax.ppn,
    taxRate,
    isTaxIncluded,
    status: "DRAFT",
    deliveryOrderId: order.id,
    items: taxItems,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Computes monthly VAT staging summary comparing Output VAT against Input VAT.
 */
export function computeMonthlyVatSummary(
  period: string,
  outputInvoices: TaxInvoice[],
  materialPurchases: MaterialPurchaseRecord[],
  unbilledOrdersCount: number = 0,
  unbilledOrdersAmount: number = 0
): SptMasaPeriodSummary {
  // 1. Output VAT (Pajak Keluaran)
  const totalDppKeluaran = outputInvoices.reduce(
    (sum, inv) => sum + (inv.dpp || 0),
    0
  );
  const totalPpnKeluaran = outputInvoices.reduce(
    (sum, inv) => sum + (inv.ppn || 0),
    0
  );

  // 2. Input VAT (Pajak Masukan)
  const totalDppMasukan = materialPurchases.reduce(
    (sum, p) => sum + (p.totalCost || 0),
    0
  );
  const totalPpnMasukan = materialPurchases.reduce(
    (sum, p) => sum + (p.estimatedVat || 0),
    0
  );

  // 3. Net Tax Payable: Output VAT - Input VAT
  const netTaxPayable = totalPpnKeluaran - totalPpnMasukan;

  return {
    period,
    totalDppKeluaran,
    totalPpnKeluaran,
    countFpk: outputInvoices.length,
    totalDppMasukan,
    totalPpnMasukan,
    countFpm: materialPurchases.length,
    netTaxPayable,
    unbilledOrdersCount,
    unbilledOrdersAmount,
    status: "OPEN",
  };
}
