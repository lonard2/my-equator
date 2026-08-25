"use client";

import React, { useState } from "react";
import { FootwearSize, SizeBreakdown } from "@/types";
import { Plus, Minus, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

interface TouchSizePadProps {
  sizes: SizeBreakdown;
  onChange: (newSizes: SizeBreakdown) => void;
  language: "id" | "en";
}

const STANDARD_SIZES: FootwearSize[] = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
const OVERSIZED_SIZES: FootwearSize[] = [46, 47, 48];

export function TouchSizePad({ sizes, onChange, language }: TouchSizePadProps) {
  const isId = language === "id";
  const [activeSize, setActiveSize] = useState<FootwearSize>(40);
  const [showOversized, setShowOversized] = useState(false);

  const displayedSizes = showOversized ? [...STANDARD_SIZES, ...OVERSIZED_SIZES] : STANDARD_SIZES;
  const currentQty = sizes[activeSize] || 0;

  const handleSetQty = (qty: number) => {
    const next = { ...sizes };
    if (qty <= 0) {
      delete next[activeSize];
    } else {
      next[activeSize] = Math.min(qty, 99999);
    }
    onChange(next);
  };

  const handleAdjust = (delta: number) => {
    const nextVal = Math.max(0, currentQty + delta);
    handleSetQty(nextVal);
  };

  return (
    <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#8B0000]" />
          <span className="font-bold text-xs text-gray-800 dark:text-gray-200 uppercase tracking-wide">
            {isId ? "Touch Sizing Pad (Tablet & Touch)" : "Touch Sizing Pad (Tablet Optimized)"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOversized(!showOversized)}
            className="text-[11px] font-semibold text-gray-500 hover:text-[#8B0000] dark:hover:text-red-400 flex items-center gap-0.5 transition"
          >
            <span>{showOversized ? (isId ? "Sembunyikan 46-48" : "Hide 46-48") : (isId ? "+ Jumbo EU 46-48" : "+ Oversize 46-48")}</span>
            {showOversized ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-900/60 text-xs font-semibold text-[#8B0000] dark:text-red-300">
            <span>EU {activeSize}:</span>
            <span className="font-mono font-extrabold text-sm">{currentQty}</span>
            <span className="text-[10px] text-gray-500">psg</span>
          </div>
        </div>
      </div>

      {/* Horizontal Size Selector Tiles */}
      <div className={`grid gap-1.5 ${showOversized ? "grid-cols-5 sm:grid-cols-13" : "grid-cols-5 sm:grid-cols-10"}`}>
        {displayedSizes.map((size) => {
          const qty = sizes[size] || 0;
          const isCurrent = activeSize === size;
          const isOversize = size >= 46;
          return (
            <button
              key={size}
              type="button"
              onClick={() => setActiveSize(size)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition min-h-[52px] active:scale-95 ${
                isCurrent
                  ? "bg-[#8B0000] text-white border-[#8B0000] shadow-md ring-2 ring-red-300 dark:ring-red-900"
                  : qty > 0
                  ? "bg-red-50/90 dark:bg-red-950/60 border-red-300 dark:border-red-900 text-[#8B0000] dark:text-red-300 font-bold"
                  : isOversize
                  ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 hover:bg-amber-100"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <span className="font-mono font-extrabold text-xs">{size}</span>
              <span className={`text-[10px] font-semibold ${isCurrent ? "text-red-100" : qty > 0 ? "text-[#8B0000] dark:text-red-300 font-mono font-bold" : "text-gray-400"}`}>
                {qty > 0 ? `${qty}` : "-"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stepper Controls & Color-Coded Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => handleAdjust(-10)}
            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 active:scale-95 transition"
          >
            -10
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(-1)}
            aria-label={isId ? "Kurangi 1 pasang" : "Decrease 1 pair"}
            className="p-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 active:scale-95 transition"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={currentQty || ""}
            onChange={(e) => {
              const clean = e.target.value.replace(/[^0-9]/g, "");
              handleSetQty(parseInt(clean, 10) || 0);
            }}
            placeholder="0"
            className="w-16 text-center font-extrabold text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-1 font-mono text-[#8B0000] dark:text-red-400 focus:border-[#8B0000] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleAdjust(1)}
            aria-label={isId ? "Tambah 1 pasang" : "Increase 1 pair"}
            className="p-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(10)}
            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 active:scale-95 transition"
          >
            +10
          </button>
        </div>

        {/* Color-Coded Presets for Fast Visual Recognition */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => handleAdjust(50)}
            className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 active:scale-95 transition"
          >
            +50 psg
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(100)}
            className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 active:scale-95 transition"
          >
            +100 psg
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(200)}
            className="px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-900 text-xs font-bold text-[#8B0000] dark:text-red-300 hover:bg-red-100 active:scale-95 transition"
          >
            +200 psg
          </button>
          <button
            type="button"
            onClick={() => handleSetQty(0)}
            className="px-2 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-300 active:scale-95 transition flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>{isId ? "Reset" : "Clear"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
