"use client";

import React from "react";
import { Boxes, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface MaterialBurnItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  estimatedMonthlyBurn: number;
  projectedDaysRemaining: number;
  healthStatus: "HEALTHY" | "WARNING" | "CRITICAL";
}

interface MaterialBurnRateHeatmapProps {
  data: MaterialBurnItem[];
  language: "id" | "en";
}

export function MaterialBurnRateHeatmap({ data, language }: MaterialBurnRateHeatmapProps) {
  const isId = language === "id";

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-gray-400">
        {isId ? "Belum ada data material." : "No material data available."}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Boxes className="h-4 w-4 text-[#8B0000]" />
            <span>{isId ? "Proyeksi Konsumsi & Ketahanan Stok (DSI)" : "Material Burn Rate & Stock Runaway"}</span>
          </h3>
          <p className="text-[11px] text-gray-500">
            {isId
              ? "Estimasi sisa hari persediaan berdasarkan ritme pemotongan & produksi"
              : "Estimated days of inventory remaining based on factory burn rate"}
          </p>
        </div>

        <div className="px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-600 dark:text-gray-400 font-mono">
          {isId ? "Skala 60 Hari Pasokan" : "60-Day Supply Scale"}
        </div>
      </div>

      {/* Material Progress Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto">
        {data.map((mat) => {
          const isCritical = mat.healthStatus === "CRITICAL";
          const isWarning = mat.healthStatus === "WARNING";

          const pct = Math.min(100, Math.round((mat.projectedDaysRemaining / 60) * 100));

          return (
            <div
              key={mat.id}
              className={`p-3 rounded-2xl border ${
                isCritical
                  ? "border-red-300 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/30"
                  : isWarning
                  ? "border-amber-300 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30"
                  : "border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40"
              } space-y-2`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-xs text-gray-900 dark:text-white truncate">
                    {mat.name}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase">{mat.category}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    isCritical
                      ? "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200"
                      : isWarning
                      ? "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}
                >
                  {isCritical ? "Kritis" : isWarning ? "Perlu Reorder" : "Aman"}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-600 dark:text-gray-400 font-mono">
                  <span>Stok: {mat.currentStock} {mat.unit}</span>
                  <span className="font-bold">~{mat.projectedDaysRemaining} hari tersisa</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isCritical ? "bg-red-600" : isWarning ? "bg-amber-500" : "bg-emerald-600"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
