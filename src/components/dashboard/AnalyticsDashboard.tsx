"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnalyticsSummary } from "@/services/analyticsService";
import { RevenueVolumeChart } from "./RevenueVolumeChart";
import { SizeBellCurveChart } from "./SizeBellCurveChart";
import { CustomerShareDonut } from "./CustomerShareDonut";
import { MaterialBurnRateHeatmap, MaterialBurnItem } from "./MaterialBurnRateHeatmap";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Truck,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  AlertTriangle,
  X,
  PlusCircle,
  Boxes,
} from "lucide-react";

interface AnalyticsDashboardProps {
  language: "id" | "en";
  onNavigateTab?: (tab: any) => void;
}

export function AnalyticsDashboard({ language, onNavigateTab }: AnalyticsDashboardProps) {
  const isId = language === "id";
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"30D" | "Q" | "YTD" | "ALL">("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  // Staged material restock modal state
  const [stagedMaterial, setStagedMaterial] = useState<MaterialBurnItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(50);
  const [restockOperator, setRestockOperator] = useState<string>("Factory Manager");
  const [restockNotes, setRestockNotes] = useState<string>("");
  const [isSubmittingRestock, setIsSubmittingRestock] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [restockSuccessMessage, setRestockSuccessMessage] = useState<string | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    if (!stagedMaterial) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setStagedMaterial(null);
        setModalError(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stagedMaterial]);

  const fetchAnalytics = async (
    targetPeriod: "30D" | "Q" | "YTD" | "ALL" = period,
    targetCustomer: string | null = selectedCustomer,
    signal?: AbortSignal
  ) => {
    try {
      setLoading(true);
      setError(null);
      let url = `/api/analytics?period=${targetPeriod}`;
      if (targetCustomer) {
        url += `&customer=${encodeURIComponent(targetCustomer)}`;
      }
      const res = await fetch(url, { signal });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.error || (isId ? "Gagal memuat data analitik." : "Failed to load analytics data."));
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("Failed to load analytics:", err);
      setError(err?.message || (isId ? "Gagal memuat data analitik server." : "Failed to load analytics from server."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchAnalytics(period, selectedCustomer, controller.signal);
    return () => {
      controller.abort();
    };
  }, [period, selectedCustomer]);

  const handleExportCsv = () => {
    if (!data) return;

    const periodLabel =
      period === "30D"
        ? isId ? "30 Hari Terakhir" : "Last 30 Days"
        : period === "Q"
        ? isId ? "Kuartal (90 Hari)" : "Quarter (90 Days)"
        : period === "YTD"
        ? "Year-to-Date"
        : isId ? "Semua Data" : "All Data";

    let csv = isId
      ? `Laporan Analitik Bisnis & Produksi Equator Insole\n`
      : `Equator Insole Business & Production Analytics Report\n`;
    csv += `${isId ? "Periode" : "Period"}: ${periodLabel}\n`;
    if (selectedCustomer) {
      csv += `${isId ? "Filter Pelanggan" : "Filtered Customer"}: ${selectedCustomer}\n`;
    }
    csv += `${isId ? "Tanggal Ekspor" : "Export Date"}: ${new Date().toLocaleString(isId ? "id-ID" : "en-US")}\n\n`;

    // 1. Monthly Trends
    csv += isId ? "--- TREN PENDAPATAN & VOLUME BULANAN ---\n" : "--- MONTHLY REVENUE & VOLUME TRENDS ---\n";
    csv += isId
      ? "Bulan,Omzet IDR,Volume Pasang,Jumlah Surat Jalan\n"
      : "Month,Revenue IDR,Volume Pairs,Delivery Orders Count\n";
    data.monthlyTrends.forEach((m) => {
      csv += `"${m.monthLabel}",${m.revenueIdr},${m.volumePairs},${m.orderCount}\n`;
    });

    // 2. Size Matrix Bell Curve Breakdown
    csv += isId ? "\n--- DISTRIBUSI UKURAN SEPATU (EU 35-48) ---\n" : "\n--- SHOE SIZE DISTRIBUTION (EU 35-48) ---\n";
    csv += isId
      ? "Ukuran Sepatu (EU),Total Pasang,Persentase,Status Puncak\n"
      : "Shoe Size (EU),Total Pairs,Percentage,Peak Status\n";
    data.sizeDistribution.forEach((s) => {
      csv += `EU ${s.size},${s.totalPairs},${s.percentage}%,${s.isPeak ? (isId ? "Puncak Tooling" : "Peak Tooling") : "Normal"}\n`;
    });

    // 3. Customer Market Share
    csv += isId ? "\n--- PANGSA PASAR PELANGGAN (BUYER MITRA) ---\n" : "\n--- CUSTOMER MARKET SHARE (PARTNER BRANDS) ---\n";
    csv += isId
      ? "Nama Pelanggan,Total Omzet IDR,Volume Pasang,Jumlah DO,Persentase Omzet\n"
      : "Customer Name,Total Revenue IDR,Volume Pairs,DO Count,Revenue Percentage\n";
    data.customerMarketShare.forEach((c) => {
      csv += `"${c.customerName}",${c.totalRevenueIdr},${c.totalPairs},${c.orderCount},${c.percentage}%\n`;
    });

    // 4. Material Inventory Runaway & DSI
    csv += isId ? "\n--- KETAHANAN STOK MATERIAL (DSI) ---\n" : "\n--- MATERIAL STOCK DAYS OF SUPPLY (DSI) ---\n";
    csv += isId
      ? "Nama Material,Kategori,Stok Saat Ini,Satuan,Burn Rate Bulanan,Sisa Hari (DSI),Status Kesehatan\n"
      : "Material Name,Category,Current Stock,Unit,Monthly Burn Rate,Days Remaining (DSI),Health Status\n";
    data.materialBurnRate.forEach((mat) => {
      csv += `"${mat.name}","${mat.category}",${mat.currentStock},${mat.unit},${mat.estimatedMonthlyBurn},${mat.projectedDaysRemaining},${mat.healthStatus}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Equator_Analytics_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenRestockModal = (material: MaterialBurnItem) => {
    setStagedMaterial(material);
    setModalError(null);
    const suggested = Math.max(20, material.estimatedMonthlyBurn * 2);
    setRestockQuantity(suggested);
    setRestockOperator(isId ? "Manager Pabrik" : "Factory Manager");
    setRestockNotes(
      isId
        ? `Pengadaan cepat via Dashboard Analitik (${material.healthStatus === "CRITICAL" ? "Stok Kritis" : "Reorder"})`
        : `Quick intake order via Business Analytics (${material.healthStatus === "CRITICAL" ? "Critical Restock" : "Reorder"})`
    );
  };

  const handleSubmitRestock = async () => {
    if (!stagedMaterial || restockQuantity <= 0) return;
    try {
      setIsSubmittingRestock(true);
      setModalError(null);
      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: stagedMaterial.id,
          type: "IN_PURCHASE",
          quantity: Number(restockQuantity),
          operatorName: restockOperator || "Factory Manager",
          referenceNumber: `PO-${Date.now().toString().slice(-6)}`,
          notes: restockNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRestockSuccessMessage(
          isId
            ? `Berhasil mencatat pengadaan restock ${restockQuantity} ${stagedMaterial.unit} untuk ${stagedMaterial.name}.`
            : `Successfully recorded restock intake of ${restockQuantity} ${stagedMaterial.unit} for ${stagedMaterial.name}.`
        );
        setStagedMaterial(null);
        fetchAnalytics(period, selectedCustomer);
        setTimeout(() => setRestockSuccessMessage(null), 5000);
      } else {
        throw new Error(json.error || (isId ? "Gagal mencatat pengadaan." : "Failed to record intake."));
      }
    } catch (err: any) {
      setModalError(err?.message || (isId ? "Gagal mencatat pengadaan stok." : "Failed to record intake order."));
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-gray-500">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-brand" />
          <p className="text-xs font-semibold">{isId ? "Memuat data analitik..." : "Loading analytics data..."}</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full p-6 rounded-xl bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/60 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-red-50 dark:bg-red-950/60 text-brand dark:text-red-400 flex items-center justify-center">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
              {isId ? "Gagal Memuat Analitik" : "Failed to Load Analytics"}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{error}</p>
          </div>
          <button
            onClick={() => fetchAnalytics(period, selectedCustomer)}
            className="w-full py-2.5 rounded-xl bg-brand text-white font-bold text-xs hover:bg-brand-strong transition active:scale-95 shadow-md flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{isId ? "Coba Lagi" : "Try Again"}</span>
          </button>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;

  // Helper for dynamic MoM badge (Fixes P0 bug)
  const renderMomBadge = (deltaPercent?: number) => {
    const val = deltaPercent ?? 0;
    if (val > 0) {
      return (
        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
          <span>+{val}% MoM</span>
        </div>
      );
    }
    if (val < 0) {
      return (
        <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
          <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />
          <span>{val}% MoM</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
        <Minus className="h-3.5 w-3.5 shrink-0" />
        <span>0% MoM</span>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 text-brand dark:text-red-400">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white tracking-wide flex items-center gap-2">
              <span>{isId ? "Analitik Bisnis" : "Business Analytics"}</span>
            </h2>
            <p className="text-xs text-gray-500">
              {isId
                ? "Omzet, distribusi ukuran insole, pangsa buyer, dan ketahanan stok material"
                : "Revenue, size distribution, buyer share, and material burn rates"}
            </p>
          </div>
        </div>

        {/* Period Selector & Action Triggers */}
        <div className="flex items-center gap-2">
          {/* Period Filter */}
          <div className="flex rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1 text-xs font-bold shadow-xs">
            {(["30D", "Q", "YTD", "ALL"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-xl transition ${
                  period === p
                    ? "bg-brand text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                }`}
              >
                {p === "30D" ? "30H" : p === "Q" ? "Kuartal" : p === "YTD" ? "YTD" : isId ? "Semua" : "All"}
              </button>
            ))}
          </div>

          {/* Export Report */}
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 active:scale-95 transition shadow-xs"
          >
            <Download className="h-4 w-4 text-brand" />
            <span>{isId ? "Ekspor CSV" : "Export CSV"}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchAnalytics(period, selectedCustomer)}
            className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:text-brand active:scale-95 transition shadow-xs"
            title={isId ? "Segarkan Data" : "Refresh Data"}
            aria-label={isId ? "Segarkan Data" : "Refresh Data"}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {restockSuccessMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-300 animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="font-semibold">{restockSuccessMessage}</p>
          </div>
          <button
            onClick={() => setRestockSuccessMessage(null)}
            aria-label={isId ? "Tutup notifikasi" : "Dismiss notification"}
            className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Network / Temporary Warning Banner */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-between text-xs text-red-900 dark:text-red-300"
        >
          <p className="font-semibold">{error}</p>
          <button
            onClick={() => fetchAnalytics(period, selectedCustomer)}
            className="px-2.5 py-1 rounded-xl bg-brand text-white text-[11px] font-bold hover:bg-brand-strong transition"
          >
            {isId ? "Coba Lagi" : "Retry"}
          </button>
        </div>
      )}

      {/* Top Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Revenue */}
        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {isId ? "Total Omzet (IDR)" : "Total Revenue (IDR)"}
            </span>
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-brand dark:text-red-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white font-mono">
              {kpis?.totalRevenueFormatted}
            </p>
            {renderMomBadge(kpis?.momRevenueGrowthPercent)}
          </div>
        </div>

        {/* 2. Total Pairs Output */}
        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {isId ? "Total Output Produksi" : "Total Volume Output"}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white font-mono">
              {kpis?.totalVolumePairs.toLocaleString("id-ID")}{" "}
              <span className="text-xs font-normal text-gray-500">{isId ? "pasang" : "pairs"}</span>
            </p>
            {renderMomBadge(kpis?.momVolumeGrowthPercent)}
          </div>
        </div>

        {/* 3. Average Order Value */}
        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {isId ? "Rata-Rata Nilai Order (AOV)" : "Average Order Value (AOV)"}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white font-mono">
              {kpis?.averageOrderValueFormatted}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5 font-mono">
              {kpis?.totalOrdersCount} {isId ? "Surat Jalan aktif" : "active orders"}
            </p>
          </div>
        </div>

        {/* 4. Delivery Completion Rate */}
        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {isId ? "Tingkat Pengiriman Selesai" : "Fulfillment Rate"}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white font-mono">
              {kpis?.totalOrdersCount
                ? Math.round((kpis.deliveredOrdersCount / kpis.totalOrdersCount) * 100)
                : 0}
              %
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {isId
                ? `${kpis?.deliveredOrdersCount} dari ${kpis?.totalOrdersCount} DO selesai`
                : `${kpis?.deliveredOrdersCount} of ${kpis?.totalOrdersCount} DOs fulfilled`}
            </p>
          </div>
        </div>
      </div>

      {/* 4-Pane Core Visualizers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. Monthly Revenue & Volume Trends */}
        <RevenueVolumeChart data={data?.monthlyTrends || []} language={language} />

        {/* 2. Sizing Matrix Bell Curve (Customer Cross-Filtering Enabled) */}
        <SizeBellCurveChart
          data={data?.sizeDistribution || []}
          language={language}
          selectedCustomer={selectedCustomer}
          onClearCustomerFilter={() => setSelectedCustomer(null)}
        />

        {/* 3. Customer Market Share Donut (Click to Cross-Filter) */}
        <CustomerShareDonut
          data={data?.customerMarketShare || []}
          language={language}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={(cust) => setSelectedCustomer(cust)}
        />

        {/* 4. Raw Material Burn Rate & DSI (Interactive Reorder Enabled) */}
        <MaterialBurnRateHeatmap
          data={data?.materialBurnRate || []}
          language={language}
          onStageReorder={handleOpenRestockModal}
        />
      </div>

      {/* Quick Material Restock Staging Modal */}
      {stagedMaterial && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="restock-modal-title"
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    stagedMaterial.healthStatus === "CRITICAL"
                      ? "bg-red-50 dark:bg-red-950/60 text-brand"
                      : "bg-amber-50 dark:bg-amber-950/60 text-amber-600"
                  }`}
                >
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="restock-modal-title" className="font-extrabold text-sm text-gray-900 dark:text-white">
                    {isId ? "Pengadaan Cepat Stok Material" : "Quick Material Restock Intake"}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {isId ? "Catat penerimaan bahan baku langsung ke gudang" : "Record raw material intake directly to warehouse"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setStagedMaterial(null);
                  setModalError(null);
                }}
                aria-label={isId ? "Tutup dialog" : "Close dialog"}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* In-Modal Error Banner (Eliminates native alert) */}
            {modalError && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-300 font-semibold flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-brand dark:text-red-400" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Selected Material Info Card */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 text-xs space-y-1.5">
              <div className="flex justify-between items-center font-bold">
                <span className="text-gray-900 dark:text-white">{stagedMaterial.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    stagedMaterial.healthStatus === "CRITICAL"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
                  }`}
                >
                  {stagedMaterial.projectedDaysRemaining} {isId ? "hari tersisa" : "days left"}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-mono">
                {isId ? "Stok Saat Ini" : "Current Stock"}: {stagedMaterial.currentStock} {stagedMaterial.unit} &middot;{" "}
                {isId ? "Estimasi konsumsi" : "Burn rate"}: ~{stagedMaterial.estimatedMonthlyBurn}/{isId ? "bln" : "mo"}
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 text-xs">
              <div>
                <label htmlFor="restock-qty-input" className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {isId ? "Jumlah Penerimaan (Unit / Lembar)" : "Intake Quantity (Units / Sheets)"}
                </label>
                <input
                  id="restock-qty-input"
                  type="number"
                  min="1"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(Math.max(1, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-brand focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="restock-operator-input" className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {isId ? "Operator Penerima / Petugas" : "Receiving Operator"}
                </label>
                <input
                  id="restock-operator-input"
                  type="text"
                  value={restockOperator}
                  onChange={(e) => setRestockOperator(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="restock-notes-input" className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {isId ? "Catatan Pengadaan / Referensi Supplier" : "Intake Notes / Supplier PO Ref"}
                </label>
                <input
                  id="restock-notes-input"
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:outline-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStagedMaterial(null);
                  setModalError(null);
                }}
                className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                {isId ? "Batal" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={isSubmittingRestock || restockQuantity <= 0}
                onClick={handleSubmitRestock}
                className="flex-1 py-2 rounded-xl bg-brand hover:bg-brand-strong text-white text-xs font-bold shadow-md active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmittingRestock ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PlusCircle className="h-3.5 w-3.5" />
                )}
                <span>{isId ? "Konfirmasi Masuk Stok" : "Confirm Restock"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
