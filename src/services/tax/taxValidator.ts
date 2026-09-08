/**
 * taxValidator.ts
 * Validation engine for Coretax 16-digit NPWP, 22-digit NITKU, and Tax Invoices.
 */
import { cleanTaxDigits } from "@/lib/utils/taxFormatters";
import { TaxInvoice } from "@/types/tax";

export interface TaxValidationResult {
  isValid: boolean;
  cleaned: string;
  error?: string;
}

export interface InvoiceValidationCheck {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a 16-digit NPWP (Corporate NPWP or 16-digit NIK for individuals).
 * Accepts 15 digits by auto-prepending '0'.
 */
export function validateNpwp16(raw: string): TaxValidationResult {
  const digits = cleanTaxDigits(raw);

  if (!digits) {
    return {
      isValid: false,
      cleaned: "",
      error: "NPWP tidak boleh kosong",
    };
  }

  // Support 15 digits by normalization
  if (digits.length === 15) {
    return {
      isValid: true,
      cleaned: "0" + digits,
    };
  }

  if (digits.length !== 16) {
    return {
      isValid: false,
      cleaned: digits,
      error: `NPWP harus 16 digit (terdeteksi ${digits.length} digit)`,
    };
  }

  return {
    isValid: true,
    cleaned: digits,
  };
}

/**
 * Validates a 22-digit NITKU (Nomor Identitas Tempat Kegiatan Usaha).
 * If a 16-digit NPWP is passed, automatically appends '000000' (Pusat / Central branch).
 */
export function validateNitku22(raw: string): TaxValidationResult {
  const digits = cleanTaxDigits(raw);

  if (!digits) {
    return {
      isValid: false,
      cleaned: "",
      error: "NITKU tidak boleh kosong",
    };
  }

  if (digits.length === 16) {
    return {
      isValid: true,
      cleaned: digits + "000000",
    };
  }

  if (digits.length !== 22) {
    return {
      isValid: false,
      cleaned: digits,
      error: `NITKU harus 22 digit (terdeteksi ${digits.length} digit)`,
    };
  }

  return {
    isValid: true,
    cleaned: digits,
  };
}

/**
 * Validates a Tax Invoice for completeness and Coretax export readiness.
 */
export function validateTaxInvoiceForCoretax(
  invoice: Partial<TaxInvoice>
): InvoiceValidationCheck {
  const errors: string[] = [];

  if (!invoice.nomorFaktur || invoice.nomorFaktur.trim() === "") {
    errors.push("Nomor Faktur / NSFP wajib diisi");
  }

  if (!invoice.buyerName || invoice.buyerName.trim() === "") {
    errors.push("Nama Pembeli BKP wajib diisi");
  }

  const npwpCheck = validateNpwp16(invoice.buyerNpwp16 || "");
  if (!npwpCheck.isValid) {
    errors.push(`NPWP Pembeli tidak valid: ${npwpCheck.error}`);
  }

  const nitkuCheck = validateNitku22(invoice.buyerNitku22 || "");
  if (!nitkuCheck.isValid) {
    errors.push(`NITKU Pembeli tidak valid: ${nitkuCheck.error}`);
  }

  if (!invoice.items || invoice.items.length === 0) {
    errors.push("Faktur Pajak harus memiliki minimal 1 baris detail barang (BKP)");
  }

  if ((invoice.dpp ?? 0) <= 0) {
    errors.push("Dasar Pengenaan Pajak (DPP) harus lebih besar dari Rp 0");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
