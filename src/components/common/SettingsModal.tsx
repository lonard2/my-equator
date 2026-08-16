"use client";

import React from "react";
import { DensityMode, LayoutWidth, ThemeMode, Language } from "@/types";
import { X, Sliders, Sun, Moon, Type, Layout, Check } from "lucide-react";

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

  const fontOptions: Array<{
    id: DensityMode;
    label: string;
    size: string;
    desc: string;
  }> = [
    {
      id: "xs",
      label: isId ? "Ekstra Kompak" : "Extra Compact",
      size: "12.5px",
      desc: isId ? "Maksimal data (20+ baris)" : "Max data density",
    },
    {
      id: "compact",
      label: isId ? "Kompak" : "Compact",
      size: "14.0px",
      desc: isId ? "Padat operasional pabrik" : "Dense factory view",
    },
    {
      id: "normal",
      label: isId ? "Standar" : "Standard",
      size: "16.0px",
      desc: isId ? "Seimbang & nyaman" : "Balanced default",
    },
    {
      id: "large",
      label: isId ? "Besar (Tablet)" : "Large (Tablet)",
      size: "18.0px",
      desc: isId ? "Optimal layar sentuh tablet" : "Optimal for touch tablets",
    },
    {
      id: "xl",
      label: isId ? "Ekstra Besar" : "Extra Large",
      size: "20.5px",
      desc: isId ? "Jarak jauh / wall monitor" : "High visibility / distance",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-xs border border-red-100 dark:border-red-900/40">
              <Sliders className="h-5 w-5 text-[#8B0000] dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                {isId ? "Pengaturan Tampilan & Tipografi" : "Display & Typography Settings"}
              </h3>
              <p className="text-[11px] text-gray-500">
                {isId ? "Kustomisasi skala huruf, layout kerja, dan tema visual" : "Customize font size, width & theme"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-5 text-xs">
          {/* 1. 5-Tier Real Font Scaling / Density */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-gray-800 dark:text-gray-200 font-bold uppercase tracking-wider text-[11px]">
              <div className="flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5 text-[#8B0000] dark:text-red-400" />
                <span>{isId ? "Skala Ukuran Huruf (5 Pilihan)" : "Font Size Scale (5 Options)"}</span>
              </div>
              <span className="text-[#8B0000] dark:text-red-400 font-mono font-extrabold normal-case">
                {fontOptions.find((o) => o.id === density)?.size}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
              {fontOptions.map((item) => {
                const isSelected = density === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onDensityChange(item.id)}
                    className={`p-2.5 rounded-2xl border text-center transition flex flex-col justify-between items-center relative active:scale-95 hover:shadow-xs ${
                      isSelected
                        ? "border-[#8B0000] bg-red-50 dark:bg-red-950/70 text-[#8B0000] dark:text-red-200 ring-2 ring-[#8B0000]"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <span className="font-bold text-xs">{item.label}</span>
                    <span className="font-mono text-[11px] font-bold text-[#8B0000] dark:text-red-400 my-0.5">
                      {item.size}
                    </span>
                    <span className="text-[9px] text-gray-500 line-clamp-1">{item.desc}</span>
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
                { id: "fluid", label: isId ? "Fluid (100% Layar)" : "Fluid (100% Full Width)", desc: isId ? "Maksimal ruang monitor" : "Full widescreen canvas" },
                { id: "boxed", label: isId ? "Boxed (1280px)" : "Boxed (1280px Centered)", desc: isId ? "Terpusat nyaman di tengah" : "Comfortable center column" },
              ].map((item) => {
                const isSelected = layoutWidth === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onLayoutWidthChange(item.id as LayoutWidth)}
                    className={`p-3 rounded-2xl border text-left font-medium transition active:scale-95 hover:shadow-xs ${
                      isSelected
                        ? "border-[#8B0000] bg-red-50 dark:bg-red-950/70 text-[#8B0000] dark:text-red-200 ring-2 ring-[#8B0000]"
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
                  className={`flex-1 py-2 px-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 active:scale-95 transition ${
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
                  className={`flex-1 py-2 px-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 active:scale-95 transition ${
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
                {isId ? "Bahasa Antarmuka" : "Language"}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onLanguageChange("id")}
                  className={`flex-1 py-2 px-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1 active:scale-95 transition ${
                    language === "id"
                      ? "border-[#8B0000] bg-red-50 text-[#8B0000] ring-1 ring-[#8B0000]"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  <span>🇮🇩 ID</span>
                </button>
                <button
                  onClick={() => onLanguageChange("en")}
                  className={`flex-1 py-2 px-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1 active:scale-95 transition ${
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
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#8B0000] hover:bg-[#A00000] text-xs font-bold text-white shadow-md hover:shadow-lg hover:shadow-red-900/20 active:scale-95 transition"
          >
            {isId ? "Tutup & Terapkan" : "Apply & Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
