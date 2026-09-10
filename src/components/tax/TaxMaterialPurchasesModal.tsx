"use client";

import React from "react";
import { MaterialPurchaseDetail } from "@/types/tax";
import { formatRupiahTax } from "@/lib/utils/taxFormatters";
import { useModalSafety } from "@/lib/utils/useModalSafety";
import { X, Layers, ShoppingCart, Calendar, ArrowDownRight, Info } from "lucide-react";

interface TaxMaterialPurchasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "id" | "en";
  period: string;
  purchases: MaterialPurchaseDetail[];
}

export function TaxMaterialPurchasesModal({
  isOpen,
  onClose,
  language,
  period,
  purchases,
}: TaxMaterialPurchasesModalProps) {
  const isId = language === "id";
  const modalRef = useModalSafety({ isOpen, onClose });

  if (!isOpen) return null;

  const totalDpp = purchases.reduce((sum, p) => sum + (p.totalCost || 0), 0);
  const totalPpn = purchases.reduce((sum, p) => sum + (p.estimatedVat || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="material-purchases-modal-title"
        tabIndex={-1}
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh] focus:outline-none"
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:border dark:border-emerald-800/60 dark:text-emerald-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 id="material-purchases-modal-title" className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                {isId
                  ? "Rincian Pembelian Bahan Baku (PPN Masukan)"
                  : "Raw Material Purchases (Input VAT Breakdown)"}
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono">
                  {period}
                </span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isId
                  ? "Arus masuk stok bahan baku (IN_PURCHASE) yang dikreditkan sebagai PPN Masukan"
                  : "Material inventory intake (IN_PURCHASE) credited as Input VAT"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={isId ? "Tutup modal rincian pembelian" : "Close purchases modal"}
            className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Totals Banner */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs shrink-0">
          <div>
            <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">
              {isId ? "Total Transaksi" : "Total Purchases"}
            </span>
            <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{purchases.length} Faktur / Transaksi</span>
          </div>
          <div>
            <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">
              {isId ? "Total Nilai DPP (Pembelian)" : "Total Purchase Base"}
            </span>
            <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{formatRupiahTax(totalDpp)}</span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">
              {isId ? "Total PPN Masukan (11%)" : "Total Input VAT (11%)"}
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatRupiahTax(totalPpn)}</span>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {purchases.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 dark:text-neutral-500 space-y-2">
              <Layers className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs">
                {isId
                  ? "Belum ada transaksi pembelian bahan baku tercatat pada periode ini."
                  : "No material purchases recorded for this tax period."}
              </p>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto">
                {isId
                  ? "Transaksi pembelian dapat dicatat melalui modul Inventaris Stok (Penerimaan IN_PURCHASE)."
                  : "Purchases can be logged through the Materials Inventory module via IN_PURCHASE intakes."}
              </p>
            </div>
          ) : (
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-neutral-800 dark:text-neutral-300">
                <thead className="bg-neutral-100 dark:bg-neutral-950/80 text-neutral-600 dark:text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="py-2.5 px-3">{isId ? "Tanggal" : "Date"}</th>
                    <th className="py-2.5 px-3">{isId ? "Bahan Baku" : "Material"}</th>
                    <th className="py-2.5 px-3 text-right">{isId ? "Kuantitas" : "Quantity"}</th>
                    <th className="py-2.5 px-3 text-right">{isId ? "Harga Satuan" : "Unit Cost"}</th>
                    <th className="py-2.5 px-3 text-right">{isId ? "Total DPP" : "Tax Base"}</th>
                    <th className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">{isId ? "PPN (11%)" : "VAT"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/60 font-normal">
                  {purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{p.date}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">{p.materialName}</div>
                        {p.notes && (
                          <div className="text-[10px] text-neutral-500 truncate max-w-xs">{p.notes}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-neutral-700 dark:text-neutral-300">
                        {p.quantity.toLocaleString("id-ID")} {p.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-neutral-500 dark:text-neutral-400">
                        {formatRupiahTax(p.unitCost)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-neutral-900 dark:text-neutral-200">
                        {formatRupiahTax(p.totalCost)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatRupiahTax(p.estimatedVat)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
            <Info className="w-3.5 h-3.5" />
            <span>
              {isId
                ? "Dihitung dari data mutasi stok tipe 'IN_PURCHASE' pada modul Material & Inventaris."
                : "Derived from 'IN_PURCHASE' inventory movement intakes."}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-medium transition-colors"
          >
            {isId ? "Tutup" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
