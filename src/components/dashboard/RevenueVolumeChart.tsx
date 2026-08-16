"use client";

import React, { useState } from "react";
import { TrendingUp, BarChart2, DollarSign, Package } from "lucide-react";
import { formatIDR } from "@/lib/utils/formatters";

interface MonthlyTrendItem {
  monthKey: string;
  monthLabel: string;
  revenueIdr: number;
  revenueFormatted: string;
  volumePairs: number;
  orderCount: number;
}

interface RevenueVolumeChartProps {
  data: MonthlyTrendItem[];
  language: "id" | "en";
}

export function RevenueVolumeChart({ data, language }: RevenueVolumeChartProps) {
  const isId = language === "id";
  const [metric, setMetric] = useState<"REVENUE" | "VOLUME">("REVENUE");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-gray-400">
        {isId ? "Belum ada data transaksi bulanan." : "No monthly transaction data available."}
      </div>
    );
  }

  const values = data.map((d) => (metric === "REVENUE" ? d.revenueIdr : d.volumePairs));
  const maxVal = Math.max(...values, 1);
  const chartHeight = 180;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingY = 20;

  const points = data.map((d, idx) => {
    const x = paddingX + (idx / Math.max(data.length - 1, 1)) * (chartWidth - 2 * paddingX);
    const val = metric === "REVENUE" ? d.revenueIdr : d.volumePairs;
    const y = chartHeight - paddingY - (val / maxVal) * (chartHeight - 2 * paddingY);
    return { x, y, data: d, val };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  return (
    <div className="p-4 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3 shadow-xs">
      {/* Header & Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#8B0000]" />
            <span>{isId ? "Tren Pendapatan & Volume Bulanan" : "Monthly Revenue & Volume Trends"}</span>
          </h3>
          <p className="text-[11px] text-gray-500">
            {isId ? "Visualisasi performa pesanan dan total pasang insole terkirim" : "Monthly factory order performance & volume output"}
          </p>
        </div>

        {/* Metric Switcher Tabs */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 text-[11px] font-bold">
          <button
            onClick={() => setMetric("REVENUE")}
            className={`px-3 py-1 rounded-lg transition ${
              metric === "REVENUE"
                ? "bg-white dark:bg-gray-700 text-[#8B0000] dark:text-red-300 shadow-xs"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {isId ? "Omzet (IDR)" : "Revenue (IDR)"}
          </button>
          <button
            onClick={() => setMetric("VOLUME")}
            className={`px-3 py-1 rounded-lg transition ${
              metric === "VOLUME"
                ? "bg-white dark:bg-gray-700 text-[#8B0000] dark:text-red-300 shadow-xs"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {isId ? "Volume (Pasang)" : "Volume (Pairs)"}
          </button>
        </div>
      </div>

      {/* Interactive SVG Chart Container */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-48 drop-shadow-xs"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B0000" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#8B0000" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = chartHeight - paddingY - pct * (chartHeight - 2 * paddingY);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="0.75"
                  strokeDasharray="3,3"
                  className="dark:stroke-gray-800"
                />
                <text
                  x={paddingX - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="7"
                  className="fill-gray-400 font-mono"
                >
                  {metric === "REVENUE"
                    ? `Rp ${Math.round((maxVal * pct) / 1000000)}jt`
                    : Math.round(maxVal * pct)}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Stroke Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#8B0000"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, idx) => (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === idx ? 6 : 4}
                className="fill-white stroke-[#8B0000] stroke-2 transition-all duration-150"
              />
              {/* X-Axis Month Label */}
              <text
                x={p.x}
                y={chartHeight - 6}
                textAnchor="middle"
                fontSize="8"
                className="fill-gray-500 dark:fill-gray-400 font-semibold"
              >
                {p.data.monthLabel}
              </text>
            </g>
          ))}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 p-2 rounded-xl bg-gray-900 text-white text-xs shadow-xl pointer-events-none border border-gray-700 animate-in fade-in zoom-in-95 duration-100"
          >
            <p className="font-bold text-[11px] text-red-300">
              {points[hoveredIndex].data.monthLabel}
            </p>
            <p className="font-extrabold text-sm">
              {metric === "REVENUE"
                ? points[hoveredIndex].data.revenueFormatted
                : `${points[hoveredIndex].data.volumePairs.toLocaleString("id-ID")} pasang`}
            </p>
            <p className="text-[10px] text-gray-400">
              {points[hoveredIndex].data.orderCount} Surat Jalan • {points[hoveredIndex].data.volumePairs} pasang
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
