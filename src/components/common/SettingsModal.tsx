"use client";

import React from "react";
import { DensityMode, LayoutWidth, ThemeMode, Language } from "@/types";
import { X, Sliders, Sun, Moon, Type, Layout, Globe, Check } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  density: DensityMode;
  onDensityChange: (density: DensityMode) => void;
  layoutWidth: LayoutWidth;
  onLayoutWidthChange: (width: LayoutWidth) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  density,
  onDensityChange,
  layoutWidth,
  onLayoutWidthChange,
  theme,
  onThemeChange,
  language,
  onLanguageChange,
}: SettingsModalProps) {
  const isId = language === "id";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-[#8B0000] dark:text-red-400" />
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                {isId ? "Pengaturan Tampilan & Tipografi" : "Display & Typography Settings"}
              </h3>
              <p className="text-[11px] text-gray-500">
                {isId ? "Kustomisasi skala huruf, layout, dan tema" : "Customize font size, width & theme"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-5 text-xs">
          {/* 1. Real Font Scaling / Density */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200 font-bold uppercase tracking-wider text-[11px]">
              <Type className="h-3.5 w-3.5 text-[#8B0000] dark:text-red-400" />
              <span>{isId ? "Skala Ukuran Huruf (Typography Scale)" : "Font Size Scale"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "compact", label: isId ? "Kompak" : "Compact", size: "13.5px", desc: isId ? "Tampilan padat" : "Dense data" },
                { id: "normal", label: isId ? "Normal" : "Normal", size: "16.0px", desc: isId ? "Standar pabrik" : "Default" },
                { id: "large", label: isId ? "Besar" : "Large", size: "19.0px", desc: isId ? "Jelas & nyaman" : "Easy read" },
              ].map((item) => {
                const isSelected = density === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onDensityChange(item.id as DensityMode)}
                    className={`p-3 rounded-xl border text-left font-medium transition ${
                      isSelected
                        ? "border-[#8B0000] bg-red-50 dark:bg-red-950/60 text-[#8B0000] dark:text-red-300 shadow-xs ring-1 ring-[#8B0000]"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <p className="font-bold text-xs">{item.label}</p>
                    <p className="text-[11px] font-mono text-[#8B0000] dark:text-red-400 font-bold mt-0.5">{item.size}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Layout Max Width */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200 font-bold uppercase tracking-wider text-[11px]">
              <Layout className="h-3.5 w-3.5 text-[#8B0000] dark:text-red-400" />
              <span>{isId ? "Lebar Ruang Kerja (Layout Width)" : "Workspace Width"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "fluid", label: isId ? "Fluid (100%)" : "Fluid (100%)", desc: isId ? "Memenuhi layar penuh" : "Full width" },
                { id: "boxed", label: isId ? "Boxed (1240px)" : "Boxed (1240px)", desc: isId ? "Terpusat rapi" : "Centered max width" },
              ].map((item) => {
                const isSelected = layoutWidth === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onLayoutWidthChange(item.id as LayoutWidth)}
                    className={`p-3 rounded-xl border text-left font-medium transition ${
                      isSelected
                        ? "border-[#8B0000] bg-red-50 dark:bg-red-950/60 text-[#8B0000] dark:text-red-300 shadow-xs ring-1 ring-[#8B0000]"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <p className="font-bold text-xs">{item.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Theme & Language */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-800">
            <div className="space-y-1.5">
              <span className="font-bold text-gray-700 dark:text-gray-300 text-[11px] uppercase tracking-wide">
                {isId ? "Tema Warna" : "Theme"}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onThemeChange("light")}
                  className={`flex-1 py-2 px-2 rounded-lg border text-center font-bold flex items-center justify-center gap-1.5 ${
                    theme === "light"
                      ? "border-[#8B0000] bg-red-50 text-[#8B0000] ring-1 ring-[#8B0000]"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => onThemeChange("dark")}
                  className={`flex-1 py-2 px-2 rounded-lg border text-center font-bold flex items-center justify-center gap-1.5 ${
                    theme === "dark"
                      ? "border-red-500 bg-red-950/80 text-red-300 ring-1 ring-red-500"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-gray-700 dark:text-gray-300 text-[11px] uppercase tracking-wide">
                {isId ? "Bahasa" : "Language"}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onLanguageChange("id")}
                  className={`flex-1 py-2 px-2 rounded-lg border text-center font-bold flex items-center justify-center gap-1 ${
                    language === "id"
                      ? "border-[#8B0000] bg-red-50 text-[#8B0000] ring-1 ring-[#8B0000]"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  <span>🇮🇩 ID</span>
                </button>
                <button
                  onClick={() => onLanguageChange("en")}
                  className={`flex-1 py-2 px-2 rounded-lg border text-center font-bold flex items-center justify-center gap-1 ${
                    language === "en"
                      ? "border-[#8B0000] bg-red-50 text-[#8B0000] ring-1 ring-[#8B0000]"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  <span>🇬🇧 EN</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#8B0000] hover:bg-[#A00000] text-xs font-bold text-white shadow-xs transition"
          >
            {isId ? "Tutup & Terapkan" : "Apply & Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
