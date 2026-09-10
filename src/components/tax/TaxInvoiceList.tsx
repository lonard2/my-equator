"use client";

import React, { useState, useMemo } from "react";
import { TaxInvoice, TaxInvoiceStatus } from "@/types/tax";
import { formatRupiahTax, formatNpwp16 } from "@/lib/utils/taxFormatters";
import { validateNpwp16, validateNitku22 } from "@/services/tax/taxValidator";
import {
  Search,
  X,
  FileText,
  Eye,
  Trash2,
  CheckSquare,
  Square,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface TaxInvoiceListProps {
  invoices: TaxInvoice[];
  language: "id" | "en";
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onViewInvoice: (invoice: TaxInvoice) => void;
  onDeleteInvoice: (id: string) => void;
  onOpenBatchModal: () => void;
  onOpenManualModal?: () => void;
  onSeedDemoData?: () => void;
  onDownloadSingleExcel?: (invoice: TaxInvoice) => void;
  onUpdateStatus?: (id: string, status: TaxInvoiceStatus) => void;
}

const STATUS_CONFIG: Record<
  TaxInvoiceStatus,
  { labelId: string; labelEn: string; color: string; badge: string }
> = {
  DRAFT: {
    labelId: "Draft",
    labelEn: "Draft",
    color: "bg-slate-500/10 text-slate-400 border-slate-700/50",
    badge: "bg-slate-500",
  },
  READY: {
    labelId: "Siap Ekspor",
    labelEn: "Ready to Export",
    color: "bg-blue-500/10 text-blue-400 border-blue-700/50",
    badge: "bg-blue-500",
  },
  EXPORTED_XML: {
    labelId: "Ekspor XML",
    labelEn: "Exported XML",
    color: "bg-purple-500/10 text-purple-400 border-purple-700/50",
    badge: "bg-purple-500",
  },
  EXPORTED_EXCEL: {
    labelId: "Ekspor Excel",
    labelEn: "Exported Excel",
    color: "bg-indigo-500/10 text-indigo-400 border-indigo-700/50",
    badge: "bg-indigo-500",
  },
  UPLOADED_CORETAX: {
    labelId: "Diunggah Coretax",
    labelEn: "Uploaded Coretax",
    color: "bg-amber-500/10 text-amber-400 border-amber-700/50",
    badge: "bg-amber-500",
  },
  APPROVED: {
    labelId: "Disetujui DJP",
    labelEn: "DJP Approved",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-700/50",
    badge: "bg-emerald-500",
  },
  CANCELLED: {
    labelId: "Dibatalkan",
    labelEn: "Cancelled",
    color: "bg-rose-500/10 text-rose-400 border-rose-700/50",
    badge: "bg-rose-500",
  },
};

export function TaxInvoiceList({
  invoices,
  language,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onViewInvoice,
  onDeleteInvoice,
  onOpenBatchModal,
  onOpenManualModal,
  onSeedDemoData,
  onDownloadSingleExcel,
  onUpdateStatus,
}: TaxInvoiceListProps) {
  const isId = language === "id";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Status filter
      if (statusFilter !== "ALL" && inv.status !== statusFilter) {
        return false;
      }

      // Search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        inv.nomorFaktur.toLowerCase().includes(term) ||
        inv.buyerName.toLowerCase().includes(term) ||
        inv.buyerNpwp16.toLowerCase().includes(term) ||
        (inv.referenceNumber && inv.referenceNumber.toLowerCase().includes(term))
      );
    });
  }, [invoices, statusFilter, searchTerm]);

  const allFilteredSelected =
    filteredInvoices.length > 0 &&
    filteredInvoices.every((inv) => selectedIds.includes(inv.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      onSelectAll([]);
    } else {
      onSelectAll(filteredInvoices.map((i) => i.id));
    }
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: invoices.length };
    invoices.forEach((inv) => {
      counts[inv.status] = (counts[inv.status] || 0) + 1;
    });
    return counts;
  }, [invoices]);

  const filterChips = [
    { id: "ALL", label: isId ? "Semua Faktur" : "All Invoices" },
    { id: "DRAFT", label: isId ? "Draft" : "Draft" },
    { id: "READY", label: isId ? "Siap Ekspor" : "Ready" },
    { id: "EXPORTED_XML", label: isId ? "Ekspor XML" : "Exported XML" },
    { id: "UPLOADED_CORETAX", label: isId ? "Diunggah" : "Uploaded" },
    { id: "APPROVED", label: isId ? "Disetujui" : "Approved" },
  ];

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm dark:shadow-lg">
      {/* Controls Bar: Search & Status Filters */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              aria-label={isId ? "Cari nomor faktur, pembeli, atau NPWP" : "Search invoice number, buyer, or NPWP"}
              placeholder={
                isId
                  ? "Cari nomor faktur, nama pembeli, NPWP..."
                  : "Search invoice number, buyer, NPWP..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 min-h-[38px]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                aria-label="Hapus pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onOpenManualModal && (
              <button
                onClick={onOpenManualModal}
                className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors min-h-[38px]"
              >
                <Plus className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                <span>{isId ? "Faktur Manual" : "Manual Invoice"}</span>
              </button>
            )}

            <button
              onClick={onOpenBatchModal}
              className="px-3.5 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors min-h-[38px]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isId ? "+ Buat dari Surat Jalan" : "+ Generate from DO"}
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1 overflow-x-auto pb-1">
          {filterChips.map((chip) => {
            const count = statusCounts[chip.id] || 0;
            const isSelected = statusFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setStatusFilter(chip.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 min-h-[34px] ${
                  isSelected
                    ? "bg-red-800 text-white border border-red-700 shadow-sm"
                    : "bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-red-950/60 text-white"
                      : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table of Tax Invoices */}
      <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
        <table className="w-full text-left text-xs text-neutral-700 dark:text-neutral-300">
          <thead className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-950/95 backdrop-blur-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-[11px] border-b border-neutral-200 dark:border-neutral-800">
            <tr>
              <th className="py-3 px-3 w-10 text-center">
                <button
                  onClick={handleToggleSelectAll}
                  aria-label="Pilih semua baris faktur"
                  className="text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 p-1"
                >
                  {allFilteredSelected ? (
                    <CheckSquare className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3">{isId ? "Nomor Faktur / DO" : "Invoice / DO No."}</th>
              <th className="py-3 px-3">{isId ? "Tanggal" : "Date"}</th>
              <th className="py-3 px-3">{isId ? "Pembeli & NPWP 16" : "Buyer & Tax ID"}</th>
              <th className="py-3 px-3 text-right">{isId ? "DPP (Rupiah)" : "Tax Base (DPP)"}</th>
              <th className="py-3 px-3 text-right">{isId ? "PPN (11%/12%)" : "VAT"}</th>
              <th className="py-3 px-3 text-center">{isId ? "Kesiapan Coretax" : "Coretax Readiness"}</th>
              <th className="py-3 px-3 text-center">{isId ? "Status Coretax" : "Coretax Status"}</th>
              <th className="py-3 px-3 text-center w-28">{isId ? "Aksi" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/60 font-normal">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-neutral-500 dark:text-neutral-400">
                  <FileText className="w-9 h-9 mx-auto mb-2 opacity-30 text-neutral-400 dark:text-neutral-500" />
                  <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    {isId ? "Belum ada Faktur Pajak yang sesuai kriteria" : "No tax invoices matching criteria"}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                    {isId
                      ? "Anda dapat memuat contoh data faktur pabrik, mengonversi dari Surat Jalan, atau menginput faktur manual."
                      : "You can load demo footwear invoices, generate from Delivery Orders, or create manual invoices."}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4">
                    {onSeedDemoData && (
                      <button
                        onClick={onSeedDemoData}
                        className="px-3 py-1.5 bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isId ? "Muat Contoh Faktur Coretax" : "Load Demo Invoices"}</span>
                      </button>
                    )}
                    {onOpenManualModal && (
                      <button
                        onClick={onOpenManualModal}
                        className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isId ? "Input Faktur Manual" : "Manual Invoice"}</span>
                      </button>
                    )}
                    <button
                      onClick={onOpenBatchModal}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      <span>{isId ? "Buat dari Surat Jalan" : "From Delivery Orders"}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => {
                const isSelected = selectedIds.includes(inv.id);
                const statusMeta = STATUS_CONFIG[inv.status] || STATUS_CONFIG.DRAFT;
                const npwpCheck = validateNpwp16(inv.buyerNpwp16 || "");
                const nitkuCheck = validateNitku22(inv.buyerNitku22 || "");
                const isCoretaxReady = npwpCheck.isValid && nitkuCheck.isValid && inv.dpp > 0;

                return (
                  <tr
                    key={inv.id}
                    className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors ${
                      isSelected
                        ? "bg-neutral-100 dark:bg-neutral-800/60 ring-1 ring-inset ring-neutral-300 dark:ring-neutral-700"
                        : ""
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onToggleSelect(inv.id)}
                        aria-label={`Pilih faktur ${inv.nomorFaktur}`}
                        className="text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 p-1"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                      <div>{inv.nomorFaktur}</div>
                      {inv.referenceNumber && (
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                          Ref: {inv.referenceNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                      {inv.invoiceDate}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-neutral-800 dark:text-neutral-200">{inv.buyerName}</div>
                      <div className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {formatNpwp16(inv.buyerNpwp16)}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-neutral-800 dark:text-neutral-200">
                      {formatRupiahTax(inv.dpp)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                      {formatRupiahTax(inv.ppn)}
                    </td>
                    {/* Coretax Validation Readiness Badge */}
                    <td className="py-3 px-3 text-center">
                      {isCoretaxReady ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                          title={isId ? "NPWP 16 & NITKU 22 lengkap dan valid" : "16-digit NPWP & 22-digit NITKU valid"}
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>{isId ? "Siap Ekspor" : "Ready"}</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"
                          title={!npwpCheck.isValid ? npwpCheck.error : nitkuCheck.error}
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>{!npwpCheck.isValid ? (isId ? "Perlu NPWP 16" : "Needs NPWP 16") : (isId ? "Perlu NITKU 22" : "Needs NITKU 22")}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${statusMeta.color}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.badge}`} />
                        {isId ? statusMeta.labelId : statusMeta.labelEn}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Quick View Details */}
                        <button
                          onClick={() => onViewInvoice(inv)}
                          title={isId ? "Lihat Detail" : "View Details"}
                          className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Quick Download Excel */}
                        {onDownloadSingleExcel && (
                          <button
                            onClick={() => onDownloadSingleExcel(inv)}
                            title={isId ? "Unduh Excel Faktur Ini (.xlsx)" : "Download Excel for this invoice (.xlsx)"}
                            className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>
                        )}

                        {/* Quick Advance Status: DRAFT -> READY */}
                        {inv.status === "DRAFT" && onUpdateStatus && (
                          <button
                            onClick={() => onUpdateStatus(inv.id, "READY")}
                            title={isId ? "Tandai Siap Ekspor" : "Mark as Ready to Export"}
                            className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Draft */}
                        {inv.status === "DRAFT" && (
                          <button
                            onClick={() => onDeleteInvoice(inv.id)}
                            title={isId ? "Hapus Draft" : "Delete Draft"}
                            className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
