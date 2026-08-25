"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MaterialItem, MaterialCategory } from "@/types";
import { X, Save, Boxes, AlertTriangle, Sparkles, Layers } from "lucide-react";
import { formatIDR } from "@/lib/utils/formatters";

interface MaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  materialToEdit?: MaterialItem | null;
  language: "id" | "en";
}

const CATEGORIES: Array<{ id: MaterialCategory; labelId: string; labelEn: string }> = [
  { id: "EVA_SHEET", labelId: "Lembaran EVA Foam Sheet", labelEn: "EVA Foam Sheet" },
  { id: "LATEX", labelId: "Latex Cushion Roll", labelEn: "Latex Cushion Roll" },
  { id: "PU_CHEMICAL", labelId: "Bahan Kimia Cair PU (Polyol/Iso)", labelEn: "PU Chemical" },
  { id: "TPU_SHANK", labelId: "Shank & Torsion Bar TPU", labelEn: "TPU Shank" },
  { id: "FABRIC", labelId: "Kain / Mesh Laminasi Insole", labelEn: "Fabric & Mesh" },
  { id: "CUTTING_DIE", labelId: "Pisau Pond / Cutting Die Set", labelEn: "Cutting Die Set" },
];

const UNITS = ["Lembar", "Roll", "Drum", "Pcs", "Meter", "Set", "Kg"];

