"use client";

import React, { useState } from "react";
import { Users, Award, Check, Filter } from "lucide-react";

export interface CustomerShareItem {
  customerName: string;
  totalRevenueIdr: number;
  totalRevenueFormatted: string;
  totalPairs: number;
  orderCount: number;
  percentage: number;
}

interface CustomerShareDonutProps {
  data: CustomerShareItem[];
  language: "id" | "en";
  selectedCustomer?: string | null;
  onSelectCustomer?: (customerName: string | null) => void;
}

// Multi-hue categorical palette strictly adhering to Crimson Scarcity
const CATEGORICAL_COLORS = [
  "#2563EB", // Royal Blue 600
  "#0D9488", // Teal 600
  "#D97706", // Amber 600
  "#7C3AED", // Violet 600
  "#059669", // Emerald 600
  "#64748B", // Slate 500 (Others)
];

export function CustomerShareDonut({
  data,
  language,
  selectedCustomer,
  onSelectCustomer,
}: CustomerShareDonutProps) {
  const isId = language === "id";
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-full flex flex-col items-center justify-center text-xs text-gray-400">
        {isId ? "Belum ada data pelanggan." : "No customer data available."}
      </div>
    );
  }

  // Calculate top 5 and remainder ("Others / Lainnya")
  const rawTop = data.slice(0, 5);
  const topTotalPercent = rawTop.reduce((acc, curr) => acc + curr.percentage, 0);
  const remainingPercent = Math.max(0, Math.round((100 - topTotalPercent) * 10) / 10);

  const displaySlices: Array<CustomerShareItem & { isOthers?: boolean }> = [...rawTop];
  if (remainingPercent > 0 && data.length > 5) {
    const othersRevenue = data.slice(5).reduce((acc, curr) => acc + curr.totalRevenueIdr, 0);
    const othersPairs = data.slice(5).reduce((acc, curr) => acc + curr.totalPairs, 0);
    const othersOrders = data.slice(5).reduce((acc, curr) => acc + curr.orderCount, 0);

    displaySlices.push({
      customerName: isId ? "Lainnya" : "Others",
      totalRevenueIdr: othersRevenue,
      totalRevenueFormatted: `Rp ${(othersRevenue / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} Jt`,
      totalPairs: othersPairs,
      orderCount: othersOrders,
      percentage: remainingPercent,
      isOthers: true,
    });
  }

  // SVG Donut metrics
  const radius = 58;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const topBuyer = rawTop[0];
  const activeIdx = hoveredIdx !== null 
    ? hoveredIdx 
    : (selectedCustomer ? displaySlices.findIndex((s) => s.customerName === selectedCustomer) : null);
  const activeItem = activeIdx !== null && activeIdx >= 0 ? displaySlices[activeIdx] : null;

  const handleSliceClick = (item: (typeof displaySlices)[0]) => {
    if (item.isOthers || !onSelectCustomer) return;
    if (selectedCustomer === item.customerName) {
      onSelectCustomer(null);
    } else {
      onSelectCustomer(item.customerName);
    }
  };

  return (
    <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs flex flex-col justify-between h-full space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" />
            <span>{isId ? "Pangsa Pasar & Konsentrasi Pelanggan" : "Customer Market Share & Concentration"}</span>
          </h3>
          <p className="text-[11px] text-gray-500">
            {isId ? "Klik pelanggan untuk memfilter kurva cetakan insole" : "Click a client to cross-filter footwear sizing bell curve"}
          </p>
        </div>
        {selectedCustomer && (
          <button
            onClick={() => onSelectCustomer && onSelectCustomer(null)}
            className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[10px] font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 flex items-center gap-1 transition"
            title={isId ? "Hapus filter pelanggan" : "Clear customer filter"}
          >
            <Filter className="h-3 w-3" />
            <span>{isId ? "Reset Filter" : "Reset Filter"}</span>
          </button>
        )}
      </div>

      {/* Donut & Legend Container */}
      <div className="flex flex-col sm:flex-row items-center gap-5 my-auto">
        {/* SVG Donut */}
        <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
          <svg
            viewBox="0 0 160 160"
            role="img"
            aria-label={isId ? "Grafik donat pangsa pasar pelanggan" : "Customer market share donut chart"}
            className="w-full h-full -rotate-90"
          >
            {displaySlices.map((cust, idx) => {
              const strokeDasharray = `${(cust.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += cust.percentage;
              const color = CATEGORICAL_COLORS[idx % CATEGORICAL_COLORS.length];
              const isSelected = selectedCustomer === cust.customerName;
              const isHovered = hoveredIdx === idx;
              const isInteractive = !cust.isOthers;

              return (
                <circle
                  key={idx}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={color}
                  strokeWidth={isHovered || isSelected ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  tabIndex={isInteractive ? 0 : -1}
                  role={isInteractive ? "button" : undefined}
                  aria-pressed={isInteractive ? isSelected : undefined}
                  aria-label={`${cust.customerName}: ${cust.percentage}% pangsa omzet (${cust.totalRevenueFormatted})`}
                  className={`transition-all duration-200 ${
                    isInteractive ? "cursor-pointer focus:outline-2 focus:outline-blue-500 focus:outline-offset-2" : "cursor-default"
                  } ${
                    isSelected ? "opacity-100 filter drop-shadow-md" : (selectedCustomer ? "opacity-45 hover:opacity-90" : "opacity-100")
                  }`}
                  onClick={() => isInteractive && handleSliceClick(cust)}
                  onKeyDown={(e) => {
                    if (isInteractive && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleSliceClick(cust);
                    }
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onFocus={() => isInteractive && setHoveredIdx(idx)}
                  onBlur={() => isInteractive && setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Center Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3">
            <span className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[90px]">
              {activeItem ? activeItem.customerName : (isId ? "Total Mitra" : "Total Clients")}
            </span>
            <span className="font-extrabold text-sm text-gray-900 dark:text-white font-mono">
              {activeItem ? `${activeItem.percentage}%` : `${data.length} Mitra`}
            </span>
            {activeItem && (
              <span className="text-[10px] text-gray-400 truncate max-w-[90px] block font-mono">
                {activeItem.totalRevenueFormatted}
              </span>
            )}
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 w-full space-y-1.5 text-xs">
          {displaySlices.map((cust, idx) => {
            const isHovered = hoveredIdx === idx;
            const isSelected = selectedCustomer === cust.customerName;
            const color = CATEGORICAL_COLORS[idx % CATEGORICAL_COLORS.length];
            const isInteractive = !cust.isOthers;

            return (
              <div
                key={idx}
                role={isInteractive ? "button" : undefined}
                tabIndex={isInteractive ? 0 : -1}
                aria-pressed={isInteractive ? isSelected : undefined}
                onClick={() => isInteractive && handleSliceClick(cust)}
                onKeyDown={(e) => {
                  if (isInteractive && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    handleSliceClick(cust);
                  }
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`p-2 rounded-xl flex items-center justify-between transition ${
                  isInteractive ? "cursor-pointer" : "cursor-default"
                } ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700 shadow-xs"
                    : isHovered && isInteractive
                    ? "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    : "bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className={`font-bold truncate ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-800 dark:text-gray-200"}`}>
                    {cust.customerName}
                  </span>
                  {isSelected && <Check className="h-3 w-3 text-blue-600 dark:text-blue-400 shrink-0" />}
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-extrabold text-gray-900 dark:text-white">
                    {cust.percentage}%
                  </span>
                  <span className="text-[10px] text-gray-400 block font-mono">
                    {cust.totalRevenueFormatted}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Insights Strip */}
      {topBuyer && (
        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Award className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-gray-600 dark:text-gray-300 text-[11px] truncate">
              {isId ? "Kontributor Terbesar:" : "Top Contributor:"} <strong className="text-gray-900 dark:text-white">{topBuyer.customerName}</strong>
            </span>
          </div>
          <span className="font-mono font-black text-xs text-brand dark:text-red-400 shrink-0 ml-2">
            {topBuyer.percentage}% {isId ? "Pangsa" : "Share"}
          </span>
        </div>
      )}
    </div>
  );
}
