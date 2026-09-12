"use client";

import React, { useState, useEffect, useRef } from "react";
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
  FileSpreadsheet,
  Boxes,
  BarChart3,
  Keyboard,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { ThemeMode, Language, UserRole } from "@/types";
import { FactoryUser } from "@/lib/auth/types";
import { getRoleBadgeInfo, canAccessTaxFiling } from "@/lib/auth/rbac";
import { useModalSafety } from "@/lib/utils/useModalSafety";
import { Avatar } from "./Avatar";
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const roleInfo = currentUser ? getRoleBadgeInfo(currentUser.role, language) : null;

  // Logout confirmation modal safety (Nielsen #5 Error Prevention: Cancel is focused first)
  const cancelLogoutRef = useRef<HTMLButtonElement | null>(null);
  const logoutModalRef = useModalSafety({
    isOpen: showLogoutConfirm,
    onClose: () => setShowLogoutConfirm(false),
    initialFocusRef: cancelLogoutRef,
  });

  // Lock body scroll and listen for Escape when mobile drawer is open
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

  const handleNavClick = (tab: NavTab) => {
    if (onTabChange) onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  const canAccessTax = currentUser ? canAccessTaxFiling(currentUser.role) : false;

  return (
    <header className="sticky top-0 z-40 bg-brand text-white shadow-md transition-colors">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3.5 sm:px-6">
        {/* Brand Compass Logo & Name */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-md">
            <Compass className="h-5 w-5 text-brand stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-bold leading-tight text-sm sm:text-base tracking-wide flex items-center gap-1.5 sm:gap-2">
              MyEquator
              <span className="rounded bg-red-900/60 px-1.5 py-0.5 text-[10px] uppercase font-semibold text-red-200">
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
              className="flex items-center gap-2 rounded-xl bg-red-950/50 px-3 py-1.5 min-h-[36px] text-xs font-semibold text-red-100 hover:bg-red-900/70 transition border border-red-800/60 shadow-xs"
              title={isId ? "Cari atau Buka Perintah (⌘K)" : "Search or Open Commands (⌘K)"}
              aria-label={isId ? "Buka Palet Perintah (⌘K)" : "Open Command Palette (⌘K)"}
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
              className="flex items-center gap-2 rounded-xl bg-red-950/50 p-1 pr-2.5 min-h-[36px] text-xs font-semibold text-white hover:bg-red-900/70 transition border border-red-800/60 shadow-xs"
              title={isId ? "Ganti Pengguna & Hak Akses (RBAC)" : "User & Security Settings (RBAC)"}
              aria-label={isId ? `Profil ${currentUser.name} (${roleInfo?.label || currentUser.role})` : `User Profile ${currentUser.name} (${roleInfo?.label || currentUser.role})`}
            >
              <Avatar name={currentUser.name} className="w-6 h-6 text-[10px]" />
              <span className="font-bold text-[11px] truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-white/20 uppercase tracking-wide">
                {roleInfo?.label || currentUser.role}
              </span>
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={onLanguageToggle}
            className="flex items-center gap-1.5 rounded-lg bg-red-950/40 px-2.5 py-1.5 min-h-[36px] text-xs font-semibold text-red-100 hover:bg-red-900/60 transition border border-red-800/60"
            title="Ganti Bahasa / Switch Language"
            aria-label={isId ? "Beralih Bahasa ke English" : "Switch Language to Bahasa Indonesia"}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="rounded-lg bg-red-950/40 p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-red-100 hover:bg-red-900/60 transition border border-red-800/60"
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
            aria-label={theme === "dark" ? (isId ? "Beralih ke Mode Terang" : "Switch to Light Mode") : (isId ? "Beralih ke Mode Gelap" : "Switch to Dark Mode")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="h-4 w-px bg-red-800/80 mx-0.5" aria-hidden="true" />

          {/* UI Settings Modal Trigger */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 rounded-lg bg-red-950/40 px-2.5 py-1.5 min-h-[36px] text-xs font-semibold text-red-100 hover:bg-red-900/60 transition border border-red-800/60"
            title={isId ? "Pengaturan Tampilan & Kerapatan UI" : "Display & UI Density Settings"}
            aria-label={isId ? "Buka Pengaturan Tampilan" : "Open Display Settings"}
          >
            <Sliders className="h-4 w-4" />
            <span>{isId ? "Tampilan" : "Settings"}</span>
          </button>

          {/* Logout Button */}
          {currentUser && onLogout && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="rounded-lg bg-red-950/40 p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-red-200 hover:text-white hover:bg-red-900/80 transition border border-red-800/60"
              title={isId ? "Keluar dari Sesi" : "Log Out of Session"}
              aria-label={isId ? "Keluar dari Sesi" : "Log Out of Session"}
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
              className="flex items-center gap-1.5 p-1.5 min-h-[44px] rounded-xl bg-red-950/50 border border-red-800/60 active:scale-95 transition"
              aria-label={isId ? `Buka Menu Navigasi (${currentUser.name})` : `Open Navigation Menu (${currentUser.name})`}
            >
              <Avatar name={currentUser.name} className="w-7 h-7 text-[10px]" />
              <span className="text-[10px] font-bold pr-1 text-red-200 uppercase max-w-[85px] truncate">
                {roleInfo?.label || currentUser.role}
              </span>
            </button>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl bg-red-950/60 text-white border border-red-800/60 active:scale-95 transition"
            aria-label={isId ? "Buka / Tutup Menu Navigasi" : "Toggle Mobile Menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE SLIDE-DOWN DRAWER MENU (md:hidden) */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-label={isId ? "Menu Navigasi Pabrik" : "Factory Navigation Menu"}
          className="md:hidden fixed inset-0 top-14 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-start animate-in fade-in duration-150 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsMobileMenuOpen(false);
            }
          }}
        >
          <div
            className="bg-brand border-b border-red-800 text-white p-5 rounded-b-2xl shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Active User Card in Drawer */}
            {currentUser && (
              <div
                onClick={() => {
                  if (onOpenSecurity) onOpenSecurity();
                  setIsMobileMenuOpen(false);
                }}
                className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 flex items-center justify-between cursor-pointer active:scale-98 transition"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={currentUser.name} className="w-11 h-11 text-sm" />
                  <div>
                    <h3 className="font-extrabold text-sm text-white leading-tight">
                      {currentUser.name}
                    </h3>
                    <p className="text-xs text-red-300">@{currentUser.username}</p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 uppercase tracking-wide">
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
                  className="p-2.5 min-h-[44px] rounded-xl bg-red-950/40 border border-red-800/60 flex flex-col items-center justify-center gap-1 active:scale-95 transition"
                >
                  <Search className="h-4 w-4 text-red-300" />
                  <span className="text-[10px] font-bold">{isId ? "Cari (⌘K)" : "Search (⌘K)"}</span>
                </button>
              )}

              <button
                onClick={onLanguageToggle}
                className="p-2.5 min-h-[44px] rounded-xl bg-red-950/40 border border-red-800/60 flex flex-col items-center justify-center gap-1 active:scale-95 transition"
              >
                <Globe className="h-4 w-4 text-red-300" />
                <span className="text-[10px] font-bold">{language.toUpperCase()}</span>
              </button>

              <button
                onClick={onThemeToggle}
                className="p-2.5 min-h-[44px] rounded-xl bg-red-950/40 border border-red-800/60 flex flex-col items-center justify-center gap-1 active:scale-95 transition"
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
                { id: "DIGITIZER", label: isId ? "Digitizer Cepat" : "Quick Digitizer", icon: Keyboard },
                { id: "INVENTORY", label: isId ? "Stok Material" : "Stock Inventory", icon: Boxes },
                { id: "CAD_STUDIO", label: isId ? "Insole CAD Studio" : "Insole CAD Studio", icon: Compass },
                { id: "ANALYTICS", label: isId ? "Analitik Bisnis" : "Business Analytics", icon: BarChart3 },
                ...(canAccessTax
                  ? [{ id: "TAX_FILING", label: isId ? "Persiapan Pajak" : "Tax Filing (Coretax)", icon: FileSpreadsheet }]
                  : []),
                { id: "SECURITY", label: isId ? "Keamanan & Pengguna" : "Security & Users", icon: ShieldCheck },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id as NavTab)}
                    aria-current={isActive ? "page" : undefined}
                    className={`w-full p-2.5 min-h-[44px] rounded-xl flex items-center justify-between text-xs font-bold transition active:scale-98 ${
                      isActive
                        ? "bg-white text-brand shadow-sm"
                        : "bg-red-950/40 text-red-100 hover:bg-red-900/60 border border-red-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <span className="w-2 h-2 rounded-full bg-brand" />}
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
                className="flex-1 py-2.5 px-3 min-h-[44px] rounded-xl bg-red-950/60 border border-red-800/60 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Sliders className="h-4 w-4 text-red-300" />
                <span>{isId ? "Pengaturan Tampilan" : "Display Settings"}</span>
              </button>

              {onLogout && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="py-2.5 px-4 min-h-[44px] rounded-xl bg-black/40 border border-red-900 text-xs font-bold text-red-300 hover:text-white flex items-center justify-center gap-1.5 active:scale-95 transition"
                  aria-label={isId ? "Keluar dari Sesi" : "Log Out of Session"}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isId ? "Keluar Sesi" : "Log Out"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal (Truth-Gate Safeguard) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div
            ref={logoutModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            className="w-full max-w-sm rounded-xl bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/70 text-brand dark:text-red-400">
                <LogOut className="h-6 w-6" />
              </div>
              <div>
                <h4 id="logout-confirm-title" className="font-extrabold text-base text-gray-900 dark:text-white">
                  {isId ? "Keluar dari Sesi?" : "Log Out of Session?"}
                </h4>
                <p className="text-xs text-gray-500 font-mono">
                  {currentUser ? currentUser.username : "User"}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300">
              {isId
                ? "Pastikan Anda telah menyimpan seluruh perubahan data surat jalan, mutasi stok bahan, atau kalkulasi pajak sebelum keluar."
                : "Ensure you have saved any ongoing changes to delivery orders, stock movements, or tax calculations before leaving."}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                ref={cancelLogoutRef}
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 min-h-[38px] rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {isId ? "Batal" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) onLogout();
                }}
                className="px-4 py-2 min-h-[38px] rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs active:scale-95 transition"
              >
                {isId ? "Ya, Keluar Sesi" : "Yes, Log Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
