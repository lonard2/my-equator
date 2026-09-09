"use client";

import React, { useEffect, useState, useRef } from "react";
import { DeliveryOrder, Language } from "@/types";
import { useModalSafety } from "@/lib/utils/useModalSafety";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import {
  Printer,
  CheckCircle2,
  Building,
  MapPin,
  Calendar,
  Layers,
  FileDown,
  ArrowRight,
  X,
  FileSpreadsheet,
} from "lucide-react";

interface SlipSpooledCeremonyModalProps {
  isOpen: boolean;
  order: DeliveryOrder | null;
  onClose: () => void;
  /** Called when the operator verifies the physical print output; promotes CONFIRMED to PRINTED. */
  onConfirmPrinted?: (order: DeliveryOrder) => void;
  language: Language;
  autoDismissMs?: number;
  onDownloadPrn?: (order: DeliveryOrder) => void;
}

export function SlipSpooledCeremonyModal({
  isOpen,
  order,
  onClose,
  onConfirmPrinted,
  language,
  autoDismissMs = 4000,
  onDownloadPrn,
}: SlipSpooledCeremonyModalProps) {
  const isId = language === "id";
  const [remainingMs, setRemainingMs] = useState(autoDismissMs);
  const actionButtonRef = useRef<HTMLButtonElement | null>(null);

  // A CONFIRMED order has not been verified as physically printed yet: the
  // operator must answer "printed correctly?" before the status advances.
  // Re-spool of an already-PRINTED order keeps the passive auto-dismiss ritual.
  const needsVerification = !!order && order.status === "CONFIRMED" && !!onConfirmPrinted;

  const modalRef = useModalSafety({
    isOpen,
    onClose,
    initialFocusRef: actionButtonRef,
  });

  // Reset countdown whenever modal opens with a new order. Verification-pending
  // ceremonies do not auto-dismiss: closing equals "not printed yet".
  useEffect(() => {
    if (!isOpen || !order) return;
    setRemainingMs(autoDismissMs);
    if (needsVerification) return;

    const intervalStep = 50;
    const timer = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= intervalStep) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - intervalStep;
      });
    }, intervalStep);

    return () => clearInterval(timer);
  }, [isOpen, order, autoDismissMs, onClose, needsVerification]);

  if (!isOpen || !order) return null;

  const progressPercent = Math.max(0, Math.min(100, (remainingMs / autoDismissMs) * 100));
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  const handleDownloadAgain = () => {
    if (onDownloadPrn) {
      onDownloadPrn(order);
    } else {
      window.open(`/api/orders/${order.id}/print-escp?format=binary`, "_blank");
    }
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="spool-ceremony-title"
        aria-describedby="spool-ceremony-desc"
        className="bg-gray-950 text-white rounded-2xl border border-amber-500/40 shadow-[0_0_50px_rgba(180,83,9,0.35)] w-full max-w-lg flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200"
      >
        {/* Top Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={isId ? "Tutup notifikasi spool cetak" : "Dismiss spool print notice"}
          className="absolute top-3.5 right-3.5 min-w-[44px] min-h-[44px] rounded-xl text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition z-20 active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-amber-500/20 blur-3xl pointer-events-none rounded-full" />

        {/* Modal Body */}
        <div className="p-6 sm:p-8 flex flex-col items-center text-center relative z-10 space-y-5">
          {/* Animated Spool Seal */}
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-950/80 border-2 border-amber-500 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-in zoom-in duration-300">
              <Printer className="h-10 w-10 sm:h-12 sm:w-12 text-amber-400 stroke-[2.2]" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-600 text-white border-2 border-gray-950 shadow-md">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h2 id="spool-ceremony-title" className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {isId ? "File .PRN Siap Dicetak!" : ".PRN File Ready to Print!"}
            </h2>
            <p id="spool-ceremony-desc" className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto">
              {isId
                ? "Stream ESC/P 80-Kolom terunduh. Buka di stasiun cetak untuk spool ke printer dot-matrix Epson LX-310."
                : "The ESC/P 80-column binary stream downloaded. Open it at the print station to spool to the Epson LX-310."}
            </p>
          </div>

          {/* Continuous Form Tractor Sheet Recap */}
          <div className="w-full rounded-xl bg-gray-900/90 border border-amber-900/50 p-4 sm:p-5 text-left space-y-3.5 shadow-inner relative overflow-hidden">
            {/* Visual Tractor Perforation Holes on Left/Right */}
            <div className="absolute left-1.5 top-0 bottom-0 flex flex-col justify-around opacity-30 pointer-events-none">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 my-0.5 block" />
              ))}
            </div>
            <div className="absolute right-1.5 top-0 bottom-0 flex flex-col justify-around opacity-30 pointer-events-none">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 my-0.5 block" />
              ))}
            </div>

            {/* Order Number & Volume Headline */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 pl-2 pr-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                  {isId ? "Nomor Surat Jalan" : "Delivery Order No."}
                </span>
                <span className="font-mono text-base font-extrabold text-amber-200 tracking-wide">
                  {order.orderNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  {isId ? "Total Volume" : "Total Quantity"}
                </span>
                <span className="font-mono text-base font-black text-amber-400 tabular-nums">
                  {order.totalQuantity.toLocaleString("id-ID")}{" "}
                  <span className="text-xs font-semibold text-gray-300 font-sans">psg</span>
                </span>
              </div>
            </div>

            {/* Customer & Destination */}
            <div className="space-y-2 text-xs pl-2 pr-2">
              <div className="flex items-start gap-2.5">
                <Building className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-100 truncate">{order.recipientName}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-gray-300 text-[11px] line-clamp-2 leading-relaxed">
                    {order.destinationAddress}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                  <span>{formatIndonesianDate(order.deliveryDate)}</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400/90 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                  <FileSpreadsheet className="h-3 w-3" />
                  <span>Epson LX-310 • 9.5"x5.5"</span>
                </span>
              </div>
            </div>

            {/* 3-Ply Carbonless Paper Breakdown */}
            <div className="pt-2 border-t border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[10px] pl-2 pr-2">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Layers className="h-3.5 w-3.5" />
                <span>{isId ? "Kertas Continuous Rangkap 3:" : "3-Ply Continuous Paper:"}</span>
              </span>
              <div className="flex items-center gap-2 font-mono text-[10px]">
                <span className="flex items-center gap-1 text-gray-200">
                  <span className="w-2 h-2 rounded-full bg-white border border-gray-400" />
                  <span>1. {isId ? "Putih (Penerima)" : "White (Customer)"}</span>
                </span>
                <span className="flex items-center gap-1 text-red-300">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span>2. {isId ? "Merah (Faktur)" : "Pink (Accounting)"}</span>
                </span>
                <span className="flex items-center gap-1 text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>3. {isId ? "Kuning (Gudang)" : "Yellow (Warehouse)"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Print Verification Block (CONFIRMED orders only) */}
          {needsVerification ? (
            <div className="w-full space-y-2.5 pt-1">
              <div className="rounded-xl border border-amber-800/60 bg-amber-950/40 px-4 py-3 text-left">
                <p className="text-sm font-bold text-amber-200">
                  {isId ? "Sudah tercetak dengan benar?" : "Printed correctly?"}
                </p>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  {isId
                    ? "Periksa fisik: 3 lapis kertas terpasang rapi, teks terbaca jelas di semua rangkap. Status tetap CONFIRMED sampai Anda konfirmasi."
                    : "Check physically: 3 plies aligned, text legible on every sheet. Status stays CONFIRMED until you confirm."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] py-2.5 px-4 rounded-xl border border-gray-700 hover:border-amber-500/70 bg-gray-900/80 hover:bg-gray-800 text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-98"
                >
                  <span>{isId ? "Belum, Cetak Ulang Nanti" : "Not Yet, Reprint Later"}</span>
                </button>

                <button
                  ref={actionButtonRef}
                  type="button"
                  onClick={() => onConfirmPrinted?.(order)}
                  className="min-h-[44px] py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-950 flex items-center justify-center gap-2 active:scale-98 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isId ? "Ya, Tandai Tercetak" : "Yes, Mark Printed"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1">
                <button
                  type="button"
                  onClick={handleDownloadAgain}
                  className="min-h-[44px] py-2.5 px-4 rounded-xl border border-gray-800 hover:border-gray-600 bg-transparent text-gray-400 hover:text-gray-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition active:scale-98"
                >
                  <FileDown className="h-3.5 w-3.5 text-amber-400" />
                  <span>{isId ? "Unduh .PRN Ulang" : "Download .PRN Again"}</span>
                </button>
              </div>

              <p className="text-[10px] text-gray-500 font-mono text-center">
                {isId
                  ? "Tanpa konfirmasi, dokumen tetap berstatus CONFIRMED dan dapat dicetak ulang kapan saja."
                  : "Without confirmation, the document stays CONFIRMED and can be reprinted anytime."}
              </p>
            </div>
          ) : (
            <>
              {/* Action CTAs & Auto-Dismiss Bar */}
              <div className="w-full space-y-2.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadAgain}
                    className="min-h-[44px] py-2.5 px-4 rounded-xl border border-gray-700 hover:border-amber-500/70 bg-gray-900/80 hover:bg-gray-800 text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-98"
                  >
                    <FileDown className="h-4 w-4 text-amber-400" />
                    <span>{isId ? "Unduh .PRN Ulang" : "Download .PRN Again"}</span>
                  </button>

                  <button
                    ref={actionButtonRef}
                    type="button"
                    onClick={onClose}
                    className="min-h-[44px] py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-950 flex items-center justify-center gap-2 active:scale-98 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    <span>{isId ? "Selesai & Lanjutkan" : "Done & Continue"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Subtle Countdown Progress */}
                <div className="space-y-1.5 pt-1">
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-75 ease-linear rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono">
                    {isId
                      ? `Menutup otomatis dalam ${remainingSeconds} detik (atau tekan Enter / Esc)`
                      : `Auto-dismissing in ${remainingSeconds}s (or press Enter / Esc)`}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
