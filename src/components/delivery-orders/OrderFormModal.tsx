"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { FootwearSize, SizeBreakdown } from "@/types";
import {
  X,
  Plus,
  Trash2,
  Save,
  Calculator,
  Grid,
  Touchpad,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatIDR } from "@/lib/utils/formatters";
import { TouchSizePad } from "./TouchSizePad";

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDraftData?: any;
  language: "id" | "en";
}

const STANDARD_SIZES: FootwearSize[] = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
const OVERSIZED_SIZES: FootwearSize[] = [46, 47, 48];

interface FormItem {
  id: string;
  articleCode: string;
  articleName: string;
  colorway: string;
  unitPrice: number;
  sizes: SizeBreakdown;
  notes: string;
}

const DEFAULT_INITIAL_ITEM: FormItem = {
  id: "item-1",
  articleCode: "EQ-SPORT-01",
  articleName: "Insole EVA Ortho Sport EQ-01",
  colorway: "Black / Red",
  unitPrice: 18500,
  sizes: { 38: 20, 39: 50, 40: 50, 41: 50, 42: 30 },
  notes: "Laminasi BK Mesh",
};

export function OrderFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialDraftData,
  language,
}: OrderFormModalProps) {
  const isId = language === "id";
  const modalRef = useRef<HTMLDivElement>(null);

  const [recipientName, setRecipientName] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [inputMode, setInputMode] = useState<"GRID" | "TOUCH_PAD">("GRID");
  const [showOversized, setShowOversized] = useState(false);

  const [items, setItems] = useState<FormItem[]>([DEFAULT_INITIAL_ITEM]);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);

  // Unsaved changes confirmation dialog state
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const displayedSizes = showOversized ? [...STANDARD_SIZES, ...OVERSIZED_SIZES] : STANDARD_SIZES;

  // Track if user has made edits after opening
  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // Reset form to clean state
  const resetForm = useCallback(() => {
    setRecipientName("");
    setDestinationAddress("");
    setPoNumber("");
    setVehicleNumber("");
    setDriverName("");
    setDeliveryDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setItems([{ ...DEFAULT_INITIAL_ITEM, id: `item-${Date.now()}` }]);
    setActiveItemIndex(0);
    setErrorMessage(null);
    setFieldErrors({});
    setIsDirty(false);
    setShowDiscardConfirm(false);
    setShowOversized(false);
  }, []);

  // Sync initialDraftData if provided (e.g. from Khatulistiwa AI assistant)
  useEffect(() => {
    if (initialDraftData && isOpen) {
      setRecipientName(initialDraftData.recipient_name || initialDraftData.recipientName || "");
      setDestinationAddress(initialDraftData.destination_address || initialDraftData.destinationAddress || "");
      setPoNumber(initialDraftData.po_number || initialDraftData.poNumber || "");
      setVehicleNumber(initialDraftData.vehicle_number || initialDraftData.vehicleNumber || "");
      setDriverName(initialDraftData.driver_name || initialDraftData.driverName || "");
      setDeliveryDate(initialDraftData.delivery_date || initialDraftData.deliveryDate || new Date().toISOString().split("T")[0]);
      setNotes(initialDraftData.notes || "");

      if (Array.isArray(initialDraftData.items) && initialDraftData.items.length > 0) {
        const mappedItems: FormItem[] = initialDraftData.items.map((it: any, idx: number) => {
          const parsedSizes: SizeBreakdown = {};
          if (it.sizes && typeof it.sizes === "object") {
            Object.entries(it.sizes).forEach(([s, q]) => {
              const numS = parseInt(s, 10);
              const numQ = typeof q === "number" ? q : parseInt(q as string, 10);
              if (!isNaN(numS) && !isNaN(numQ) && numQ > 0) {
                parsedSizes[numS as FootwearSize] = numQ;
              }
            });
          }
          return {
            id: `item-${Date.now()}-${idx}`,
            articleCode: it.article_code || it.articleCode || `EQ-ART-0${idx + 1}`,
            articleName: it.article_name || it.articleName || "Insole Custom Moulded",
            colorway: it.colorway || "Black",
            unitPrice: Math.max(0, it.unit_price || it.unitPrice || 20000),
            sizes: parsedSizes,
            notes: it.notes || "",
          };
        });
        setItems(mappedItems);
      }
      setIsDirty(true);
    } else if (isOpen && !initialDraftData) {
      resetForm();
    }
  }, [initialDraftData, isOpen, resetForm]);

  // Safe dismiss handler
  const handleRequestClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      resetForm();
      onClose();
    }
  }, [isDirty, onClose, resetForm]);

  // Handle escape key listener for safe dismiss
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false);
        } else {
          handleRequestClose();
        }
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showDiscardConfirm, handleRequestClose]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    markDirty();
    const nextItem: FormItem = {
      id: `item-${Date.now()}`,
      articleCode: `EQ-ITEM-0${items.length + 1}`,
      articleName: "Insole EVA Custom Moulded",
      colorway: "Black",
      unitPrice: 20000,
      sizes: {},
      notes: "",
    };
    setItems([...items, nextItem]);
    setActiveItemIndex(items.length);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    markDirty();
    const newItems = items.filter((i) => i.id !== id);
    setItems(newItems);
    setActiveItemIndex(Math.max(0, activeItemIndex - 1));
  };

  const handleSizeChange = (itemId: string, size: FootwearSize, value: string) => {
    markDirty();
    const cleanVal = value.replace(/[^0-9]/g, "");
    const num = parseInt(cleanVal, 10);
    setItems(
      items.map((item) => {
        if (item.id !== itemId) return item;
        const newSizes = { ...item.sizes };
        if (isNaN(num) || num <= 0) {
          delete newSizes[size];
        } else {
          newSizes[size] = Math.min(num, 99999);
        }
        return { ...item, sizes: newSizes };
      })
    );
  };

  const handleTouchPadChange = (newSizes: SizeBreakdown) => {
    markDirty();
    setItems(
      items.map((item, idx) => (idx === activeItemIndex ? { ...item, sizes: newSizes } : item))
    );
  };

  // Calculate totals
  let grandTotalPairs = 0;
  let grandTotalAmount = 0;
  items.forEach((item) => {
    let itemPairs = 0;
    Object.values(item.sizes).forEach((qty) => {
      if (typeof qty === "number" && qty > 0) itemPairs += qty;
    });
    grandTotalPairs += itemPairs;
    grandTotalAmount += itemPairs * (item.unitPrice || 0);
  });

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!recipientName.trim()) {
      errors.recipientName = isId ? "Nama customer / penerima wajib diisi" : "Customer name is required";
    }
    if (!destinationAddress.trim()) {
      errors.destinationAddress = isId ? "Alamat tujuan pengiriman wajib diisi" : "Destination address is required";
    }
    if (grandTotalPairs <= 0) {
      errors.totalPairs = isId
        ? "Wajib mengisi jumlah pasang minimal 1 pada salah satu ukuran"
        : "Total pairs must be greater than 0";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: recipientName.trim(),
          destinationAddress: destinationAddress.trim(),
          poNumber: poNumber.trim(),
          vehicleNumber: vehicleNumber.trim(),
          driverName: driverName.trim(),
          deliveryDate,
          notes: notes.trim(),
          items: items.map((i) => ({
            articleCode: (i.articleCode || "EQ-ITEM").trim(),
            articleName: (i.articleName || "Insole").trim(),
            colorway: i.colorway.trim(),
            unitPrice: Math.max(0, Number(i.unitPrice) || 0),
            sizes: i.sizes,
            notes: i.notes.trim(),
          })),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || (isId ? "Gagal menyimpan surat jalan." : "Failed to create delivery order."));
      }

      setIsDirty(false);
      resetForm();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (isId ? "Terjadi kesalahan saat menyimpan surat jalan." : "Failed to save order.");
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const currentItem = items[activeItemIndex] || items[0];

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/40">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-red-100 dark:bg-red-950/70 text-[#8B0000] dark:text-red-400">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white leading-tight">
                {isId ? "Buat Surat Jalan (DO) Baru" : "New Delivery Order"}
              </h3>
              <p className="text-[11px] text-gray-500">
                {isId
                  ? "Entri dokumen pengiriman insole dengan validasi matriks ukuran otomatis"
                  : "Create footwear delivery slip with automated matrix validation"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRequestClose}
            aria-label={isId ? "Tutup formulir" : "Close modal"}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Non-blocking Global Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2.5 text-xs text-red-800 dark:text-red-300 font-medium">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-xs text-red-600 hover:underline font-bold"
              >
                {isId ? "Tutup" : "Dismiss"}
              </button>
            </div>
          )}

          {/* Recipient & Logistics Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span>{isId ? "Nama Customer / PT *" : "Customer Name *"}</span>
                {fieldErrors.recipientName && (
                  <span className="text-[11px] text-red-600 font-medium">{fieldErrors.recipientName}</span>
                )}
              </label>
              <input
                type="text"
                required
                maxLength={100}
                placeholder="e.g. PT Bintang Pratama Footwear"
                value={recipientName}
                onChange={(e) => {
                  setRecipientName(e.target.value);
                  markDirty();
                  if (fieldErrors.recipientName) setFieldErrors({ ...fieldErrors, recipientName: "" });
                }}
                className={`w-full rounded-xl border px-3 py-2 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800 transition ${
                  fieldErrors.recipientName
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-700 focus:border-[#8B0000] focus:outline-none"
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {isId ? "Nomor PO / SPK" : "PO / SPK Number"}
              </label>
              <input
                type="text"
                maxLength={50}
                placeholder="e.g. PO-8821 / SPK-04"
                value={poNumber}
                onChange={(e) => {
                  setPoNumber(e.target.value);
                  markDirty();
                }}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-[#8B0000] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {isId ? "Tanggal Pengiriman" : "Delivery Date"}
              </label>
              <input
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => {
                  setDeliveryDate(e.target.value);
                  markDirty();
                }}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-[#8B0000] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span>{isId ? "Alamat Tujuan Lengkap *" : "Destination Address *"}</span>
                {fieldErrors.destinationAddress && (
                  <span className="text-[11px] text-red-600 font-medium">{fieldErrors.destinationAddress}</span>
                )}
              </label>
              <input
                type="text"
                required
                maxLength={300}
                placeholder="e.g. Kawasan Industri Jatake Blok C No. 12, Tangerang"
                value={destinationAddress}
                onChange={(e) => {
                  setDestinationAddress(e.target.value);
                  markDirty();
                  if (fieldErrors.destinationAddress) setFieldErrors({ ...fieldErrors, destinationAddress: "" });
                }}
                className={`w-full rounded-xl border px-3 py-2 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800 transition ${
                  fieldErrors.destinationAddress
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-700 focus:border-[#8B0000] focus:outline-none"
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {isId ? "Nama Pengemudi / Sopir" : "Driver Name"}
              </label>
              <input
                type="text"
                maxLength={80}
                placeholder="e.g. Asep Sunandar"
                value={driverName}
                onChange={(e) => {
                  setDriverName(e.target.value);
                  markDirty();
                }}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-[#8B0000] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {isId ? "Nomor Kendaraan" : "Vehicle Number"}
              </label>
              <input
                type="text"
                maxLength={30}
                placeholder="e.g. D 8842 AB"
                value={vehicleNumber}
                onChange={(e) => {
                  setVehicleNumber(e.target.value);
                  markDirty();
                }}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-[#8B0000] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {isId ? "Catatan Khusus Pengiriman" : "Special Shipping Notes"}
              </label>
              <input
                type="text"
                maxLength={300}
                placeholder="e.g. Mohon stempel rangkap 3 & cek kualitas"
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  markDirty();
                }}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-[#8B0000] focus:outline-none"
              />
            </div>
          </div>

          {/* Size Matrix Items Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-[#8B0000]" />
                    <span>{isId ? "Rincian Artikel & Matriks Ukuran Sepatu" : "Size Breakdown Matrix"}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowOversized(!showOversized)}
                    className="text-[11px] font-semibold text-gray-500 hover:text-[#8B0000] dark:hover:text-red-400 flex items-center gap-0.5"
                  >
                    <span>{showOversized ? (isId ? "Sembunyikan 46-48" : "Hide 46-48") : (isId ? "+ Jumbo EU 46-48" : "+ Oversize 46-48")}</span>
                    {showOversized ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                </div>
                {fieldErrors.totalPairs && (
                  <p className="text-xs text-red-600 font-semibold mt-0.5">{fieldErrors.totalPairs}</p>
                )}
              </div>

              {/* View Switcher: Spreadsheet vs Touch Pad */}
              <div className="flex items-center space-x-2">
                <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setInputMode("GRID")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
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
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                      inputMode === "TOUCH_PAD"
                        ? "bg-white dark:bg-gray-700 text-[#8B0000] dark:text-red-300 shadow-xs"
                        : "text-gray-500"
                    }`}
                  >
                    <Touchpad className="h-3.5 w-3.5" />
                    <span>Touch Pad</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] dark:text-red-400 hover:underline active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isId ? "+ Baris Baru" : "+ Add Row"}</span>
                </button>
              </div>
            </div>

            {/* If Touch Pad mode is active */}
            {inputMode === "TOUCH_PAD" ? (
              <div className="space-y-4">
                {/* Active Item Selector Tab Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {items.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveItemIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                        activeItemIndex === idx
                          ? "bg-[#8B0000] text-white border-[#8B0000] shadow-xs"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.articleCode || `Item ${idx + 1}`}: {item.articleName}
                    </button>
                  ))}
                </div>

                {/* Item Details Form */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Kode Artikel</label>
                    <input
                      type="text"
                      maxLength={40}
                      value={currentItem.articleCode}
                      onChange={(e) => {
                        markDirty();
                        setItems(
                          items.map((it, i) => (i === activeItemIndex ? { ...it, articleCode: e.target.value } : it))
                        );
                      }}
                      className="w-full rounded-lg border px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Nama Artikel</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={currentItem.articleName}
                      onChange={(e) => {
                        markDirty();
                        setItems(
                          items.map((it, i) => (i === activeItemIndex ? { ...it, articleName: e.target.value } : it))
                        );
                      }}
                      className="w-full rounded-lg border px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">Harga Satuan (IDR)</label>
                    <input
                      type="number"
                      min="0"
                      value={currentItem.unitPrice || ""}
                      onChange={(e) => {
                        markDirty();
                        setItems(
                          items.map((it, i) =>
                            i === activeItemIndex ? { ...it, unitPrice: Math.max(0, parseInt(e.target.value, 10) || 0) } : it
                          )
                        );
                      }}
                      className="w-full rounded-lg border px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>

                {/* Dedicated Touch Sizing Pad */}
                <TouchSizePad
                  sizes={currentItem.sizes}
                  onChange={handleTouchPadChange}
                  language={language}
                />
              </div>
            ) : (
              /* Spreadsheet Grid View */
              <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-x-auto bg-gray-50/50 dark:bg-gray-800/30">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="p-2.5 text-left w-36">{isId ? "Kode & Nama Artikel" : "Article"}</th>
                      <th className="p-2.5 text-left w-24">{isId ? "Harga (IDR)" : "Price"}</th>
                      {displayedSizes.map((size) => (
                        <th
                          key={size}
                          className={`p-2 text-center w-11 font-mono ${
                            size >= 46
                              ? "bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {size}
                        </th>
                      ))}
                      <th className="p-2.5 text-right w-20">{isId ? "Total Psg" : "Pairs"}</th>
                      <th className="p-2.5 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map((item) => {
                      let itemPairs = 0;
                      Object.values(item.sizes).forEach((qty) => {
                        if (typeof qty === "number" && qty > 0) itemPairs += qty;
                      });

                      return (
                        <tr key={item.id} className="bg-white dark:bg-gray-900">
                          <td className="p-2.5 space-y-1">
                            <input
                              type="text"
                              placeholder="Kode Art (e.g. EQ-01)"
                              maxLength={40}
                              value={item.articleCode}
                              onChange={(e) => {
                                markDirty();
                                setItems(
                                  items.map((i) => (i.id === item.id ? { ...i, articleCode: e.target.value } : i))
                                );
                              }}
                              className="w-full rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-[11px] font-mono bg-white dark:bg-gray-800"
                            />
                            <input
                              type="text"
                              placeholder="Deskripsi Artikel"
                              maxLength={100}
                              value={item.articleName}
                              onChange={(e) => {
                                markDirty();
                                setItems(
                                  items.map((i) => (i.id === item.id ? { ...i, articleName: e.target.value } : i))
                                );
                              }}
                              className="w-full rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-800"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              min="0"
                              placeholder="Rp 0"
                              value={item.unitPrice || ""}
                              onChange={(e) => {
                                markDirty();
                                setItems(
                                  items.map((i) =>
                                    i.id === item.id ? { ...i, unitPrice: Math.max(0, parseInt(e.target.value, 10) || 0) } : i
                                  )
                                );
                              }}
                              className="w-full rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs bg-white dark:bg-gray-800"
                            />
                          </td>
                          {displayedSizes.map((size) => {
                            const val = item.sizes[size] || "";
                            return (
                              <td key={size} className="p-1">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  placeholder="-"
                                  aria-label={`Ukuran ${size} untuk ${item.articleName || item.articleCode}`}
                                  value={val}
                                  onChange={(e) => handleSizeChange(item.id, size, e.target.value)}
                                  className={`w-full text-center rounded border px-1 py-1 text-xs font-mono font-bold transition ${
                                    val && Number(val) > 0
                                      ? "bg-red-50 dark:bg-red-950/60 border-[#8B0000] text-[#8B0000] dark:text-red-300"
                                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800"
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
                              disabled={items.length <= 1}
                              aria-label={isId ? "Hapus baris artikel" : "Remove item row"}
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
              </div>
            )}

            {/* Live Summary Bar */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40">
              <span className="text-xs font-semibold text-red-900 dark:text-red-200">
                {isId ? "Total Pasang Siap Kirim:" : "Total Pairs to Ship:"}
              </span>
              <div className="text-right">
                <span className="text-sm font-extrabold text-[#8B0000] dark:text-red-400">
                  {grandTotalPairs.toLocaleString("id-ID")} pasang
                </span>
                {grandTotalAmount > 0 && (
                  <span className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Est. Nilai: {formatIDR(grandTotalAmount)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleRequestClose}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition"
            >
              {isId ? "Batal" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#8B0000] hover:bg-[#A00000] text-xs font-bold text-white shadow-md active:scale-95 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>
                {loading
                  ? isId
                    ? "Menyimpan..."
                    : "Saving..."
                  : isId
                  ? "Simpan Surat Jalan"
                  : "Save Order"}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Discard Unsaved Changes Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-5 max-w-sm w-full space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                  {isId ? "Buang Perubahan?" : "Discard Changes?"}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {isId
                    ? "Anda memiliki data yang belum disimpan. Yakin ingin menutup formulir ini?"
                    : "You have unsaved form changes. Are you sure you want to discard them?"}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                {isId ? "Tetap Edit" : "Keep Editing"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  resetForm();
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
              >
                {isId ? "Ya, Buang" : "Discard"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
