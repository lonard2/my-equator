"use client";

import React, { useState, useEffect } from "react";
import { AnalyticsSummary } from "@/services/analyticsService";
import { RevenueVolumeChart } from "./RevenueVolumeChart";
import { SizeBellCurveChart } from "./SizeBellCurveChart";
import { CustomerShareDonut } from "./CustomerShareDonut";
import { MaterialBurnRateHeatmap } from "./MaterialBurnRateHeatmap";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Truck,
  Download,
  RefreshCw,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface AnalyticsDashboardProps {
  language: "id" | "en";
}

export function AnalyticsDashboard({ language }: AnalyticsDashboardProps) {
  const isId = language === "id";
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"30D" | "Q" | "YTD" | "ALL">("ALL");

  const fetchAnalytics = async (targetPeriod: "30D" | "Q" | "YTD" | "ALL" = period) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/analytics?period=${targetPeriod}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.error || "Gagal memuat data analitik.");
      }
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      setError(err?.message || (isId ? "Gagal memuat data analitik server." : "Failed to load analytics from server."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const handleExportCsv = () => {
    if (!data) return;

    const periodLabel = period === "30D" ? "30 Hari Terakhir" : period === "Q" ? "Kuartal (90 Hari)" : period === "YTD" ? "Year-to-Date" : "Semua Data";

    let csv = `Laporan Analitik Bisnis & Produksi Equator Insole\n`;
    csv += `Periode: ${periodLabel}\n`;
    csv += `Tanggal Export: ${new Date().toLocaleString("id-ID")}\n\n`;

    // 1. Monthly Trends
    csv += "--- TREN PENDAPATAN & VOLUME BULANAN ---\n";
    csv += "Bulan,Omzet IDR,Volume Pasang,Jumlah Surat Jalan\n";
    data.monthlyTrends.forEach((m) => {
      csv += `"${m.monthLabel}",${m.revenueIdr},${m.volumePairs},${m.orderCount}\n`;
    });

    // 2. Size Matrix Bell Curve Breakdown
    csv += "\n--- DISTRIBUSI UKURAN SEPATU (EU 35-48) ---\n";
    csv += "Ukuran Sepatu (EU),Total Pasang,Persentase,Status Puncak\n";
    data.sizeDistribution.forEach((s) => {
      csv += `EU ${s.size},${s.totalPairs},${s.percentage}%,${s.isPeak ? "Puncak Tooling" : "Normal"}\n`;
    });

    // 3. Customer Market Share
    csv += "\n--- PANGSA PASAR PELANGGAN (BUYER MITRA) ---\n";
    csv += "Nama Pelanggan,Total Omzet IDR,Volume Pasang,Jumlah DO,Persentase Omzet\n";
    data.customerMarketShare.forEach((c) => {
      csv += `"${c.customerName}",${c.totalRevenueIdr},${c.totalPairs},${c.orderCount},${c.percentage}%\n`;
    });

    // 4. Material Inventory Runaway & DSI
    csv += "\n--- KETAHANAN STOK MATERIAL (DSI) ---\n";
    csv += "Nama Material,Kategori,Stok Saat Ini,Satuan,Burn Rate Bulanan,Sisa Hari (DSI),Status Kesehatan\n";
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

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-gray-500">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-[#8B0000]" />
          <p className="text-xs font-semibold">{isId ? "Memuat visualisasi analitik..." : "Loading analytics visualizer..."}</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/60 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-red-50 dark:bg-red-950/60 text-[#8B0000] dark:text-red-400 flex items-center justify-center">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
              {isId ? "Gagal Memuat Analitik" : "Failed to Load Analytics"}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{error}</p>
          </div>
          <button
            onClick={() => fetchAnalytics(period)}
            className="w-full py-2.5 rounded-2xl bg-[#8B0000] text-white font-bold text-xs hover:bg-[#A30000] transition active:scale-95 shadow-md flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{isId ? "Coba Lagi" : "Try Again"}</span>
          </button>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-red-50 dark:bg-red-950/60 text-[#8B0000] dark:text-red-400">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white tracking-wide flex items-center gap-2">
              <span>{isId ? "Pusat Analitik Bisnis & Operasional Pabrik" : "Executive Business & Factory Analytics"}</span>
            </h2>
            <p className="text-xs text-gray-500">
              {isId
                ? "Laporan omzet, kurva distribusi cetakan insole, pangsa pasar buyer, dan ketahanan stok material"
                : "Real-time manufacturing KPIs, size matrix distribution, revenue shares, and material burn rates"}
            </p>
          </div>
        </div>

        {/* Period Selector & Action Triggers */}
        <div className="flex items-center gap-2">
          {/* Period Filter */}
          <div className="flex rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1 text-xs font-bold shadow-xs">
            {(["30D", "Q", "YTD", "ALL"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-xl transition ${
                  period === p
                    ? "bg-[#8B0000] text-white shadow-xs"
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
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 active:scale-95 transition shadow-xs"
          >
            <Download className="h-4 w-4 text-[#8B0000]" />
            <span>{isId ? "Export CSV" : "Export CSV"}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchAnalytics(period)}
            className="p-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:text-[#8B0000] active:scale-95 transition shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Network / Temporary Warning Banner if any */}
      {error && (
        <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-between text-xs text-red-900 dark:text-red-300">
          <p className="font-semibold">{error}</p>
          <button
            onClick={() => fetchAnalytics(period)}
            className="px-2.5 py-1 rounded-xl bg-[#8B0000] text-white text-[11px] font-bold hover:bg-[#A30000] transition"
          >
            {isId ? "Coba Lagi" : "Retry"}
          </button>
        </div>
      )}

      {/* Top Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Revenue */}
        <div className="p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {isId ? "Total Omzet (IDR)" : "Total Revenue (IDR)"}
            </span>
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-[#8B0000] dark:text-red-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white font-mono">
              {kpis?.totalRevenueFormatted}
            </p>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-0.5">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>+{kpis?.momRevenueGrowthPercent}% MoM</span>
            </div>
          </div>
        </div>

        {/* 2. Total Pairs Output */}
        <div className="p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-2">
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
              <span className="text-xs font-normal text-gray-500">pasang</span>
            </p>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-0.5">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>+{kpis?.momVolumeGrowthPercent}% MoM</span>
            </div>
          </div>
        </div>

        {/* 3. Average Order Value */}
        <div className="p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-2">
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
            <p className="text-[11px] text-gray-500 mt-0.5">
              {kpis?.totalOrdersCount} Surat Jalan aktif
            </p>
          </div>
        </div>

        {/* 4. Delivery Completion Rate */}
        <div className="p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-2">
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
              {kpis?.deliveredOrdersCount} dari {kpis?.totalOrdersCount} DO selesai
            </p>
          </div>
        </div>
      </div>

      {/* 4-Pane Core Visualizers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. Monthly Revenue & Volume Trends */}
        <RevenueVolumeChart data={data?.monthlyTrends || []} language={language} />

        {/* 2. Sizing Matrix Bell Curve */}
        <SizeBellCurveChart data={data?.sizeDistribution || []} language={language} />

        {/* 3. Customer Market Share Donut */}
        <CustomerShareDonut data={data?.customerMarketShare || []} language={language} />

        {/* 4. Raw Material Burn Rate & DSI */}
        <MaterialBurnRateHeatmap data={data?.materialBurnRate || []} language={language} />
      </div>
    </div>
  );
}
