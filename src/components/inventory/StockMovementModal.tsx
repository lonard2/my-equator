"use client";

import React, { useState, useEffect } from "react";
import { MaterialItem, MovementType } from "@/types";
import { X, ArrowDownRight, ArrowUpRight, AlertCircle, CheckCircle2, User, FileText } from "lucide-react";

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  materials: MaterialItem[];
  preselectedMaterialId?: string | null;
  language: "id" | "en";
}

const MOVEMENT_TYPES: Array<{
  id: MovementType;
  labelId: string;
  labelEn: string;
  direction: "IN" | "OUT" | "SET";
  badgeColor: string;
}> = [
  {
    id: "IN_PURCHASE",
    labelId: "Barang Masuk (Pembelian Supplier)",
    labelEn: "Stock IN (Supplier Purchase)",
    direction: "IN",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    id: "OUT_PRODUCTION",
    labelId: "Barang Keluar (Produksi & Cutting)",
    labelEn: "Stock OUT (Production / Cutting)",
    direction: "OUT",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    id: "IN_RETURN",
    labelId: "Retur Masuk (Sisa Produksi)",
    labelEn: "Stock IN (Production Return)",
    direction: "IN",
    badgeColor: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  },
  {
    id: "OUT_WASTAGE",
    labelId: "Barang Rusak / Afkir / Scrap",
    labelEn: "Stock OUT (Wastage / Scrap)",
    direction: "OUT",
    badgeColor: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  },
  {
    id: "ADJUSTMENT",
    labelId: "Penyesuaian Fisik (Stock Opname)",
    labelEn: "Stock Opname Adjustment",
    direction: "SET",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
];

export function StockMovementModal({
  isOpen,
  onClose,
  onSuccess,
  materials,
  preselectedMaterialId,
  language,
}: StockMovementModalProps) {
  const isId = language === "id";

  const [materialId, setMaterialId] = useState<string>("");
  const [movementType, setMovementType] = useState<MovementType>("IN_PURCHASE");
  const [quantity, setQuantity] = useState<number>(10);
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [operatorName, setOperatorName] = useState<string>("Staff Gudang");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (preselectedMaterialId) {
      setMaterialId(preselectedMaterialId);
    } else if (materials.length > 0 && !materialId) {
      setMaterialId(materials[0].id);
    }
  }, [preselectedMaterialId, materials, isOpen]);

  if (!isOpen) return null;

  const selectedMaterial = materials.find((m) => m.id === materialId);
  const currentStock = selectedMaterial ? selectedMaterial.currentStock : 0;
  const unit = selectedMaterial ? selectedMaterial.unit : "";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialId || quantity <= 0 || !operatorName.trim()) {
      alert(isId ? "Mohon lengkapi bahan, jumlah, dan nama operator." : "Please fill in material, qty, and operator.");
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
          quantity,
          referenceNumber,
          operatorName,
          notes,
        }),
      });

      if (!res.ok) throw new Error("Failed to record stock movement");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert(isId ? "Gagal mencatat mutasi stok." : "Failed to record stock movement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white dark:bg-gray-800 text-[#8B0000] dark:text-red-400 shadow-xs">
              {currentMovementConfig?.direction === "IN" ? (
                <ArrowDownRight className="h-5 w-5 text-emerald-600" />
              ) : currentMovementConfig?.direction === "OUT" ? (
                <ArrowUpRight className="h-5 w-5 text-blue-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                {isId ? "Catat Mutasi Stok Bahan (IN / OUT)" : "Record Stock Movement"}
              </h3>
              <p className="text-[11px] text-gray-500">
                {isId ? "Pencatatan saldo fisik dan jejak audit inventaris" : "Audit trail entry"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 active:scale-95 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Material Picker */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 dark:text-gray-300">
              {isId ? "Pilih Bahan Baku *" : "Select Material *"}
            </label>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.sku}] {m.name} (Stok: {m.currentStock} {m.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Movement Type */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 dark:text-gray-300">
              {isId ? "Jenis Mutasi Stok *" : "Movement Type *"}
            </label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as MovementType)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold"
            >
              {MOVEMENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {isId ? t.labelId : t.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Live Balance Calculator */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-gray-700 dark:text-gray-300">
                {isId
                  ? movementType === "ADJUSTMENT"
                    ? "Jumlah Stok Aktual Baru *"
                    : "Jumlah Pasokan / Pengambilan *"
                  : "Quantity *"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity || ""}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-sm font-bold font-mono text-[#8B0000] dark:text-red-400"
                />
                <span className="absolute right-3 top-3 text-[11px] font-semibold text-gray-400">
                  {unit}
                </span>
              </div>
            </div>

            {/* Projected Stock Preview Card */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-2.5 flex flex-col justify-center">
              <span className="text-[10px] text-gray-500 font-semibold uppercase">
                {isId ? "Proyeksi Stok Setelahnya" : "Projected Balance"}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono font-extrabold text-sm text-gray-900 dark:text-white">
                  {currentStock}
                </span>
                <span className="text-gray-400 text-xs">➔</span>
                <span
                  className={`font-mono font-extrabold text-base ${
                    projectedStock < (selectedMaterial?.safetyThreshold || 10)
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {projectedStock} {unit}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-gray-700 dark:text-gray-300">
                {isId ? "No. Referensi (PO / SPK)" : "Reference (PO / SPK)"}
              </label>
              <input
                type="text"
                placeholder="e.g. PO-SUP-882 / SPK-CUT-04"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 dark:text-gray-300">
                {isId ? "Nama Operator Gudang *" : "Operator Name *"}
              </label>
              <input
                type="text"
                required
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="e.g. Agus (Gudang Bahan)"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-700 dark:text-gray-300">
              {isId ? "Catatan Mutasi" : "Notes"}
            </label>
            <input
              type="text"
              placeholder="e.g. Penerimaan batch PO Q3 dari PT Indo Foam"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 active:scale-95 transition"
            >
              {isId ? "Batal" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#8B0000] hover:bg-[#A00000] text-xs font-bold text-white shadow-md active:scale-95 transition disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{loading ? (isId ? "Menyimpan..." : "Saving...") : isId ? "Konfirmasi Mutasi" : "Commit Movement"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
