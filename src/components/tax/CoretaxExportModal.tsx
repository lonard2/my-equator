"use client";

import React, { useState, useMemo } from "react";
import { TaxInvoice, CompanyTaxProfile } from "@/types/tax";
import { validateTaxInvoiceForCoretax } from "@/services/tax/taxValidator";
import { formatRupiahTax } from "@/lib/utils/taxFormatters";
import {
  X,
  Download,
  FileCode,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Info,
} from "lucide-react";

interface CoretaxExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "id" | "en";
  invoices: TaxInvoice[];
  selectedIds: string[];
  companyProfile: CompanyTaxProfile | null;
}

export function CoretaxExportModal({
  isOpen,
  onClose,
  language,
  invoices,
  selectedIds,
  companyProfile,
}: CoretaxExportModalProps) {
  const isId = language === "id";
  const [downloadingXml, setDownloadingXml] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const targetInvoices = useMemo(() => {
    if (selectedIds.length > 0) {
      const set = new Set(selectedIds);
      return invoices.filter((i) => set.has(i.id));
    }
    return invoices;
  }, [invoices, selectedIds]);

  // Run Coretax validation
  const validationResults = useMemo(() => {
    return targetInvoices.map((inv) => ({
      invoice: inv,
      check: validateTaxInvoiceForCoretax(inv),
    }));
  }, [targetInvoices]);

  const invalidInvoices = validationResults.filter((r) => !r.check.isValid);
  const isReadyForCoretax = invalidInvoices.length === 0 && targetInvoices.length > 0;

  if (!isOpen) return null;

  const totalDpp = targetInvoices.reduce((sum, i) => sum + (i.dpp || 0), 0);
  const totalPpn = targetInvoices.reduce((sum, i) => sum + (i.ppn || 0), 0);

  const handleDownloadXml = async () => {
    setDownloadingXml(true);
    setDownloadSuccess(null);
    try {
      const res = await fetch("/api/tax/export-xml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceIds: targetInvoices.map((i) => i.id) }),
      });

      if (!res.ok) throw new Error("Gagal mengunduh XML Coretax");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Coretax_Faktur_${new Date().toISOString().slice(0, 10)}.xml`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setDownloadSuccess(isId ? "File XML Coretax berhasil diunduh!" : "Coretax XML downloaded successfully!");
    } catch (err: any) {
      alert(err.message || "Gagal mengunduh XML");
    } finally {
      setDownloadingXml(false);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    setDownloadSuccess(null);
    try {
      const res = await fetch("/api/tax/export-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceIds: targetInvoices.map((i) => i.id) }),
      });

      if (!res.ok) throw new Error("Gagal mengunduh Excel Coretax");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Coretax_Faktur_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setDownloadSuccess(isId ? "File Excel Coretax berhasil diunduh!" : "Coretax Excel downloaded successfully!");
    } catch (err: any) {
      alert(err.message || "Gagal mengunduh Excel");
    } finally {
      setDownloadingExcel(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-950/50 border border-red-800/60 text-red-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">
                {isId ? "Ekspor e-Faktur Coretax DJP" : "Export DJP Coretax e-Faktur"}
              </h3>
              <p className="text-xs text-neutral-400">
                {isId
                  ? `Mengekspor ${targetInvoices.length} Faktur Pajak Keluaran (FPK)`
                  : `Exporting ${targetInvoices.length} Sales Tax Invoices`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Summary Box */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 flex justify-between items-center text-xs">
            <div>
              <span className="text-neutral-500 block text-[11px]">{isId ? "Total DPP" : "Total Tax Base"}</span>
              <span className="font-mono font-bold text-neutral-100">{formatRupiahTax(totalDpp)}</span>
            </div>
            <div className="text-right">
              <span className="text-neutral-500 block text-[11px]">{isId ? "Total PPN Terutang" : "Total VAT Due"}</span>
              <span className="font-mono font-bold text-red-400">{formatRupiahTax(totalPpn)}</span>
            </div>
          </div>

          {/* Validation Status */}
          {isReadyForCoretax ? (
            <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-xl p-3.5 flex items-center gap-3 text-xs text-emerald-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold block">
                  {isId ? "Validasi Coretax Lolos (100%)" : "Coretax Validation Passed"}
                </span>
                <span className="text-[11px] opacity-90">
                  {isId
                    ? "Seluruh NPWP 16 digit, NITKU 22 digit, dan rincian BKP telah terverifikasi sesuai skema DJP."
                    : "All 16-digit NPWP, 22-digit NITKU, and BKP items match DJP schema requirements."}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3.5 space-y-2 text-xs text-amber-300">
              <div className="flex items-center gap-2 font-semibold text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {isId
                    ? `Perhatian: Terdapat ${invalidInvoices.length} faktur dengan data belum lengkap`
                    : `Warning: ${invalidInvoices.length} invoices have incomplete data`}
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-300/90 pl-1">
                {invalidInvoices.slice(0, 3).map(({ invoice, check }, i) => (
                  <li key={i}>
                    {invoice.nomorFaktur}: {check.errors.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {downloadSuccess && (
            <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-xl p-3 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Download Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Download XML */}
            <button
              onClick={handleDownloadXml}
              disabled={downloadingXml || targetInvoices.length === 0}
              className="p-4 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-red-700/60 rounded-xl flex flex-col items-start text-left transition-all group disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-lg bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400 mb-2.5 group-hover:scale-105 transition-transform">
                <FileCode className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-neutral-100 block">
                {isId ? "Unduh File XML Coretax" : "Download Coretax XML"}
              </span>
              <span className="text-[11px] text-neutral-400 mt-1 block">
                {isId
                  ? "Format .xml resmi untuk impor massal web portal Coretax DJP"
                  : "Official .xml format for Coretax DJP portal batch upload"}
              </span>
            </button>

            {/* Download Excel */}
            <button
              onClick={handleDownloadExcel}
              disabled={downloadingExcel || targetInvoices.length === 0}
              className="p-4 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-emerald-700/60 rounded-xl flex flex-col items-start text-left transition-all group disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-2.5 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-neutral-100 block">
                {isId ? "Unduh Template Excel DJP" : "Download DJP Excel Template"}
              </span>
              <span className="text-[11px] text-neutral-400 mt-1 block">
                {isId
                  ? "File .xlsx 2-sheet (Faktur + Detail) kompatibel converter DJP"
                  : "Official 2-sheet .xlsx compatible with DJP converter tools"}
              </span>
            </button>
          </div>

          {/* Coretax Upload Guidance */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-neutral-300 font-semibold">
              <Info className="w-3.5 h-3.5 text-neutral-400" />
              <span>{isId ? "Langkah Pengunggahan ke Portal Coretax DJP:" : "Steps to Upload into Coretax DJP Portal:"}</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-400 pl-1 leading-relaxed">
              <li>{isId ? "Login ke portal resmi Coretax DJP (portal.pajak.go.id) dengan NPWP 16 / NIK." : "Login to official Coretax DJP portal with 16-digit NPWP."}</li>
              <li>{isId ? "Navigasi ke menu e-Faktur > Administrasi Faktur > Impor Faktur." : "Navigate to e-Faktur > Invoicing Administration > Bulk Import."}</li>
              <li>{isId ? "Pilih berkas XML (.xml) yang baru diunduh lalu klik Validasi & Unggah." : "Select downloaded XML file and click Validate & Upload."}</li>
              <li>{isId ? "Setelah diverifikasi DJP, status faktur otomatis menjadi Siap Approval." : "Once validated by DJP, invoice status changes to Ready for Approval."}</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 flex items-center justify-end bg-neutral-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
          >
            {isId ? "Tutup" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
