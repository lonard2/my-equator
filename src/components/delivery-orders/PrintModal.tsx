"use client";

import React, { useState, useEffect } from "react";
import { DeliveryOrder, FootwearSize } from "@/types";
import { generateEscpMonospaceText } from "@/lib/printer/escp";
import { formatIndonesianDate, formatIDR, terbilang } from "@/lib/utils/formatters";
import {
  X,
  Printer,
  FileDown,
  Terminal,
  FileText,
  Check,
  Edit3,
  Sparkles,
} from "lucide-react";

interface PrintModalProps {
  isOpen: boolean;
  order: DeliveryOrder | null;
  onClose: () => void;
  language: "id" | "en";
}

const STANDARD_SIZES: FootwearSize[] = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

export function PrintModal({ isOpen, order, onClose, language }: PrintModalProps) {
  const isId = language === "id";
  const [activeTab, setActiveTab] = useState<"DOT_MATRIX" | "HTML_SHEET">("DOT_MATRIX");
  const [copied, setCopied] = useState(false);

  // In-place tweaking for print overrides
  const [customDriver, setCustomDriver] = useState("");
  const [customVehicle, setCustomVehicle] = useState("");
  const [customNotes, setCustomNotes] = useState("");

  useEffect(() => {
    if (order) {
      setCustomDriver(order.driverName || "");
      setCustomVehicle(order.vehicleNumber || "");
      setCustomNotes(order.notes || "");
    }
  }, [order]);

  if (!isOpen || !order) return null;

  // Clone order with overrides for preview
  const previewOrder: DeliveryOrder = {
    ...order,
    driverName: customDriver || order.driverName,
    vehicleNumber: customVehicle || order.vehicleNumber,
    notes: customNotes || order.notes,
  };

  const monospaceText = generateEscpMonospaceText(previewOrder);

  const handleDownloadPrn = () => {
    window.open(`/api/orders/${order.id}/print-escp?format=binary`, "_blank");
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(monospaceText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/80 dark:bg-gray-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/70 text-[#8B0000] dark:text-red-400">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  {isId ? "Pratinjau Cetak Surat Jalan" : "Print Preview & Spooler"}
                </h3>
                <span className="text-xs font-mono font-bold text-[#8B0000] dark:text-red-400">
                  {order.orderNumber}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                {isId
                  ? "Dukungan cetak Continuous Form Dot-Matrix (Epson LX) & Kertas Standar"
                  : "Continuous Form Dot-Matrix & Standard Paper Print Support"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Tabs */}
            <div className="flex items-center rounded-xl bg-gray-200/80 dark:bg-gray-800 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("DOT_MATRIX")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  activeTab === "DOT_MATRIX"
                    ? "bg-[#8B0000] text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>ESC/P Dot-Matrix (80-Col)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("HTML_SHEET")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  activeTab === "HTML_SHEET"
                    ? "bg-[#8B0000] text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Laser / Inkjet</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Live Override Bar */}
        <div className="bg-red-50/70 dark:bg-red-950/30 border-b border-red-100 dark:border-red-900/40 px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-[#8B0000] dark:text-red-300 font-bold">
            <Edit3 className="h-3.5 w-3.5" />
            <span>{isId ? "Tweak Cetak Sementara:" : "Temporary Print Tweak:"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600 dark:text-gray-400 font-medium">{isId ? "Sopir:" : "Driver:"}</span>
            <input
              type="text"
              placeholder="Nama Sopir"
              value={customDriver}
              onChange={(e) => setCustomDriver(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1 text-xs text-gray-900 dark:text-white focus:border-[#8B0000] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600 dark:text-gray-400 font-medium">{isId ? "No Kend:" : "Vehicle:"}</span>
            <input
              type="text"
              placeholder="No Kendaraan"
              value={customVehicle}
              onChange={(e) => setCustomVehicle(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1 text-xs text-gray-900 dark:text-white focus:border-[#8B0000] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1 flex-1 min-w-[200px]">
            <span className="text-gray-600 dark:text-gray-400 font-medium">{isId ? "Catatan:" : "Notes:"}</span>
            <input
              type="text"
              placeholder="Catatan tambahan di kertas"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1 text-xs text-gray-900 dark:text-white focus:border-[#8B0000] focus:outline-none"
            />
          </div>
          <span className="text-[10px] text-gray-400 italic">
            {isId ? "(Hanya berlaku untuk cetakan ini)" : "(Only affects this print job)"}
          </span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50 dark:bg-gray-950">
          {activeTab === "DOT_MATRIX" ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    ESC/P 80-COL
                  </span>
                  <p>
                    {isId
                      ? "Format Monospace 80-Kolom untuk printer Epson LX-300 / LX-310 / LQ-310 continuous form (kertas rangkap 3)."
                      : "80-column monospace ESC/P format for continuous tractor paper."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 active:scale-95 transition shadow-xs"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : null}
                    <span>{copied ? (isId ? "Tersalin!" : "Copied!") : isId ? "Salin Teks" : "Copy Text"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPrn}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#8B0000] hover:bg-[#A00000] text-xs font-bold text-white shadow-xs transition active:scale-95"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    <span>Download Binary .PRN</span>
                  </button>
                </div>
              </div>

              {/* Simulated Dot-Matrix Continuous Terminal Sheet */}
              <div className="rounded-2xl border-2 border-emerald-900/40 bg-[#091510] p-4 sm:p-6 overflow-x-auto shadow-2xl text-[#34d399] font-mono text-xs sm:text-[13px] leading-relaxed selection:bg-emerald-600/40 selection:text-white">
                <pre className="font-mono">{monospaceText}</pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <p>
                  {isId
                    ? "Tata letak siap cetak untuk printer laser / inkjet standar atau ekspor PDF via menu browser."
                    : "High-fidelity printable sheet for laser/inkjet printers."}
                </p>
                <button
                  type="button"
                  onClick={handleBrowserPrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B0000] hover:bg-[#A00000] text-xs font-bold text-white shadow-sm transition active:scale-95"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>{isId ? "Cetak Dokumen Sekarang" : "Print Document"}</span>
                </button>
              </div>

              {/* Printable HTML Sheet */}
              <div className="bg-white text-gray-900 border border-gray-300 rounded-2xl p-8 shadow-md space-y-6 print-page max-w-4xl mx-auto">
                {/* Header */}
                <div className="border-b-2 border-gray-900 pb-4 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-[#8B0000]">
                      EQUATOR INSOLE BANDUNG
                    </h2>
                    <p className="text-xs text-gray-700 font-medium">
                      Spesialis Footbed & Insole Orthotic, EVA Foam, Latex & TPU Components
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Jl. Industri Insole No. 88, Bandung, Jawa Barat | Telp: (022) 540-8899
                    </p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-base font-black uppercase tracking-wider">
                      SURAT JALAN
                    </h3>
                    <p className="font-mono font-bold text-sm text-[#8B0000]">{previewOrder.orderNumber}</p>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <p>
                      <span className="font-semibold text-gray-500">Kepada Yth:</span>{" "}
                      <span className="font-bold text-gray-900">{previewOrder.recipientName}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-500">Alamat Tujuan:</span>{" "}
                      <span className="text-gray-800">{previewOrder.destinationAddress}</span>
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p>
                      <span className="font-semibold text-gray-500">Tanggal Kirim:</span>{" "}
                      <span className="font-bold">{formatIndonesianDate(previewOrder.deliveryDate)}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-500">No. PO / SPK:</span>{" "}
                      <span className="font-mono font-semibold">{previewOrder.poNumber || "-"}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-500">No. Kendaraan / Sopir:</span>{" "}
                      <span>
                        {previewOrder.vehicleNumber || "-"} / {previewOrder.driverName || "-"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Table */}
                <table className="w-full text-xs border border-gray-300">
                  <thead className="bg-gray-100 font-bold border-b border-gray-300">
                    <tr>
                      <th className="p-2 border-r border-gray-300 w-8 text-center">No</th>
                      <th className="p-2 border-r border-gray-300 text-left">Nama Artikel & Spesifikasi</th>
                      {STANDARD_SIZES.map((s) => (
                        <th key={s} className="p-1 border-r border-gray-300 text-center w-8 font-mono bg-red-50/50">
                          {s}
                        </th>
                      ))}
                      <th className="p-2 text-right w-20">Total (Psg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {previewOrder.items?.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="p-2 border-r border-gray-300 text-center text-gray-500">{idx + 1}</td>
                        <td className="p-2 border-r border-gray-300">
                          <p className="font-bold text-gray-900">{item.articleName}</p>
                          <p className="text-[10px] text-gray-500 font-mono">
                            {item.articleCode} {item.colorway && `• ${item.colorway}`}
                          </p>
                        </td>
                        {STANDARD_SIZES.map((s) => (
                          <td key={s} className="p-1 border-r border-gray-300 text-center font-mono font-bold text-gray-900">
                            {item.sizes?.[s] || "-"}
                          </td>
                        ))}
                        <td className="p-2 text-right font-extrabold text-[#8B0000]">{item.totalPairs} psg</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-400">
                    <tr>
                      <td colSpan={2} className="p-2 border-r border-gray-300 uppercase text-gray-800">
                        TOTAL PENGIRIMAN
                      </td>
                      {STANDARD_SIZES.map((s) => {
                        const colSum =
                          previewOrder.items?.reduce((sum, item) => sum + (item.sizes?.[s] || 0), 0) || 0;
                        return (
                          <td key={s} className="p-1 border-r border-gray-300 text-center font-mono font-bold text-gray-900">
                            {colSum > 0 ? colSum : "-"}
                          </td>
                        );
                      })}
                      <td className="p-2 text-right font-extrabold text-[#8B0000]">
                        {previewOrder.totalQuantity} psg
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Terbilang & Notes */}
                {previewOrder.totalAmount && previewOrder.totalAmount > 0 && (
                  <div className="text-xs bg-red-50/50 p-3 rounded-xl border border-red-200">
                    <span className="font-semibold text-red-900 uppercase">Terbilang:</span>{" "}
                    <span className="italic font-bold text-[#8B0000]">"{terbilang(previewOrder.totalAmount)}"</span>
                  </div>
                )}

                {previewOrder.notes && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                    <span className="font-semibold text-gray-700">Catatan:</span> {previewOrder.notes}
                  </div>
                )}

                {/* 3-Party Signatures Triad */}
                <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs">
                  <div>
                    <p className="font-semibold text-gray-600 mb-16">Penerima / Customer</p>
                    <p className="font-bold border-t border-gray-400 pt-1 mx-4">( ................................ )</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 mb-16">Pengirim / Sopir</p>
                    <p className="font-bold border-t border-gray-400 pt-1 mx-4">
                      ( {previewOrder.driverName || "................................"} )
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 mb-16">Hormat Kami / Bagian Gudang</p>
                    <p className="font-bold border-t border-gray-400 pt-1 mx-4">( Equator Insole Bandung )</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
