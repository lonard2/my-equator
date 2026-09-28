"use client";

import React from "react";
import {
  FileText,
  Keyboard,
  Boxes,
  Compass,
  BarChart3,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";
import { canAccessTaxFiling } from "@/lib/auth/rbac";

export type NavTab =
  | "DELIVERY_ORDERS"
  | "DIGITIZER"
  | "INVENTORY"
  | "CAD_STUDIO"
  | "ANALYTICS"
  | "TAX_FILING"
  | "SECURITY";

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  language: "id" | "en";
  userRole?: string;
}

export function Sidebar({ currentTab, onTabChange, language, userRole }: SidebarProps) {
  const isId = language === "id";

  const navItems: { id: NavTab; label: string; icon: React.ElementType }[] = [
    {
      id: "DELIVERY_ORDERS",
      label: isId ? "Surat Jalan (DO)" : "Delivery Orders",
      icon: FileText,
    },
    {
      id: "DIGITIZER",
      label: isId ? "Digitizer Cepat" : "Quick Digitizer",
      icon: Keyboard,
    },
    {
      id: "INVENTORY",
      label: isId ? "Stok Material" : "Stock Inventory",
      icon: Boxes,
    },
    {
      id: "CAD_STUDIO",
      label: isId ? "Studio Insole CAD" : "Insole CAD Studio",
      icon: Compass,
    },
    {
      id: "ANALYTICS",
      label: isId ? "Analitik Bisnis" : "Business Analytics",
      icon: BarChart3,
    },
    {
      id: "TAX_FILING",
      label: isId ? "Persiapan Pajak" : "Tax Filing (Coretax)",
      icon: FileSpreadsheet,
    },
    {
      id: "SECURITY",
      label: isId ? "Keamanan & Pengguna" : "Security & Users",
      icon: ShieldCheck,
    },
  ];

  const canAccessTax = canAccessTaxFiling(userRole);
  const visibleNavItems = navItems.filter(
    (item) => item.id !== "TAX_FILING" || canAccessTax
  );

  return (
    <aside className="w-60 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col justify-between p-3 shrink-0">
      <nav aria-label={isId ? "Navigasi Utama Pabrik" : "Main Factory Navigation"} className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
          {isId ? "Modul Pabrik" : "Factory Modules"}
        </div>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`relative w-full flex items-center justify-between px-3 py-2.5 min-h-[40px] rounded-xl text-xs font-semibold transition active:scale-95 ${
                isActive
                  ? "bg-red-50/70 dark:bg-red-950/40 text-brand dark:text-red-300 font-bold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand dark:bg-red-500"
                  aria-hidden="true"
                />
              )}
              <div className="flex items-center space-x-2.5 pl-1">
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-brand dark:text-red-400" : "text-gray-500"}`} />
                <span className="truncate">{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Factory Floor Telemetry Widget */}
      <div className="p-3 rounded-xl bg-gray-50/90 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-800 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-bold text-gray-800 dark:text-gray-200 text-xs">Equator Insole</p>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            ONLINE
          </span>
        </div>
        <div className="space-y-1 font-mono text-[10px] text-gray-500 dark:text-gray-400">
          <div className="flex justify-between">
            <span>DATABASE:</span>
            <span className="text-gray-700 dark:text-gray-300 font-semibold">SQLite (Local)</span>
          </div>
          <div className="flex justify-between">
            <span>SPOOLER:</span>
            <span className="text-gray-700 dark:text-gray-300 font-semibold">ESC/P 80-Col</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
