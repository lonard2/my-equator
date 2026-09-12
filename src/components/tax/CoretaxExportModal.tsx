"use client";

import React, { useState, useMemo } from "react";
import { TaxInvoice, CompanyTaxProfile } from "@/types/tax";
import { validateTaxInvoiceForCoretax } from "@/services/tax/taxValidator";
import { formatRupiahTax } from "@/lib/utils/taxFormatters";
import { useModalSafety } from "@/lib/utils/useModalSafety";
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
  userRole?: string;
  period?: string;
}

export function CoretaxExportModal({
  isOpen,
  onClose,
  language,
  invoices,
  selectedIds,
  companyProfile,
  userRole = "SUPER_ADMIN",
  period,
}: CoretaxExportModalProps) {
  const isId = language === "id";
  const [downloadingXml, setDownloadingXml] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const modalRef = useModalSafety({
    isOpen,
    onClose,
  });

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
    setDownloadError(null);
    try {
      const activeRole = userRole || "SUPER_ADMIN";
      const invoiceIds = targetInvoices.map((i) => i.id);
      const res = await fetch("/api/tax/export-xml", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": activeRole,
        },
        body: JSON.stringify({ invoiceIds, period }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || (isId ? "Gagal mengunduh XML Coretax" : "Failed to download Coretax XML"));
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      a.download = targetInvoices.length > 0
        ? `Coretax_Faktur_${timestamp}.xml`
        : `Coretax_Sample_Template_${timestamp}.xml`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setDownloadSuccess(
        isId
          ? targetInvoices.length > 0
            ? "File XML Coretax berhasil diunduh!"
            : "Berkas contoh XML Coretax berhasil diunduh!"
          : "Coretax XML file downloaded successfully!"
      );
    } catch (err: any) {
      setDownloadError(err.message || (isId ? "Gagal mengunduh XML" : "Failed to download XML"));
    } finally {
      setDownloadingXml(false);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    setDownloadSuccess(null);
    setDownloadError(null);
    try {
      const activeRole = userRole || "SUPER_ADMIN";
      const invoiceIds = targetInvoices.map((i) => i.id);
      const res = await fetch("/api/tax/export-excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": activeRole,
        },
        body: JSON.stringify({ invoiceIds, period }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || (isId ? "Gagal mengunduh Excel Coretax" : "Failed to download Coretax Excel"));
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      a.download = targetInvoices.length > 0
        ? `Coretax_Faktur_${timestamp}.xlsx`
        : `Template_Coretax_DJP_Resmi.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setDownloadSuccess(
        isId
          ? targetInvoices.length > 0
            ? "File Excel Coretax (3-Sheet) berhasil diunduh!"
            : "Template Resmi Excel DJP Coretax (3-Sheet) berhasil diunduh!"
          : "Official DJP Coretax Excel Template downloaded successfully!"
      );
    } catch (err: any) {
      setDownloadError(err.message || (isId ? "Gagal mengunduh Excel" : "Failed to download Excel"));
    } finally {
      setDownloadingExcel(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="coretax-export-modal-title"
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 id="coretax-export-modal-title" className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {isId ? "Ekspor e-Faktur Coretax DJP" : "Export DJP Coretax e-Faktur"}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isId
                  ? `Mengekspor ${targetInvoices.length} Faktur Pajak Keluaran (FPK)`
                  : `Exporting ${targetInvoices.length} Sales Tax Invoices`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 flex-1 min-h-0 overflow-y-auto">
          {/* Summary Box */}
          <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 flex justify-between items-center text-xs">
            <div>
              <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isId ? "Total DPP" : "Total Tax Base"}</span>
              <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{formatRupiahTax(totalDpp)}</span>
            </div>
            <div className="text-right">
              <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isId ? "Total PPN Terutang" : "Total VAT Due"}</span>
              <span className="font-mono font-bold text-red-600 dark:text-red-400">{formatRupiahTax(totalPpn)}</span>
            </div>
          </div>

          {/* Validation Status */}
          {isReadyForCoretax ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3.5 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
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
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 space-y-2 text-xs text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  {isId
                    ? `Perhatian: Terdapat ${invalidInvoices.length} faktur dengan data belum lengkap`
                    : `Warning: ${invalidInvoices.length} invoices have incomplete data`}
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800/90 dark:text-amber-300/90 pl-1">
                {invalidInvoices.slice(0, 3).map(({ invoice, check }, i) => (
                  <li key={i}>
                    {invoice.nomorFaktur}: {check.errors.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {downloadSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700/60 rounded-xl p-3 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {downloadError && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-700/60 rounded-xl p-3 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{downloadError}</span>
            </div>
          )}

          {/* Download Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Download XML */}
            <button
              onClick={handleDownloadXml}
              disabled={downloadingXml}
              className="p-4 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-950 dark:hover:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-800 hover:border-red-400 dark:hover:border-red-700/60 rounded-xl flex flex-col items-start text-left transition-all group disabled:opacity-50"
            >
              <div className="flex items-center justify-between w-full mb-2.5">
                <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-105 transition-transform">
                  <FileCode className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50">
                  {isId ? "Rekomendasi Portal DJP" : "DJP Portal Recommended"}
                </span>
              </div>
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block">
                {targetInvoices.length > 0
                  ? isId ? "Unduh File XML Coretax" : "Download Coretax XML"
                  : isId ? "Unduh Contoh Skema XML DJP" : "Download Sample DJP XML"}
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 block">
                {targetInvoices.length > 0
                  ? isId
                    ? "Format .xml resmi untuk impor massal web portal Coretax DJP"
                    : "Official .xml format for Coretax DJP portal batch upload"
                  : isId
                    ? "Skema berkas XML contoh dengan identitas PKP PT Equator"
                    : "Sample XML schema with PT Equator PKP credentials"}
              </span>
            </button>

            {/* Download Excel */}
            <button
              onClick={handleDownloadExcel}
              disabled={downloadingExcel}
              className="p-4 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-950 dark:hover:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-400 dark:hover:border-emerald-700/60 rounded-xl flex flex-col items-start text-left transition-all group disabled:opacity-50"
            >
              <div className="flex items-center justify-between w-full mb-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-300/60 dark:border-neutral-700/60">
                  {isId ? "Arsip Internal & Audit" : "Internal Archive & Audit"}
                </span>
              </div>
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block">
                {targetInvoices.length > 0
                  ? isId ? "Unduh Excel Coretax (3-Sheet)" : "Download Coretax Excel (3-Sheet)"
                  : isId ? "Unduh Template Excel DJP (Blank)" : "Download DJP Excel Template (Blank)"}
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 block">
                {targetInvoices.length > 0
                  ? isId
                    ? "Berkas .xlsx lengkap (Faktur, Detail, & Petunjuk Pengisian)"
                    : "Complete .xlsx workbook (Faktur, Detail & Instructions)"
                  : isId
                    ? "Template resmi DJP kosong dengan baris panduan & identitas PKP"
                    : "Official empty DJP template with guide rows & PKP headers"}
              </span>
            </button>
          </div>

          {/* Coretax Upload Guidance */}
          <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-neutral-800 dark:text-neutral-300 font-semibold">
              <Info className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>{isId ? "Langkah Pengunggahan ke Portal Coretax DJP:" : "Steps to Upload into Coretax DJP Portal:"}</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-600 dark:text-neutral-400 pl-1 leading-relaxed">
              <li>{isId ? "Login ke portal resmi Coretax DJP (portal.pajak.go.id) dengan NPWP 16 / NIK." : "Login to official Coretax DJP portal with 16-digit NPWP."}</li>
              <li>{isId ? "Navigasi ke menu e-Faktur > Administrasi Faktur > Impor Faktur." : "Navigate to e-Faktur > Invoicing Administration > Bulk Import."}</li>
              <li>{isId ? "Pilih berkas XML (.xml) yang baru diunduh lalu klik Validasi & Unggah." : "Select downloaded XML file and click Validate & Upload."}</li>
              <li>{isId ? "Setelah diverifikasi DJP, status faktur otomatis menjadi Siap Approval." : "Once validated by DJP, invoice status changes to Ready for Approval."}</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end bg-neutral-50 dark:bg-neutral-950/80 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-300 rounded-lg text-xs font-medium transition-colors"
          >
            {isId ? "Tutup" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
