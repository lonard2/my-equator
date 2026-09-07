"use client";

import React from "react";
import { Boxes } from "lucide-react";

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

/* Ranked days-of-supply (DSI) list. Not a heatmap: the source data is one
   projection per material, so a matrix would be fabricated. Rows are sorted
   by days remaining; status color = semantic only. */
export function MaterialBurnRateHeatmap({ data, language }: MaterialBurnRateHeatmapProps) {
  const isId = language === "id";

  if (!data || data.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="h-56 flex items-center justify-center text-xs text-gray-400">
          {isId ? "Belum ada data material." : "No material data available."}
        </div>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => a.projectedDaysRemaining - b.projectedDaysRemaining);

  const statusTone = (status: MaterialBurnItem["healthStatus"]) =>
    status === "CRITICAL"
      ? "bg-red-500"
      : status === "WARNING"
      ? "bg-amber-500"
      : "bg-emerald-500";

  const statusLabel = (status: MaterialBurnItem["healthStatus"]) =>
    status === "CRITICAL"
      ? isId ? "Kritis" : "Critical"
      : status === "WARNING"
      ? isId ? "Perlu Reorder" : "Reorder Soon"
      : isId ? "Aman" : "Healthy";

  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Boxes className="h-4 w-4 text-brand" />
            <span>{isId ? "Ketahanan Stok Material (DSI)" : "Material Days of Supply"}</span>
          </h3>
          <p className="text-[11px] text-gray-500">
            {isId
              ? "Estimasi sisa hari persediaan berdasarkan ritme produksi, diurutkan paling kritis dulu"
              : "Estimated days of inventory remaining, most critical first"}
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-600 dark:text-gray-400 font-mono shrink-0">
          {isId ? "Skala 60 Hari" : "60-Day Scale"}
        </span>
      </div>

      <div className="overflow-y-auto max-h-64 divide-y divide-gray-100 dark:divide-gray-800">
        {sorted.map((mat) => {
          const pct = Math.min(100, Math.round((mat.projectedDaysRemaining / 60) * 100));
          return (
            <div key={mat.id} className="py-2.5 flex items-center gap-3">
              <span
                className={`w-2 h-8 rounded-full shrink-0 ${statusTone(mat.healthStatus)}`}
                title={statusLabel(mat.healthStatus)}
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-gray-900 dark:text-white truncate leading-tight">
                  {mat.name}
                </p>
                <p className="text-[10px] text-gray-500 font-mono">
                  {mat.currentStock} {mat.unit} &middot; ~{mat.estimatedMonthlyBurn}/{isId ? "bln" : "mo"}
                </p>
                <div className="mt-1.5 h-1 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className={`h-full rounded-full ${statusTone(mat.healthStatus)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-base font-black text-gray-900 dark:text-white font-mono tabular-nums leading-none">
                  {mat.projectedDaysRemaining}
                </p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                  {isId ? "hari" : "days"} &middot; {statusLabel(mat.healthStatus)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
