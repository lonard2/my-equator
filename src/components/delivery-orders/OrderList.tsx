"use client";

import React, { useState } from "react";
import { DeliveryOrder, DeliveryOrderStatus } from "@/types";
import { formatIndonesianDate } from "@/lib/utils/formatters";
import {
  Search,
  Plus,
  Printer,
  ChevronRight,
  Filter,
  Truck,
  CheckCircle2,
  Clock,
  Send,
  FileCheck,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.poNumber && order.poNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: DeliveryOrderStatus) => {
    switch (status) {
      case "DRAFT":
        return {
          bg: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300",
          icon: Clock,
          label: isId ? "Draft" : "Draft",
        };
      case "CONFIRMED":
        return {
          bg: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200",
          icon: FileCheck,
          label: isId ? "Terkonfirmasi" : "Confirmed",
        };
      case "PRINTED":
        return {
          bg: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200",
          icon: Printer,
          label: isId ? "Tercetak" : "Printed",
        };
      case "DISPATCHED":
        return {
          bg: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200",
          icon: Truck,
          label: isId ? "Terkirim Armada" : "Dispatched",
        };
      case "DELIVERED":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200",
          icon: CheckCircle2,
          label: isId ? "Diterima Customer" : "Delivered",
        };
      default:
        return {
          bg: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200",
          icon: Clock,
          label: status,
        };
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Top Header & New Action */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {isId ? "Surat Jalan (Delivery Orders)" : "Delivery Orders"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {filteredOrders.length} {isId ? "dokumen terdaftar" : "registered documents"}
            </p>
          </div>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#8B0000] hover:bg-[#A00000] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>{isId ? "+ Buat Surat Jalan" : "+ New Order"}</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder={isId ? "Cari No SJ, Customer, PO..." : "Search SJ, Customer, PO..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-8 pr-3 py-1.5 text-xs text-gray-900 dark:text-white focus:border-[#8B0000] focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 focus:border-[#8B0000] focus:outline-none"
          >
            <option value="ALL">{isId ? "Semua Status" : "All Status"}</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">{isId ? "Terkonfirmasi" : "Confirmed"}</option>
            <option value="PRINTED">{isId ? "Tercetak" : "Printed"}</option>
            <option value="DISPATCHED">{isId ? "Terkirim" : "Dispatched"}</option>
            <option value="DELIVERED">{isId ? "Diterima" : "Delivered"}</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            {isId ? "Tidak ada surat jalan yang cocok." : "No matching delivery orders found."}
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isSelected = selectedOrderId === order.id;
            const badge = getStatusBadge(order.status);
            const StatusIcon = badge.icon;

            return (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className={`p-3 cursor-pointer transition flex items-start justify-between group ${
                  isSelected
                    ? "bg-red-50/70 dark:bg-red-950/40 border-l-4 border-[#8B0000]"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                }`}
              >
                <div className="space-y-1 pr-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}`}
                    >
                      <StatusIcon className="h-2.5 w-2.5" />
                      {badge.label}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                    {order.recipientName}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                    <span>{formatIndonesianDate(order.deliveryDate)}</span>
                    <span>•</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {order.totalQuantity.toLocaleString("id-ID")} psg
                    </span>
                    {order.poNumber && (
                      <>
                        <span>•</span>
                        <span className="truncate">PO: {order.poNumber}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPrint(order);
                    }}
                    title={isId ? "Cetak ESC/P / Print" : "Print ESC/P"}
                    className="p-1.5 text-gray-400 hover:text-[#8B0000] hover:bg-white dark:hover:bg-gray-700 rounded transition"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
