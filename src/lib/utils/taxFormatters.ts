/**
 * taxFormatters.ts
 * Formatting utilities for Indonesian Coretax (PSIAP) Tax Identifiers and Currency.
 * - NPWP 16 digits (e.g., 01.234.567.8-901.2345)
 * - NITKU 22 digits (e.g., 0123456789012345-000000)
 */

/**
 * Strips all non-digit characters from a tax string.
 */
export function cleanTaxDigits(raw: string): string {
  if (!raw) return "";
  return raw.replace(/\D/g, "");
}

/**
 * Formats a 16-digit (or 15-digit) NPWP into standard formatted mask.
 * 16-digit: XX.XXX.XXX.X-XXX.XXXX
 * 15-digit: XX.XXX.XXX.X-XXX.000
 */
export function formatNpwp16(raw: string): string {
  const digits = cleanTaxDigits(raw);
  if (!digits) return "";

  // Pad to 16 digits if 15 digits provided
  const padded = digits.length === 15 ? "0" + digits : digits;

  if (padded.length <= 2) return padded;
  if (padded.length <= 5) return `${padded.slice(0, 2)}.${padded.slice(2)}`;
  if (padded.length <= 8) return `${padded.slice(0, 2)}.${padded.slice(2, 5)}.${padded.slice(5)}`;
  if (padded.length <= 9) return `${padded.slice(0, 2)}.${padded.slice(2, 5)}.${padded.slice(5, 8)}.${padded.slice(8)}`;
  if (padded.length <= 12) {
    return `${padded.slice(0, 2)}.${padded.slice(2, 5)}.${padded.slice(5, 8)}.${padded.slice(8, 9)}-${padded.slice(9)}`;
  }

  return `${padded.slice(0, 2)}.${padded.slice(2, 5)}.${padded.slice(5, 8)}.${padded.slice(8, 9)}-${padded.slice(9, 12)}.${padded.slice(12, 16)}`;
}

/**
 * Formats a 22-digit NITKU into standard readability mask (16 digits NPWP - 6 digits Branch).
 */
export function formatNitku22(raw: string): string {
  const digits = cleanTaxDigits(raw);
  if (!digits) return "";

  if (digits.length <= 16) {
    return digits;
  }
  return `${digits.slice(0, 16)}-${digits.slice(16, 22)}`;
}

/**
 * Formats number as formal Indonesian Rupiah.
 */
export function formatRupiahTax(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
