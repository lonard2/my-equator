"use client";

import React from "react";
import { DeliveryOrder, DeliveryOrderStatus, FootwearSize } from "@/types";
import { formatIndonesianDate, formatIDR, terbilang } from "@/lib/utils/formatters";
import {
  Printer,
  FileDown,
  Truck,
  CheckCircle2,
  Calendar,
  Building,
  MapPin,
  FileText,
  User,
  Car,
  Clock,
  ArrowRight,
  Trash2,
} from "lucide-react";

interface OrderDetailProps {
  order: DeliveryOrder;
  onStatusChange: (id: string, newStatus: DeliveryOrderStatus) => void;
  onOpenPrint: (order: DeliveryOrder) => void;
  onDeleteOrder: (id: string) => void;
  language: "id" | "en";
}

const STANDARD_SIZES: FootwearSize[] = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

export function OrderDetail({
  order,
  onStatusChange,
  onOpenPrint,
  onDeleteOrder,
  language,
}: OrderDetailProps) {
  const isId = language === "id";

  const nextStatusMap: Partial<Record<DeliveryOrderStatus, { next: DeliveryOrderStatus; label: string; icon: React.ElementType }>> = {
    DRAFT: {
      next: "CONFIRMED",
      label: isId ? "Konfirmasi Pesanan" : "Confirm Order",
      icon: CheckCircle2,
    },
    CONFIRMED: {
      next: "PRINTED",
      label: isId ? "Tandai Tercetak (Dot-Matrix)" : "Mark as Printed",
      icon: Printer,
    },
    PRINTED: {
      next: "DISPATCHED",
      label: isId ? "Kirimkan ke Armada / Driver" : "Dispatch with Driver",
      icon: Truck,
    },
    DISPATCHED: {
      next: "DELIVERED",
      label: isId ? "Selesai Diterima Customer" : "Mark as Delivered",
      icon: CheckCircle2,
    },
  };

  const nextAction = nextStatusMap[order.status];

  const handleDownloadPrn = async () => {
    window.open(`/api/orders/${order.id}/print-escp?format=binary`, "_blank");
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-y-auto">
      {/* Top Banner with Actions */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 sm:p-6 sticky top-0 z-10 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {order.orderNumber}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/60 text-[#8B0000] dark:text-red-300">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isId ? "Dibuat pada" : "Created at"} {formatIndonesianDate(order.createdAt)}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {nextAction && (
              <button
                onClick={() => onStatusChange(order.id, nextAction.next)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#8B0000] hover:bg-[#A00000] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition"
              >
                <nextAction.icon className="h-3.5 w-3.5" />
                <span>{nextAction.label}</span>
              </button>
            )}

            <button
              onClick={() => onOpenPrint(order)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-xs transition"
            >
              <Printer className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
              <span>{isId ? "Pratinjau Cetak" : "Print Preview"}</span>
            </button>

            <button
              onClick={handleDownloadPrn}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-xs transition"
              title="Download raw .prn binary stream for LX-300/310"
            >
              <FileDown className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
              <span>.PRN</span>
            </button>

            <button
              onClick={() => {
                if (confirm(isId ? "Yakin ingin menghapus surat jalan ini?" : "Delete this delivery order?")) {
                  onDeleteOrder(order.id);
                }
              }}
              className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
              title={isId ? "Hapus Surat Jalan" : "Delete Order"}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Customer & Destination */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <Building className="h-3.5 w-3.5" />
              <span>{isId ? "Penerima / Customer" : "Customer / Recipient"}</span>
            </div>
            <p className="font-bold text-sm text-gray-900 dark:text-white">{order.recipientName}</p>
            <div className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-400" />
              <span>{order.destinationAddress}</span>
            </div>
          </div>

          {/* Delivery & PO Details */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5" />
              <span>{isId ? "Jadwal & Referensi" : "Schedule & References"}</span>
            </div>
            <div className="text-xs space-y-1">
              <p className="text-gray-800 dark:text-gray-200">
                <span className="text-gray-500">{isId ? "Tgl Kirim:" : "Date:"}</span>{" "}
                <span className="font-semibold">{formatIndonesianDate(order.deliveryDate)}</span>
              </p>
              <p className="text-gray-800 dark:text-gray-200">
                <span className="text-gray-500">PO / SPK:</span>{" "}
                <span className="font-semibold">{order.poNumber || "-"}</span>
              </p>
            </div>
          </div>

          {/* Logistics & Driver */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <Truck className="h-3.5 w-3.5" />
              <span>{isId ? "Armada & Pengemudi" : "Logistics & Driver"}</span>
            </div>
            <div className="text-xs space-y-1">
              <p className="text-gray-800 dark:text-gray-200">
                <span className="text-gray-500">{isId ? "Sopir:" : "Driver:"}</span>{" "}
                <span className="font-semibold">{order.driverName || "-"}</span>
              </p>
              <p className="text-gray-800 dark:text-gray-200">
                <span className="text-gray-500">{isId ? "No Kendaraan:" : "Vehicle:"}</span>{" "}
                <span className="font-semibold">{order.vehicleNumber || "-"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Size Matrix Items Table */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                {isId ? "Rincian Matriks Ukuran Sepatu (EU 36–45)" : "Footwear Size Breakdown Matrix"}
              </h3>
              <p className="text-xs text-gray-500">
                {order.items?.length || 0} {isId ? "artikel insole dipesan" : "insole articles ordered"}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 uppercase font-semibold block">
                {isId ? "Total Pasang" : "Total Pairs"}
              </span>
              <span className="text-base font-extrabold text-[#8B0000] dark:text-red-400">
                {order.totalQuantity.toLocaleString("id-ID")} psg
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-3 w-10 text-center">No</th>
                  <th className="p-3 min-w-[180px]">{isId ? "Artikel & Spesifikasi" : "Article & Specs"}</th>
                  {STANDARD_SIZES.map((size) => (
                    <th key={size} className="p-2 text-center w-10 font-mono bg-red-50/40 dark:bg-red-950/20">
                      {size}
                    </th>
                  ))}
                  <th className="p-3 text-right w-24">{isId ? "Subtotal" : "Subtotal"}</th>
                  <th className="p-3 text-right w-28">{isId ? "Harga Satuan" : "Unit Price"}</th>
                  <th className="p-3 text-right w-32">{isId ? "Total Nilai" : "Total Amount"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {order.items?.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition">
                    <td className="p-3 text-center text-gray-400">{idx + 1}</td>
                    <td className="p-3">
                      <p className="font-bold text-gray-900 dark:text-white">{item.articleName}</p>
                      <p className="text-[11px] text-gray-500 font-mono">
                        {item.articleCode} {item.colorway && `• ${item.colorway}`}
                      </p>
                      {item.notes && <p className="text-[10px] text-amber-600 mt-0.5">{item.notes}</p>}
                    </td>
                    {STANDARD_SIZES.map((size) => {
                      const qty = item.sizes?.[size];
                      return (
                        <td
                          key={size}
                          className={`p-2 text-center font-mono ${
                            qty && qty > 0
                              ? "bg-red-50/80 dark:bg-red-950/40 font-bold text-[#8B0000] dark:text-red-300"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        >
                          {qty && qty > 0 ? qty : "-"}
                        </td>
                      );
                    })}
                    <td className="p-3 text-right font-bold text-gray-900 dark:text-white">
                      {item.totalPairs.toLocaleString("id-ID")} psg
                    </td>
                    <td className="p-3 text-right text-gray-600 dark:text-gray-300">
                      {item.unitPrice ? formatIDR(item.unitPrice) : "-"}
                    </td>
                    <td className="p-3 text-right font-semibold text-gray-900 dark:text-white">
                      {item.totalPrice ? formatIDR(item.totalPrice) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Grand Total Footer */}
              <tfoot className="bg-gray-50 dark:bg-gray-800 font-bold border-t border-gray-200 dark:border-gray-700">
                <tr>
                  <td colSpan={2} className="p-3 text-gray-800 dark:text-gray-200 uppercase">
                    {isId ? "Grand Total Pengiriman" : "Grand Total"}
                  </td>
                  {STANDARD_SIZES.map((size) => {
                    const colSum =
                      order.items?.reduce((sum, item) => sum + (item.sizes?.[size] || 0), 0) || 0;
                    return (
                      <td key={size} className="p-2 text-center font-mono text-gray-900 dark:text-white">
                        {colSum > 0 ? colSum : "-"}
                      </td>
                    );
                  })}
                  <td className="p-3 text-right text-[#8B0000] dark:text-red-400 font-extrabold">
                    {order.totalQuantity.toLocaleString("id-ID")} psg
                  </td>
                  <td></td>
                  <td className="p-3 text-right text-[#8B0000] dark:text-red-400 font-extrabold">
                    {order.totalAmount ? formatIDR(order.totalAmount) : "-"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Terbilang Banner & Notes */}
        {order.totalAmount && order.totalAmount > 0 && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-4">
            <p className="text-xs font-semibold text-red-900 dark:text-red-300 uppercase tracking-wide">
              {isId ? "Terbilang Formal:" : "Spelled Out in Words:"}
            </p>
            <p className="text-sm font-bold text-[#8B0000] dark:text-red-400 italic mt-0.5">
              "{terbilang(order.totalAmount)}"
            </p>
          </div>
        )}

        {order.notes && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {isId ? "Catatan Tambahan" : "Notes"}
            </p>
            <p className="text-xs text-gray-800 dark:text-gray-200">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
