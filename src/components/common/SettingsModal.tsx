"use client";

import React from "react";
import { DeviceViewMode, DensityMode, LayoutWidth, ThemeMode, Language } from "@/types";
import { X, Sliders, Monitor, Tablet, Smartphone, Sparkles, Sun, Moon, Globe, Check } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceMode: DeviceViewMode | "AUTO";
  onDeviceModeChange: (mode: DeviceViewMode | "AUTO") => void;
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
  deviceMode,
  onDeviceModeChange,
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
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-[#8B0000] dark:text-red-400" />
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                {isId ? "Pengaturan Tampilan & UI (Preferences)" : "UI & Display Preferences"}
              </h3>
              <p className="text-[11px] text-gray-500">
                {isId ? "Kustomisasi skala huruf, lebar layout, dan adaptasi perangkat" : "Customize font scale and layout"}
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

        {/* Content */}
        <div className="p-5 space-y-5 text-xs">
          {/* 1. Responsiveness / Device Simulation */}
          <div className="space-y-2">
            <label className="font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider text-[11px]">
              {isId ? "Mode Responsif Perangkat" : "Responsive Device Mode"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "AUTO", label: isId ? "Otomatis" : "Auto Fluid", icon: Sparkles },
                { id: "DESKTOP", label: "Desktop", icon: Monitor },
                { id: "TABLET", label: "Tablet", icon: Tablet },
                { id: "MOBILE", label: "Mobile", icon: Smartphone },
              ].map((item) => {
                const isSelected = deviceMode === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onDeviceModeChange(item.id as any)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border font-semibold transition gap-1.5 ${
                      isSelected
                        ? "border-[#8B0000] bg-red-50 dark:bg-red-950/60 text-[#8B0000] dark:text-red-300 shadow-xs"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[11px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. UI Density & Font Scaling */}
          <div className="space-y-2">
            <label className="font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider text-[11px]">
              {isId ? "Kerapatan Tampilan & Skala Font (UI Density)" : "UI Density & Scaling"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "compact", label: isId ? "Kompak (0.9x)" : "Compact", desc: "Data padat" },
                { id: "normal", label: isId ? "Normal (1.0x)" : "Normal", desc: "Standar" },
                { id: "large", label: isId ? "Besar (1.1x)" : "Large", desc: "Mudah dibaca" },
              ].map((item) => {
                const isSelected = density === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onDensityChange(item.id as DensityMode)}
                    className={`p-2.5 rounded-xl border text-left font-medium transition ${
                      isSelected
                        ? "border-[#8B0000] bg-red-50 dark:bg-red-950/60 text-[#8B0000] dark:text-red-300 shadow-xs"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <p className="font-bold text-xs">{item.label}</p>
                    <p className="text-[10px] text-gray-500">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Layout Width */}
          <div className="space-y-2">
            <label className="font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider text-[11px]">
              {isId ? "Lebar Ruang Kerja (Layout Width)" : "Workspace Width"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "fluid", label: isId ? "Lebar Penuh (Fluid 100%)" : "Fluid (Full Width)", desc: "Maksimal monitor lebar" },
                { id: "boxed", label: isId ? "Kotak (Boxed 1200px)" : "Boxed (1200px)", desc: "Terpusat di tengah" },
              ].map((item) => {
                const isSelected = layoutWidth === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onLayoutWidthChange(item.id as LayoutWidth)}
                    className={`p-2.5 rounded-xl border text-left font-medium transition ${
                      isSelected
                        ? "border-[#8B0000] bg-red-50 dark:bg-red-950/60 text-[#8B0000] dark:text-red-300 shadow-xs"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <p className="font-bold text-xs">{item.label}</p>
                    <p className="text-[10px] text-gray-500">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Theme & Language Quick Row */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-800">
            <div className="space-y-1.5">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{isId ? "Tema Warna:" : "Theme:"}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => onThemeChange("light")}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-center font-bold flex items-center justify-center gap-1.5 ${
                    theme === "light"
                      ? "border-[#8B0000] bg-red-50 text-[#8B0000]"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600"
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span>Terang</span>
                </button>
                <button
                  onClick={() => onThemeChange("dark")}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-center font-bold flex items-center justify-center gap-1.5 ${
                    theme === "dark"
                      ? "border-red-500 bg-red-950/80 text-red-300"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600"
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  <span>Gelap</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{isId ? "Bahasa:" : "Language:"}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => onLanguageChange("id")}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-center font-bold flex items-center justify-center gap-1 ${
                    language === "id"
                      ? "border-[#8B0000] bg-red-50 text-[#8B0000]"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600"
                  }`}
                >
                  <span>🇮🇩 ID</span>
                </button>
                <button
                  onClick={() => onLanguageChange("en")}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-center font-bold flex items-center justify-center gap-1 ${
                    language === "en"
                      ? "border-[#8B0000] bg-red-50 text-[#8B0000]"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600"
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
            className="px-4 py-1.5 rounded-lg bg-[#8B0000] hover:bg-[#A00000] text-xs font-bold text-white shadow-xs transition"
          >
            {isId ? "Tutup & Terapkan" : "Close & Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
