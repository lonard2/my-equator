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
    <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand" />
          <span className="font-bold text-xs text-gray-800 dark:text-gray-200 uppercase tracking-wide">
            {isId ? "Touch Sizing Pad (Tablet & Touch)" : "Touch Sizing Pad (Tablet Optimized)"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOversized(!showOversized)}
            className="text-[11px] font-semibold text-gray-500 hover:text-brand dark:hover:text-red-400 flex items-center gap-0.5 transition"
          >
            <span>{showOversized ? (isId ? "Sembunyikan 46-48" : "Hide 46-48") : (isId ? "+ Jumbo EU 46-48" : "+ Oversize 46-48")}</span>
            {showOversized ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-900/60 text-xs font-semibold text-brand dark:text-red-300">
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
              aria-label={isId ? `Pilih ukuran ${size}, saat ini ${qty > 0 ? `${qty} pasang` : "0 pasang"}` : `Select size ${size}, currently ${qty > 0 ? `${qty} pairs` : "0 pairs"}`}
              aria-pressed={isCurrent}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition min-h-[52px] active:scale-95 ${
                isCurrent
                  ? "bg-brand text-white border-brand shadow-md ring-2 ring-red-300 dark:ring-red-900"
                  : qty > 0
                  ? "bg-red-50/90 dark:bg-red-950/60 border-red-300 dark:border-red-900 text-brand dark:text-red-300 font-bold"
                  : isOversize
                  ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 hover:bg-amber-100"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <span className="font-mono font-extrabold text-xs">{size}</span>
              <span className={`text-[10px] font-semibold ${isCurrent ? "text-red-100" : qty > 0 ? "text-brand dark:text-red-300 font-mono font-bold" : "text-gray-400"}`}>
                {qty > 0 ? `${qty}` : "-"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Two labeled control clusters: adjust the count, or jump by preset */}
      <div className="space-y-2.5 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            {isId ? "Ubah Jumlah" : "Adjust Quantity"}
          </p>
          <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => handleAdjust(-10)}
            aria-label={isId ? "Kurangi 10 pasang" : "Decrease 10 pairs"}
            className="min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 active:scale-95 transition flex items-center justify-center"
          >
            -10
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(-1)}
            aria-label={isId ? "Kurangi 1 pasang" : "Decrease 1 pair"}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 active:scale-95 transition flex items-center justify-center"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={currentQty || ""}
            aria-label={isId ? `Jumlah pasang ukuran ${activeSize}` : `Quantity for size ${activeSize}`}
            onChange={(e) => {
              const clean = e.target.value.replace(/[^0-9]/g, "");
              handleSetQty(parseInt(clean, 10) || 0);
            }}
            placeholder="0"
            className="w-16 min-h-[44px] text-center font-extrabold text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-1 font-mono text-brand dark:text-red-400 focus:border-brand focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleAdjust(1)}
            aria-label={isId ? "Tambah 1 pasang" : "Increase 1 pair"}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 active:scale-95 transition flex items-center justify-center"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(10)}
            aria-label={isId ? "Tambah 10 pasang" : "Increase 10 pairs"}
            className="min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 active:scale-95 transition flex items-center justify-center"
          >
            +10
          </button>
          <button
            type="button"
            onClick={() => handleSetQty(0)}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-300 active:scale-95 transition flex items-center gap-1.5 justify-center"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{isId ? "Reset" : "Clear"}</span>
          </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            {isId ? "Preset Cepat" : "Quick Presets"}
          </p>
          <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => handleAdjust(50)}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 active:scale-95 transition flex items-center justify-center"
          >
            +50 psg
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(100)}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 active:scale-95 transition flex items-center justify-center"
          >
            +100 psg
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(200)}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-900 text-xs font-bold text-brand dark:text-red-300 hover:bg-red-100 active:scale-95 transition flex items-center justify-center"
          >
            +200 psg
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
