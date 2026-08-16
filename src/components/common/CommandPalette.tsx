"use client";

import React, { useState, useEffect, useRef } from "react";
import { NavTab } from "./Sidebar";
import {
  Search,
  FileText,
  Keyboard,
  Boxes,
  Compass,
  BarChart3,
  Sliders,
  Sparkles,
  Plus,
  ArrowRight,
  X,
  Command,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavTab) => void;
  onOpenCreateOrder: () => void;
  onOpenSettings: () => void;
  onOpenAssistant: () => void;
  language: "id" | "en";
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: "NAV" | "ACTION" | "AI";
  icon: React.ElementType;
  action: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenCreateOrder,
  onOpenSettings,
  onOpenAssistant,
  language,
}: CommandPaletteProps) {
  const isId = language === "id";
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: CommandItem[] = [
    // Navigation
    {
      id: "nav-orders",
      title: isId ? "Daftar Surat Jalan (DO)" : "Delivery Orders",
      subtitle: isId ? "Kelola dan cetak surat jalan pabrik" : "Manage & print delivery orders",
      category: "NAV",
      icon: FileText,
      action: () => onNavigateTab("DELIVERY_ORDERS"),
    },
    {
      id: "nav-digitizer",
      title: isId ? "Quick Digitizer Arsip" : "Quick Digitizer Archive",
      subtitle: isId ? "Entri cepat keyboard-first faktur kertas" : "Rapid keyboard-first paper slip intake",
      category: "NAV",
      icon: Keyboard,
      action: () => onNavigateTab("DIGITIZER"),
    },
    {
      id: "nav-inventory",
      title: isId ? "Stok Material & Gudang" : "Raw Materials Inventory",
      subtitle: isId ? "Cek persediaan busa EVA, lateks, plat TPU" : "Inspect EVA sheets, latex, TPU stock",
      category: "NAV",
      icon: Boxes,
      action: () => onNavigateTab("INVENTORY"),
    },
    {
      id: "nav-cad",
      title: isId ? "Studio Insole CAD & Vector" : "Insole CAD & Vector Studio",
      subtitle: isId ? "Rancang kurva sol sepatu parametrik & ekspor DXF" : "Parametric insole vector designer & DXF export",
      category: "NAV",
      icon: Compass,
      action: () => onNavigateTab("CAD_STUDIO"),
    },
    {
      id: "nav-analytics",
      title: isId ? "Visual Analytics & Omzet" : "Visual Analytics & Revenue",
      subtitle: isId ? "Kurva ukuran sepatu, grafik omzet, & market share" : "Shoe size bell curve, revenue & market share",
      category: "NAV",
      icon: BarChart3,
      action: () => onNavigateTab("ANALYTICS"),
    },
    // Quick Actions
    {
      id: "act-create-order",
      title: isId ? "Buat Surat Jalan Baru (+)" : "Create New Delivery Order (+)",
      subtitle: isId ? "Buka formulir pembuatan DO baru" : "Open blank delivery order form",
      category: "ACTION",
      icon: Plus,
      action: onOpenCreateOrder,
    },
    {
      id: "act-ai-chat",
      title: isId ? "Tanya Khatulistiwa AI Assistant" : "Ask Khatulistiwa AI Assistant",
      subtitle: isId ? "Chat bot asisten pabrik pintar & prompt DO" : "AI factory intelligence & draft assistant",
      category: "AI",
      icon: Sparkles,
      action: onOpenAssistant,
    },
    {
      id: "act-settings",
      title: isId ? "Pengaturan Tampilan & UI" : "UI Display & Theme Settings",
      subtitle: isId ? "Atur kerapatan font, tema gelap/terang, & bahasa" : "Configure density, dark/light theme, language",
      category: "ACTION",
      icon: Sliders,
      action: onOpenSettings,
    },
  ];

  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  // Global Keyboard Listener for Cmd+K / Ctrl+K
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(filtered.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(filtered.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-in fade-in duration-100">
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Bar Input */}
        <div className="p-3.5 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <Search className="h-5 w-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isId
                ? "Ketik perintah, navigasi, atau aksi (cth: Surat Jalan, CAD, AI)..."
                : "Type a command or navigation (e.g. Delivery Order, CAD, AI)..."
            }
            className="flex-1 bg-transparent text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
          <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg">
            <span>ESC</span>
          </div>
        </div>

        {/* Command Items List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              {isId ? "Tidak ada hasil pencarian." : "No matching commands found."}
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = selectedIndex === idx;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 rounded-2xl flex items-center justify-between cursor-pointer transition ${
                    isSelected
                      ? "bg-red-50 dark:bg-red-950/50 text-[#8B0000] dark:text-red-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isSelected
                          ? "bg-[#8B0000] text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-xs leading-tight">{item.title}</p>
                      <p className="text-[11px] text-gray-500 truncate">{item.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      isSelected ? "translate-x-0.5 opacity-100 text-[#8B0000]" : "opacity-0"
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="p-2.5 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-800 text-[10px] text-gray-500 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <span>↑↓ Pilih</span>
            <span>↵ Eksekusi</span>
          </div>
          <span>Equator Command Palette (⌘K)</span>
        </div>
      </div>
    </div>
  );
}
