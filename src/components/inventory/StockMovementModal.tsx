"use client";

import React, { useState, useEffect, useRef } from "react";
import { MaterialItem, MovementType } from "@/types";
import { X, ArrowDownRight, AlertCircle, CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";
import { formatIDR } from "@/lib/utils/formatters";

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  materials: MaterialItem[];
  preselectedMaterialId?: string | null;
  initialMovementType?: MovementType;
  initialQuantity?: number;
  initialReferenceNumber?: string;
  initialNotes?: string;
  language: "id" | "en";
}

const MOVEMENT_TYPES: Array<{
  id: MovementType;
  labelId: string;
  labelEn: string;
  descriptionId: string;
  direction: "IN" | "OUT" | "SET";
  badgeColor: string;
}> = [
  {
    id: "IN_PURCHASE",
    labelId: "Barang Masuk (Pembelian Supplier)",
    labelEn: "Stock IN (Supplier Purchase)",
    descriptionId: "Penerimaan material baru dari supplier PO",
    direction: "IN",
    badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60",
  },
  {
    id: "OUT_PRODUCTION",
    labelId: "Barang Keluar (Produksi & Cutting)",
    labelEn: "Stock OUT (Production / Cutting)",
    descriptionId: "Pengambilan bahan untuk batch pemotongan insole",
    direction: "OUT",
    badgeColor: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900/60",
  },
  {
    id: "IN_RETURN",
    labelId: "Retur Masuk (Sisa Produksi)",
    labelEn: "Stock IN (Production Return)",
    descriptionId: "Pengembalian sisa lembaran/bahan dari lantai kerja",
    direction: "IN",
    badgeColor: "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-900/60",
  },
  {
    id: "OUT_WASTAGE",
    labelId: "Barang Rusak / Afkir / Scrap",
    labelEn: "Stock OUT (Wastage / Scrap)",
    descriptionId: "Penghapusan material rusak, cacat cetak, atau kadaluarsa",
    direction: "OUT",
    badgeColor: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-900/60",
  },
  {
    id: "ADJUSTMENT",
    labelId: "Penyesuaian Fisik (Stock Opname)",
    labelEn: "Stock Opname Adjustment",
    descriptionId: "Koreksi nilai absolut berdasarkan hitung fisik gudang",
    direction: "SET",
    badgeColor: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
  },
];

