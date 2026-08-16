"use client";

import React, { useState, useEffect } from "react";
import { DeliveryOrder, DeliveryOrderStatus, FootwearSize, SizeBreakdown } from "@/types";
import { formatIndonesianDate, formatIDR, terbilang } from "@/lib/utils/formatters";
import { TouchSizePad } from "./TouchSizePad";
import {
  Printer,
  FileDown,
  Truck,
  CheckCircle2,
  Calendar,
  Building,
  MapPin,
  Trash2,
  Edit3,
  Save,
  X,
  Plus,
  Grid,
  Touchpad,
} from "lucide-react";

interface OrderDetailProps {
  order: DeliveryOrder;
  onStatusChange: (id: string, newStatus: DeliveryOrderStatus) => void;
  onOpenPrint: (order: DeliveryOrder) => void;
  onDeleteOrder: (id: string) => void;
  onOrderUpdated: () => void;
  language: "id" | "en";
}

const STANDARD_SIZES: FootwearSize[] = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

interface EditableItem {
  id: string;
  articleCode: string;
  articleName: string;
  colorway: string;
  unitPrice: number;
  sizes: SizeBreakdown;
  notes: string;
}

export function OrderDetail({
  order,
  onStatusChange,
  onOpenPrint,
  onDeleteOrder,
  onOrderUpdated,
  language,
}: OrderDetailProps) {
  const isId = language === "id";
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inputMode, setInputMode] = useState<"GRID" | "TOUCH_PAD">("GRID");
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);

  // Edit form states
  const [recipientName, setRecipientName] = useState(order.recipientName);
  const [destinationAddress, setDestinationAddress] = useState(order.destinationAddress);
  const [poNumber, setPoNumber] = useState(order.poNumber || "");
  const [vehicleNumber, setVehicleNumber] = useState(order.vehicleNumber || "");
  const [driverName, setDriverName] = useState(order.driverName || "");
  const [deliveryDate, setDeliveryDate] = useState(order.deliveryDate);
  const [notes, setNotes] = useState(order.notes || "");
  const [editItems, setEditItems] = useState<EditableItem[]>([]);

  // Sync edit state whenever order prop changes
  useEffect(() => {
    setRecipientName(order.recipientName);
    setDestinationAddress(order.destinationAddress);
    setPoNumber(order.poNumber || "");
    setVehicleNumber(order.vehicleNumber || "");
    setDriverName(order.driverName || "");
    setDeliveryDate(order.deliveryDate);
    setNotes(order.notes || "");

    const mapped = (order.items || []).map((item) => ({
      id: item.id,
      articleCode: item.articleCode,
      articleName: item.articleName,
      colorway: item.colorway || "",
      unitPrice: item.unitPrice || 0,
      sizes: { ...item.sizes },
      notes: item.notes || "",
    }));
    setEditItems(mapped);
    setIsEditing(false);
    setActiveItemIndex(0);
  }, [order]);

  const handleDownloadPrn = () => {
    window.open(`/api/orders/${order.id}/print-escp?format=binary`, "_blank");
  };

  const handleAddItem = () => {
    const nextItem = {
      id: `item-${Date.now()}`,
      articleCode: `EQ-ITEM-0${editItems.length + 1}`,
      articleName: "Insole EVA Custom Moulded",
      colorway: "Black",
      unitPrice: 20000,
      sizes: {},
      notes: "",
    };
    setEditItems([...editItems, nextItem]);
    setActiveItemIndex(editItems.length);
  };

  const handleRemoveItem = (id: string) => {
    if (editItems.length <= 1) return;
    const next = editItems.filter((i) => i.id !== id);
    setEditItems(next);
    setActiveItemIndex(Math.max(0, activeItemIndex - 1));
  };

  const handleSizeChange = (itemId: string, size: FootwearSize, value: string) => {
    const num = parseInt(value, 10);
    setEditItems(
      editItems.map((item) => {
        if (item.id !== itemId) return item;
        const newSizes = { ...item.sizes };
        if (isNaN(num) || num <= 0) {
          delete newSizes[size];
        } else {
          newSizes[size] = num;
        }
        return { ...item, sizes: newSizes };
      })
    );
  };

  const handleTouchPadChange = (newSizes: SizeBreakdown) => {
    setEditItems(
      editItems.map((item, idx) => (idx === activeItemIndex ? { ...item, sizes: newSizes } : item))
    );
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName,
          destinationAddress,
          poNumber,
          vehicleNumber,
          driverName,
          deliveryDate,
          notes,
          items: editItems.map((i) => ({
            id: i.id,
            articleCode: i.articleCode,
            articleName: i.articleName,
            colorway: i.colorway,
            unitPrice: i.unitPrice,
            sizes: i.sizes,
            notes: i.notes,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to update order");
      setIsEditing(false);
      onOrderUpdated();
    } catch (err) {
      console.error(err);
      alert(isId ? "Gagal menyimpan perubahan surat jalan." : "Failed to update order.");
    } finally {
      setSaving(false);
    }
  };

  // Calculation for Edit Mode
  let editGrandTotalPairs = 0;
  let editGrandTotalAmount = 0;
  editItems.forEach((item) => {
    let itemPairs = 0;
    Object.values(item.sizes).forEach((qty) => {
      if (typeof qty === "number" && qty > 0) itemPairs += qty;
    });
    editGrandTotalPairs += itemPairs;
    editGrandTotalAmount += itemPairs * (item.unitPrice || 0);
  });

  const nextStatusMap: Partial<
    Record<DeliveryOrderStatus, { next: DeliveryOrderStatus; label: string; icon: React.ElementType }>
  > = {
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
  const currentEditItem = editItems[activeItemIndex] || editItems[0];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-y-auto">
      {/* Top Header Banner */}
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
              {isEditing && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  {isId ? "Mode Edit Aktif" : "Editing Mode"}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isId ? "Dibuat pada" : "Created at"} {formatIndonesianDate(order.createdAt)}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 px-3 py-2 text-xs font-bold text-[#8B0000] dark:text-red-300 hover:bg-red-100 transition shadow-xs"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>{isId ? "Edit Surat Jalan" : "Edit Order"}</span>
                </button>

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
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>{isId ? "Batal Edit" : "Cancel"}</span>
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#8B0000] hover:bg-[#A00000] px-4 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{saving ? (isId ? "Menyimpan..." : "Saving...") : isId ? "Simpan Perubahan" : "Save Changes"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
        {/* Info Cards (View / Edit Mode) */}
        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        ) : (
          /* Interactive Edit Mode for Header Fields */
          <div className="rounded-2xl border-2 border-red-200 dark:border-red-900/60 bg-white dark:bg-gray-900 p-5 space-y-4 shadow-sm">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-[#8B0000]" />
              <span>{isId ? "Edit Informasi Surat Jalan" : "Edit Order Information"}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {isId ? "Nama Penerima / Customer *" : "Customer *"}
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:border-[#8B0000] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {isId ? "No. PO / SPK" : "PO / SPK"}
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:border-[#8B0000] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {isId ? "Tanggal Pengiriman" : "Delivery Date"}
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:border-[#8B0000] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {isId ? "Alamat Tujuan Lengkap *" : "Destination Address *"}
                </label>
                <input
                  type="text"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:border-[#8B0000] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {isId ? "Nama Pengemudi / Sopir" : "Driver Name"}
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:border-[#8B0000] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Size Matrix Items Table (View or Interactive Edit) */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                {isId ? "Rincian Matriks Ukuran Sepatu (EU 36–45)" : "Footwear Size Breakdown Matrix"}
              </h3>
              <p className="text-xs text-gray-500">
                {isEditing
                  ? isId
                    ? "Ubah jumlah pasang per size langsung di tabel ini"
                    : "Edit pairs per size directly in this grid"
                  : `${order.items?.length || 0} ${isId ? "artikel insole dipesan" : "insole articles ordered"}`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isEditing && (
                <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setInputMode("GRID")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                      inputMode === "GRID"
                        ? "bg-white dark:bg-gray-700 text-[#8B0000] dark:text-red-300 shadow-xs"
                        : "text-gray-500"
                    }`}
                  >
                    <Grid className="h-3.5 w-3.5" />
                    <span>Grid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("TOUCH_PAD")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                      inputMode === "TOUCH_PAD"
                        ? "bg-white dark:bg-gray-700 text-[#8B0000] dark:text-red-300 shadow-xs"
                        : "text-gray-500"
                    }`}
                  >
                    <Touchpad className="h-3.5 w-3.5" />
                    <span>Touch Pad</span>
                  </button>
                </div>
              )}

              {isEditing && (
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] dark:text-red-400 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isId ? "+ Tambah Baris" : "+ Add Row"}</span>
                </button>
              )}

              <div className="text-right">
                <span className="text-xs text-gray-500 uppercase font-semibold block">
                  {isId ? "Total Pasang" : "Total Pairs"}
                </span>
                <span className="text-base font-extrabold text-[#8B0000] dark:text-red-400">
                  {isEditing
                    ? `${editGrandTotalPairs.toLocaleString("id-ID")} psg`
                    : `${order.totalQuantity.toLocaleString("id-ID")} psg`}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {!isEditing ? (
              /* View Mode Table */
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
            ) : inputMode === "TOUCH_PAD" ? (
              /* Touch Pad Edit Mode */
              <div className="p-4 space-y-4">
                {/* Active Item Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {editItems.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveItemIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition ${
                        activeItemIndex === idx
                          ? "bg-[#8B0000] text-white border-[#8B0000] shadow-xs"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.articleCode || `Item ${idx + 1}`}: {item.articleName}
                    </button>
                  ))}
                </div>

                <TouchSizePad
                  sizes={currentEditItem?.sizes || {}}
                  onChange={handleTouchPadChange}
                  language={language}
                />
              </div>
            ) : (
              /* Interactive Grid Table */
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="p-2.5 text-left w-36">{isId ? "Artikel & Kode" : "Article"}</th>
                    <th className="p-2.5 text-left w-24">{isId ? "Harga (IDR)" : "Price"}</th>
                    {STANDARD_SIZES.map((size) => (
                      <th key={size} className="p-2 text-center w-11 font-mono">
                        {size}
                      </th>
                    ))}
                    <th className="p-2.5 text-right w-20">{isId ? "Total Psg" : "Pairs"}</th>
                    <th className="p-2.5 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {editItems.map((item) => {
                    let itemPairs = 0;
                    Object.values(item.sizes).forEach((qty) => {
                      if (typeof qty === "number" && qty > 0) itemPairs += qty;
                    });

                    return (
                      <tr key={item.id} className="bg-white dark:bg-gray-900">
                        <td className="p-2.5 space-y-1">
                          <input
                            type="text"
                            value={item.articleCode}
                            onChange={(e) =>
                              setEditItems(
                                editItems.map((i) =>
                                  i.id === item.id ? { ...i, articleCode: e.target.value } : i
                                )
                              )
                            }
                            className="w-full rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-[11px] font-mono"
                          />
                          <input
                            type="text"
                            value={item.articleName}
                            onChange={(e) =>
                              setEditItems(
                                editItems.map((i) =>
                                  i.id === item.id ? { ...i, articleName: e.target.value } : i
                                )
                              )
                            }
                            className="w-full rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs font-semibold"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice || ""}
                            onChange={(e) =>
                              setEditItems(
                                editItems.map((i) =>
                                  i.id === item.id
                                    ? { ...i, unitPrice: parseInt(e.target.value, 10) || 0 }
                                    : i
                                )
                              )
                            }
                            className="w-full rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs"
                          />
                        </td>
                        {STANDARD_SIZES.map((size) => {
                          const val = item.sizes[size] || "";
                          return (
                            <td key={size} className="p-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="-"
                                value={val}
                                onChange={(e) => handleSizeChange(item.id, size, e.target.value)}
                                className={`w-full text-center rounded border px-1 py-1 text-xs font-mono font-bold transition ${
                                  val && Number(val) > 0
                                    ? "bg-red-50 dark:bg-red-950/60 border-[#8B0000] text-[#8B0000] dark:text-red-300"
                                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                                }`}
                              />
                            </td>
                          );
                        })}
                        <td className="p-2.5 text-right font-extrabold text-xs text-[#8B0000] dark:text-red-400">
                          {itemPairs} psg
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={editItems.length <= 1}
                            className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Terbilang & Notes */}
        {!isEditing ? (
          <>
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
          </>
        ) : (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {isId ? "Catatan Tambahan Surat Jalan" : "Order Notes"}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs text-gray-900 dark:text-white focus:border-[#8B0000] focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
