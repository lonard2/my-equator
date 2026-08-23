"use client";

import React from "react";
import {
  FileText,
  Keyboard,
  Boxes,
  Compass,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

export type NavTab = "DELIVERY_ORDERS" | "DIGITIZER" | "INVENTORY" | "CAD_STUDIO" | "ANALYTICS" | "SECURITY";

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  language: "id" | "en";
}

export function Sidebar({ currentTab, onTabChange, language }: SidebarProps) {
  const isId = language === "id";

  const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: string }[] = [
    {
      id: "DELIVERY_ORDERS",
      label: isId ? "Surat Jalan (DO)" : "Delivery Orders",
      icon: FileText,
    },
    {
      id: "DIGITIZER",
      label: isId ? "Quick Digitizer" : "Quick Digitizer",
      icon: Keyboard,
      badge: "Fast",
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
      label: isId ? "Visual Analytics" : "Visual Analytics",
      icon: BarChart3,
    },
    {
      id: "SECURITY",
      label: isId ? "Keamanan & Backup" : "Security & Backup",
      icon: ShieldCheck,
    },
  ];

  return (
    <aside className="w-60 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col justify-between p-3 shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
          {isId ? "Menu Utama" : "Main Navigation"}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                isActive
                  ? "bg-red-50 dark:bg-red-950/50 text-[#8B0000] dark:text-red-400 font-bold shadow-xs border border-red-100 dark:border-red-900/40"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`h-4 w-4 ${isActive ? "text-[#8B0000] dark:text-red-400" : "text-gray-500"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-[#8B0000] dark:text-red-300">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs space-y-1">
        <p className="font-bold text-gray-800 dark:text-gray-200">Equator Insole Bandung</p>
        <p className="text-gray-500 dark:text-gray-400 text-[11px]">{isId ? "Operasional Pabrik & CAD Terpadu" : "Integrated ERP & CAD Operations"}</p>
      </div>
    </aside>
  );
}
