"use client";

import React, { useState } from "react";
import { Compass, Flame, Info } from "lucide-react";

interface SizeItem {
  size: number;
  totalPairs: number;
  percentage: number;
  isPeak: boolean;
}

interface SizeBellCurveChartProps {
  data: SizeItem[];
  language: "id" | "en";
}

export function SizeBellCurveChart({ data, language }: SizeBellCurveChartProps) {
  const isId = language === "id";
  const [hoveredSize, setHoveredSize] = useState<SizeItem | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-gray-400">
        {isId ? "Belum ada data distribusi ukuran." : "No size distribution data available."}
      </div>
    );
  }

  const maxPairs = Math.max(...data.map((d) => d.totalPairs), 1);
  const chartHeight = 180;
  const chartWidth = 500;
  const paddingX = 35;
  const paddingY = 25;

  const points = data.map((d, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * (chartWidth - 2 * paddingX);
    const y = chartHeight - paddingY - (d.totalPairs / maxPairs) * (chartHeight - 2 * paddingY);
    return { x, y, data: d };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  // Find peak size
  const peakItem = data.find((d) => d.isPeak) || data[0];

  return (
    <div className="p-4 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Compass className="h-4 w-4 text-[#8B0000]" />
            <span>{isId ? "Kurva Distribusi Ukuran Sepatu (EU 35–48)" : "Size Matrix Bell Curve (EU 35–48)"}</span>
          </h3>
          <p className="text-[11px] text-gray-500">
            {isId
              ? "Distribusi normal produksi pabrik & identifikasi ukuran cetakan terpadat"
              : "Factory sizing breakdown & peak tooling volume distribution"}
          </p>
        </div>

        {peakItem && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 text-xs font-bold shadow-xs">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            <span>
              {isId ? `Puncak: Size EU ${peakItem.size}` : `Peak: EU ${peakItem.size}`}
            </span>
          </div>
        )}
      </div>

      {/* SVG Bell Curve */}
      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-48 drop-shadow-xs">
          <defs>
            <linearGradient id="bellGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B0000" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8B0000" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid Baseline */}
          <line
            x1={paddingX}
            y1={chartHeight - paddingY}
            x2={chartWidth - paddingX}
            y2={chartHeight - paddingY}
            stroke="#cbd5e1"
            strokeWidth="1.5"
            className="dark:stroke-gray-800"
          />

          {/* Bell Area */}
          <path d={areaD} fill="url(#bellGradient)" />

          {/* Bell Smooth Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#8B0000"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Column Bars & Markers */}
          {points.map((p, idx) => {
            const isHovered = hoveredSize?.size === p.data.size;
            const barWidth = 14;
            const barHeight = chartHeight - paddingY - p.y;

            return (
              <g
                key={idx}
                tabIndex={0}
                role="graphics-symbol"
                aria-label={`Ukuran EU ${p.data.size}: ${p.data.totalPairs} pasang (${p.data.percentage}%)${p.data.isPeak ? ", Puncak Produksi" : ""}`}
                className="cursor-pointer focus:outline-none"
                onMouseEnter={() => setHoveredSize(p.data)}
                onMouseLeave={() => setHoveredSize(null)}
                onFocus={() => setHoveredSize(p.data)}
                onBlur={() => setHoveredSize(null)}
              >
                {/* Subtle vertical bar */}
                <rect
                  x={p.x - barWidth / 2}
                  y={p.y}
                  width={barWidth}
                  height={barHeight}
                  rx="3"
                  className={`${
                    p.data.isPeak
                      ? "fill-red-700/60 dark:fill-red-500/60"
                      : isHovered
                      ? "fill-red-500/40"
                      : "fill-gray-300/30 dark:fill-gray-700/30"
                  } transition-colors`}
                />

                {/* Point circle */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.data.isPeak ? 5.5 : isHovered ? 5 : 3.5}
                  className={`${
                    p.data.isPeak
                      ? "fill-red-600 stroke-white stroke-2"
                      : "fill-white stroke-[#8B0000] stroke-2"
                  }`}
                />

                {/* Size Label */}
                <text
                  x={p.x}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  fontSize="8"
                  className={`font-mono font-bold ${
                    p.data.isPeak
                      ? "fill-[#8B0000] dark:fill-red-400 font-extrabold text-[9px]"
                      : "fill-gray-600 dark:fill-gray-400"
                  }`}
                >
                  {p.data.size}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredSize && (
          <div className="absolute top-2 right-4 p-2.5 rounded-2xl bg-gray-900 text-white text-xs shadow-xl pointer-events-none border border-gray-700 animate-in fade-in zoom-in-95 duration-100">
            <p className="font-extrabold text-sm text-red-300">
              EU {hoveredSize.size}
            </p>
            <p className="font-bold">
              {hoveredSize.totalPairs.toLocaleString("id-ID")} pasang ({hoveredSize.percentage}%)
            </p>
            <p className="text-[10px] text-gray-400">
              {hoveredSize.isPeak ? "Ukuran paling diminati buyer" : "Porsi produksi pabrik"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