export function StockMovementModal({
  isOpen,
  onClose,
  onSuccess,
  materials,
  preselectedMaterialId,
  initialMovementType,
  initialQuantity,
  initialReferenceNumber,
  initialNotes,
  language,
}: StockMovementModalProps) {
  const isId = language === "id";

  const [materialId, setMaterialId] = useState<string>("");
  const [movementType, setMovementType] = useState<MovementType>("IN_PURCHASE");
  const [quantity, setQuantity] = useState<number>(10);
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [operatorName, setOperatorName] = useState<string>("Staff Gudang");
  const [notes, setNotes] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const initialFormRef = useRef<{
    materialId: string;
    movementType: MovementType;
    quantity: number;
    referenceNumber: string;
    notes: string;
  }>({
    materialId: "",
    movementType: "IN_PURCHASE",
    quantity: 10,
    referenceNumber: "",
    notes: "",
  });

  useEffect(() => {
    const selectedMat = preselectedMaterialId || (materials.length > 0 ? materials[0].id : "");
    const selectedType = initialMovementType || "IN_PURCHASE";
    const selectedQty = initialQuantity !== undefined ? initialQuantity : 10;
    const selectedRef = initialReferenceNumber || "";
    const selectedNotes = initialNotes || "";

    setMaterialId(selectedMat);
    setMovementType(selectedType);
    setQuantity(selectedQty);
    setReferenceNumber(selectedRef);
    setNotes(selectedNotes);
    setValidationError(null);
    setShowDiscardConfirm(false);

    initialFormRef.current = {
      materialId: selectedMat,
      movementType: selectedType,
      quantity: selectedQty,
      referenceNumber: selectedRef,
      notes: selectedNotes,
    };
  }, [preselectedMaterialId, initialMovementType, initialQuantity, initialReferenceNumber, initialNotes, materials, isOpen]);

  // Check if form has unsaved modifications
  const isDirty =
    materialId !== initialFormRef.current.materialId ||
    movementType !== initialFormRef.current.movementType ||
    quantity !== initialFormRef.current.quantity ||
    referenceNumber !== initialFormRef.current.referenceNumber ||
    notes !== initialFormRef.current.notes;

  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false);
        } else {
          handleRequestClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDirty, showDiscardConfirm]);

  if (!isOpen) return null;

  const selectedMaterial = materials.find((m) => m.id === materialId);
  const currentStock = selectedMaterial ? selectedMaterial.currentStock : 0;
  const unit = selectedMaterial ? selectedMaterial.unit : "";
  const unitCost = selectedMaterial ? selectedMaterial.unitCost : 0;

  // Projected stock preview
  let projectedStock = currentStock;
  const currentMovementConfig = MOVEMENT_TYPES.find((m) => m.id === movementType);
  if (currentMovementConfig?.direction === "IN") {
    projectedStock = currentStock + (quantity || 0);
  } else if (currentMovementConfig?.direction === "OUT") {
    projectedStock = Math.max(0, currentStock - (quantity || 0));
  } else if (currentMovementConfig?.direction === "SET") {
    projectedStock = quantity || 0;
  }

  const isOutOfStockWarning = currentMovementConfig?.direction === "OUT" && (quantity || 0) > currentStock;

  const handleStepQuantity = (delta: number) => {
    setQuantity((prev) => Math.min(1000000, Math.max(1, (prev || 0) + delta)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setValidationError(null);

    if (!materialId) {
      setValidationError(isId ? "Pilih bahan baku terlebih dahulu." : "Please select a material.");
      return;
    }

    if (!quantity || quantity <= 0) {
      setValidationError(isId ? "Jumlah mutasi harus lebih dari 0." : "Quantity must be greater than 0.");
      return;
    }

    if (!operatorName.trim()) {
      setValidationError(isId ? "Nama operator gudang wajib diisi." : "Operator name is required.");
      return;
    }

    if (currentMovementConfig?.direction === "OUT" && quantity > currentStock) {
      setValidationError(
        isId
          ? `Stok tidak mencukupi. Stok saat ini ${currentStock.toLocaleString("id-ID")} ${unit}, jumlah keluar ${quantity.toLocaleString("id-ID")} ${unit}.`
          : `Insufficient stock. Current stock is ${currentStock.toLocaleString()} ${unit}, requested OUT is ${quantity.toLocaleString()} ${unit}.`
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          type: movementType,
          quantity: Math.floor(quantity),
          referenceNumber: referenceNumber.trim() || undefined,
          operatorName: operatorName.trim(),
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        onSuccess();
        onClose();
      } else {
        setValidationError(json.error || (isId ? "Gagal mencatat mutasi stok." : "Failed to record movement."));
      }
    } catch (err) {
      console.error("Failed to record stock movement:", err);
      setValidationError(isId ? "Terjadi kesalahan jaringan saat menyimpan mutasi." : "Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="movement-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
              <ArrowDownRight className="h-5 w-5" />
            </div>
            <div>
              <h3 id="movement-modal-title" className="font-extrabold text-base text-gray-900 dark:text-white">
                {isId ? "Catat Mutasi Stok Gudang" : "Record Stock Movement"}
              </h3>
              <p className="text-[11px] text-gray-500">
                {isId ? "Penerimaan PO, pengeluaran produksi & penyesuaian opname" : "Log material IN / OUT / opname adjustments"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Close Movement Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {validationError && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 flex items-center gap-2 text-red-700 dark:text-red-300 font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Material SKU Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400 block">
              {isId ? "Pilih Bahan Baku" : "Select Material SKU"} <span className="text-red-500">*</span>
            </label>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#8B0000] disabled:opacity-60"
              required
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.sku}] {m.name} (Stok: {m.currentStock.toLocaleString("id-ID")} {m.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Movement Type Radio Grid */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-gray-400 block">
              {isId ? "Jenis Mutasi Stok" : "Movement Type"} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {MOVEMENT_TYPES.map((t) => {
                const isSelected = movementType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={loading}
                    onClick={() => setMovementType(t.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? "border-[#8B0000] bg-red-50/70 dark:bg-red-950/40 text-[#8B0000] dark:text-red-300 font-bold shadow-xs"
                        : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                    } disabled:opacity-60`}
                  >
                    <div>
                      <p className="text-[11px] leading-tight">{isId ? t.labelId : t.labelEn}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{t.descriptionId}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      t.direction === "IN" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
                      t.direction === "OUT" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}>
                      {t.direction}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Input with Quick Stepper Chips */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-gray-400 block">
              {movementType === "ADJUSTMENT"
                ? isId ? "Jumlah Stok Fisik Aktual (Opname)" : "Adjusted Stock Count"
                : isId ? "Jumlah Mutasi" : "Quantity"}{" "}
              ({unit}) <span className="text-red-500">*</span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={1000000}
                value={quantity}
                disabled={loading}
                onChange={(e) => setQuantity(Math.min(1000000, Math.max(1, parseInt(e.target.value, 10) || 0)))}
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 font-mono font-extrabold text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#8B0000] tabular-nums disabled:opacity-60"
                required
              />
              <div className="flex gap-1">
                {[5, 10, 50, 100].map((step) => (
                  <button
                    key={step}
                    type="button"
                    disabled={loading}
                    onClick={() => handleStepQuantity(step)}
                    className="px-2.5 py-2 min-h-[38px] rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] font-mono font-bold text-gray-700 dark:text-gray-300 transition-all active:scale-90 active:bg-gray-300 dark:active:bg-gray-600 disabled:opacity-50"
                  >
                    +{step}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Stock Projection & Value Indicator */}
          <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
            isOutOfStockWarning
              ? "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/60"
              : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-800"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">
                  {isId ? "Stok Sebelum Mutasi" : "Current Stock"}
                </span>
                <span className="font-mono font-black text-sm text-gray-900 dark:text-white tabular-nums">
                  {currentStock.toLocaleString("id-ID")} {unit}
                </span>
              </div>

              <div className="text-center">
                <span className="text-gray-400 font-black">➔</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">
                  {isId ? "Estimasi Stok Akhir" : "Projected Stock"}
                </span>
                <span className={`font-mono font-black text-base tabular-nums ${
                  isOutOfStockWarning ? "text-red-600" : "text-emerald-700 dark:text-emerald-400"
                }`}>
                  {projectedStock.toLocaleString("id-ID")} {unit}
                </span>
              </div>
            </div>

            {selectedMaterial && (
              <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-between pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                <span>{isId ? "Perkiraan Nilai Transaksi:" : "Estimated Transaction Value:"}</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200 tabular-nums">
                  {formatIDR(unitCost * (quantity || 0))} <span className="font-normal text-gray-500">(@ {formatIDR(unitCost)}/{unit})</span>
                </span>
              </div>
            )}
          </div>

          {/* Reference & Operator Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">
                {isId ? "No. Referensi (PO / SPK / Koreksi)" : "Reference No (PO/WO/Offset)"}
              </label>
              <input
                type="text"
                value={referenceNumber}
                disabled={loading}
                onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                placeholder="e.g. PO/EQ/2026/08/042"
                maxLength={40}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 font-mono text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#8B0000] disabled:opacity-60 uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">
                {isId ? "Nama Operator / PIC" : "Operator Name"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={operatorName}
                disabled={loading}
                onChange={(e) => setOperatorName(e.target.value)}
                maxLength={50}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#8B0000] disabled:opacity-60"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400 block">
              {isId ? "Catatan Mutasi" : "Notes"}
            </label>
            <input
              type="text"
              value={notes}
              disabled={loading}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isId ? "Keterangan batch produksi, surat jalan masuk, koreksi dll" : "Production batch info, incoming DO, offset info"}
              maxLength={200}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#8B0000] disabled:opacity-60"
            />
          </div>

          {/* Actions Footer */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleRequestClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
            >
              {isId ? "Batal" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading || isOutOfStockWarning}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95 transition disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{loading ? (isId ? "Menyimpan..." : "Saving...") : isId ? "Simpan Mutasi" : "Save Movement"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Discard Changes In-App Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 rounded-2xl bg-amber-100 dark:bg-amber-950/70">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-gray-900 dark:text-white">
                  {isId ? "Batalkan Pengisian?" : "Discard Changes?"}
                </h4>
                <p className="text-xs text-gray-500">
                  {isId ? "Perubahan mutasi belum disimpan" : "Unsaved movement changes"}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300">
              {isId
                ? "Anda telah mengubah data formulir mutasi. Jika Anda menutup modal sekarang, data yang telah diisi akan hilang."
                : "You have unsaved changes in the movement form. Closing now will discard your input."}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100"
              >
                {isId ? "Lanjutkan Mengisi" : "Keep Editing"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs active:scale-95 transition"
              >
                {isId ? "Tutup & Buang" : "Discard"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
