"use client";

import React from "react";
import { Compass, Moon, Sun, Globe, Sliders, Search, LogOut } from "lucide-react";
import { ThemeMode, Language, UserRole } from "@/types";
import { FactoryUser } from "@/lib/auth/types";
import { getRoleBadgeInfo } from "@/lib/auth/rbac";

interface HeaderProps {
  theme: ThemeMode;
  onThemeToggle: () => void;
  language: Language;
  onLanguageToggle: () => void;
  onOpenSettings: () => void;
  onOpenCommandPalette?: () => void;
  currentUser?: FactoryUser;
  onOpenSecurity?: () => void;
  onLogout?: () => void;
}

export function Header({
  theme,
  onThemeToggle,
  language,
  onLanguageToggle,
  onOpenSettings,
  onOpenCommandPalette,
  currentUser,
  onOpenSecurity,
  onLogout,
}: HeaderProps) {
  const roleInfo = currentUser ? getRoleBadgeInfo(currentUser.role, language) : null;

  return (
    <header className="sticky top-0 z-40 bg-[#8B0000] text-white shadow-md transition-colors">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Compass Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-md">
            <Compass className="h-5 w-5 text-[#8B0000] stroke-[2.2] animate-pulse-slow" />
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
          {/* Command Palette Trigger */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-2 rounded-xl bg-red-950/50 px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-900/70 transition border border-red-800/60 shadow-xs"
              title="Cari atau Buka Perintah (⌘K)"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cari...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-red-900/80 px-1.5 py-0.2 text-[10px] font-mono text-red-200">
                ⌘K
              </kbd>
            </button>
          )}

          {/* User Profile & Role Trigger */}
          {currentUser && (
            <button
              onClick={onOpenSecurity}
              className="flex items-center gap-2 rounded-xl bg-red-950/50 p-1 pr-2.5 text-xs font-semibold text-white hover:bg-red-900/70 transition border border-red-800/60 shadow-xs"
              title="Ganti Pengguna & Hak Akses (RBAC)"
            >
              <img
                src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"}
                alt={currentUser.name}
                className="w-6 h-6 rounded-lg object-cover border border-red-400"
              />
              <span className="hidden md:inline font-bold text-[11px] truncate max-w-[110px]">
                {currentUser.name}
              </span>
              <span className="hidden sm:inline px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-white/20 uppercase">
                {currentUser.role.split("_")[0]}
              </span>
            </button>
          )}

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
            className="flex items-center gap-1.5 rounded-lg bg-red-950/40 px-2.5 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-900/60 transition border border-red-800/60"
            title="Pengaturan Tampilan & Kerapatan / UI Settings"
          >
            <Sliders className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Logout Button */}
          {currentUser && onLogout && (
            <button
              onClick={onLogout}
              className="rounded-lg bg-red-950/40 p-1.5 text-red-200 hover:text-white hover:bg-red-900/80 transition border border-red-800/60"
              title={language === "id" ? "Keluar dari Sistem / Log Out" : "Log Out"}
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
