"use client";

import React, { useState, useEffect } from "react";
import { DeliveryOrder, FootwearSize } from "@/types";
import { generateEscpMonospaceText } from "@/lib/printer/escp";
import { formatIndonesianDate, formatShortDate, formatIDR, terbilang } from "@/lib/utils/formatters";
import { X, Printer, FileDown, Terminal, FileText, Check } from "lucide-react";

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

  if (!isOpen || !order) return null;

  const monospaceText = generateEscpMonospaceText(order);

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
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header with Tab Switcher */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/60">
          <div className="flex items-center space-x-3">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Printer className="h-4 w-4 text-[#8B0000]" />
              <span>{isId ? "Pratinjau Cetak Surat Jalan" : "Print Preview"}</span>
              <span className="text-xs font-mono font-normal text-gray-500">({order.orderNumber})</span>
            </h3>

            {/* Tabs */}
            <div className="flex items-center rounded-lg bg-gray-200 dark:bg-gray-700 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("DOT_MATRIX")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
                  activeTab === "DOT_MATRIX"
                    ? "bg-white dark:bg-gray-900 text-[#8B0000] dark:text-red-400 shadow-xs"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>ESC/P Dot-Matrix (80-Col)</span>
              </button>
              <button
                onClick={() => setActiveTab("HTML_SHEET")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
                  activeTab === "HTML_SHEET"
                    ? "bg-white dark:bg-gray-900 text-[#8B0000] dark:text-red-400 shadow-xs"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Format Standar Laser/Inkjet</span>
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === "DOT_MATRIX" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <p>
                  {isId
                    ? "Format Monospace 80-Kolom untuk printer Epson LX-300 / LX-310 / LQ-310 continuous form (kertas rangkap 3)."
                    : "80-column monospace ESC/P format for continuous tractor paper."}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyText}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : null}
                    <span>{copied ? (isId ? "Tersalin!" : "Copied!") : isId ? "Salin Teks" : "Copy Text"}</span>
                  </button>
                  <button
                    onClick={handleDownloadPrn}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#8B0000] hover:bg-[#A00000] text-xs font-semibold text-white shadow-xs transition"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    <span>Download Binary .PRN</span>
                  </button>
                </div>
              </div>

              {/* Simulated Dot-Matrix Continuous Terminal Sheet */}
              <div className="rounded-xl border-2 border-emerald-900/30 bg-[#0c1a14] p-4 sm:p-6 overflow-x-auto shadow-inner text-[#4ade80] font-mono text-xs sm:text-[13px] leading-relaxed select-all">
                <pre>{monospaceText}</pre>
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
                  onClick={handleBrowserPrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#8B0000] hover:bg-[#A00000] text-xs font-bold text-white shadow-xs transition"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>{isId ? "Cetak Dokumen Sekarang" : "Print Document"}</span>
                </button>
              </div>

              {/* Printable HTML Sheet (A4 / Half Page preview) */}
              <div className="bg-white text-gray-900 border border-gray-300 rounded-xl p-8 shadow-sm space-y-6 print-page">
                {/* Header */}
                <div className="border-b-2 border-gray-900 pb-4 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-[#8B0000]">
                      EQUATOR INSOLE BANDUNG
                    </h2>
                    <p className="text-xs text-gray-600">
                      Spesialis Footbed & Insole Orthotic, EVA Foam, Latex & TPU Components
                    </p>
                    <p className="text-xs text-gray-500">
                      Jl. Industri Insole No. 88, Bandung, Jawa Barat | Telp: (022) 540-8899
                    </p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-base font-extrabold uppercase tracking-wide">
                      SURAT JALAN
                    </h3>
                    <p className="font-mono font-bold text-sm text-[#8B0000]">{order.orderNumber}</p>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <p>
                      <span className="font-semibold text-gray-500">Kepada Yth:</span>{" "}
                      <span className="font-bold">{order.recipientName}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-500">Alamat Tujuan:</span>{" "}
                      <span>{order.destinationAddress}</span>
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p>
                      <span className="font-semibold text-gray-500">Tanggal Kirim:</span>{" "}
                      <span className="font-bold">{formatIndonesianDate(order.deliveryDate)}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-500">No. PO / SPK:</span>{" "}
                      <span className="font-mono font-semibold">{order.poNumber || "-"}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-500">No. Kendaraan / Sopir:</span>{" "}
                      <span>
                        {order.vehicleNumber || "-"} / {order.driverName || "-"}
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
                        <th key={s} className="p-1 border-r border-gray-300 text-center w-8 font-mono">
                          {s}
                        </th>
                      ))}
                      <th className="p-2 text-right w-20">Total (Psg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {order.items?.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="p-2 border-r border-gray-300 text-center">{idx + 1}</td>
                        <td className="p-2 border-r border-gray-300">
                          <p className="font-bold">{item.articleName}</p>
                          <p className="text-[10px] text-gray-500">
                            {item.articleCode} {item.colorway && `• ${item.colorway}`}
                          </p>
                        </td>
                        {STANDARD_SIZES.map((s) => (
                          <td key={s} className="p-1 border-r border-gray-300 text-center font-mono font-bold">
                            {item.sizes?.[s] || "-"}
                          </td>
                        ))}
                        <td className="p-2 text-right font-extrabold">{item.totalPairs} psg</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-400">
                    <tr>
                      <td colSpan={2} className="p-2 border-r border-gray-300 uppercase">
                        TOTAL PENGIRIMAN
                      </td>
                      {STANDARD_SIZES.map((s) => {
                        const colSum =
                          order.items?.reduce((sum, item) => sum + (item.sizes?.[s] || 0), 0) || 0;
                        return (
                          <td key={s} className="p-1 border-r border-gray-300 text-center font-mono font-bold">
                            {colSum > 0 ? colSum : "-"}
                          </td>
                        );
                      })}
                      <td className="p-2 text-right font-extrabold text-[#8B0000]">
                        {order.totalQuantity} psg
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Terbilang & Signatures Triad */}
                {order.totalAmount && order.totalAmount > 0 && (
                  <div className="text-xs bg-gray-50 p-2.5 rounded border border-gray-200">
                    <span className="font-semibold text-gray-500">Terbilang:</span>{" "}
                    <span className="italic font-bold">"{terbilang(order.totalAmount)}"</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs">
                  <div>
                    <p className="font-semibold text-gray-600 mb-16">Penerima / Customer</p>
                    <p className="font-bold border-t border-gray-400 pt-1 mx-4">( ................................ )</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 mb-16">Pengirim / Sopir</p>
                    <p className="font-bold border-t border-gray-400 pt-1 mx-4">
                      ( {order.driverName || "................................"} )
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
