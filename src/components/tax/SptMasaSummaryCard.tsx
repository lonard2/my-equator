"use client";

import React from "react";
import { SptMasaPeriodSummary } from "@/types/tax";
import { formatRupiahTax } from "@/lib/utils/taxFormatters";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  FileCheck,
  Receipt,
  Scale,
  Sparkles,
} from "lucide-react";

interface SptMasaSummaryCardProps {
  summary: SptMasaPeriodSummary | null;
  language: "id" | "en";
  onOpenBatchModal: () => void;
  onOpenPurchasesModal?: () => void;
}

export function SptMasaSummaryCard({
  summary,
  language,
  onOpenBatchModal,
  onOpenPurchasesModal,
}: SptMasaSummaryCardProps) {
  const isId = language === "id";

  if (!summary) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 w-48 bg-neutral-200 dark:bg-neutral-800 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-20 bg-neutral-100 dark:bg-neutral-800 rounded" />
          <div className="h-20 bg-neutral-100 dark:bg-neutral-800 rounded" />
          <div className="h-20 bg-neutral-100 dark:bg-neutral-800 rounded" />
          <div className="h-20 bg-neutral-100 dark:bg-neutral-800 rounded" />
        </div>
      </div>
    );
  }

  const isKurangBayar = summary.netTaxPayable > 0;
  const isLebihBayar = summary.netTaxPayable < 0;

  return (
    <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden">
      {/* Background accent glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 dark:bg-red-950/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 flex items-center justify-center text-red-600 dark:text-red-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              {isId ? "Rekonsiliasi SPT Masa PPN (1111)" : "Monthly VAT Reconciliation"}
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono">
                {summary.period}
              </span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {isId
                ? "Komparasi PPN Keluaran (Penjualan) vs PPN Masukan (Bahan Baku)"
                : "Output VAT (Sales) vs Input VAT (Raw Material Purchases)"}
            </p>
          </div>
        </div>

        {/* Unbilled DO Alert Banner */}
        {summary.unbilledOrdersCount > 0 && (
          <div className="flex items-center gap-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg px-3 py-1.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              {isId
                ? `${summary.unbilledOrdersCount} Surat Jalan belum difakturkan (${formatRupiahTax(summary.unbilledOrdersAmount)})`
                : `${summary.unbilledOrdersCount} unbilled orders ready for invoice (${formatRupiahTax(summary.unbilledOrdersAmount)})`}
            </span>
            <button
              onClick={onOpenBatchModal}
              className="ml-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded text-xs transition-colors flex items-center gap-1 shadow-sm"
            >
              <Sparkles className="w-3 h-3" />
              {isId ? "Fakturkan Massal" : "Batch Invoice"}
            </button>
          </div>
        )}
      </div>

      {/* KPI 4-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total DPP Penyerahan */}
        <div className="bg-neutral-50/90 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800/80 rounded-lg p-3.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
            {isId ? "Total DPP Penyerahan" : "Tax Base (DPP)"}
          </span>
          <div className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
            {formatRupiahTax(summary.totalDppKeluaran)}
          </div>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-500 mt-1 block">
            {summary.countFpk} {isId ? "Faktur Pajak Keluaran" : "Sales Invoices"}
          </span>
        </div>

        {/* PPN Keluaran */}
        <div className="bg-neutral-50/90 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800/80 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {isId ? "PPN Keluaran (Terutang)" : "Output VAT"}
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-lg font-bold font-mono text-red-600 dark:text-red-400">
            {formatRupiahTax(summary.totalPpnKeluaran)}
          </div>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-500 mt-1 block">
            {isId ? "Kewajiban pungut dari pembeli" : "Collected from buyers"}
          </span>
        </div>

        {/* PPN Masukan */}
        <div
          onClick={onOpenPurchasesModal}
          className={`bg-neutral-50/90 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800/80 rounded-lg p-3.5 transition-all ${
            onOpenPurchasesModal
              ? "hover:border-emerald-500/50 dark:hover:border-emerald-700/60 hover:bg-emerald-50/40 dark:hover:bg-neutral-900/80 cursor-pointer group"
              : ""
          }`}
          role={onOpenPurchasesModal ? "button" : undefined}
          tabIndex={onOpenPurchasesModal ? 0 : undefined}
          onKeyDown={(e) => {
            if (onOpenPurchasesModal && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onOpenPurchasesModal();
            }
          }}
          aria-label={isId ? "Lihat rincian pembelian bahan baku PPN Masukan" : "View Input VAT material purchases"}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">
              {isId ? "PPN Masukan (Kredit)" : "Input VAT (Credit)"}
            </span>
            <TrendingDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatRupiahTax(summary.totalPpnMasukan)}
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px]">
            <span className="text-neutral-500 dark:text-neutral-500">
              {summary.countFpm} {isId ? "Pembelian bahan baku" : "Material purchases"}
            </span>
            {onOpenPurchasesModal && (
              <span className="text-emerald-600 dark:text-emerald-400/80 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 font-medium">
                {isId ? "Rincian →" : "Details →"}
              </span>
            )}
          </div>
        </div>

        {/* Net Tax Payable */}
        <div
          className={`rounded-lg p-3.5 border ${
            isKurangBayar
              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/60 text-red-900 dark:text-red-200"
              : isLebihBayar
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200"
              : "bg-neutral-50 dark:bg-neutral-950/60 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200"
          }`}
        >
          <span className="text-[11px] font-medium uppercase tracking-wider block mb-1">
            {isKurangBayar
              ? isId
                ? "Kurang Bayar (Disetor)"
                : "Net Tax Due"
              : isLebihBayar
              ? isId
                ? "Lebih Bayar (Kompensasi)"
                : "Tax Overpayment"
              : isId
              ? "Nihil"
              : "Zero Balance"}
          </span>
          <div className="text-lg font-bold font-mono">
            {formatRupiahTax(Math.abs(summary.netTaxPayable))}
          </div>
          <span className="text-[11px] opacity-80 mt-1 block">
            {isKurangBayar
              ? isId
                ? "Setor via e-Billing sebelum akhir bulan"
                : "Pay via DJP Billing before month-end"
              : isLebihBayar
              ? isId
                ? "Dapat dikompensasikan ke masa depan"
                : "Eligible for next period carry-forward"
              : isId
              ? "Pajak seimbang"
              : "Balanced"}
          </span>
        </div>
      </div>
    </div>
  );
}
