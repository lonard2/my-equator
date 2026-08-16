"use client";

import React, { useState, useEffect } from "react";
import { MaterialItem, MaterialCategory } from "@/types";
import { X, Save, Boxes, AlertTriangle } from "lucide-react";
import { formatIDR } from "@/lib/utils/formatters";

interface MaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  materialToEdit?: MaterialItem | null;
  language: "id" | "en";
}

const CATEGORIES: Array<{ id: MaterialCategory; labelId: string; labelEn: string }> = [
  { id: "EVA_SHEET", labelId: "Lembaran EVA Foam", labelEn: "EVA Foam Sheet" },
  { id: "LATEX", labelId: "Latex Cushion Roll", labelEn: "Latex Cushion Roll" },
  { id: "PU_CHEMICAL", labelId: "Bahan Kimia PU", labelEn: "PU Chemical" },
  { id: "TPU_SHANK", labelId: "Shank & Torsion Bar TPU", labelEn: "TPU Shank" },
  { id: "FABRIC", labelId: "Kain / Mesh Laminasi", labelEn: "Fabric & Mesh" },
  { id: "CUTTING_DIE", labelId: "Pisau Pond / Cutting Die", labelEn: "Cutting Die" },
];

const UNITS = ["Lembar", "Roll", "Drum", "Pcs", "Meter", "Set", "Kg"];

export function MaterialFormModal({
  isOpen,
  onClose,
  onSuccess,
  materialToEdit,
  language,
}: MaterialFormModalProps) {
  const isId = language === "id";
  const isEditing = !!materialToEdit;

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MaterialCategory>("EVA_SHEET");
  const [unit, setUnit] = useState("Lembar");
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [safetyThreshold, setSafetyThreshold] = useState<number>(20);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (materialToEdit) {
      setSku(materialToEdit.sku);
      setName(materialToEdit.name);
      setCategory(materialToEdit.category);
      setUnit(materialToEdit.unit);
      setCurrentStock(materialToEdit.currentStock);
      setSafetyThreshold(materialToEdit.safetyThreshold);
      setUnitCost(materialToEdit.unitCost);
      setLocation(materialToEdit.location || "");
      setNotes(materialToEdit.notes || "");
    } else {
      setSku(`RAW-EVA-${Date.now().toString().slice(-4)}`);
      setName("");
      setCategory("EVA_SHEET");
      setUnit("Lembar");
      setCurrentStock(0);
      setSafetyThreshold(20);
      setUnitCost(50000);
      setLocation("Gudang A - Rak 01");
      setNotes("");
    }
  }, [materialToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      alert(isId ? "Mohon isi Nama Bahan dan SKU." : "Please fill in material name and SKU.");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (isEditing && materialToEdit) {
        res = await fetch(`/api/inventory/materials/${materialToEdit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            category,
            unit,
            safetyThreshold,
            unitCost,
            location,
            notes,
          }),
        });
      } else {
        res = await fetch("/api/inventory/materials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku,
            name,
            category,
            unit,
            currentStock,
            safetyThreshold,
            unitCost,
            location,
            notes,
          }),
        });
      }

      if (!res.ok) throw new Error("Failed to save material");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert(isId ? "Gagal menyimpan data bahan baku." : "Failed to save material SKU.");
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
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                {isEditing
                  ? isId
                    ? "Edit Data Bahan Baku"
                    : "Edit Raw Material SKU"
                  : isId
                  ? "Tambah Bahan Baku Baru"
                  : "Register New Material SKU"}
              </h3>
              <p className="text-[11px] text-gray-500">
                {isId ? "Master data inventaris & parameter safety stock" : "Inventory master catalog"}
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-gray-700 dark:text-gray-300">
                {isId ? "Kode SKU Bahan *" : "Material SKU *"}
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="e.g. RAW-EVA-3MM-BLK"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 font-mono font-bold text-xs uppercase disabled:opacity-60"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 dark:text-gray-300">
                {isId ? "Kategori Bahan *" : "Category *"}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs font-semibold"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isId ? c.labelId : c.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-700 dark:text-gray-300">
              {isId ? "Nama Lengkap Bahan Baku *" : "Material Description *"}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. EVA Foam Sheet 3mm Shore C 65 (Black High Rebound)"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs font-semibold"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-gray-700 dark:text-gray-300">
                {isId ? "Satuan Unit" : "Unit"}
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {!isEditing && (
              <div className="space-y-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">
                  {isId ? "Stok Awal" : "Initial Stock"}
                </label>
                <input
                  type="number"
                  min="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs font-bold font-mono"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="font-bold text-amber-700 dark:text-amber-400">
                {isId ? "Batas Safety Stock" : "Safety Alert Level"}
              </label>
              <input
                type="number"
                min="1"
                value={safetyThreshold}
                onChange={(e) => setSafetyThreshold(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30 p-2 text-xs font-bold font-mono text-amber-900 dark:text-amber-300"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 dark:text-gray-300">
                {isId ? "Harga Beli Satuan (IDR)" : "Unit Cost (IDR)"}
              </label>
              <input
                type="number"
                min="0"
                value={unitCost || ""}
                onChange={(e) => setUnitCost(parseInt(e.target.value, 10) || 0)}
                placeholder="Rp 0"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-700 dark:text-gray-300">
              {isId ? "Lokasi Rak Gudang" : "Warehouse Location"}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Gudang Utama - Rak A02 / Pallet 04"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-700 dark:text-gray-300">
              {isId ? "Catatan / Spesifikasi Teknis" : "Technical Specs & Notes"}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Supplier: PT Indo Foam Perkasa. Density 65 Shore C."
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
              <Save className="h-4 w-4" />
              <span>{loading ? (isId ? "Menyimpan..." : "Saving...") : isId ? "Simpan Bahan" : "Save Material"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
