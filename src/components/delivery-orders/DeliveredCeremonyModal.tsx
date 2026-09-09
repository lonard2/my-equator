"use client";

import React, { useEffect, useState, useRef } from "react";
import { DeliveryOrder, Language } from "@/types";
import { useModalSafety } from "@/lib/utils/useModalSafety";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import {
  CheckCircle2,
  Building,
  MapPin,
  PackageCheck,
  Calendar,
  Truck,
  ArrowRight,
  ShieldCheck,
  X,
} from "lucide-react";

interface DeliveredCeremonyModalProps {
  isOpen: boolean;
  order: DeliveryOrder | null;
  onClose: () => void;
  language: Language;
  autoDismissMs?: number;
}

export function DeliveredCeremonyModal({
  isOpen,
  order,
  onClose,
  language,
  autoDismissMs = 6000,
}: DeliveredCeremonyModalProps) {
  const isId = language === "id";
  const [remainingMs, setRemainingMs] = useState(autoDismissMs);
  const actionButtonRef = useRef<HTMLButtonElement | null>(null);

  const modalRef = useModalSafety({
    isOpen,
    onClose,
    initialFocusRef: actionButtonRef,
  });

  // Reset countdown whenever modal opens with a new order
  useEffect(() => {
    if (!isOpen || !order) return;
    setRemainingMs(autoDismissMs);

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
  }, [isOpen, order, autoDismissMs, onClose]);

  if (!isOpen || !order) return null;

  const progressPercent = Math.max(0, Math.min(100, (remainingMs / autoDismissMs) * 100));
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ceremony-title"
        aria-describedby="ceremony-desc"
        className="bg-gray-950 text-white rounded-2xl border border-emerald-500/40 shadow-[0_0_50px_rgba(4,120,87,0.35)] w-full max-w-lg flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200"
      >
        {/* Top Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={isId ? "Tutup notifikasi penyelesaian" : "Dismiss completion notice"}
          className="absolute top-3.5 right-3.5 min-w-[44px] min-h-[44px] rounded-xl text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition z-20 active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/20 blur-3xl pointer-events-none rounded-full" />

        {/* Modal Body */}
        <div className="p-6 sm:p-8 flex flex-col items-center text-center relative z-10 space-y-5">
          {/* Animated Completion Seal */}
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-950/80 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-in zoom-in duration-300">
              <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-400 stroke-[2.2]" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-600 text-white border-2 border-gray-950 shadow-md">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h2 id="ceremony-title" className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {isId ? "Pengiriman Selesai Diterima!" : "Delivery Receipt Confirmed!"}
            </h2>
            <p id="ceremony-desc" className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto">
              {isId
                ? "Tanda terima fisik resmi tercatat dalam sistem operasional Equator Insole."
                : "Official physical receipt logged in Equator Insole operations platform."}
            </p>
          </div>

          {/* Order Recap Sheet */}
          <div className="w-full rounded-xl bg-gray-900/90 border border-emerald-900/50 p-4 sm:p-5 text-left space-y-3.5 shadow-inner">
            {/* Order Number & Pairs Headline */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  {isId ? "Nomor Surat Jalan" : "Order Number"}
                </span>
                <span className="font-mono text-base font-extrabold text-white tracking-wide">
                  {order.orderNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  {isId ? "Total Volume" : "Total Pairs"}
                </span>
                <span className="font-mono text-base font-black text-emerald-400 tabular-nums">
                  {order.totalQuantity.toLocaleString("id-ID")}{" "}
                  <span className="text-xs font-semibold text-gray-300 font-sans">psg</span>
                </span>
              </div>
            </div>

            {/* Customer & Destination */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <Building className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
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
                {order.driverName && (
                  <span className="flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-gray-500" />
                    <span className="truncate max-w-[130px]">{order.driverName}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Factory Triad Signature Verified Pill */}
            <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px] font-semibold text-gray-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <PackageCheck className="h-3.5 w-3.5" />
                <span>{isId ? "Triad Tanda Tangan Lengkap" : "Triad Signatures Verified"}</span>
              </span>
              <span className="font-mono text-[10px] text-gray-500">
                {isId ? "Penerima • Sopir • Gudang" : "Recipient • Driver • Warehouse"}
              </span>
            </div>
          </div>

          {/* Action CTA & Auto-Dismiss Bar */}
          <div className="w-full space-y-3 pt-1">
            <button
              ref={actionButtonRef}
              type="button"
              onClick={onClose}
              className="w-full py-3 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 active:scale-98 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <span>{isId ? "Selesai & Lanjutkan" : "Done & Continue"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Subtle Countdown Progress */}
            <div className="space-y-1.5">
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-75 ease-linear rounded-full"
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
        </div>
      </div>
    </div>
  );
}
