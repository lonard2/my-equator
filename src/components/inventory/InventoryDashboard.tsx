"use client";

import React, { useState, useEffect } from "react";
import { MaterialItem, MaterialCategory, StockMovement, StockHealthStatus } from "@/types";
import { formatIDR, formatIndonesianDate } from "@/lib/utils/formatters";
import { MaterialFormModal } from "./MaterialFormModal";
import { StockMovementModal } from "./StockMovementModal";
import {
  Boxes,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Search,
  History,
  Package,
  Layers,
  Edit2,
  Trash2,
  MapPin,
  DollarSign,
} from "lucide-react";

interface InventoryDashboardProps {
  language: "id" | "en";
}

const CATEGORY_NAMES: Record<MaterialCategory, { id: string; en: string }> = {
  EVA_SHEET: { id: "EVA Foam", en: "EVA Foam" },
  LATEX: { id: "Latex Roll", en: "Latex Roll" },
  PU_CHEMICAL: { id: "Kimia PU", en: "PU Chemical" },
  TPU_SHANK: { id: "TPU Shank", en: "TPU Shank" },
  FABRIC: { id: "Kain / Mesh", en: "Fabric & Mesh" },
  CUTTING_DIE: { id: "Pisau Pond", en: "Cutting Die" },
};

export function InventoryDashboard({ language }: InventoryDashboardProps) {
  const isId = language === "id";
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view tab: "MATERIALS" | "HISTORY"
  const [activeTab, setActiveTab] = useState<"MATERIALS" | "HISTORY">("MATERIALS");

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Modals state
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<MaterialItem | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedMaterialForMovement, setSelectedMaterialForMovement] = useState<string | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [matRes, movRes] = await Promise.all([
        fetch("/api/inventory/materials"),
        fetch("/api/inventory/movements"),
      ]);
      const matJson = await matRes.json();
      const movJson = await movRes.json();

      if (matJson.success) setMaterials(matJson.data);
      if (movJson.success) setMovements(movJson.data);
    } catch (err) {
      console.error("Failed to load inventory data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm(isId ? "Yakin ingin menghapus SKU bahan ini?" : "Delete this material SKU?")) return;
    try {
      const res = await fetch(`/api/inventory/materials/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchInventory();
      }
    } catch (err) {
      console.error("Failed to delete material:", err);
    }
  };

  const handleOpenMovement = (matId?: string) => {
    setSelectedMaterialForMovement(matId || null);
    setIsMovementModalOpen(true);
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.location && m.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === "ALL" || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate KPIs
  const totalValuation = materials.reduce((sum, m) => sum + m.currentStock * m.unitCost, 0);
  const criticalItems = materials.filter((m) => m.healthStatus === "CRITICAL");
  const warningItems = materials.filter((m) => m.healthStatus === "WARNING");
  const lowStockTotal = criticalItems.length + warningItems.length;

  const getHealthBadge = (health: StockHealthStatus = "HEALTHY") => {
    switch (health) {
      case "CRITICAL":
        return {
          label: isId ? "Kritis" : "Critical",
          className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200",
        };
      case "WARNING":
        return {
          label: isId ? "Perlu Reorder" : "Low Stock",
          className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200",
        };
      case "HEALTHY":
      default:
        return {
          label: isId ? "Aman" : "Healthy",
          className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200",
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 p-3 sm:p-6 space-y-4 sm:space-y-6 pb-24 md:pb-8">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-red-100 dark:bg-red-950 text-[#8B0000] dark:text-red-400">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">
              {isId ? "Inventori Bahan Baku & Mutasi Stok" : "Raw Materials & Stock Inventory"}
            </h2>
            <p className="text-[11px] text-gray-500">
              {isId
                ? "Manajemen stok EVA, latex, PU, TPU shank, kain & pisau pond insole"
                : "Tracking of EVA foam sheets, latex, PU, TPU shanks, fabrics & cutting dies"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenMovement()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95 transition"
          >
            <ArrowDownRight className="h-4 w-4" />
            <span>{isId ? "Catat Mutasi" : "Stock IN/OUT"}</span>
          </button>

          <button
            onClick={() => {
              setMaterialToEdit(null);
              setIsMaterialModalOpen(true);
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#8B0000] hover:bg-[#A00000] text-white text-xs font-bold shadow-xs active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>{isId ? "Tambah SKU" : "Add SKU"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            {isId ? "Total Item SKU" : "Total SKUs"}
          </span>
          <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white font-mono">
            {materials.length} <span className="text-xs font-normal text-gray-500">SKU</span>
          </p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            {isId ? "Valuasi Stok Gudang" : "Valuation"}
          </span>
          <p className="text-base sm:text-xl font-black text-[#8B0000] dark:text-red-400 font-mono truncate">
            {formatIDR(totalValuation)}
          </p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            {isId ? "Stok Kritis / Minim" : "Low Stock Alert"}
          </span>
          <p className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {lowStockTotal} <span className="text-xs font-normal text-gray-500">item</span>
          </p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            {isId ? "Total Mutasi Log" : "Total Movements"}
          </span>
          <p className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {movements.length} <span className="text-xs font-normal text-gray-500">log</span>
          </p>
        </div>
      </div>

      {/* Critical Stock Alert Banner */}
      {criticalItems.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <h4 className="font-bold text-xs text-red-900 dark:text-red-200">
                {isId ? "Peringatan Stok Kritis (Under Safety Stock)" : "Critical Stock Warning"}
              </h4>
              <p className="text-[11px] text-red-700 dark:text-red-300 mt-0.5">
                {criticalItems.length} {isId ? "bahan baku berada di bawah 50% safety stock:" : "materials below 50% safety stock:"}{" "}
                <strong>{criticalItems.map((c) => c.name).join(", ")}</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenMovement(criticalItems[0]?.id)}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-[#8B0000] text-white text-xs font-bold shadow-xs active:scale-95 transition"
          >
            <ArrowDownRight className="h-3.5 w-3.5" />
            <span>{isId ? "Restock Pembelian" : "Restock Purchase"}</span>
          </button>
        </div>
      )}

      {/* Workspace Card with Tabs & Search */}
      <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xs">
        {/* Tabs & Search Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60 dark:bg-gray-800/40">
          <div className="flex items-center rounded-2xl bg-gray-200/80 dark:bg-gray-800 p-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab("MATERIALS")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                activeTab === "MATERIALS"
                  ? "bg-white dark:bg-gray-900 text-[#8B0000] dark:text-red-400 shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>{isId ? "Daftar Stok Bahan" : "Material Stock"}</span>
            </button>
            <button
              onClick={() => setActiveTab("HISTORY")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                activeTab === "HISTORY"
                  ? "bg-white dark:bg-gray-900 text-[#8B0000] dark:text-red-400 shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>{isId ? "Log Mutasi (Audit)" : "Movement Logs"}</span>
            </button>
          </div>

          {activeTab === "MATERIALS" && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={isId ? "Cari SKU, Nama, Lokasi..." : "Search SKU, Name..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 pl-8 pr-3 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8B0000] focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Category Filter Pills */}
        {activeTab === "MATERIALS" && (
          <div className="p-2.5 sm:p-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setCategoryFilter("ALL")}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                categoryFilter === "ALL"
                  ? "bg-[#8B0000] text-white shadow-xs"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
              }`}
            >
              {isId ? "Semua" : "All"} ({materials.length})
            </button>
            {(Object.keys(CATEGORY_NAMES) as MaterialCategory[]).map((cat) => {
              const isSelected = categoryFilter === cat;
              const count = materials.filter((m) => m.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                    isSelected
                      ? "bg-[#8B0000] text-white shadow-xs"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {isId ? CATEGORY_NAMES[cat].id : CATEGORY_NAMES[cat].en} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 1: MATERIALS VIEW */}
        {activeTab === "MATERIALS" ? (
          <div>
            {/* MOBILE TOUCH CARD FEED (md:hidden) */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800 p-2 space-y-3">
              {filteredMaterials.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  {isId ? "Tidak ada bahan baku ditemukan." : "No materials found."}
                </div>
              ) : (
                filteredMaterials.map((m) => {
                  const badge = getHealthBadge(m.healthStatus);
                  const totalVal = m.currentStock * m.unitCost;

                  return (
                    <div
                      key={m.id}
                      className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-xs text-[#8B0000] dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-md">
                          {m.sku}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight">
                          {m.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                          <span className="px-2 py-0.2 rounded bg-gray-100 dark:bg-gray-800 font-semibold">
                            {isId ? CATEGORY_NAMES[m.category]?.id || m.category : m.category}
                          </span>
                          {m.location && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span>{m.location}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold uppercase block">
                            {isId ? "Stok Aktual" : "Stock"}
                          </span>
                          <span className="font-mono font-black text-base text-gray-900 dark:text-white">
                            {m.currentStock.toLocaleString("id-ID")}{" "}
                            <span className="text-xs font-normal text-gray-500">{m.unit}</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 font-bold uppercase block">
                            {isId ? "Total Valuasi" : "Valuation"}
                          </span>
                          <span className="font-mono font-bold text-xs text-[#8B0000] dark:text-red-400">
                            {formatIDR(totalVal)}
                          </span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <button
                          onClick={() => handleOpenMovement(m.id)}
                          className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition shadow-xs"
                        >
                          <ArrowDownRight className="h-3.5 w-3.5" />
                          <span>Mutasi</span>
                        </button>
                        <button
                          onClick={() => {
                            setMaterialToEdit(m);
                            setIsMaterialModalOpen(true);
                          }}
                          className="py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-1 active:scale-95 transition"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(m.id)}
                          className="py-2 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 text-xs font-bold text-red-600 dark:text-red-300 flex items-center justify-center gap-1 active:scale-95 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* DESKTOP/TABLET TABLE VIEW (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3 min-w-[200px]">{isId ? "SKU & Nama Bahan" : "SKU & Description"}</th>
                    <th className="p-3 w-28">{isId ? "Kategori" : "Category"}</th>
                    <th className="p-3 text-right w-28">{isId ? "Stok Aktual" : "Current Stock"}</th>
                    <th className="p-3 text-center w-36">{isId ? "Status Kesehatan" : "Stock Health"}</th>
                    <th className="p-3 text-right w-28">{isId ? "Harga Satuan" : "Unit Cost"}</th>
                    <th className="p-3 text-right w-32">{isId ? "Total Nilai" : "Total Valuation"}</th>
                    <th className="p-3 min-w-[140px]">{isId ? "Lokasi Gudang" : "Location"}</th>
                    <th className="p-3 text-center w-28">{isId ? "Aksi" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-400">
                        <Boxes className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                        <p>{isId ? "Tidak ada bahan baku ditemukan" : "No materials found"}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((m, idx) => {
                      const badge = getHealthBadge(m.healthStatus);
                      const totalVal = m.currentStock * m.unitCost;
                      return (
                        <tr key={m.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition">
                          <td className="p-3 text-center text-gray-400">{idx + 1}</td>
                          <td className="p-3">
                            <p className="font-bold text-gray-900 dark:text-white">{m.name}</p>
                            <p className="text-[11px] font-mono text-gray-500">{m.sku}</p>
                            {m.notes && <p className="text-[10px] text-gray-400 mt-0.5">{m.notes}</p>}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                              {isId ? CATEGORY_NAMES[m.category]?.id || m.category : m.category}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <span className="font-mono font-extrabold text-sm text-gray-900 dark:text-white">
                              {m.currentStock.toLocaleString("id-ID")}
                            </span>{" "}
                            <span className="text-[11px] text-gray-500 font-semibold">{m.unit}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.className}`}>
                              {badge.label}
                            </span>
                            <p className="text-[10px] text-gray-400 mt-1">
                              Safety: {m.safetyThreshold} {m.unit}
                            </p>
                          </td>
                          <td className="p-3 text-right text-gray-700 dark:text-gray-300 font-mono">
                            {formatIDR(m.unitCost)}
                          </td>
                          <td className="p-3 text-right font-extrabold text-gray-900 dark:text-white font-mono">
                            {formatIDR(totalVal)}
                          </td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">
                            {m.location || "-"}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenMovement(m.id)}
                                className="p-1.5 rounded-xl bg-red-50 dark:bg-red-950 text-[#8B0000] dark:text-red-300 hover:bg-red-100 transition active:scale-95 shadow-xs"
                                title="Catat Mutasi IN / OUT"
                              >
                                <ArrowDownRight className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setMaterialToEdit(m);
                                  setIsMaterialModalOpen(true);
                                }}
                                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition active:scale-95"
                                title="Edit Parameter Bahan"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(m.id)}
                                className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 text-red-600 transition active:scale-95"
                                title="Hapus Bahan"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* TAB 2: MOVEMENT LOGS VIEW */
          <div>
            {/* Mobile History Card Feed */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800 p-2 space-y-2.5">
              {movements.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  {isId ? "Belum ada riwayat mutasi stok." : "No movement logs found."}
                </div>
              ) : (
                movements.map((mov) => (
                  <div
                    key={mov.id}
                    className="p-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {mov.materialName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          mov.type.startsWith("IN")
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : mov.type.startsWith("OUT")
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {mov.type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>{formatIndonesianDate(mov.createdAt)}</span>
                      <span className="font-mono font-black text-sm text-gray-900 dark:text-white">
                        {mov.type.startsWith("IN") ? "+" : mov.type.startsWith("OUT") ? "-" : ""}
                        {mov.quantity.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-400 font-mono">
                      Ref: {mov.referenceNumber || "-"} • Operator: {mov.operatorName}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Desktop History Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3 w-36">{isId ? "Waktu & Tanggal" : "Timestamp"}</th>
                    <th className="p-3 min-w-[180px]">{isId ? "Nama Bahan Baku" : "Material"}</th>
                    <th className="p-3 w-36">{isId ? "Jenis Mutasi" : "Type"}</th>
                    <th className="p-3 text-right w-28">{isId ? "Jumlah Mutasi" : "Quantity"}</th>
                    <th className="p-3 w-36">{isId ? "No. Referensi" : "Reference"}</th>
                    <th className="p-3 w-32">{isId ? "Operator" : "Operator"}</th>
                    <th className="p-3">{isId ? "Catatan" : "Notes"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400">
                        <History className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                        <p>{isId ? "Belum ada riwayat mutasi stok" : "No movement logs recorded yet"}</p>
                      </td>
                    </tr>
                  ) : (
                    movements.map((mov, idx) => (
                      <tr key={mov.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition">
                        <td className="p-3 text-center text-gray-400">{idx + 1}</td>
                        <td className="p-3 text-gray-500 font-mono text-[11px]">
                          {formatIndonesianDate(mov.createdAt)}
                        </td>
                        <td className="p-3 font-bold text-gray-900 dark:text-white">
                          {mov.materialName}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              mov.type.startsWith("IN")
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : mov.type.startsWith("OUT")
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {mov.type}
                          </span>
                        </td>
                        <td className="p-3 text-right font-extrabold font-mono text-sm text-gray-900 dark:text-white">
                          {mov.type.startsWith("IN") ? "+" : mov.type.startsWith("OUT") ? "-" : ""}
                          {mov.quantity.toLocaleString("id-ID")}
                        </td>
                        <td className="p-3 font-mono text-gray-600 dark:text-gray-400">
                          {mov.referenceNumber || "-"}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">
                          {mov.operatorName}
                        </td>
                        <td className="p-3 text-gray-500">
                          {mov.notes || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Material Form Modal */}
      <MaterialFormModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSuccess={fetchInventory}
        materialToEdit={materialToEdit}
        language={language}
      />

      {/* Stock Movement Modal */}
      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        onSuccess={fetchInventory}
        materials={materials}
        preselectedMaterialId={selectedMaterialForMovement}
        language={language}
      />
    </div>
  );
}
