/**
 * taxCalculationService.ts
 * Indonesian Tax (PPN & DPP) calculation engine adhering to DJP standards.
 * Supports standard 11% VAT, upcoming 12% VAT, tax-inclusive & exclusive prices,
 * and tax-exempt transactions (Kode 07 & 08).
 */

export interface TaxCalculationParams {
  totalAmount: number;
  taxRate?: number; // 11 default, or 12
  isTaxIncluded?: boolean;
  isExempt?: boolean;
}

export interface TaxCalculationResult {
  dpp: number;
  ppn: number;
  grandTotal: number;
  taxRate: number;
  isTaxIncluded: boolean;
}

export interface ItemTaxParams {
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  isTaxIncluded?: boolean;
  isExempt?: boolean;
}

export interface ItemTaxResult {
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  dpp: number;
  ppn: number;
}

export interface AggregateTotalsResult {
  totalDpp: number;
  totalPpn: number;
  grandTotal: number;
}

/**
 * Calculates DPP and PPN for a given amount.
 * Follows DJP rounding rules (integer rounding to nearest Rupiah).
 */
export function calculateTax({
  totalAmount,
  taxRate = 11,
  isTaxIncluded = false,
  isExempt = false,
}: TaxCalculationParams): TaxCalculationResult {
  const safeTotal = Math.max(0, Math.round(totalAmount));

  if (isExempt || taxRate === 0) {
    return {
      dpp: safeTotal,
      ppn: 0,
      grandTotal: safeTotal,
      taxRate: 0,
      isTaxIncluded,
    };
  }

  const rateFactor = taxRate / 100;

  if (isTaxIncluded) {
    // DPP = Total / (1 + Rate)
    // Round to nearest Rupiah
    const dpp = Math.round(safeTotal / (1 + rateFactor));
    const ppn = safeTotal - dpp;

    return {
      dpp,
      ppn,
      grandTotal: safeTotal,
      taxRate,
      isTaxIncluded: true,
    };
  }

  // Tax exclusive: DPP is totalAmount, PPN is added on top
  const dpp = safeTotal;
  const ppn = Math.round(dpp * rateFactor);
  const grandTotal = dpp + ppn;

  return {
    dpp,
    ppn,
    grandTotal,
    taxRate,
    isTaxIncluded: false,
  };
}

/**
 * Calculates line-item level taxes for footwear BKP lines.
 */
export function calculateItemTax({
  quantity,
  unitPrice,
  taxRate = 11,
  isTaxIncluded = false,
  isExempt = false,
}: ItemTaxParams): ItemTaxResult {
  const safeQty = Math.max(0, quantity);
  const safeUnitPrice = Math.max(0, unitPrice);
  const rawTotal = safeQty * safeUnitPrice;

  const tax = calculateTax({
    totalAmount: rawTotal,
    taxRate,
    isTaxIncluded,
    isExempt,
  });

  return {
    quantity: safeQty,
    unitPrice: safeUnitPrice,
    totalPrice: rawTotal,
    dpp: tax.dpp,
    ppn: tax.ppn,
  };
}

/**
 * Aggregates multiple items into total DPP and PPN.
 */
export function aggregateTaxInvoiceTotals(
  items: Array<{ dpp: number; ppn: number; totalPrice?: number }>
): AggregateTotalsResult {
  const totalDpp = items.reduce((sum, item) => sum + (item.dpp || 0), 0);
  const totalPpn = items.reduce((sum, item) => sum + (item.ppn || 0), 0);

  return {
    totalDpp,
    totalPpn,
    grandTotal: totalDpp + totalPpn,
  };
}
