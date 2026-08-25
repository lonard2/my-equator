"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { MaterialItem, MaterialCategory, StockMovement, StockHealthStatus, MovementType } from "@/types";
import { formatIDR, formatIndonesianDate } from "@/lib/utils/formatters";
import { calculateInsoleBom, INSOLE_BOM_PRESETS } from "@/lib/inventory/bom";
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
  Calculator,
  RefreshCw,
  X,
  Sparkles,
  AlertCircle,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Keyboard,
  HelpCircle,
} from "lucide-react";

interface InventoryDashboardProps {
  language: "id" | "en";
}

type SortColumn = "name" | "sku" | "category" | "stock" | "health" | "unitCost" | "valuation" | "location";

const CATEGORY_NAMES: Record<MaterialCategory, { id: string; en: string }> = {
  EVA_SHEET: { id: "EVA Foam Sheet", en: "EVA Foam Sheet" },
  LATEX: { id: "Latex Roll", en: "Latex Roll" },
  PU_CHEMICAL: { id: "Kimia Cair PU", en: "PU Chemical" },
  TPU_SHANK: { id: "TPU Arch Shank", en: "TPU Shank" },
  FABRIC: { id: "Kain Laminasi", en: "Fabric & Mesh" },
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
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Column Sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // BOM Estimator State (For Pak Hendra / Production Staging)
  const [showBomDrawer, setShowBomDrawer] = useState(false);
  const [bomArticleCode, setBomArticleCode] = useState("EQ-SPORT-01");
  const [bomTargetPairs, setBomTargetPairs] = useState(1000);

  // Modals & Feedback State
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<MaterialItem | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedMaterialForMovement, setSelectedMaterialForMovement] = useState<string | null>(null);
  const [movementCorrection, setMovementCorrection] = useState<{
    materialId?: string;
    type?: MovementType;
    quantity?: number;
    referenceNumber?: string;
    notes?: string;
  } | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<MaterialItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  // Global Keyboard Accelerators (Alex / Power User Persona)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT";

      if (e.key === "Escape") {
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
          return;
        }
        if (showBomDrawer) {
          setShowBomDrawer(false);
          return;
        }
        if (searchTerm) {
          setSearchTerm("");
          return;
        }
      }

      if (!isInput && e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (!isInput && (e.key === "?" || (e.shiftKey && e.key === "?"))) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      if (e.altKey && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        setMaterialToEdit(null);
        setIsMaterialModalOpen(true);
      } else if (e.altKey && (e.key === "m" || e.key === "M")) {
        e.preventDefault();
        setMovementCorrection(null);
        setSelectedMaterialForMovement(null);
        setIsMovementModalOpen(true);
      } else if (e.altKey && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        setShowBomDrawer((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isShortcutsModalOpen, showBomDrawer, searchTerm]);

  const confirmDeleteMaterial = async () => {
    if (!materialToDelete) return;
    try {
      const res = await fetch(`/api/inventory/materials/${materialToDelete.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast(isId ? `SKU ${materialToDelete.sku} berhasil dihapus` : `SKU ${materialToDelete.sku} deleted`);
        fetchInventory();
      }
    } catch (err) {
      console.error("Failed to delete material:", err);
    } finally {
      setMaterialToDelete(null);
    }
  };

  const handleOpenMovement = (matId?: string) => {
    setMovementCorrection(null);
    setSelectedMaterialForMovement(matId || null);
    setIsMovementModalOpen(true);
  };

  // 1-Click Transaction Correction / Offset Handler
  const handleCorrection = (mov: StockMovement) => {
    let offsetType: MovementType = "ADJUSTMENT";
    if (mov.type === "IN_PURCHASE") offsetType = "OUT_WASTAGE";
    else if (mov.type === "OUT_PRODUCTION") offsetType = "IN_RETURN";
    else if (mov.type === "OUT_WASTAGE") offsetType = "IN_RETURN";
    else if (mov.type === "IN_RETURN") offsetType = "OUT_PRODUCTION";

    setMovementCorrection({
      materialId: mov.materialId,
      type: offsetType,
      quantity: mov.quantity,
      referenceNumber: `KOR/${mov.referenceNumber || mov.id.slice(0, 8)}`,
      notes: `Koreksi atas transaksi [${mov.type}] Ref: ${mov.referenceNumber || mov.id.slice(0, 8)}`,
    });
    setSelectedMaterialForMovement(mov.materialId);
    setIsMovementModalOpen(true);
  };

  // Sort Toggle Handler
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedAndFilteredMaterials = useMemo(() => {
    const filtered = materials.filter((m) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        (m.location && m.location.toLowerCase().includes(q));

      const matchesCategory = categoryFilter === "ALL" || m.category === categoryFilter;
      const matchesLowStock = !onlyLowStock || m.healthStatus === "CRITICAL" || m.healthStatus === "WARNING";

      return matchesSearch && matchesCategory && matchesLowStock;
    });

    return [...filtered].sort((a, b) => {
      let valA: string | number = a.name;
      let valB: string | number = b.name;

      if (sortColumn === "sku") {
        valA = a.sku;
        valB = b.sku;
      } else if (sortColumn === "category") {
        valA = a.category;
        valB = b.category;
      } else if (sortColumn === "stock") {
        valA = a.currentStock;
        valB = b.currentStock;
      } else if (sortColumn === "health") {
        const healthOrder: Record<StockHealthStatus, number> = { CRITICAL: 0, WARNING: 1, HEALTHY: 2 };
        valA = healthOrder[a.healthStatus || "HEALTHY"];
        valB = healthOrder[b.healthStatus || "HEALTHY"];
      } else if (sortColumn === "unitCost") {
        valA = a.unitCost;
        valB = b.unitCost;
      } else if (sortColumn === "valuation") {
        valA = a.currentStock * a.unitCost;
        valB = b.currentStock * b.unitCost;
      } else if (sortColumn === "location") {
        valA = a.location || "";
        valB = b.location || "";
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [materials, searchTerm, categoryFilter, onlyLowStock, sortColumn, sortDirection]);

  // Calculate KPIs
  const totalValuation = materials.reduce((sum, m) => sum + m.currentStock * m.unitCost, 0);
  const criticalItems = materials.filter((m) => m.healthStatus === "CRITICAL");
  const warningItems = materials.filter((m) => m.healthStatus === "WARNING");
  const lowStockTotal = criticalItems.length + warningItems.length;

  // BOM Calculation calculation
  const bomResult = useMemo(() => {
    return calculateInsoleBom(bomArticleCode, bomTargetPairs, materials);
  }, [bomArticleCode, bomTargetPairs, materials]);

  const getHealthBadge = (health: StockHealthStatus = "HEALTHY") => {
    switch (health) {
      case "CRITICAL":
        return {
          label: isId ? "Kritis" : "Critical",
          className: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-900/60",
        };
      case "WARNING":
        return {
          label: isId ? "Perlu Reorder" : "Low Stock",
          className: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
        };
      case "HEALTHY":
      default:
        return {
          label: isId ? "Aman" : "Healthy",
          className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60",
        };
    }
  };

  const renderSortIndicator = (col: SortColumn) => {
    if (sortColumn !== col) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition inline ml-1 opacity-60" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 text-[#8B0000] dark:text-red-400 inline ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 text-[#8B0000] dark:text-red-400 inline ml-1" />
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50/70 dark:bg-gray-950 p-3 sm:p-6 space-y-4 sm:space-y-6 pb-24 md:pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-red-100 dark:bg-red-950/70 text-[#8B0000] dark:text-red-400 shrink-0">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">
                {isId ? "Inventori Bahan Baku & Mutasi Stok" : "Raw Materials & Stock Inventory"}
              </h2>
              <button
                type="button"
                onClick={() => setIsShortcutsModalOpen(true)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title={isId ? "Panduan Shortcut Keyboard (?)" : "Keyboard Shortcuts (?)"}
                aria-label="Keyboard Shortcuts"
              >
                <Keyboard className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {isId
                ? "Manajemen stok EVA, latex roll, PU, TPU shank, kain laminasi & pisau pond"
                : "Tracking of EVA foam sheets, latex rolls, PU chemicals, TPU shanks, fabrics & cutting dies"}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2">
          {/* BOM Calculator Drawer Trigger (Pak Hendra Persona) */}
          <button
            type="button"
            onClick={() => setShowBomDrawer(!showBomDrawer)}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-2xl border text-xs font-bold transition active:scale-95 shadow-xs ${
              showBomDrawer
                ? "bg-[#8B0000] text-white border-[#8B0000]"
                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            title={isId ? "Kalkulator Kebutuhan Bahan (BOM) (Alt+B)" : "Bill of Materials Calculator (Alt+B)"}
          >
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">{isId ? "Estimasi BOM Insole" : "BOM Calculator"}</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[9px] font-mono">Alt+B</kbd>
          </button>

          <button
            type="button"
            onClick={() => handleOpenMovement()}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95 transition"
            title={isId ? "Catat Transaksi Mutasi (Alt+M)" : "Record Stock Movement (Alt+M)"}
          >
            <ArrowDownRight className="h-4 w-4" />
            <span>{isId ? "Catat Mutasi" : "Stock IN/OUT"}</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-black/20 text-[9px] font-mono">Alt+M</kbd>
          </button>

          <button
            type="button"
            onClick={() => {
              setMaterialToEdit(null);
              setIsMaterialModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-2xl bg-[#8B0000] hover:bg-[#A00000] text-white text-xs font-bold shadow-xs active:scale-95 transition"
            title={isId ? "Tambah SKU Bahan Baru (Alt+N)" : "Add New SKU (Alt+N)"}
          >
            <Plus className="h-4 w-4" />
            <span>{isId ? "Tambah SKU" : "Add SKU"}</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-black/20 text-[9px] font-mono">Alt+N</kbd>
          </button>
        </div>
      </div>

      {/* Interactive Insole BOM Estimator Drawer (For Pak Hendra / Factory Production Staging) */}
      {showBomDrawer && (
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-red-100 dark:bg-red-950/70 text-[#8B0000] dark:text-red-400">
                  <Calculator className="h-4 w-4" />
                </span>
                <h3 className="font-black text-sm text-gray-900 dark:text-white">
                  {isId ? "Kalkulator Bill of Materials (BOM) Insole" : "Insole Production BOM Estimator"}
                </h3>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {isId
                  ? "Hitung otomatis kebutuhan lembaran EVA, latex, kain & TPU shank berdasarkan target pesanan pasang"
                  : "Calculate raw material consumption and inventory sufficiency for target insole batches"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                bomResult.allSufficient
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200"
                  : "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200"
              }`}>
                {bomResult.allSufficient
                  ? isId ? "✓ Stok Bahan Mencukupi" : "✓ Inventory Sufficient"
                  : isId ? "⚠️ Ada Defisit Bahan" : "⚠️ Shortage Detected"}
              </span>
              <button
                type="button"
                onClick={() => setShowBomDrawer(false)}
                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label="Close BOM Drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Model & Target Volume Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">
                {isId ? "Pilih Model / Artikel Insole" : "Insole Article Model"}
              </label>
              <select
                value={bomArticleCode}
                onChange={(e) => setBomArticleCode(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#8B0000]"
              >
                {INSOLE_BOM_PRESETS.map((p) => (
                  <option key={p.articleCode} value={p.articleCode}>
                    [{p.articleCode}] {p.articleName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">
                {isId ? "Target Produksi (Pasang / psg)" : "Target Volume (Pairs)"}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  step={50}
                  value={bomTargetPairs}
                  onChange={(e) => setBomTargetPairs(Math.max(1, parseInt(e.target.value, 10) || 0))}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-mono font-black text-[#8B0000] dark:text-red-400 focus:outline-none focus:border-[#8B0000]"
                />
                <div className="flex gap-1 shrink-0">
                  {[500, 1000, 2500].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setBomTargetPairs(qty)}
                      className={`px-2 py-2 rounded-xl text-[10px] font-bold border transition ${
                        bomTargetPairs === qty
                          ? "bg-[#8B0000] text-white border-[#8B0000]"
                          : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* BOM Material Breakdown Matrix */}
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-3">{isId ? "Bahan Baku" : "Material Requirement"}</th>
                  <th className="p-3 text-right">{isId ? "Kebutuhan" : "Required"}</th>
                  <th className="p-3 text-right">{isId ? "Stok Gudang" : "Current Stock"}</th>
                  <th className="p-3 text-center">{isId ? "Kecukupan" : "Status"}</th>
                  <th className="p-3 text-right">{isId ? "Estimasi Biaya" : "Est. Cost"}</th>
                  <th className="p-3 text-center w-28">{isId ? "Aksi" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {bomResult.requirements.map((req, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition">
                    <td className="p-3">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {CATEGORY_NAMES[req.materialCategory]?.id || req.materialCategory}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {req.matchedMaterial ? req.matchedMaterial.name : `Cari bahan ${req.materialNamePattern}`}
                      </p>
                    </td>
                    <td className="p-3 text-right font-mono font-black text-gray-900 dark:text-white tabular-nums">
                      {req.requiredQuantity.toLocaleString("id-ID")}{" "}
                      <span className="text-xs font-normal text-gray-500">{req.unit}</span>
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums">
                      <span className={req.isSufficient ? "text-gray-900 dark:text-white font-bold" : "text-red-600 font-black"}>
                        {req.currentStock.toLocaleString("id-ID")}
                      </span>{" "}
                      <span className="text-xs font-normal text-gray-500">{req.unit}</span>
                    </td>
                    <td className="p-3 text-center">
                      {req.isSufficient ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{isId ? "Cukup" : "OK"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>{isId ? `Kurang ${req.deficit} ${req.unit}` : `Deficit ${req.deficit}`}</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-gray-900 dark:text-white tabular-nums">
                      {formatIDR(req.estimatedCost)}
                    </td>
                    <td className="p-3 text-center">
                      {!req.isSufficient && req.matchedMaterial && (
                        <button
                          type="button"
                          onClick={() => handleOpenMovement(req.matchedMaterial?.id)}
                          className="px-2.5 py-1 rounded-xl bg-[#8B0000] hover:bg-[#A00000] text-white text-[11px] font-bold shadow-2xs active:scale-95 transition"
                        >
                          {isId ? "Restock" : "PO IN"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 dark:bg-gray-800/80 font-bold border-t border-gray-200 dark:border-gray-700 text-xs">
                <tr>
                  <td colSpan={4} className="p-3 text-gray-700 dark:text-gray-300">
                    {isId ? `Total Estimasi Bahan Baku (${bomTargetPairs.toLocaleString("id-ID")} pasang)` : "Total Estimated Raw Material Cost"}
                    <span className="ml-2 font-normal text-[11px] text-gray-500">
                      (~{formatIDR(bomResult.costPerPairIDR)} / pasang)
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-black text-sm text-[#8B0000] dark:text-red-400 tabular-nums">
                    {formatIDR(bomResult.totalEstimatedCostIDR)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            {isId ? "Total Item SKU" : "Total SKUs"}
          </span>
          <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white font-mono tabular-nums leading-none">
            {materials.length} <span className="text-xs font-normal text-gray-500">SKU</span>
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            {isId ? "Valuasi Stok Gudang" : "Valuation"}
          </span>
          <p className="text-base sm:text-xl font-black text-[#8B0000] dark:text-red-400 font-mono truncate tabular-nums leading-none">
            {formatIDR(totalValuation)}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            {isId ? "Stok Kritis / Minim" : "Low Stock Alert"}
          </span>
          <p className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums leading-none">
            {lowStockTotal} <span className="text-xs font-normal text-gray-500">item</span>
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            {isId ? "Total Mutasi Log" : "Total Movements"}
          </span>
          <p className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tabular-nums leading-none">
            {movements.length} <span className="text-xs font-normal text-gray-500">log</span>
          </p>
        </div>
      </div>

      {/* Critical Stock Alert Banner */}
      {criticalItems.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
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
            type="button"
            onClick={() => handleOpenMovement(criticalItems[0]?.id)}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-[#8B0000] text-white text-xs font-bold shadow-xs active:scale-95 transition shrink-0"
          >
            <ArrowDownRight className="h-3.5 w-3.5" />
            <span>{isId ? "Restock Pembelian" : "Restock Purchase"}</span>
          </button>
        </div>
      )}

      {/* Workspace Card with Tabs & Search */}
      <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xs">
        {/* Tabs & Search Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/80 dark:bg-gray-800/40">
          <div className="flex items-center rounded-2xl bg-gray-200/80 dark:bg-gray-800 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("MATERIALS")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                activeTab === "MATERIALS"
                  ? "bg-white dark:bg-gray-900 text-[#8B0000] dark:text-red-400 shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>{isId ? "Daftar Stok Bahan" : "Material Stock"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("HISTORY")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                activeTab === "HISTORY"
                  ? "bg-white dark:bg-gray-900 text-[#8B0000] dark:text-red-400 shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>{isId ? "Log Mutasi (Audit)" : "Movement Logs"}</span>
            </button>
          </div>

          {activeTab === "MATERIALS" && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                aria-label={isId ? "Cari SKU, nama bahan baku, atau lokasi rak" : "Search SKU, material name, or shelf location"}
                placeholder={isId ? "Cari SKU, Nama, Lokasi... (Tekan /)" : "Search SKU, Name... (Press /)"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 pl-8 pr-8 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8B0000] focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Clear Search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Category & Low Stock Filter Pills with Scroll Mask */}
        {activeTab === "MATERIALS" && (
          <div className="relative border-b border-gray-100 dark:border-gray-800">
            <div
              className="p-2.5 sm:p-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none"
              style={{
                WebkitMaskImage: "linear-gradient(to right, black calc(100% - 32px), transparent 100%)",
                maskImage: "linear-gradient(to right, black calc(100% - 32px), transparent 100%)",
              }}
            >
              <button
                type="button"
                onClick={() => setCategoryFilter("ALL")}
                aria-pressed={categoryFilter === "ALL"}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 shrink-0 ${
                  categoryFilter === "ALL"
                    ? "bg-[#8B0000] text-white shadow-xs"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {isId ? "Semua" : "All"} ({materials.length})
              </button>

              {/* Quick Low Stock Toggle Filter */}
              <button
                type="button"
                onClick={() => setOnlyLowStock(!onlyLowStock)}
                aria-pressed={onlyLowStock}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1 shrink-0 ${
                  onlyLowStock
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60"
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                <span>{isId ? "Stok Kritis / Reorder" : "Low Stock Only"}</span>
                <span className="ml-0.5 px-1 rounded-full text-[10px] bg-white/30 text-white font-mono">
                  {lowStockTotal}
                </span>
              </button>

              {(Object.keys(CATEGORY_NAMES) as MaterialCategory[]).map((cat) => {
                const isSelected = categoryFilter === cat;
                const count = materials.filter((m) => m.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    aria-pressed={isSelected}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 shrink-0 ${
                      isSelected
                        ? "bg-[#8B0000] text-white shadow-xs"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {isId ? CATEGORY_NAMES[cat].id : CATEGORY_NAMES[cat].en} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 1: MATERIALS VIEW */}
        {activeTab === "MATERIALS" ? (
          <div>
            {/* MOBILE TOUCH CARD FEED (md:hidden) */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800 p-2.5 space-y-3">
              {sortedAndFilteredMaterials.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  {isId ? "Tidak ada bahan baku ditemukan." : "No materials found."}
                </div>
              ) : (
                sortedAndFilteredMaterials.map((m) => {
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
                          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-semibold">
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
                          <span className="font-mono font-black text-base text-gray-900 dark:text-white tabular-nums">
                            {m.currentStock.toLocaleString("id-ID")}{" "}
                            <span className="text-xs font-normal text-gray-500">{m.unit}</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 font-bold uppercase block">
                            {isId ? "Total Valuasi" : "Valuation"}
                          </span>
                          <span className="font-mono font-bold text-xs text-[#8B0000] dark:text-red-400 tabular-nums">
                            {formatIDR(totalVal)}
                          </span>
                        </div>
                      </div>

                      {/* Card Action Buttons with 44px min-height for Casey persona */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenMovement(m.id)}
                          className="py-2.5 min-h-[44px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition shadow-xs"
                        >
                          <ArrowDownRight className="h-4 w-4" />
                          <span>Mutasi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMaterialToEdit(m);
                            setIsMaterialModalOpen(true);
                          }}
                          className="py-2.5 min-h-[44px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-1 active:scale-95 transition"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMaterialToDelete(m)}
                          className="py-2.5 min-h-[44px] rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 text-xs font-bold text-red-600 dark:text-red-300 flex items-center justify-center gap-1 active:scale-95 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* DESKTOP/TABLET TABLE VIEW (hidden md:block) WITH STICKY HEADER & DYNAMIC SORTING */}
            <div className="hidden md:block overflow-x-auto max-h-[68vh]">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-xs text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700 select-none shadow-2xs">
                  <tr>
                    <th className="p-3.5 w-10 text-center">No</th>
                    <th
                      onClick={() => handleSort("name")}
                      className="p-3.5 min-w-[220px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition group"
                    >
                      <div className="flex items-center gap-1">
                        <span>{isId ? "SKU & Nama Bahan" : "SKU & Description"}</span>
                        {renderSortIndicator("name")}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("category")}
                      className="p-3.5 w-36 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition group"
                    >
                      <div className="flex items-center gap-1">
                        <span>{isId ? "Kategori" : "Category"}</span>
                        {renderSortIndicator("category")}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("stock")}
                      className="p-3.5 text-right w-32 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition group"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>{isId ? "Stok Aktual" : "Current Stock"}</span>
                        {renderSortIndicator("stock")}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("health")}
                      className="p-3.5 text-center w-36 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition group"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{isId ? "Status Kesehatan" : "Stock Health"}</span>
                        {renderSortIndicator("health")}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("unitCost")}
                      className="p-3.5 text-right w-28 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition group"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>{isId ? "Harga Satuan" : "Unit Cost"}</span>
                        {renderSortIndicator("unitCost")}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("valuation")}
                      className="p-3.5 text-right w-32 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition group"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>{isId ? "Total Nilai" : "Total Valuation"}</span>
                        {renderSortIndicator("valuation")}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("location")}
                      className="p-3.5 min-w-[130px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition group"
                    >
                      <div className="flex items-center gap-1">
                        <span>{isId ? "Lokasi Gudang" : "Location"}</span>
                        {renderSortIndicator("location")}
                      </div>
                    </th>
                    <th className="p-3.5 text-center w-28">{isId ? "Aksi" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                  {sortedAndFilteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-400">
                        <Boxes className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                        <p>{isId ? "Tidak ada bahan baku ditemukan" : "No materials found"}</p>
                      </td>
                    </tr>
                  ) : (
                    sortedAndFilteredMaterials.map((m, idx) => {
                      const badge = getHealthBadge(m.healthStatus);
                      const totalVal = m.currentStock * m.unitCost;
                      return (
                        <tr key={m.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition">
                          <td className="p-3.5 text-center text-gray-400 font-mono tabular-nums">{idx + 1}</td>
                          <td className="p-3.5">
                            <p className="font-bold text-gray-900 dark:text-white">{m.name}</p>
                            <p className="text-[11px] font-mono text-[#8B0000] dark:text-red-400 font-bold">{m.sku}</p>
                            {m.notes && <p className="text-[10px] text-gray-400 mt-0.5">{m.notes}</p>}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                              {isId ? CATEGORY_NAMES[m.category]?.id || m.category : m.category}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <span className="font-mono font-extrabold text-sm text-gray-900 dark:text-white tabular-nums">
                              {m.currentStock.toLocaleString("id-ID")}
                            </span>{" "}
                            <span className="text-[11px] text-gray-500 font-semibold">{m.unit}</span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.className}`}>
                              {badge.label}
                            </span>
                            <p className="text-[10px] text-gray-400 mt-1 font-mono tabular-nums">
                              Safety: {m.safetyThreshold} {m.unit}
                            </p>
                          </td>
                          <td className="p-3.5 text-right text-gray-700 dark:text-gray-300 font-mono tabular-nums">
                            {formatIDR(m.unitCost)}
                          </td>
                          <td className="p-3.5 text-right font-extrabold text-gray-900 dark:text-white font-mono tabular-nums">
                            {formatIDR(totalVal)}
                          </td>
                          <td className="p-3.5 text-gray-600 dark:text-gray-400">
                            {m.location || "-"}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenMovement(m.id)}
                                className="p-1.5 rounded-xl bg-red-50 dark:bg-red-950 text-[#8B0000] dark:text-red-300 hover:bg-red-100 transition active:scale-95 shadow-xs"
                                title={isId ? "Catat Mutasi IN / OUT" : "Record Stock Movement"}
                              >
                                <ArrowDownRight className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMaterialToEdit(m);
                                  setIsMaterialModalOpen(true);
                                }}
                                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition active:scale-95"
                                title={isId ? "Edit Parameter Bahan" : "Edit SKU"}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setMaterialToDelete(m)}
                                className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 text-red-600 transition active:scale-95"
                                title={isId ? "Hapus Bahan" : "Delete SKU"}
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
          /* TAB 2: MOVEMENT LOGS VIEW WITH STICKY HEADER & 1-CLICK CORRECTION */
          <div>
            {/* Mobile History Card Feed */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800 p-2.5 space-y-2.5">
              {movements.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  {isId ? "Belum ada riwayat mutasi stok." : "No movement logs found."}
                </div>
              ) : (
                movements.map((mov) => (
                  <div
                    key={mov.id}
                    className="p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {mov.materialName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          mov.type.startsWith("IN")
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
                            : mov.type.startsWith("OUT")
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200"
                        }`}
                      >
                        {mov.type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>{formatIndonesianDate(mov.createdAt)}</span>
                      <span className="font-mono font-black text-sm text-gray-900 dark:text-white tabular-nums">
                        {mov.type.startsWith("IN") ? "+" : mov.type.startsWith("OUT") ? "-" : ""}
                        {mov.quantity.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] text-gray-400 font-mono">
                        Ref: {mov.referenceNumber || "-"} • Op: {mov.operatorName}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCorrection(mov)}
                        className="px-2.5 py-1 min-h-[36px] rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1 active:scale-95 transition"
                        title={isId ? "Buat Koreksi / Offset Mutasi Ini" : "Create Offset Correction"}
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Koreksi</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop History Table with Sticky Header & 1-Click Koreksi */}
            <div className="hidden md:block overflow-x-auto max-h-[68vh]">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-xs text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700 select-none shadow-2xs">
                  <tr>
                    <th className="p-3.5 w-10 text-center">No</th>
                    <th className="p-3.5 w-36">{isId ? "Waktu & Tanggal" : "Timestamp"}</th>
                    <th className="p-3.5 min-w-[200px]">{isId ? "Nama Bahan Baku" : "Material"}</th>
                    <th className="p-3.5 w-36">{isId ? "Jenis Mutasi" : "Type"}</th>
                    <th className="p-3.5 text-right w-28">{isId ? "Jumlah Mutasi" : "Quantity"}</th>
                    <th className="p-3.5 w-36">{isId ? "No. Referensi" : "Reference"}</th>
                    <th className="p-3.5 w-32">{isId ? "Operator" : "Operator"}</th>
                    <th className="p-3.5">{isId ? "Catatan" : "Notes"}</th>
                    <th className="p-3.5 text-center w-24">{isId ? "Aksi" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-400">
                        <History className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                        <p>{isId ? "Belum ada riwayat mutasi stok" : "No movement logs recorded yet"}</p>
                      </td>
                    </tr>
                  ) : (
                    movements.map((mov, idx) => (
                      <tr key={mov.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition">
                        <td className="p-3.5 text-center text-gray-400 font-mono tabular-nums">{idx + 1}</td>
                        <td className="p-3.5 text-gray-500 font-mono text-[11px] tabular-nums">
                          {formatIndonesianDate(mov.createdAt)}
                        </td>
                        <td className="p-3.5 font-bold text-gray-900 dark:text-white">
                          {mov.materialName}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              mov.type.startsWith("IN")
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60"
                                : mov.type.startsWith("OUT")
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60"
                            }`}
                          >
                            {mov.type}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-extrabold font-mono text-sm text-gray-900 dark:text-white tabular-nums">
                          {mov.type.startsWith("IN") ? "+" : mov.type.startsWith("OUT") ? "-" : ""}
                          {mov.quantity.toLocaleString("id-ID")}
                        </td>
                        <td className="p-3.5 font-mono text-gray-600 dark:text-gray-400">
                          {mov.referenceNumber || "-"}
                        </td>
                        <td className="p-3.5 text-gray-700 dark:text-gray-300">
                          {mov.operatorName}
                        </td>
                        <td className="p-3.5 text-gray-500">
                          {mov.notes || "-"}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleCorrection(mov)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 font-bold text-[10px] active:scale-95 transition shadow-2xs"
                            title={isId ? "Koreksi / Offset Mutasi Ini" : "Offset / Correct Movement"}
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>{isId ? "Koreksi" : "Offset"}</span>
                          </button>
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

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      {isShortcutsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <span className="p-2 rounded-2xl bg-red-100 dark:bg-red-950/70 text-[#8B0000] dark:text-red-400">
                  <Keyboard className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="font-extrabold text-base leading-tight">
                    {isId ? "Pintasan Keyboard Inventori" : "Inventory Keyboard Shortcuts"}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {isId ? "Akselerator cepat untuk efisiensi staf gudang" : "Fast accelerators for warehouse staff"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShortcutsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label="Close Shortcuts"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {isId ? "Tambah SKU Bahan Baru" : "Add New Material SKU"}
                </span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 font-mono font-bold text-[11px]">
                  Alt + N
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {isId ? "Catat Mutasi Stok (IN / OUT)" : "Record Stock Movement"}
                </span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 font-mono font-bold text-[11px]">
                  Alt + M
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {isId ? "Buka / Tutup Kalkulator BOM" : "Toggle Insole BOM Estimator"}
                </span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 font-mono font-bold text-[11px]">
                  Alt + B
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {isId ? "Fokus Kolom Pencarian" : "Focus Search Input"}
                </span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 font-mono font-bold text-[11px]">
                  /
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {isId ? "Buka Panduan Pintasan Ini" : "Show Keyboard Shortcuts"}
                </span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 font-mono font-bold text-[11px]">
                  ?
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {isId ? "Tutup Modal / Bersihkan Search" : "Close Drawer / Clear Search"}
                </span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 font-mono font-bold text-[11px]">
                  Esc
                </kbd>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsShortcutsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#8B0000] text-white text-xs font-bold shadow-xs active:scale-95 transition"
              >
                {isId ? "Mengerti" : "Got it"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {materialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 rounded-2xl bg-red-100 dark:bg-red-950/70">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-gray-900 dark:text-white">
                  {isId ? "Hapus SKU Bahan?" : "Delete Material SKU?"}
                </h4>
                <p className="text-xs text-gray-500 font-mono">{materialToDelete.sku}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300">
              {isId
                ? `Apakah Anda yakin ingin menghapus "${materialToDelete.name}" dari katalog inventori? Aksi ini tidak dapat dibatalkan.`
                : `Are you sure you want to delete "${materialToDelete.name}" from the inventory catalog?`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMaterialToDelete(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100"
              >
                {isId ? "Batal" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={confirmDeleteMaterial}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs active:scale-95 transition"
              >
                {isId ? "Ya, Hapus SKU" : "Delete SKU"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Material Form Modal */}
      <MaterialFormModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSuccess={() => {
          showToast(isId ? "Data bahan baku berhasil disimpan" : "Material SKU successfully saved");
          fetchInventory();
        }}
        materialToEdit={materialToEdit}
        language={language}
      />

      {/* Stock Movement Modal with Correction Support */}
      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => {
          setIsMovementModalOpen(false);
          setMovementCorrection(null);
        }}
        onSuccess={() => {
          showToast(isId ? "Transaksi mutasi stok berhasil dicatat" : "Stock movement successfully recorded");
          fetchInventory();
        }}
        materials={materials}
        preselectedMaterialId={selectedMaterialForMovement}
        initialMovementType={movementCorrection?.type}
        initialQuantity={movementCorrection?.quantity}
        initialReferenceNumber={movementCorrection?.referenceNumber}
        initialNotes={movementCorrection?.notes}
        language={language}
      />
    </div>
  );
}
