/**
 * coretaxExcelGenerator.ts
 * Generates official 2-sheet DJP Coretax Excel import workbook (.xlsx).
 * Sheet 1: Faktur (Header level with 16-digit NPWP & 22-digit NITKU)
 * Sheet 2: DetailFaktur (Line items BKP)
 */
import * as XLSX from "xlsx";
import { TaxInvoice, CompanyTaxProfile } from "@/types/tax";
import { cleanTaxDigits } from "@/lib/utils/taxFormatters";

export async function generateCoretaxExcel(
  invoices: TaxInvoice[],
  company: CompanyTaxProfile
): Promise<Buffer> {
  const sellerNpwp16 = cleanTaxDigits(company.npwp16);
  const sellerNitku22 = cleanTaxDigits(company.nitku22);

  // 1. Build Sheet 1: Faktur
  const fakturRows = invoices.map((inv) => {
    let taxYear = 2026;
    let taxMonth = 1;
    if (inv.taxPeriod && inv.taxPeriod.includes("-")) {
      const parts = inv.taxPeriod.split("-");
      taxYear = parseInt(parts[0], 10) || 2026;
      taxMonth = parseInt(parts[1], 10) || 1;
    }

    return {
      KD_JENIS_TRANSAKSI: inv.transactionCode || "01",
      NOMOR_FAKTUR: inv.nomorFaktur,
      TANGGAL_FAKTUR: inv.invoiceDate,
      MASA_PAJAK: taxMonth,
      TAHUN_PAJAK: taxYear,
      NPWP_PENJUAL: sellerNpwp16,
      NITKU_PENJUAL: sellerNitku22,
      NAMA_PENJUAL: company.companyName,
      NPWP_PEMBELI: cleanTaxDigits(inv.buyerNpwp16),
      NITKU_PEMBELI: cleanTaxDigits(inv.buyerNitku22),
      NAMA_PEMBELI: inv.buyerName,
      ALAMAT_PEMBELI: inv.buyerAddress,
      JUMLAH_DPP: inv.dpp,
      JUMLAH_PPN: inv.ppn,
      TARIF_PPN: inv.taxRate || 11,
      STATUS: inv.status,
    };
  });

  // 2. Build Sheet 2: DetailFaktur
  const detailRows: Array<{
    NOMOR_FAKTUR: string;
    KODE_OBJEK: string;
    NAMA_BARANG: string;
    HARGA_SATUAN: number;
    JUMLAH_BARANG: number;
    HARGA_TOTAL: number;
    DPP: number;
    PPN: number;
  }> = [];

  for (const inv of invoices) {
    if (inv.items && inv.items.length > 0) {
      for (const item of inv.items) {
        detailRows.push({
          NOMOR_FAKTUR: inv.nomorFaktur,
          KODE_OBJEK: item.itemCode,
          NAMA_BARANG: item.itemName,
          HARGA_SATUAN: item.unitPrice,
          JUMLAH_BARANG: item.quantity,
          HARGA_TOTAL: item.totalPrice,
          DPP: item.dpp,
          PPN: item.ppn,
        });
      }
    } else {
      detailRows.push({
        NOMOR_FAKTUR: inv.nomorFaktur,
        KODE_OBJEK: "INSOLE-GENERIC",
        NAMA_BARANG: "Penyerahan Produk Insole Footwear",
        HARGA_SATUAN: inv.dpp,
        JUMLAH_BARANG: 1,
        HARGA_TOTAL: inv.dpp,
        DPP: inv.dpp,
        PPN: inv.ppn,
      });
    }
  }

  // Create Workbook
  const workbook = XLSX.utils.book_new();

  const fakturSheet = XLSX.utils.json_to_sheet(fakturRows);
  const detailSheet = XLSX.utils.json_to_sheet(detailRows);

  XLSX.utils.book_append_sheet(workbook, fakturSheet, "Faktur");
  XLSX.utils.book_append_sheet(workbook, detailSheet, "DetailFaktur");

  // Output as Buffer
  const buffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  });

  return Buffer.from(buffer);
}
