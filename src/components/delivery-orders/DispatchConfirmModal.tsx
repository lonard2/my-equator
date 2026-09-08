"use client";

import React, { useRef, useState } from "react";
import { DeliveryOrder, DeliveryOrderStatus, Language } from "@/types";
import { useModalSafety } from "@/lib/utils/useModalSafety";
import { STATUS_COLOR_MAP } from "@/lib/utils/statusColors";
import { StatusBadge } from "./StatusBadge";
import { Truck, CheckCircle2, X, AlertTriangle, Building, MapPin, Calendar, Package, Loader2, ArrowRight } from "lucide-react";
import { formatIndonesianDate } from "@/lib/utils/formatters";

interface DispatchConfirmModalProps {
  isOpen: boolean;
  order: DeliveryOrder | null;
  targetStatus: "DISPATCHED" | "DELIVERED";
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  language: Language;
}

export function DispatchConfirmModal({
  isOpen,
  order,
  targetStatus,
  onConfirm,
  onClose,
  language,
}: DispatchConfirmModalProps) {
  const isId = language === "id";
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useModalSafety({
    isOpen,
    onClose,
    initialFocusRef: cancelButtonRef,
  });

  if (!isOpen || !order) return null;

  const isDispatching = targetStatus === "DISPATCHED";

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispatch-confirm-title"
        aria-describedby="dispatch-confirm-desc"
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-md md:max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div
          className={`p-4 text-white flex items-center justify-between shadow-xs ${
            isDispatching ? "bg-purple-800 dark:bg-purple-900" : "bg-emerald-800 dark:bg-emerald-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/10 text-white">
              {isDispatching ? <Truck className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            </div>
            <div>
              <h3 id="dispatch-confirm-title" className="font-bold text-sm leading-tight">
                {isDispatching
                  ? isId ? "Konfirmasi Pengiriman ke Armada" : "Confirm Delivery Dispatch"
                  : isId ? "Konfirmasi Selesai Diterima" : "Confirm Delivery Receipt"}
              </h3>
              <p className="text-[11px] font-mono text-purple-200 dark:text-emerald-200">{order.orderNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition flex items-center justify-center"
            aria-label={isId ? "Tutup dialog" : "Close dialog"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Status Progression Strip */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {isId ? "Status Saat Ini" : "Current Status"}
              </span>
              <div>
                <StatusBadge status={order.status} size="sm" language={language} />
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-gray-400" aria-hidden />

            <div className="space-y-0.5 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {isId ? "Status Baru" : "Target Status"}
              </span>
              <div>
                <StatusBadge status={targetStatus} size="sm" language={language} />
              </div>
            </div>
          </div>

          {/* Order Summary Snapshot */}
          <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <Building className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900 dark:text-white leading-tight">
                  {order.recipientName}
                </p>
                <p className="text-[11px] text-gray-500 line-clamp-1">{order.destinationAddress}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px]">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <Package className="h-3.5 w-3.5 text-gray-400" />
                <span>
                  {isId ? "Total Muatan:" : "Total Pairs:"}{" "}
                  <strong className="font-mono text-gray-900 dark:text-white">{order.totalQuantity} psg</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span>{formatIndonesianDate(order.deliveryDate)}</span>
              </div>
            </div>

            {(order.driverName || order.vehicleNumber) && (
              <div className="pt-1.5 text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
                {order.driverName && <span>Sopir: <strong className="text-gray-800 dark:text-gray-200">{order.driverName}</strong></span>}
                {order.vehicleNumber && <span>No. Pol: <strong className="text-gray-800 dark:text-gray-200 font-mono">{order.vehicleNumber}</strong></span>}
              </div>
            )}
          </div>

          {/* Operational Impact Notice */}
          <div
            id="dispatch-confirm-desc"
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs leading-relaxed ${
              isDispatching
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300"
                : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-300"
            }`}
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <p className="font-bold">
                {isDispatching
                  ? isId ? "Verifikasi Muatan Sebelum Kirim" : "Verify Cargo Before Dispatch"
                  : isId ? "Verifikasi Bukti Terima Fisik" : "Verify Signed Physical Receipt"}
              </p>
              <p className="text-[11px] opacity-90">
                {isDispatching
                  ? isId
                    ? "Surat jalan akan dialihkan ke status Kirimkan ke Armada. Pastikan barang fisik telah selesai dimuat dan diserahkan ke sopir/armada pengiriman. Pembatalan setelah ini membutuhkan rollback berstatus khusus."
                    : "The delivery order will advance to Dispatched status. Ensure all physical cartons have been loaded. Reversing this afterwards requires an audited rollback."
                  : isId
                    ? "Surat jalan akan dialihkan ke status Selesai Diterima. Pastikan barang telah tiba di pabrik/gudang pembeli dan tanda terima fisik telah ditandatangani."
                    : "The delivery order will be marked as Delivered. Ensure goods have arrived and physical/digital receipt has been signed by the recipient."}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2.5">
          <button
            ref={cancelButtonRef}
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition active:scale-95 disabled:opacity-50"
          >
            {isId ? "Batal" : "Cancel"}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirm}
            className={`min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition active:scale-95 focus:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              STATUS_COLOR_MAP[targetStatus].cta.buttonClasses
            }`}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isDispatching ? (
              <Truck className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>
              {submitting
                ? isId ? "Memproses..." : "Processing..."
                : isDispatching
                ? isId ? "Ya, Kirimkan ke Armada" : "Yes, Dispatch to Driver"
                : isId ? "Ya, Konfirmasi Selesai Diterima" : "Yes, Confirm Receipt"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
