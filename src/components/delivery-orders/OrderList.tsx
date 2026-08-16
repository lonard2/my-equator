"use client";

import React, { useState } from "react";
import { DeliveryOrder, DeliveryOrderStatus } from "@/types";
import { formatIndonesianDate, formatShortDate } from "@/lib/utils/formatters";
import {
  Search,
  Plus,
  Printer,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  FileText,
  Boxes,
} from "lucide-react";

interface OrderListProps {
  orders: DeliveryOrder[];
  selectedOrderId: string | null;
  onSelectOrder: (order: DeliveryOrder) => void;
  onCreateNew: () => void;
  onOpenPrint: (order: DeliveryOrder) => void;
  language: "id" | "en";
}

export function OrderList({
  orders,
  selectedOrderId,
  onSelectOrder,
  onCreateNew,
  onOpenPrint,
  language,
}: OrderListProps) {
  const isId = language === "id";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filterOptions: Array<{ id: string; label: string }> = [
    { id: "ALL", label: isId ? "Semua" : "All" },
    { id: "DRAFT", label: "Draft" },
    { id: "CONFIRMED", label: isId ? "Konfirm" : "Confirmed" },
    { id: "PRINTED", label: isId ? "Tercetak" : "Printed" },
    { id: "DISPATCHED", label: isId ? "Kirim" : "Dispatched" },
    { id: "DELIVERED", label: isId ? "Selesai" : "Delivered" },
  ];

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.destinationAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.poNumber && order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: DeliveryOrderStatus) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200";
      case "PRINTED":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200";
      case "DISPATCHED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200";
      case "DELIVERED":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate live counts for filter chips
  const countByStatus = (st: string) => {
    if (st === "ALL") return orders.length;
    return orders.filter((o) => o.status === st).length;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Search and Action Bar */}
      <div className="p-3.5 border-b border-gray-200 dark:border-gray-800 space-y-2.5 bg-gray-50/70 dark:bg-gray-800/40">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tight">
              {isId ? "Surat Jalan (DO)" : "Delivery Orders"}
            </h2>
            <p className="text-[11px] text-gray-500 font-medium">
              {orders.length} {isId ? "total dokumen tersimpan" : "orders in system"}
            </p>
          </div>

          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B0000] hover:bg-[#A00000] px-3.5 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg hover:shadow-red-900/20 active:scale-95 transition-all duration-150"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>{isId ? "Buat DO" : "New DO"}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder={isId ? "Cari No. SJ, Customer, PO..." : "Search Order, Client, PO..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 pl-8 pr-3 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] focus:outline-none transition-shadow"
          />
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {filterOptions.map((f) => {
            const isSelected = statusFilter === f.id;
            const count = countByStatus(f.id);
            return (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1 active:scale-95 ${
                  isSelected
                    ? "bg-[#8B0000] text-white shadow-xs"
                    : "bg-gray-200/80 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300/80"
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`px-1 rounded-full text-[9px] font-mono ${
                    isSelected
                      ? "bg-white/25 text-white"
                      : "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/80">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
            <p className="text-xs font-semibold text-gray-500">
              {isId ? "Tidak ada surat jalan ditemukan" : "No orders found"}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isSelected = order.id === selectedOrderId;
            return (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className={`group p-3.5 cursor-pointer transition-all duration-150 relative ${
                  isSelected
                    ? "bg-red-50/80 dark:bg-red-950/40 border-l-4 border-[#8B0000]"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-gray-900 dark:text-white group-hover:text-[#8B0000] dark:group-hover:text-red-400 transition-colors">
                        {order.orderNumber}
                      </span>
                    </div>

                    <p className="font-bold text-xs text-gray-800 dark:text-gray-200 truncate">
                      {order.recipientName}
                    </p>

                    <p className="text-[11px] text-gray-500 truncate">{order.destinationAddress}</p>
                  </div>

                  <div className="flex flex-col items-end space-y-1.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-transform ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    <span className="font-extrabold text-xs text-[#8B0000] dark:text-red-400">
                      {order.totalQuantity.toLocaleString("id-ID")} psg
                    </span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
                  <span>{formatShortDate(order.deliveryDate)}</span>
                  {order.poNumber && <span className="font-mono text-[10px]">PO: {order.poNumber}</span>}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPrint(order);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all"
                    title="Cetak Surat Jalan"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
