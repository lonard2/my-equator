"use client";

import React, { useState } from "react";
import { FootwearSize, SizeBreakdown } from "@/types";
import { Plus, Minus, Check } from "lucide-react";

interface TouchSizePadProps {
  sizes: SizeBreakdown;
  onChange: (newSizes: SizeBreakdown) => void;
  language: "id" | "en";
}

const STANDARD_SIZES: FootwearSize[] = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

export function TouchSizePad({ sizes, onChange, language }: TouchSizePadProps) {
  const isId = language === "id";
  const [activeSize, setActiveSize] = useState<FootwearSize>(40);

  const currentQty = sizes[activeSize] || 0;

  const handleSetQty = (qty: number) => {
    const next = { ...sizes };
    if (qty <= 0) {
      delete next[activeSize];
    } else {
      next[activeSize] = qty;
    }
    onChange(next);
  };

  const handleAdjust = (delta: number) => {
    const nextVal = Math.max(0, currentQty + delta);
    handleSetQty(nextVal);
  };

  return (
    <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs text-gray-800 dark:text-gray-200 uppercase tracking-wide">
          {isId ? "Touch Size Pad (Khusus Layar Tablet / Touch)" : "Touch Sizing Pad (Tablet Optimized)"}
        </span>
        <span className="text-[11px] font-semibold text-[#8B0000] dark:text-red-400">
          Size {activeSize}: <strong className="text-sm">{currentQty}</strong> psg
        </span>
      </div>

      {/* Horizontal Size Selector Tiles */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
        {STANDARD_SIZES.map((size) => {
          const qty = sizes[size] || 0;
          const isCurrent = activeSize === size;
          return (
            <button
              key={size}
              type="button"
              onClick={() => setActiveSize(size)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition min-h-[50px] ${
                isCurrent
                  ? "bg-[#8B0000] text-white border-[#8B0000] shadow-md ring-2 ring-red-300"
                  : qty > 0
                  ? "bg-red-50 dark:bg-red-950/60 border-red-300 text-[#8B0000] dark:text-red-300 font-bold"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100"
              }`}
            >
              <span className="font-mono font-extrabold text-xs">{size}</span>
              <span className={`text-[10px] font-semibold ${isCurrent ? "text-red-100" : "text-gray-500"}`}>
                {qty > 0 ? `${qty}` : "-"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick Stepper & Preset Buttons for Active Size */}
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
            className="p-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 active:scale-95 transition"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            value={currentQty || ""}
            onChange={(e) => handleSetQty(parseInt(e.target.value, 10) || 0)}
            placeholder="0"
            className="w-16 text-center font-extrabold text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-1 font-mono text-[#8B0000] dark:text-red-400"
          />
          <button
            type="button"
            onClick={() => handleAdjust(1)}
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

        {/* Rapid Batch Presets (+50, +100, +200 pasang) */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => handleAdjust(50)}
            className="px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-xs font-bold text-[#8B0000] dark:text-red-300 hover:bg-red-100 active:scale-95 transition"
          >
            +50 psg
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(100)}
            className="px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-xs font-bold text-[#8B0000] dark:text-red-300 hover:bg-red-100 active:scale-95 transition"
          >
            +100 psg
          </button>
          <button
            type="button"
            onClick={() => handleSetQty(0)}
            className="px-2 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition"
          >
            {isId ? "Reset" : "Clear"}
          </button>
        </div>
      </div>
    </div>
  );
}
