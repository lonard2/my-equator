"use client";

import React, { useState, useEffect } from "react";
import { DeliveryOrder } from "@/types";
import { TaxTransactionCode } from "@/types/tax";
import { formatRupiahTax } from "@/lib/utils/taxFormatters";
import { useModalSafety } from "@/lib/utils/useModalSafety";
import {
  X,
  Sparkles,
  CheckSquare,
  Square,
  AlertCircle,
  Truck,
  Calendar,
  CheckCircle2,
} from "lucide-react";

interface TaxBatchGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "id" | "en";
  period: string;
  onGenerated: () => void;
  userRole?: string;
}

export function TaxBatchGenerateModal({
  isOpen,
  onClose,
  language,
  period,
  onGenerated,
  userRole = "SUPER_ADMIN",
}: TaxBatchGenerateModalProps) {
  const isId = language === "id";

  const modalRef = useModalSafety({
    isOpen,
    onClose,
  });

  const [unbilledOrders, setUnbilledOrders] = useState<DeliveryOrder[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [transactionCode, setTransactionCode] = useState<TaxTransactionCode>("01");
  const [taxRate, setTaxRate] = useState<number>(11);
  const [isTaxIncluded, setIsTaxIncluded] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch unbilled orders when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    fetch(`/api/tax/reconciliation?period=${period}`, {
      headers: { "x-user-role": userRole },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          const orders = res.data.unbilledOrders || [];
          setUnbilledOrders(orders);
          // Default: select all unbilled orders
          setSelectedOrderIds(orders.map((o: DeliveryOrder) => o.id));
        } else {
          setError(res.error || "Gagal memuat daftar surat jalan");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen, period, userRole]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedOrderIds.length === unbilledOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(unbilledOrders.map((o) => o.id));
    }
  };

  const selectedTotalAmount = unbilledOrders
    .filter((o) => selectedOrderIds.includes(o.id))
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const estimatedPpn = Math.round(selectedTotalAmount * (taxRate / 100));

  const handleGenerate = async () => {
    if (selectedOrderIds.length === 0) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/tax/batch-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole,
        },
        body: JSON.stringify({
          orderIds: selectedOrderIds,
          options: {
            transactionCode,
            taxRate,
            isTaxIncluded,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        onGenerated();
        onClose();
      } else {
        setError(data.error || "Gagal membuat faktur pajak");
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan jaringan");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-generate-modal-title"
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 id="batch-generate-modal-title" className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {isId ? "Buat Faktur Pajak dari Surat Jalan" : "Batch Generate Tax Invoices"}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isId
                  ? `Pilih surat jalan terkonfirmasi pada masa ${period}`
                  : `Select confirmed delivery orders for period ${period}`}
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

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 rounded-xl p-3 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Configuration Options */}
          <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label htmlFor="batch-tax-code" className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                {isId ? "Kode Transaksi" : "Transaction Code"}
              </label>
              <select
                id="batch-tax-code"
                value={transactionCode}
                onChange={(e) => setTransactionCode(e.target.value as TaxTransactionCode)}
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-200 focus:outline-none focus:border-red-600"
              >
                <option value="01">01 - Penyerahan BKP Umum</option>
                <option value="02">02 - Pemungut Bendahara</option>
                <option value="03">03 - Pemungut BUMN/K3S</option>
                <option value="07">07 - Kawasan Berikat (Tidak Dipungut)</option>
                <option value="08">08 - Dibebaskan PPN</option>
              </select>
            </div>

            <div>
              <label htmlFor="batch-tax-rate" className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                {isId ? "Tarif PPN" : "VAT Rate"}
              </label>
              <select
                id="batch-tax-rate"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-200 focus:outline-none focus:border-red-600"
              >
                <option value={11}>11% (Standar UU HPP)</option>
                <option value={12}>12% (Ketentuan Baru)</option>
                <option value={0}>0% (Bebas PPN)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                {isId ? "Harga Termasuk Pajak?" : "Tax-Inclusive Price?"}
              </label>
              <button
                type="button"
                onClick={() => setIsTaxIncluded(!isTaxIncluded)}
                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium text-left transition-colors ${
                  isTaxIncluded
                    ? "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                {isTaxIncluded
                  ? isId
                    ? "Ya (DPP = Total / 1.11)"
                    : "Yes (Inclusive)"
                  : isId
                  ? "Tidak (DPP = Nilai Barang)"
                  : "No (Exclusive)"}
              </button>
            </div>
          </div>

          {/* Unbilled Orders List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <button
                onClick={handleToggleAll}
                className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 flex items-center gap-1.5 font-medium"
              >
                {selectedOrderIds.length === unbilledOrders.length && unbilledOrders.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                ) : (
                  <Square className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                )}
                <span>
                  {isId
                    ? `Pilih Semua (${unbilledOrders.length} Surat Jalan)`
                    : `Select All (${unbilledOrders.length} DOs)`}
                </span>
              </button>
              <span className="text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                {isId ? "Terpilih:" : "Selected:"} {selectedOrderIds.length}
              </span>
            </div>

            <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-800/60 max-h-60 overflow-y-auto shadow-inner">
              {loading ? (
                <div className="p-8 text-center text-xs text-neutral-500 dark:text-neutral-400 animate-pulse">
                  {isId ? "Memuat surat jalan..." : "Loading delivery orders..."}
                </div>
              ) : unbilledOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-600 dark:text-emerald-500/50" />
                  <p>
                    {isId
                      ? "Semua Surat Jalan pada masa ini telah difakturkan!"
                      : "All delivery orders for this period have been invoiced!"}
                  </p>
                </div>
              ) : (
                unbilledOrders.map((order) => {
                  const isChecked = selectedOrderIds.includes(order.id);
                  return (
                    <div
                      key={order.id}
                      onClick={() => handleToggleSelect(order.id)}
                      className={`p-3 text-xs flex items-center justify-between cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors ${
                        isChecked
                          ? "bg-neutral-100 dark:bg-neutral-800/60 ring-1 ring-inset ring-neutral-300 dark:ring-neutral-700"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1 text-neutral-500 dark:text-neutral-400">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-mono font-medium text-neutral-900 dark:text-neutral-200">
                            {order.orderNumber}
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-2">
                            <span>{order.recipientName}</span>
                            <span>•</span>
                            <span>{order.deliveryDate}</span>
                            <span>•</span>
                            <span>{order.totalQuantity} psg</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono font-semibold text-neutral-900 dark:text-neutral-200">
                        {formatRupiahTax(order.totalAmount ?? 0)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Calculation Summary Footer */}
          {selectedOrderIds.length > 0 && (
            <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 flex items-center justify-between text-xs">
              <div>
                <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">
                  {isId ? "Estimasi Total DPP Penyerahan" : "Estimated Total Tax Base"}
                </span>
                <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                  {formatRupiahTax(selectedTotalAmount)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">
                  {isId ? `Estimasi PPN Terutang (${taxRate}%)` : `Estimated VAT (${taxRate}%)`}
                </span>
                <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                  {formatRupiahTax(estimatedPpn)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2.5 bg-neutral-50 dark:bg-neutral-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-medium transition-colors"
          >
            {isId ? "Batal" : "Cancel"}
          </button>
          <button
            onClick={handleGenerate}
            disabled={selectedOrderIds.length === 0 || generating}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {generating
                ? isId
                  ? "Menghasilkan..."
                  : "Generating..."
                : isId
                ? `Buat ${selectedOrderIds.length} Faktur Pajak`
                : `Create ${selectedOrderIds.length} Invoices`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
