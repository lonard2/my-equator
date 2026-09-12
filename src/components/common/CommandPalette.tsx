"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  FileSpreadsheet,
  ShieldCheck,
  PackageCheck,
} from "lucide-react";
import { DeliveryOrder } from "@/types";
import { FactoryUser } from "@/lib/auth/types";
import { canAccessTaxFiling } from "@/lib/auth/rbac";
import { useModalSafety } from "@/lib/utils/useModalSafety";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavTab) => void;
  onOpenCreateOrder: () => void;
  onOpenSettings: () => void;
  onOpenAssistant: () => void;
  language: "id" | "en";
  orders?: DeliveryOrder[];
  currentUser?: FactoryUser | null;
  onSelectOrder?: (orderId: string) => void;
}

type CommandCategory = "ORDERS" | "NAV" | "ACTION" | "AI";

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: CommandCategory;
  icon: React.ElementType;
  action: () => void;
  badge?: string;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenCreateOrder,
  onOpenSettings,
  onOpenAssistant,
  language,
  orders = [],
  currentUser,
  onSelectOrder,
}: CommandPaletteProps) {
  const isId = language === "id";
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMac, setIsMac] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const modalRef = useModalSafety({
    isOpen,
    onClose,
    initialFocusRef: inputRef,
  });

  // Detect OS for shortcut display (Cmd+K vs Ctrl+K)
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent));
    }
  }, []);

  // Reset query and selected index on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const canAccessTax = currentUser ? canAccessTaxFiling(currentUser.role) : false;
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  // Build command candidates dynamically
  const staticItems = useMemo<CommandItem[]>(() => {
    const navs: CommandItem[] = [
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
    ];

    if (canAccessTax) {
      navs.push({
        id: "nav-tax",
        title: isId ? "Persiapan Pengisian Pajak (Coretax)" : "Coretax Tax Filing Preparation",
        subtitle: isId
          ? "Rekonsiliasi PPN, faktur pajak keluaran, dan ekspor XML/Excel DJP"
          : "VAT reconciliation, tax invoices, and DJP XML/Excel bulk export",
        category: "NAV",
        icon: FileSpreadsheet,
        action: () => onNavigateTab("TAX_FILING"),
      });
    }

    if (isSuperAdmin) {
      navs.push({
        id: "nav-security",
        title: isId ? "Keamanan & Pengguna (RBAC)" : "Security & Users (RBAC)",
        subtitle: isId
          ? "Kelola akun pengguna, matriks akses, audit trail, & backup"
          : "Manage user accounts, RBAC matrix, audit log, & snapshot restore",
        category: "NAV",
        icon: ShieldCheck,
        action: () => onNavigateTab("SECURITY"),
      });
    }

    const actions: CommandItem[] = [
      {
        id: "act-create-order",
        title: isId ? "Buat Surat Jalan Baru (+)" : "Create New Delivery Order (+)",
        subtitle: isId ? "Buka formulir pembuatan DO baru" : "Open blank delivery order form",
        category: "ACTION",
        icon: Plus,
        action: onOpenCreateOrder,
      },
      {
        id: "act-settings",
        title: isId ? "Pengaturan Tampilan & UI" : "UI Display & Theme Settings",
        subtitle: isId ? "Atur kerapatan font, tema gelap/terang, & bahasa" : "Configure density, dark/light theme, language",
        category: "ACTION",
        icon: Sliders,
        action: onOpenSettings,
      },
      {
        id: "act-ai-chat",
        title: isId ? "Tanya Khatulistiwa AI Assistant" : "Ask Khatulistiwa AI Assistant",
        subtitle: isId ? "Chat asisten pabrik & kalkulasi otomatis" : "Factory assistant chat & automated calculations",
        category: "AI",
        icon: Sparkles,
        action: onOpenAssistant,
      },
    ];

    return [...navs, ...actions];
  }, [isId, canAccessTax, isSuperAdmin, onNavigateTab, onOpenCreateOrder, onOpenSettings, onOpenAssistant]);

  // Generate live order search items
  const orderItems = useMemo<CommandItem[]>(() => {
    if (!orders || orders.length === 0) return [];
    const q = query.trim().toLowerCase();

    // If searching, filter matching orders (up to 5)
    if (q) {
      return orders
        .filter((o) => {
          return (
            o.orderNumber.toLowerCase().includes(q) ||
            o.recipientName.toLowerCase().includes(q) ||
            (o.poNumber && o.poNumber.toLowerCase().includes(q)) ||
            (o.destinationAddress && o.destinationAddress.toLowerCase().includes(q))
          );
        })
        .slice(0, 5)
        .map((o) => ({
          id: `order-${o.id}`,
          title: `${o.orderNumber} • ${o.recipientName}`,
          subtitle: `${o.destinationAddress} • ${o.totalQuantity} psg • PO: ${o.poNumber || "-"}`,
          category: "ORDERS" as CommandCategory,
          icon: PackageCheck,
          badge: o.status,
          action: () => {
            if (onSelectOrder) {
              onSelectOrder(o.id);
            } else {
              onNavigateTab("DELIVERY_ORDERS");
            }
          },
        }));
    }

    // When empty query, display 3 most recent delivery orders for rapid jumping
    return orders.slice(0, 3).map((o) => ({
      id: `order-${o.id}`,
      title: `${o.orderNumber} • ${o.recipientName}`,
      subtitle: `${o.destinationAddress} • ${o.totalQuantity} psg • PO: ${o.poNumber || "-"}`,
      category: "ORDERS" as CommandCategory,
      icon: PackageCheck,
      badge: o.status,
      action: () => {
        if (onSelectOrder) {
          onSelectOrder(o.id);
        } else {
          onNavigateTab("DELIVERY_ORDERS");
        }
      },
    }));
  }, [orders, query, onSelectOrder, onNavigateTab]);

  // Filter and prioritize items
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Return recent orders first, then quick actions, then navigation
      return [...orderItems, ...staticItems];
    }
    const filteredStatic = staticItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
    );
    return [...orderItems, ...filteredStatic];
  }, [query, orderItems, staticItems]);

  // Auto-scroll the selected item into view
  useEffect(() => {
    const item = filtered[selectedIndex];
    if (item && itemRefs.current[item.id]) {
      itemRefs.current[item.id]?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, filtered]);

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
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  const categoryTitles: Record<CommandCategory, string> = {
    ORDERS: isId ? "Surat Jalan (DO)" : "Delivery Orders",
    NAV: isId ? "Navigasi Pabrik" : "Factory Navigation",
    ACTION: isId ? "Aksi Cepat Pabrik" : "Factory Quick Actions",
    AI: isId ? "Asisten Cerdas" : "AI Assistant",
  };

  // Group filtered items by category for cognitive chunking
  const categoryOrder: CommandCategory[] = ["ORDERS", "NAV", "ACTION", "AI"];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-12 sm:pt-20 p-3 sm:p-4 overflow-y-auto cursor-pointer animate-in fade-in duration-100"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={isId ? "Palet Perintah Global Pabrik" : "Global Factory Command Palette"}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="p-3.5 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <Search className="h-5 w-5 text-brand dark:text-red-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls="command-palette-list"
            aria-autocomplete="list"
            aria-activedescendant={filtered[selectedIndex] ? `cmd-item-${filtered[selectedIndex].id}` : undefined}
            aria-label={isId ? "Cari nomor DO, pelanggan, atau perintah navigasi" : "Search DO number, customer, or navigation"}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isId
                ? "Cari nomor surat jalan, pelanggan, material, atau perintah..."
                : "Search DO number, customer, materials, or commands..."
            }
            className="flex-1 bg-transparent text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg">
            <span>ESC</span>
          </div>
          {/* Mobile close button to prevent touch traps */}
          <button
            type="button"
            onClick={onClose}
            aria-label={isId ? "Tutup pencarian" : "Close search"}
            className="sm:hidden p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Command Items List with Category Chunking */}
        <div
          id="command-palette-list"
          role="listbox"
          aria-label={isId ? "Daftar Hasil Perintah & Surat Jalan" : "Command & Delivery Order Results"}
          className="max-h-80 overflow-y-auto p-2 space-y-2"
        >
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 space-y-1">
              <p className="font-semibold text-gray-600 dark:text-gray-300">
                {isId ? "Tidak ada hasil pencarian." : "No matching commands found."}
              </p>
              <p className="text-[11px] text-gray-400">
                {isId
                  ? "Coba cari nomor DO (SJ/EQ), nama toko, bahan EVA, atau CAD."
                  : "Try searching DO numbers (SJ/EQ), buyer name, EVA foam, or CAD."}
              </p>
            </div>
          ) : (
            categoryOrder.map((cat) => {
              const catItems = filtered.filter((i) => i.category === cat);
              if (catItems.length === 0) return null;

              return (
                <div key={cat} className="space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50/70 dark:bg-gray-800/40 rounded-md">
                    {categoryTitles[cat]}
                  </div>

                  {catItems.map((item) => {
                    const Icon = item.icon;
                    const overallIdx = filtered.findIndex((f) => f.id === item.id);
                    const isSelected = selectedIndex === overallIdx;

                    return (
                      <div
                        key={item.id}
                        id={`cmd-item-${item.id}`}
                        ref={(el) => {
                          itemRefs.current[item.id] = el;
                        }}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          item.action();
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(overallIdx)}
                        className={`p-2.5 min-h-[44px] rounded-xl flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? "bg-red-50 dark:bg-red-950/50 text-brand dark:text-red-300 shadow-2xs"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-xl shrink-0 ${
                              isSelected
                                ? "bg-brand text-white"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-xs leading-tight truncate">{item.title}</p>
                              {item.badge && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase tracking-tight">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                        <ArrowRight
                          className={`h-4 w-4 shrink-0 transition-transform ${
                            isSelected ? "translate-x-0.5 opacity-100 text-brand dark:text-red-400" : "opacity-0"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="p-2.5 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-800 text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <span>{isId ? "↑↓ Navigasi" : "↑↓ Navigate"}</span>
            <span>{isId ? "↵ Eksekusi" : "↵ Execute"}</span>
            <span>{isId ? "ESC Tutup" : "ESC Dismiss"}</span>
          </div>
          <span>MyEquator ({isMac ? "⌘K" : "Ctrl+K"})</span>
        </div>
      </div>
    </div>
  );
}

