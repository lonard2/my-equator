"use client";

import React, { useState } from "react";
import {
  Compass,
  Moon,
  Sun,
  Globe,
  Sliders,
  Search,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  FileText,
  Boxes,
  BarChart3,
  Keyboard,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { ThemeMode, Language, UserRole } from "@/types";
import { FactoryUser } from "@/lib/auth/types";
import { getRoleBadgeInfo } from "@/lib/auth/rbac";
import { NavTab } from "./Sidebar";

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
  currentTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
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
  currentTab,
  onTabChange,
}: HeaderProps) {
  const isId = language === "id";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const roleInfo = currentUser ? getRoleBadgeInfo(currentUser.role, language) : null;

  const handleNavClick = (tab: NavTab) => {
    if (onTabChange) onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#8B0000] text-white shadow-md transition-colors">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3.5 sm:px-6">
        {/* Brand Compass Logo & Name */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-md">
            <Compass className="h-5 w-5 text-[#8B0000] stroke-[2.2] animate-pulse-slow" />
          </div>
          <div>
            <h1 className="font-bold leading-tight text-sm sm:text-base tracking-wide flex items-center gap-1.5 sm:gap-2">
              MyEquator
              <span className="rounded bg-red-900/60 px-1.5 py-0.5 text-[9px] sm:text-[10px] uppercase font-semibold text-red-200">
                Factory ERP
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-red-200">Equator Insole • Bandung</p>
          </div>
        </div>

        {/* DESKTOP & TABLET CONTROLS (hidden md:flex) */}
        <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
          {/* Command Palette Trigger */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-2 rounded-xl bg-red-950/50 px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-900/70 transition border border-red-800/60 shadow-xs"
              title={isId ? "Cari atau Buka Perintah (⌘K)" : "Search or Open Commands (⌘K)"}
            >
              <Search className="h-3.5 w-3.5" />
              <span>{isId ? "Cari..." : "Search..."}</span>
              <kbd className="inline-flex items-center gap-0.5 rounded bg-red-900/80 px-1.5 py-0.5 text-[10px] font-mono text-red-200">
                ⌘K
              </kbd>
            </button>
          )}

          {/* User Profile & Role Trigger */}
          {currentUser && (
            <button
              onClick={onOpenSecurity}
              className="flex items-center gap-2 rounded-xl bg-red-950/50 p-1 pr-2.5 text-xs font-semibold text-white hover:bg-red-900/70 transition border border-red-800/60 shadow-xs"
              title={isId ? "Ganti Pengguna & Hak Akses (RBAC)" : "User & Security Settings (RBAC)"}
            >
              <img
                src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"}
                alt={currentUser.name}
                className="w-6 h-6 rounded-lg object-cover border border-red-400"
              />
              <span className="font-bold text-[11px] truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-white/20 uppercase">
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
            <span>Settings</span>
          </button>

          {/* Logout Button */}
          {currentUser && onLogout && (
            <button
              onClick={onLogout}
              className="rounded-lg bg-red-950/40 p-1.5 text-red-200 hover:text-white hover:bg-red-900/80 transition border border-red-800/60"
              title={isId ? "Keluar dari Sistem / Log Out" : "Log Out"}
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* MOBILE CLEAN BURGER MENU TRIGGER (md:hidden) */}
        <div className="md:hidden flex items-center gap-2">
          {currentUser && (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center gap-1.5 p-1 rounded-xl bg-red-950/50 border border-red-800/60"
            >
              <img
                src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"}
                alt={currentUser.name}
                className="w-6 h-6 rounded-lg object-cover"
              />
              <span className="text-[10px] font-bold pr-1 text-red-200 uppercase">
                {currentUser.role.split("_")[0]}
              </span>
            </button>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-red-950/60 text-white border border-red-800/60 active:scale-95 transition"
            aria-label="Toggle Mobile Menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE SLIDE-DOWN DRAWER MENU (md:hidden) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-start animate-in fade-in duration-150">
          <div className="bg-[#8B0000] border-b border-red-800 text-white p-5 rounded-b-3xl shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Active User Card in Drawer */}
            {currentUser && (
              <div
                onClick={() => {
                  if (onOpenSecurity) onOpenSecurity();
                  setIsMobileMenuOpen(false);
                }}
                className="p-3.5 rounded-2xl bg-red-950/60 border border-red-800/80 flex items-center justify-between cursor-pointer active:scale-98 transition"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"}
                    alt={currentUser.name}
                    className="w-11 h-11 rounded-xl object-cover border border-red-400"
                  />
                  <div>
                    <h3 className="font-extrabold text-sm text-white leading-tight">
                      {currentUser.name}
                    </h3>
                    <p className="text-xs text-red-300">@{currentUser.username}</p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold bg-white/20 uppercase">
                      {roleInfo?.label}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-red-300" />
              </div>
            )}

            {/* Quick Actions Strip */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {onOpenCommandPalette && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenCommandPalette();
                  }}
                  className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/60 flex flex-col items-center gap-1 active:scale-95 transition"
                >
                  <Search className="h-4 w-4 text-red-300" />
                  <span className="text-[10px] font-bold">Cari (⌘K)</span>
                </button>
              )}

              <button
                onClick={onLanguageToggle}
                className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/60 flex flex-col items-center gap-1 active:scale-95 transition"
              >
                <Globe className="h-4 w-4 text-red-300" />
                <span className="text-[10px] font-bold">{language.toUpperCase()}</span>
              </button>

              <button
                onClick={onThemeToggle}
                className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/60 flex flex-col items-center gap-1 active:scale-95 transition"
              >
                {theme === "dark" ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-red-300" />}
                <span className="text-[10px] font-bold">{theme === "dark" ? "Light" : "Dark"}</span>
              </button>
            </div>

            {/* Module Navigation Links */}
            <div className="space-y-1.5 pt-2 border-t border-red-800/60">
              <span className="text-[10px] font-extrabold uppercase text-red-300 tracking-wider block px-1 mb-1">
                {isId ? "Menu Modul Pabrik" : "Factory Modules"}
              </span>

              {[
                { id: "DELIVERY_ORDERS", label: isId ? "Surat Jalan (DO)" : "Delivery Orders", icon: FileText },
                { id: "DIGITIZER", label: isId ? "Archive Digitizer" : "Quick Digitizer", icon: Keyboard },
                { id: "INVENTORY", label: isId ? "Inventori Bahan Baku" : "Stock Inventory", icon: Boxes },
                { id: "CAD_STUDIO", label: isId ? "Insole CAD Studio" : "CAD Studio", icon: Compass },
                { id: "ANALYTICS", label: isId ? "Pusat Analitik Bisnis" : "Analytics Suite", icon: BarChart3 },
                { id: "SECURITY", label: isId ? "Keamanan & Pengguna" : "Security & Users", icon: ShieldCheck },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id as NavTab)}
                    className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-bold transition active:scale-98 ${
                      isActive
                        ? "bg-white text-[#8B0000] shadow-sm"
                        : "bg-red-950/40 text-red-100 hover:bg-red-900/60 border border-red-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <span className="w-2 h-2 rounded-full bg-[#8B0000]" />}
                  </button>
                );
              })}
            </div>

            {/* Settings & Logout */}
            <div className="pt-3 border-t border-red-800/60 flex items-center gap-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenSettings();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Sliders className="h-4 w-4 text-red-300" />
                <span>Pengaturan Tampilan</span>
              </button>

              {onLogout && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-black/40 border border-red-900 text-xs font-bold text-red-300 hover:text-white flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Keluar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