const THICKNESS_PRESETS = ["2mm", "3mm", "4mm", "5mm", "8mm", "10mm", "20mm"];
const HARDNESS_PRESETS = [
  { code: "SOFT_30", label: "Soft 25-30° Shore C (Comfort / Casual)" },
  { code: "MED_40", label: "Medium 35-40° Shore C (Running / Sport)" },
  { code: "HARD_55", label: "Hard 50-55° Shore C (Orthotic / Rigid)" },
];

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

  const [thickness, setThickness] = useState("4mm");
  const [hardness, setHardness] = useState("MED_40");

  const [validationError, setValidationError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
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
      setUnitCost(45000);
      setLocation("Gudang A - Rak 01");
      setNotes("EVA Sheet 1.2m x 2.4m");
    }
    setValidationError(null);
    setShowDiscardConfirm(false);
  }, [materialToEdit, isOpen]);

  const isDirty = useMemo(() => {
    if (!materialToEdit) {
      return name.trim().length > 0 || currentStock > 0;
    }
    return (
      name !== materialToEdit.name ||
      category !== materialToEdit.category ||
      unit !== materialToEdit.unit ||
      safetyThreshold !== materialToEdit.safetyThreshold ||
      unitCost !== materialToEdit.unitCost ||
      (location || "") !== (materialToEdit.location || "") ||
      (notes || "") !== (materialToEdit.notes || "")
    );
  }, [name, category, unit, safetyThreshold, unitCost, location, notes, currentStock, materialToEdit]);

  if (!isOpen) return null;

  const handleAttemptClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleApplyPresetName = (presetName: string, defaultUnit: string, defaultUnitCost: number) => {
    setName(presetName);
    setUnit(defaultUnit);
    setUnitCost(defaultUnitCost);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim() || !sku.trim()) {
      setValidationError(isId ? "Nama bahan baku dan SKU wajib diisi." : "Material name and SKU are required.");
      return;
    }

    if (safetyThreshold < 0 || unitCost < 0) {
      setValidationError(isId ? "Batas safety stock dan harga tidak boleh negatif." : "Threshold and unit cost cannot be negative.");
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
            name: name.trim(),
            category,
            unit,
            safetyThreshold,
            unitCost,
            location: location.trim() || undefined,
            notes: notes.trim() || undefined,
          }),
        });
      } else {
        res = await fetch("/api/inventory/materials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku: sku.trim().toUpperCase(),
            name: name.trim(),
            category,
            unit,
            currentStock,
            safetyThreshold,
            unitCost,
            location: location.trim() || undefined,
            notes: notes.trim() || undefined,
          }),
        });
      }

      const json = await res.json();
      if (json.success) {
        onSuccess();
        onClose();
      } else {
        setValidationError(json.error || (isId ? "Gagal menyimpan SKU bahan." : "Failed to save material."));
      }
    } catch (err) {
      console.error("Failed to save material:", err);
      setValidationError(isId ? "Terjadi kesalahan jaringan." : "Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-red-100 dark:bg-red-950/70 text-[#8B0000] dark:text-red-400">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                {isEditing
                  ? isId ? "Edit Parameter Bahan Baku" : "Edit Material SKU"
                  : isId ? "Tambah SKU Bahan Baku Baru" : "Add New Material SKU"}
              </h3>
              <p className="text-[11px] text-gray-500">
                {isId ? "Katalog material insole pabrik Equator" : "Equator factory insole material catalog"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAttemptClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {validationError && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 flex items-center gap-2 text-red-700 dark:text-red-300 font-bold">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Quick Factory Insole Presets (When creating new item) */}
          {!isEditing && (
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>{isId ? "Template Cepat Bahan Insole:" : "Quick Material Presets:"}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: "EVA 4mm High-Density 40° Hitam (1.2x2.4m)", cat: "EVA_SHEET" as MaterialCategory, unit: "Lembar", cost: 48000 },
                  { name: "EVA 8mm Rigid Orthotic 55° Abu-abu (1.2x2.4m)", cat: "EVA_SHEET" as MaterialCategory, unit: "Lembar", cost: 85000 },
                  { name: "Natural Latex 3mm High-Rebound Roll (50m)", cat: "LATEX" as MaterialCategory, unit: "Roll", cost: 650000 },
                  { name: "Kain BK Mesh Anti-Bakteri Hitam (Roll 50m)", cat: "FABRIC" as MaterialCategory, unit: "Meter", cost: 28000 },
                  { name: "Plat TPU Arch Shank Support 75mm", cat: "TPU_SHANK" as MaterialCategory, unit: "Pcs", cost: 1800 },
                ].map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCategory(p.cat);
                      handleApplyPresetName(p.name, p.unit, p.cost);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-semibold text-gray-700 dark:text-gray-300 hover:border-[#8B0000] hover:text-[#8B0000] transition"
                  >
                    {p.name.split(" ")[0]} {p.name.split(" ")[1]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SKU and Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">
                {isId ? "Kode SKU Bahan" : "Material SKU Code"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                disabled={isEditing}
                maxLength={40}
                className={`w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 font-mono font-bold text-xs uppercase focus:outline-none focus:border-[#8B0000] ${
                  isEditing ? "bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                }`}
                placeholder="e.g. RAW-EVA-4MM-BLK"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">
                {isId ? "Kategori Material" : "Category"} <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 font-semibold text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#8B0000]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isId ? c.labelId : c.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Material Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400 block">
              {isId ? "Nama Lengkap Bahan Baku" : "Full Material Name"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              placeholder={isId ? "e.g. EVA Foam 4mm High-Density 40° Hitam (1.2m x 2.4m)" : "e.g. EVA Foam Sheet 4mm Black"}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 font-semibold text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#8B0000]"
              required
            />
          </div>

          {/* Stock, Unit & Safety Threshold Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {!isEditing && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 block">
                  {isId ? "Stok Awal" : "Initial Stock"}
                </label>
                <input
                  type="number"
                  min={0}
                  max={999999}
                  value={currentStock}
                  onChange={(e) => setCurrentStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 font-mono font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#8B0000] tabular-nums"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">
                {isId ? "Satuan Unit" : "Unit of Measure"} <span className="text-red-500">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 font-semibold text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#8B0000]"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">
                {isId ? "Batas Safety Stock" : "Safety Threshold"} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                max={999999}
                value={safetyThreshold}
                onChange={(e) => setSafetyThreshold(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 font-mono font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#8B0000] tabular-nums"
                required
              />
            </div>
          </div>

          {/* Unit Cost and Warehouse Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">
                {isId ? "Harga Beli per Satuan (IDR)" : "Unit Cost (IDR)"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={unitCost}
                  onChange={(e) => setUnitCost(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 font-mono font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#8B0000] tabular-nums"
                  required
                />
                <span className="absolute right-3 top-2 text-[10px] text-gray-400 font-mono pointer-events-none">
                  {formatIDR(unitCost)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">
                {isId ? "Lokasi Rak / Gudang" : "Warehouse Location"}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Gudang Utama - Rak EVA B-03"
                maxLength={60}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#8B0000]"
              />
            </div>
          </div>

          {/* Notes / Technical Specs */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400 block">
              {isId ? "Spesifikasi / Catatan Tambahan" : "Technical Notes"}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={250}
              placeholder={isId ? "Spesifikasi density, supplier PO, dimensi lembaran..." : "Density specs, supplier, sheet dimensions..."}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#8B0000]"
            />
          </div>

          {/* Actions Footer */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {isId ? "Batal" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B0000] hover:bg-[#A00000] text-white text-xs font-bold shadow-xs active:scale-95 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? (isId ? "Menyimpan..." : "Saving...") : isId ? "Simpan SKU" : "Save SKU"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Discard Confirmation Dialog */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-3">
            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
              {isId ? "Tutup tanpa menyimpan?" : "Discard unsaved changes?"}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {isId
                ? "Perubahan data bahan baku yang telah Anda ketik akan hilang."
                : "Any changes you entered will be lost."}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300"
              >
                {isId ? "Lanjut Mengisi" : "Keep Editing"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs"
              >
                {isId ? "Buang Perubahan" : "Discard"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
