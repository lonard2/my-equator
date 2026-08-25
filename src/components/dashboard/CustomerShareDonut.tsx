"use client";

import React, { useState } from "react";
import { Users, PieChart as PieIcon, Award } from "lucide-react";

interface CustomerShareItem {
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
}

const COLORS = [
  "#8B0000", // Dark Red (Brand)
  "#DC2626", // Red 600
  "#F59E0B", // Amber 500
  "#10B981", // Emerald 500
  "#3B82F6", // Blue 500
  "#8B5CF6", // Purple 500
  "#EC4899", // Pink 500
];

export function CustomerShareDonut({ data, language }: CustomerShareDonutProps) {
  const isId = language === "id";
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-5 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-full flex flex-col items-center justify-center text-xs text-gray-400">
        {isId ? "Belum ada data pelanggan." : "No customer data available."}
      </div>
    );
  }

  // Calculate SVG Donut arcs
  const radius = 58;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const topCustomers = data.slice(0, 5);
  const topBuyer = topCustomers[0];

  return (
    <div className="p-5 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs flex flex-col justify-between h-full space-y-4">
      {/* Header */}
      <div>
        <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="h-4 w-4 text-[#8B0000]" />
          <span>{isId ? "Pangsa Pasar & Konsentrasi Pelanggan" : "Customer Market Share & Concentration"}</span>
        </h3>
        <p className="text-[11px] text-gray-500">
          {isId ? "Distribusi omzet per brand pabrik sepatu mitra" : "Revenue share breakdown across footwear brand clients"}
        </p>
      </div>

      {/* Donut & Legend Container */}
      <div className="flex flex-col sm:flex-row items-center gap-5 my-auto">
        {/* SVG Donut */}
        <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
            {topCustomers.map((cust, idx) => {
              const strokeDasharray = `${(cust.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += cust.percentage;
              const color = COLORS[idx % COLORS.length];

              return (
                <circle
                  key={idx}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={color}
                  strokeWidth={hoveredIdx === idx ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  tabIndex={0}
                  role="graphics-symbol"
                  aria-label={`${cust.customerName}: ${cust.percentage}% pangsa omzet (${cust.totalRevenueFormatted})`}
                  className="transition-all duration-200 cursor-pointer focus:outline-none"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onFocus={() => setHoveredIdx(idx)}
                  onBlur={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Center Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[10px] text-gray-400 font-bold uppercase">
              {hoveredIdx !== null ? "Share" : "Total Buyer"}
            </span>
            <span className="font-extrabold text-sm text-gray-900 dark:text-white">
              {hoveredIdx !== null ? `${topCustomers[hoveredIdx].percentage}%` : `${data.length} Mitra`}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 w-full space-y-1.5 text-xs">
          {topCustomers.map((cust, idx) => {
            const isHovered = hoveredIdx === idx;
            const color = COLORS[idx % COLORS.length];

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition ${
                  isHovered
                    ? "bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40"
                    : "bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-bold text-gray-800 dark:text-gray-200 truncate">
                    {cust.customerName}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-extrabold text-gray-900 dark:text-white">
                    {cust.percentage}%
                  </span>
                  <span className="text-[10px] text-gray-400 block">
                    {cust.totalRevenueFormatted}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Insights Strip to Fill Card Height Naturally */}
      {topBuyer && (
        <div className="p-2.5 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-[#8B0000] dark:text-red-400 shrink-0" />
            <span className="text-gray-600 dark:text-gray-300 text-[11px]">
              {isId ? "Kontributor Utama:" : "Top Contributor:"} <strong className="text-gray-900 dark:text-white">{topBuyer.customerName}</strong>
            </span>
          </div>
          <span className="font-mono font-black text-xs text-[#8B0000] dark:text-red-300">
            {topBuyer.percentage}% {isId ? "Omzet" : "Share"}
          </span>
        </div>
      )}
    </div>
  );
}
