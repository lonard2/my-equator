/**
 * coretaxExcelGenerator.ts
 * Generates official 3-sheet DJP Coretax Excel import workbook (.xlsx).
 * Sheet 1: Faktur (Header level with 16-digit NPWP & 22-digit NITKU)
 * Sheet 2: DetailFaktur (Line items BKP)
 * Sheet 3: Petunjuk_Pengisian (Official DJP filling instructions & format guidelines)
 */
import * as XLSX from "xlsx";
import { TaxInvoice, CompanyTaxProfile } from "@/types/tax";
import { cleanTaxDigits } from "@/lib/utils/taxFormatters";

export async function generateCoretaxExcel(
  invoices: TaxInvoice[],
  company: CompanyTaxProfile
): Promise<Buffer> {
  const sellerNpwp16 = cleanTaxDigits(company.npwp16) || "0123456789012345";
  const sellerNitku22 = cleanTaxDigits(company.nitku22) || "0123456789012345000000";

  // 1. Build Sheet 1: Faktur
  let fakturRows: any[] = [];

  if (invoices.length > 0) {
    fakturRows = invoices.map((inv) => {
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
  } else {
    // Blank template with official DJP sample guide row
    fakturRows = [
      {
        KD_JENIS_TRANSAKSI: "01",
        NOMOR_FAKTUR: "010.001-26.00000001",
        TANGGAL_FAKTUR: new Date().toISOString().split("T")[0],
        MASA_PAJAK: new Date().getMonth() + 1,
        TAHUN_PAJAK: new Date().getFullYear(),
        NPWP_PENJUAL: sellerNpwp16,
        NITKU_PENJUAL: sellerNitku22,
        NAMA_PENJUAL: company.companyName,
        NPWP_PEMBELI: "0987654321098765",
        NITKU_PEMBELI: "0987654321098765000000",
        NAMA_PEMBELI: "PT Contoh Mitra Footwear (CONTOH FORMAT)",
        ALAMAT_PEMBELI: "Jl. Industri Sentul Kav. 10, Bogor",
        JUMLAH_DPP: 10000000,
        JUMLAH_PPN: 1100000,
        TARIF_PPN: 11,
        STATUS: "READY",
      },
    ];
  }

  // 2. Build Sheet 2: DetailFaktur
  let detailRows: Array<{
    NOMOR_FAKTUR: string;
    KODE_OBJEK: string;
    NAMA_BARANG: string;
    HARGA_SATUAN: number;
    JUMLAH_BARANG: number;
    HARGA_TOTAL: number;
    DPP: number;
    PPN: number;
  }> = [];

  if (invoices.length > 0) {
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
  } else {
    detailRows = [
      {
        NOMOR_FAKTUR: "010.001-26.00000001",
        KODE_OBJEK: "INS-EVA-40",
        NAMA_BARANG: "Insole EVA High Density Size 40 (CONTOH DETAIL)",
        HARGA_SATUAN: 50000,
        JUMLAH_BARANG: 200,
        HARGA_TOTAL: 10000000,
        DPP: 10000000,
        PPN: 1100000,
      },
    ];
  }

  // 3. Build Sheet 3: Petunjuk Pengisian
  const instructions = [
    {
      KOLOM: "KD_JENIS_TRANSAKSI",
      PENJELASAN: "Kode transaksi e-Faktur Coretax: 01 (Umum BKP), 02 (Bendahara), 03 (BUMN), 07 (Kawasan Berikat), 08 (Bebas PPN)",
      CONTOH: "01",
    },
    {
      KOLOM: "NOMOR_FAKTUR",
      PENJELASAN: "Nomor Seri Faktur Pajak resmi atau nomor draf Coretax (16 karakter)",
      CONTOH: "010.001-26.00000001",
    },
    {
      KOLOM: "NPWP_PENJUAL / PEMBELI",
      PENJELASAN: "NPWP format baru 16 digit angka (atau NIK 16 digit bagi WP Orang Pribadi)",
      CONTOH: "0123456789012345",
    },
    {
      KOLOM: "NITKU_PENJUAL / PEMBELI",
      PENJELASAN: "Nomor Identitas Tempat Kegiatan Usaha (22 digit): NPWP 16 digit + 6 digit kode cabang (default pusat: 000000)",
      CONTOH: "0123456789012345000000",
    },
    {
      KOLOM: "TARIF_PPN",
      PENJELASAN: "Tarif PPN berlaku (11% berdasarkan UU HPP, atau 12% sesuai ketetapan pemerintah)",
      CONTOH: "11",
    },
    {
      KOLOM: "KORELASI SHEET",
      PENJELASAN: "Setiap baris pada sheet 'DetailFaktur' harus memiliki NOMOR_FAKTUR yang persis sama dengan sheet 'Faktur'",
      CONTOH: "010.001-26.00000001",
    },
  ];

  // Create Workbook
  const workbook = XLSX.utils.book_new();

  const fakturSheet = XLSX.utils.json_to_sheet(fakturRows);
  const detailSheet = XLSX.utils.json_to_sheet(detailRows);
  const guideSheet = XLSX.utils.json_to_sheet(instructions);

  // Set professional column widths for optimal display in Excel & LibreOffice
  fakturSheet["!cols"] = [
    { wch: 22 }, // KD_JENIS_TRANSAKSI
    { wch: 24 }, // NOMOR_FAKTUR
    { wch: 16 }, // TANGGAL_FAKTUR
    { wch: 12 }, // MASA_PAJAK
    { wch: 12 }, // TAHUN_PAJAK
    { wch: 20 }, // NPWP_PENJUAL
    { wch: 26 }, // NITKU_PENJUAL
    { wch: 32 }, // NAMA_PENJUAL
    { wch: 20 }, // NPWP_PEMBELI
    { wch: 26 }, // NITKU_PEMBELI
    { wch: 32 }, // NAMA_PEMBELI
    { wch: 40 }, // ALAMAT_PEMBELI
    { wch: 16 }, // JUMLAH_DPP
    { wch: 16 }, // JUMLAH_PPN
    { wch: 12 }, // TARIF_PPN
    { wch: 18 }, // STATUS
  ];

  detailSheet["!cols"] = [
    { wch: 24 }, // NOMOR_FAKTUR
    { wch: 20 }, // KODE_OBJEK
    { wch: 36 }, // NAMA_BARANG
    { wch: 16 }, // HARGA_SATUAN
    { wch: 16 }, // JUMLAH_BARANG
    { wch: 16 }, // HARGA_TOTAL
    { wch: 16 }, // DPP
    { wch: 16 }, // PPN
  ];

  guideSheet["!cols"] = [
    { wch: 25 }, // KOLOM
    { wch: 70 }, // PENJELASAN
    { wch: 30 }, // CONTOH
  ];

  XLSX.utils.book_append_sheet(workbook, fakturSheet, "Faktur");
  XLSX.utils.book_append_sheet(workbook, detailSheet, "DetailFaktur");
  XLSX.utils.book_append_sheet(workbook, guideSheet, "Petunjuk_Pengisian");

  // Output as Buffer
  const buffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  });

  return Buffer.from(buffer);
}
