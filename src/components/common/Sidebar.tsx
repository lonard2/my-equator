"use client";

import React from "react";
import {
  FileText,
  Keyboard,
  Boxes,
  Compass,
  BarChart3,
  Bot,
  ShieldCheck,
} from "lucide-react";

export type NavTab = "DELIVERY_ORDERS" | "DIGITIZER" | "INVENTORY" | "CAD_STUDIO" | "ANALYTICS" | "AI_ASSISTANT" | "SECURITY";

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
      id: "AI_ASSISTANT",
      label: isId ? "Khatulistiwa AI" : "Khatulistiwa AI",
      icon: Bot,
      badge: "AI",
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
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? "bg-red-50 dark:bg-red-950/50 text-[#8B0000] dark:text-red-400 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`h-4 w-4 ${isActive ? "text-[#8B0000] dark:text-red-400" : "text-gray-500"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-[#8B0000] dark:text-red-300">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs">
        <p className="font-semibold text-gray-800 dark:text-gray-200">Equator Insole System</p>
        <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">ESC/P Dot Matrix & SQLite Ready</p>
      </div>
    </aside>
  );
}
