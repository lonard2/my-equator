"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { DeliveryOrder, FootwearSize } from "@/types";
import { formatShortDate } from "@/lib/utils/formatters";
import { StatusBadge } from "./StatusBadge";
import {
  Search,
  Plus,
  Printer,
  FileText,
  BarChart3,
  Layers,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

interface OrderListProps {
  orders: DeliveryOrder[];
  selectedOrderId: string | null;
  onSelectOrder: (order: DeliveryOrder) => void;
  onCreateNew: () => void;
  onOpenPrint: (order: DeliveryOrder) => void;
  language: "id" | "en";
}

const STANDARD_SIZES: FootwearSize[] = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

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
  const [showAggregateSummary, setShowAggregateSummary] = useState(false);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const filterOptions: Array<{ id: string; label: string }> = [
    { id: "ALL", label: isId ? "Semua" : "All" },
    { id: "DRAFT", label: "Draft" },
    { id: "CONFIRMED", label: isId ? "Konfirm" : "Confirmed" },
    { id: "PRINTED", label: isId ? "Tercetak" : "Printed" },
    { id: "DISPATCHED", label: isId ? "Kirim" : "Dispatched" },
    { id: "DELIVERED", label: isId ? "Selesai" : "Delivered" },
  ];

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.recipientName.toLowerCase().includes(q) ||
        order.destinationAddress.toLowerCase().includes(q) ||
        (order.poNumber && order.poNumber.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Compute aggregate pairs per size across all filtered orders (For Pak Hendra / Factory Foreman)
  const sizeAggregates = useMemo(() => {
    const agg: { [key in FootwearSize]?: number } = {};
    let totalAll = 0;
    filteredOrders.forEach((order) => {
      order.items?.forEach((item) => {
        Object.entries(item.sizes || {}).forEach(([s, q]) => {
          const numS = parseInt(s, 10) as FootwearSize;
          const numQ = typeof q === "number" ? q : parseInt(q as string, 10) || 0;
          if (numQ > 0) {
            agg[numS] = (agg[numS] || 0) + numQ;
            totalAll += numQ;
          }
        });
      });
    });
    return { bySize: agg, total: totalAll };
  }, [filteredOrders]);

  // Keyboard navigation between orders (ArrowUp / ArrowDown) with auto-scroll into view
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (filteredOrders.length === 0) return;

      const currentIndex = filteredOrders.findIndex((o) => o.id === selectedOrderId);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = currentIndex < filteredOrders.length - 1 ? currentIndex + 1 : 0;
        const targetOrder = filteredOrders[nextIndex];
        onSelectOrder(targetOrder);
        // Auto-scroll target into view
        const el = listContainerRef.current?.querySelector(`[data-order-id="${targetOrder.id}"]`);
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredOrders.length - 1;
        const targetOrder = filteredOrders[prevIndex];
        onSelectOrder(targetOrder);
        // Auto-scroll target into view
        const el = listContainerRef.current?.querySelector(`[data-order-id="${targetOrder.id}"]`);
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredOrders, selectedOrderId, onSelectOrder]);

  // Calculate live counts for filter chips
  const countByStatus = (st: string) => {
    if (st === "ALL") return orders.length;
    return orders.filter((o) => o.status === st).length;
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
  };

  return (
    <aside
      role="region"
      aria-label={isId ? "Daftar Surat Jalan" : "Delivery Orders List"}
      className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 select-none"
    >
      {/* Search and Action Header */}
      <div className="p-3.5 border-b border-gray-200 dark:border-gray-800 space-y-2.5 bg-gray-50/80 dark:bg-gray-800/40">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tight">
              {isId ? "Surat Jalan (DO)" : "Delivery Orders"}
            </h2>
            <p className="text-[11px] text-gray-500 font-medium tabular-nums">
              {orders.length} {isId ? "total dokumen tersimpan" : "orders in system"}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowAggregateSummary(!showAggregateSummary)}
              title={isId ? "Lihat rekap total pasang per ukuran sepatu" : "View aggregate size breakdown"}
              className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 ${
                showAggregateSummary
                  ? "bg-[#8B0000] text-white border-[#8B0000] shadow-xs"
                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-[11px] font-bold">{isId ? "Rekap Size" : "Size Agg."}</span>
            </button>

            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B0000] hover:bg-[#A00000] px-3 py-1.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-all duration-150"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>{isId ? "Buat DO" : "New DO"}</span>
            </button>
          </div>
        </div>

        {/* Aggregate Sizing Breakdown Drawer (For Pak Hendra / Factory Production Staging) */}
        {showAggregateSummary && (
          <div className="p-3 rounded-2xl bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-2 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between text-[11px] font-bold text-red-900 dark:text-red-300">
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-[#8B0000]" />
                <span>{isId ? "Rekap Total Pasang per Size (Filter Aktif)" : "Total Pairs per Size (Active Filter)"}</span>
              </span>
              <span className="font-mono text-xs font-black text-[#8B0000] dark:text-red-400 tabular-nums">
                {sizeAggregates.total.toLocaleString("id-ID")} psg
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1 text-center font-mono">
              {STANDARD_SIZES.map((size) => {
                const qty = sizeAggregates.bySize[size] || 0;
                return (
                  <div
                    key={size}
                    className={`p-1 rounded-xl border text-[11px] transition ${
                      qty > 0
                        ? "bg-white dark:bg-gray-800 border-red-300 dark:border-red-900 text-[#8B0000] dark:text-red-300 font-bold shadow-2xs"
                        : "bg-transparent border-red-100/60 dark:border-red-950/60 text-gray-400 dark:text-gray-600"
                    }`}
                  >
                    <span className="block text-[9px] text-gray-500 dark:text-gray-400 font-sans font-semibold">EU {size}</span>
                    <span className="tabular-nums">{qty > 0 ? qty : "-"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
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
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1 active:scale-95 ${
                  isSelected
                    ? "bg-[#8B0000] text-white shadow-xs"
                    : "bg-gray-200/80 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300/80 dark:hover:bg-gray-700"
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`px-1 rounded-full text-[9px] font-mono tabular-nums ${
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
      <div
        ref={listContainerRef}
        role="listbox"
        aria-label={isId ? "Daftar Dokumen Surat Jalan" : "Delivery Orders Listbox"}
        className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/80"
      >
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400 space-y-3">
            <FileText className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-700" />
            <div>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {isId ? "Tidak ada surat jalan ditemukan" : "No orders found"}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {searchTerm || statusFilter !== "ALL"
                  ? isId ? "Coba sesuaikan kata kunci pencarian atau filter status." : "Try adjusting your search query or filter."
                  : isId ? "Klik 'Buat DO' untuk membuat surat jalan baru." : "Click 'New DO' to create your first order."}
              </p>
            </div>
            {(searchTerm || statusFilter !== "ALL") && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition shadow-2xs"
              >
                <RotateCcw className="h-3.5 w-3.5 text-[#8B0000]" />
                <span>{isId ? "Reset Filter & Pencarian" : "Reset Filters"}</span>
              </button>
            )}
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isSelected = order.id === selectedOrderId;
            return (
              <div
                key={order.id}
                data-order-id={order.id}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => onSelectOrder(order)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectOrder(order);
                  }
                }}
                className={`group p-3.5 cursor-pointer transition-all duration-150 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B0000] focus-visible:ring-inset ${
                  isSelected
                    ? "bg-red-50/80 dark:bg-red-950/40"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                {/* Active Inset Indicator Bar without box-sizing layout shift */}
                {isSelected && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#8B0000]" />
                )}

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
                    <StatusBadge status={order.status} size="sm" language={language} />
                    <span className="font-extrabold text-xs text-[#8B0000] dark:text-red-400 tabular-nums">
                      {order.totalQuantity.toLocaleString("id-ID")} psg
                    </span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="tabular-nums">{formatShortDate(order.deliveryDate)}</span>
                  {order.poNumber && <span className="font-mono text-[10px] truncate max-w-[120px]">PO: {order.poNumber}</span>}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPrint(order);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all min-h-[28px] min-w-[28px] flex items-center justify-center active:scale-95"
                    title={isId ? "Cetak Surat Jalan" : "Print Order"}
                    aria-label={isId ? `Cetak Surat Jalan ${order.orderNumber}` : `Print Order ${order.orderNumber}`}
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Keyboard Shortcut Guidance Footer */}
      <div className="px-3.5 py-2 border-t border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 text-[10px] text-gray-400 flex items-center justify-between">
        <span>{filteredOrders.length} {isId ? "dokumen ditampilkan" : "orders displayed"}</span>
        <span className="font-mono hidden sm:inline text-gray-400/80">↑/↓ Navigasi Keyboard</span>
      </div>
    </aside>
  );
}
