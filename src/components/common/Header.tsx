"use client";

import React from "react";
import { Monitor, Tablet, Smartphone, Moon, Sun, Globe, Sliders, Sparkles } from "lucide-react";
import { DeviceViewMode, ThemeMode, Language } from "@/types";

interface HeaderProps {
  deviceMode: DeviceViewMode | "AUTO";
  onDeviceModeChange: (mode: DeviceViewMode | "AUTO") => void;
  theme: ThemeMode;
  onThemeToggle: () => void;
  language: Language;
  onLanguageToggle: () => void;
  onOpenSettings: () => void;
}

export function Header({
  deviceMode,
  onDeviceModeChange,
  theme,
  onThemeToggle,
  language,
  onLanguageToggle,
  onOpenSettings,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#8B0000] text-white shadow-md transition-colors">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
            <span className="font-extrabold text-[#8B0000] tracking-tighter text-lg">EQ</span>
          </div>
          <div>
            <h1 className="font-bold leading-tight text-base tracking-wide flex items-center gap-2">
              MyEquator
              <span className="rounded bg-red-900/60 px-1.5 py-0.5 text-[10px] uppercase font-semibold text-red-200">
                Factory ERP
              </span>
            </h1>
            <p className="text-[11px] text-red-200">Equator Insole • Bandung</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Device Simulation / Auto Mode Switcher */}
          <div className="hidden sm:flex items-center rounded-lg bg-red-950/40 p-1 border border-red-800/60">
            <button
              onClick={() => onDeviceModeChange("AUTO")}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition ${
                deviceMode === "AUTO"
                  ? "bg-white text-[#8B0000] shadow-xs font-bold"
                  : "text-red-200 hover:text-white"
              }`}
              title="Auto Responsive (adapts to browser resize)"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Auto</span>
            </button>
            <button
              onClick={() => onDeviceModeChange("DESKTOP")}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition ${
                deviceMode === "DESKTOP"
                  ? "bg-white text-[#8B0000] shadow-xs font-bold"
                  : "text-red-200 hover:text-white"
              }`}
              title="Desktop Workstation View"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => onDeviceModeChange("TABLET")}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition ${
                deviceMode === "TABLET"
                  ? "bg-white text-[#8B0000] shadow-xs font-bold"
                  : "text-red-200 hover:text-white"
              }`}
              title="Tablet Floor View"
            >
              <Tablet className="h-3.5 w-3.5" />
              <span>Tablet</span>
            </button>
            <button
              onClick={() => onDeviceModeChange("MOBILE")}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition ${
                deviceMode === "MOBILE"
                  ? "bg-white text-[#8B0000] shadow-xs font-bold"
                  : "text-red-200 hover:text-white"
              }`}
              title="Mobile Warehouse View"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          {/* Language Switcher */}
          <button
            onClick={onLanguageToggle}
            className="flex items-center gap-1.5 rounded-lg bg-red-950/40 px-2.5 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-900/60 transition border border-red-800/60"
            title="Ganti Bahasa / Switch Language"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="rounded-lg bg-red-950/40 p-1.5 text-red-100 hover:bg-red-900/60 transition border border-red-800/60"
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* UI Settings Modal Trigger */}
          <button
            onClick={onOpenSettings}
            className="rounded-lg bg-red-950/40 p-1.5 text-red-100 hover:bg-red-900/60 transition border border-red-800/60"
            title="Pengaturan Tampilan / UI Settings"
          >
            <Sliders className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
