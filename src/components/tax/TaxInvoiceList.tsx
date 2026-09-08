"use client";

import React, { useState, useMemo } from "react";
import { TaxInvoice, TaxInvoiceStatus } from "@/types/tax";
import { formatRupiahTax, formatNpwp16 } from "@/lib/utils/taxFormatters";
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
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
      {/* Controls Bar: Search & Status Filters */}
      <div className="p-4 border-b border-neutral-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
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
              className="w-full pl-9 pr-8 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 min-h-[38px]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                aria-label="Hapus pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
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
                    ? "bg-red-900/80 text-white border border-red-700"
                    : "bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-red-800 text-white"
                      : "bg-neutral-800 text-neutral-400"
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
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-neutral-300">
          <thead className="bg-neutral-950/80 text-neutral-400 uppercase tracking-wider text-[11px] border-b border-neutral-800">
            <tr>
              <th className="py-3 px-3 w-10 text-center">
                <button
                  onClick={handleToggleSelectAll}
                  aria-label="Pilih semua baris faktur"
                  className="text-neutral-400 hover:text-neutral-200 p-1"
                >
                  {allFilteredSelected ? (
                    <CheckSquare className="w-4 h-4 text-red-400" />
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
              <th className="py-3 px-3 text-center">{isId ? "Status Coretax" : "Coretax Status"}</th>
              <th className="py-3 px-3 text-center w-24">{isId ? "Aksi" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 font-normal">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-neutral-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>{isId ? "Belum ada Faktur Pajak yang sesuai filter" : "No tax invoices matching criteria"}</p>
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => {
                const isSelected = selectedIds.includes(inv.id);
                const statusMeta = STATUS_CONFIG[inv.status] || STATUS_CONFIG.DRAFT;

                return (
                  <tr
                    key={inv.id}
                    className={`hover:bg-neutral-800/40 transition-colors ${
                      isSelected ? "bg-red-950/20" : ""
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onToggleSelect(inv.id)}
                        aria-label={`Pilih faktur ${inv.nomorFaktur}`}
                        className="text-neutral-400 hover:text-neutral-200 p-1"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-red-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-neutral-100">
                      <div>{inv.nomorFaktur}</div>
                      {inv.referenceNumber && (
                        <div className="text-[10px] text-neutral-400 font-sans mt-0.5">
                          Ref: {inv.referenceNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-neutral-400 whitespace-nowrap">
                      {inv.invoiceDate}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-neutral-200">{inv.buyerName}</div>
                      <div className="font-mono text-[11px] text-neutral-400 mt-0.5">
                        {formatNpwp16(inv.buyerNpwp16)}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-neutral-200">
                      {formatRupiahTax(inv.dpp)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-red-400">
                      {formatRupiahTax(inv.ppn)}
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
                        <button
                          onClick={() => onViewInvoice(inv)}
                          title={isId ? "Lihat Detail" : "View Details"}
                          className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {inv.status === "DRAFT" && (
                          <button
                            onClick={() => onDeleteInvoice(inv.id)}
                            title={isId ? "Hapus Draft" : "Delete Draft"}
                            className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded transition-colors"
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
