"use client";

import React, { useState, useEffect } from "react";
import { DeliveryOrder, DeliveryOrderStatus, DensityMode, LayoutWidth, ThemeMode, Language } from "@/types";
import { Header } from "@/components/common/Header";
import { Sidebar, NavTab } from "@/components/common/Sidebar";
import { OrderList } from "@/components/delivery-orders/OrderList";
import { OrderDetail } from "@/components/delivery-orders/OrderDetail";
import { OrderFormModal } from "@/components/delivery-orders/OrderFormModal";
import { PrintModal } from "@/components/delivery-orders/PrintModal";
import { ArchiveDigitizer } from "@/components/delivery-orders/ArchiveDigitizer";
import { StatusBadge } from "@/components/delivery-orders/StatusBadge";
import { getOrderFilterOptions, STATUS_COLOR_MAP } from "@/lib/utils/statusColors";
import { DispatchConfirmModal } from "@/components/delivery-orders/DispatchConfirmModal";
import { DeliveredCeremonyModal } from "@/components/delivery-orders/DeliveredCeremonyModal";
import { SlipSpooledCeremonyModal } from "@/components/delivery-orders/SlipSpooledCeremonyModal";
import { useModalSafety } from "@/lib/utils/useModalSafety";
import { InventoryDashboard } from "@/components/inventory/InventoryDashboard";
import { CadStudio } from "@/components/design-studio/CadStudio";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { SecurityDashboard } from "@/components/security/SecurityDashboard";
import { CommandPalette } from "@/components/common/CommandPalette";
import { KhatulistiwaAssistant } from "@/components/assistant/KhatulistiwaAssistant";
import { SettingsModal } from "@/components/common/SettingsModal";
import { LoginView } from "@/components/auth/LoginView";
import { FACTORY_DEMO_ACCOUNTS, FactoryUser } from "@/lib/auth/types";
import {
  FileText,
  Boxes,
  Compass,
  BarChart3,
  ShieldCheck,
  Plus,
  Truck,
  Printer,
  ChevronRight,
  X,
  Search,
  RotateCcw,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { formatIndonesianDate } from "@/lib/utils/formatters";

export default function HomePage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>("DELIVERY_ORDERS");

  // Factory Authentication & Persistent User Session
  const [currentUser, setCurrentUser] = useState<FactoryUser | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // UI Settings State (5-tier density)
  const [density, setDensity] = useState<DensityMode>("normal");
  const [layoutWidth, setLayoutWidth] = useState<LayoutWidth>("fluid");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [language, setLanguage] = useState<Language>("id");

  // Tablet & Desktop Workspace State
  const [isListRailCollapsed, setIsListRailCollapsed] = useState(false);

  // Modals & Assistant States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [stagedDraftData, setStagedDraftData] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);

  // Dispatch Guard State (P0: Lightweight confirmation sheet on Kirimkan / Tiba di Lokasi)
  const [dispatchGuard, setDispatchGuard] = useState<{
    order: DeliveryOrder;
    targetStatus: "DISPATCHED" | "DELIVERED";
  } | null>(null);

  // Delivered Ceremony State (Brief full-screen celebration on DELIVERED transition)
  const [deliveredCeremonyOrder, setDeliveredCeremonyOrder] = useState<DeliveryOrder | null>(null);

  // Slip Spooled Ceremony State (Dot-matrix print confirmation ritual matching Delivered ceremony)
  const [slipSpooledCeremonyOrder, setSlipSpooledCeremonyOrder] = useState<DeliveryOrder | null>(null);

  // Global App Toast State (Accessible Live Region, replaces native alert)
  const [appToast, setAppToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showAppToast = (message: string, type: "success" | "error" = "success") => {
    setAppToast({ message, type });
    setTimeout(() => {
      setAppToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Mobile Bottom Sheet modal safety
  const mobileDetailRef = useModalSafety({
    isOpen: isMobileDetailOpen,
    onClose: () => setIsMobileDetailOpen(false),
  });

  // Mobile feed search & status filter states (P0)
  const [mobileSearchTerm, setMobileSearchTerm] = useState("");
  const [mobileStatusFilter, setMobileStatusFilter] = useState<string>("ALL");

  // Restore saved authentication session from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("myequator_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          setCurrentUser(parsed);
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      setCurrentUser(null);
    } finally {
      setAuthInitialized(true);
    }
  }, []);

  const handleLoginSuccess = (user: FactoryUser) => {
    setCurrentUser(user);
    localStorage.setItem("myequator_session", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("myequator_session");
  };

  const handleUserChange = (user: FactoryUser) => {
    setCurrentUser(user);
    localStorage.setItem("myequator_session", JSON.stringify(user));
  };

  // Global Keyboard Listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setOrders(json.data);
        if (json.data.length > 0 && !selectedOrder) {
          setSelectedOrder(json.data[0]);
        } else if (selectedOrder) {
          const updated = json.data.find((o: DeliveryOrder) => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchOrders();
    }
  }, [currentUser]);

  const handleDensityChange = (d: DensityMode) => {
    setDensity(d);
    document.documentElement.setAttribute("data-density", d);
  };

  const handleLayoutWidthChange = (w: LayoutWidth) => {
    setLayoutWidth(w);
    document.documentElement.setAttribute("data-width", w);
  };

  const handleThemeChange = (t: ThemeMode) => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    handleThemeChange(nextTheme);
  };

  const handleLanguageToggle = () => {
    const nextLang = language === "id" ? "en" : "id";
    setLanguage(nextLang);
  };

  const handleStatusChange = async (orderId: string, newStatus: DeliveryOrderStatus, reason?: string) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (currentUser) {
        headers["x-user-role"] = currentUser.role;
        headers["x-user-id"] = currentUser.id;
        headers["x-user-name"] = currentUser.name;
      }
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus, reason }),
      });
      const json = await res.json();
      if (json.success) {
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(json.data);
        }
        if (newStatus === "DELIVERED") {
          setDeliveredCeremonyOrder(json.data || orders.find((o) => o.id === orderId) || null);
        }
        if (newStatus === "PRINTED") {
          setSlipSpooledCeremonyOrder(json.data || orders.find((o) => o.id === orderId) || null);
        }
        fetchOrders();
      } else {
        showAppToast(json.error || (language === "id" ? "Gagal memperbarui status surat jalan." : "Failed to update order status."), "error");
      }
    } catch (err: any) {
      console.error("Failed to update status:", err);
      showAppToast(err.message || (language === "id" ? "Terjadi kesalahan jaringan." : "Network error occurred."), "error");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setSelectedOrder(null);
        setIsMobileDetailOpen(false);
        showAppToast(
          language === "id" ? "Surat jalan draft berhasil dihapus." : "Draft order deleted successfully.",
          "success"
        );
        fetchOrders();
      } else {
        showAppToast(
          json.error || (language === "id" ? "Gagal menghapus surat jalan." : "Failed to delete delivery order."),
          "error"
        );
      }
    } catch (err: any) {
      console.error("Failed to delete order:", err);
      showAppToast(
        err.message || (language === "id" ? "Terjadi kesalahan saat menghapus surat jalan." : "An error occurred while deleting delivery order."),
        "error"
      );
    }
  };

  // Khatulistiwa AI Assistant: 1-Click Apply Draft Order
  const handleApplyDraftOrder = (draftData: any) => {
    setStagedDraftData(draftData);
    setIsFormOpen(true);
  };

  if (!authInitialized) {
    return null;
  }

  // If user is not logged in, render the factory login portal
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} language={language} />;
  }

  const isId = language === "id";

  // Summary Metrics
  const totalVolumePairs = orders.reduce((sum, o) => sum + (o.totalQuantity || 0), 0);
  const readyToLoadCount = orders.filter((o) => o.status === "PRINTED").length;
  const dispatchedCount = orders.filter((o) => o.status === "DISPATCHED").length;
  const completedCount = orders.filter((o) => o.status === "DELIVERED").length;

  // Mobile Header & Feed Filter Options (Canonical shared token config)
  const mobileFilterOptions = getOrderFilterOptions(language);

  const countMobileByStatus = (st: string) => {
    if (st === "ALL") return orders.length;
    return orders.filter((o) => o.status === st).length;
  };

  const filteredMobileOrders = orders.filter((order) => {
    const q = mobileSearchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      order.orderNumber.toLowerCase().includes(q) ||
      order.recipientName.toLowerCase().includes(q) ||
      (order.destinationAddress && order.destinationAddress.toLowerCase().includes(q)) ||
      (order.poNumber && order.poNumber.toLowerCase().includes(q)) ||
      (order.driverName && order.driverName.toLowerCase().includes(q));

    const matchesStatus = mobileStatusFilter === "ALL" || order.status === mobileStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-950 font-sans antialiased text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Top Header */}
      <Header
        theme={theme}
        onThemeToggle={handleThemeToggle}
        language={language}
        onLanguageToggle={handleLanguageToggle}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        currentUser={currentUser}
        onOpenSecurity={() => setCurrentTab("SECURITY")}
        onLogout={handleLogout}
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setIsMobileDetailOpen(false);
        }}
      />

      {/* Main Workspace Layout Shell */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Navigation Sidebar */}
        <div className="hidden md:flex shrink-0">
          <Sidebar
            currentTab={currentTab}
            onTabChange={(tab) => {
              setCurrentTab(tab);
              setIsMobileDetailOpen(false);
            }}
            language={language}
          />
        </div>

        {/* Dynamic Center Work Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <div key={currentTab} className="flex-1 flex flex-col overflow-hidden animate-view-enter">
          {currentTab === "DELIVERY_ORDERS" ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Top KPI Micro Strip */}
              <div className="p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-700/60 hover:shadow-xs transition">
                  <div className="p-2 rounded-xl bg-white dark:bg-gray-800 text-brand dark:text-red-400 shadow-xs">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
                      {isId ? "Total Surat Jalan" : "Total Orders"}
                    </p>
                    <p className="text-base font-extrabold text-gray-900 dark:text-white leading-tight font-mono tabular-nums">
                      {orders.length} <span className="text-xs font-normal text-gray-500 font-sans">dokumen</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-700/60 hover:shadow-xs transition">
                  <div className="p-2 rounded-xl bg-white dark:bg-gray-800 text-brand dark:text-red-400 shadow-xs">
                    <Boxes className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
                      {isId ? "Total Pasang Terjadwal" : "Total Scheduled Pairs"}
                    </p>
                    <p className="text-base font-extrabold text-gray-900 dark:text-white leading-tight font-mono tabular-nums">
                      {totalVolumePairs.toLocaleString("id-ID")}{" "}
                      <span className="text-xs font-normal text-gray-500 font-sans">pasang</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-700/60 hover:shadow-xs transition">
                  <div className="p-2 rounded-xl bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 shadow-xs">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
                      {isId ? "Siap Muat & Pengiriman" : "Ready to Load & Dispatch"}
                    </p>
                    <p className="text-base font-extrabold text-gray-900 dark:text-white leading-tight tabular-nums">
                      <span className="text-amber-700 dark:text-amber-300 font-bold font-mono">{readyToLoadCount}</span>{" "}
                      <span className="text-xs font-normal text-gray-500 font-sans">{isId ? "Siap" : "Ready"}</span> •{" "}
                      <span className="text-purple-700 dark:text-purple-300 font-bold font-mono">{dispatchedCount}</span>{" "}
                      <span className="text-xs font-normal text-gray-500 font-sans">{isId ? "Kirim" : "Transit"}</span> •{" "}
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">{completedCount}</span>{" "}
                      <span className="text-xs font-normal text-gray-500 font-sans">{isId ? "Selesai" : "Delivered"}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Master-Detail Dual Pane */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* Left Rail (List) */}
                <div
                  className={`transition-all duration-200 overflow-hidden flex flex-col shrink-0 ${
                    isListRailCollapsed
                      ? "md:w-0 border-none"
                      : "w-full md:w-80 lg:w-[360px] h-full border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800"
                  }`}
                >
                  {/* Mobile Header Card (P0: Search + Status Filter Chips) */}
                  <div className="md:hidden bg-brand text-white shadow-xs">
                    {/* Top Bar: Title & Action */}
                    <div className="p-3.5 pb-2.5 flex items-center justify-between">
                      <div>
                        <h2 className="font-bold text-sm leading-tight">
                          {isId ? "Surat Jalan (Gudang)" : "Delivery Orders (Warehouse)"}
                        </h2>
                        <p className="text-[11px] text-red-200 mt-0.5">
                          {orders.length} {isId ? "DO aktif di sistem" : "active orders in system"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setStagedDraftData(null);
                          setIsFormOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl bg-white text-brand font-bold text-xs shadow-xs active:scale-95 transition"
                      >
                        <Plus className="h-4 w-4 stroke-[2.5]" />
                        <span>{isId ? "Buat DO" : "New DO"}</span>
                      </button>
                    </div>

                    {/* Search Bar */}
                    <div className="px-3.5 pb-2.5">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-red-300 pointer-events-none" />
                        <input
                          type="text"
                          aria-label={isId ? "Cari surat jalan berdasarkan nomor, customer, PO, atau sopir" : "Search delivery orders by number, client, PO, or driver"}
                          placeholder={isId ? "Cari No. SJ, Customer, PO, Sopir..." : "Search Order, Client, PO, Driver..."}
                          value={mobileSearchTerm}
                          onChange={(e) => setMobileSearchTerm(e.target.value)}
                          className="w-full rounded-xl bg-black/20 border border-white/20 py-2 pl-8.5 pr-11 text-xs text-white placeholder-red-200/70 focus:bg-black/30 focus:border-white focus:outline-none transition shadow-inner"
                        />
                        {mobileSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setMobileSearchTerm("")}
                            aria-label={isId ? "Hapus pencarian" : "Clear search"}
                            className="absolute right-0.5 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] p-2.5 text-red-200 hover:text-white flex items-center justify-center rounded-lg active:scale-95 transition"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status Filter Chips */}
                    <div className="px-3.5 pb-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                      {mobileFilterOptions.map((opt) => {
                        const isSelected = mobileStatusFilter === opt.id;
                        const count = countMobileByStatus(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setMobileStatusFilter(opt.id)}
                            className={`px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 active:scale-95 ${
                              isSelected
                                ? "bg-white text-brand shadow-xs font-black"
                                : "bg-white/15 text-white hover:bg-white/25 backdrop-blur-xs"
                            }`}
                          >
                            <span>{opt.label}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono tabular-nums ${
                                isSelected ? "bg-red-100 text-brand font-black" : "bg-black/25 text-white/90"
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile Specific Card Feed */}
                  <div className="md:hidden flex-1 overflow-y-auto p-3 space-y-3 pb-20">
                    {loading ? (
                      <div className="space-y-3 py-2">
                        {[1, 2, 3].map((n) => (
                          <div
                            key={n}
                            className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3 animate-pulse"
                          >
                            <div className="flex items-center justify-between">
                              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded-md" />
                              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                            </div>
                            <div className="space-y-1.5">
                              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-md" />
                              <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-800 rounded-md" />
                            </div>
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                              <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded-md" />
                              <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded-md" />
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div className="h-11 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                              <div className="h-11 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filteredMobileOrders.length === 0 ? (
                      <div className="p-8 my-4 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 space-y-3">
                        <FileText className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-700" />
                        <div>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            {isId ? "Tidak ada surat jalan ditemukan" : "No delivery orders found"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
                            {mobileSearchTerm || mobileStatusFilter !== "ALL"
                              ? isId
                                ? "Coba sesuaikan kata kunci pencarian atau filter status yang dipilih."
                                : "Try adjusting your search query or status filter."
                              : isId
                              ? "Belum ada dokumen surat jalan. Buat dokumen pertama untuk memulai."
                              : "No delivery orders yet. Create the first order to get started."}
                          </p>
                        </div>
                        {mobileSearchTerm || mobileStatusFilter !== "ALL" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setMobileSearchTerm("");
                              setMobileStatusFilter("ALL");
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition shadow-xs"
                          >
                            <RotateCcw className="h-4 w-4 text-brand" />
                            <span>{isId ? "Reset Filter & Pencarian" : "Reset Filters"}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setStagedDraftData(null);
                              setIsFormOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-brand text-xs font-bold text-white shadow-xs active:scale-95 transition"
                          >
                            <Plus className="h-4 w-4 stroke-[2.5]" />
                            <span>{isId ? "Buat Surat Jalan Pertama" : "Create First Order"}</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      filteredMobileOrders.map((order) => {
                        const isPrintable = order.status !== "DRAFT" && order.status !== "CANCELLED";
                        const printDisabledTooltip = order.status === "DRAFT"
                          ? (isId ? "Konfirm dulu untuk cetak resmi" : "Confirm order before official print")
                          : (isId ? "Dokumen dibatalkan, tidak dapat dicetak" : "Cancelled order cannot be printed");

                        return (
                          <div
                            key={order.id}
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsMobileDetailOpen(true);
                            }}
                            className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-2.5 shadow-xs active:scale-[0.98] transition-all cursor-pointer hover:border-red-300"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-brand dark:text-red-400 font-mono">
                                {order.orderNumber}
                              </span>
                              <StatusBadge status={order.status} size="sm" language={language} />
                            </div>

                            <div>
                              <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                                {order.recipientName}
                              </p>
                              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                {order.destinationAddress}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                              <div>
                                <span className="text-gray-400">Total: </span>
                                <span className="font-extrabold text-gray-900 dark:text-white">
                                  {order.totalQuantity} psg
                                </span>
                              </div>
                              <span className="text-[11px] text-gray-400">
                                {formatIndonesianDate(order.deliveryDate)}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                type="button"
                                disabled={!isPrintable}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isPrintable) setPrintOrder(order);
                                }}
                                title={!isPrintable ? printDisabledTooltip : (isId ? "Cetak Slip" : "Print Slip")}
                                className={`py-2.5 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                                  !isPrintable
                                    ? "bg-gray-100 dark:bg-gray-800/60 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60"
                                    : "bg-red-50 dark:bg-red-950/60 text-brand dark:text-red-300 active:scale-95"
                                }`}
                              >
                                <Printer className="h-4 w-4" />
                                <span>{isId ? "Cetak Slip" : "Print Slip"}</span>
                              </button>

                            {order.status === "PRINTED" ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(order);
                                  setDispatchGuard({ order, targetStatus: "DISPATCHED" });
                                }}
                                className={`py-2.5 min-h-[44px] rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition ${STATUS_COLOR_MAP.DISPATCHED.cta.buttonClasses}`}
                              >
                                <Truck className="h-4 w-4" />
                                <span>{isId ? "Kirimkan" : "Dispatch"}</span>
                              </button>
                            ) : order.status === "DISPATCHED" ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(order);
                                  setDispatchGuard({ order, targetStatus: "DELIVERED" });
                                }}
                                className={`py-2.5 min-h-[44px] rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition ${STATUS_COLOR_MAP.DELIVERED.cta.buttonClasses}`}
                              >
                                <span>{isId ? "Tiba di Lokasi" : "Mark Delivered"}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(order);
                                  setIsMobileDetailOpen(true);
                                }}
                                className="py-2.5 min-h-[44px] rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1 active:scale-95 transition"
                              >
                                <span>{isId ? "Detail" : "Details"}</span>
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  </div>

                  {/* Desktop & Tablet OrderList */}
                  <div className="hidden md:flex flex-col flex-1 overflow-hidden">
                    <OrderList
                      orders={orders}
                      selectedOrderId={selectedOrder?.id || null}
                      onSelectOrder={setSelectedOrder}
                      onCreateNew={() => {
                        setStagedDraftData(null);
                        setIsFormOpen(true);
                      }}
                      onOpenPrint={(order) => setPrintOrder(order)}
                      language={language}
                      loading={loading}
                    />
                  </div>
                </div>

                {/* Right Rail (Detail Workspace) */}
                <div className="hidden md:flex flex-1 flex-col h-full overflow-hidden relative">
                  {/* Expand / Collapse List Rail Button */}
                  <div className="absolute top-4 left-4 z-20">
                    <button
                      onClick={() => setIsListRailCollapsed(!isListRailCollapsed)}
                      className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 hover:text-brand active:scale-95 transition"
                      title={isListRailCollapsed ? "Buka Daftar Surat Jalan" : "Tutup Panel Samping"}
                    >
                      {isListRailCollapsed ? (
                        <PanelLeftOpen className="h-4 w-4" />
                      ) : (
                        <PanelLeftClose className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {loading && !selectedOrder ? (
                    <div className="flex-1 p-6 space-y-5 animate-pulse bg-gray-50/50 dark:bg-gray-950/50 overflow-y-auto">
                      <div className="h-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded-md" />
                          <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800 rounded-md" />
                        </div>
                        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="h-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4" />
                        <div className="h-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4" />
                        <div className="h-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4" />
                      </div>
                      <div className="h-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4" />
                    </div>
                  ) : selectedOrder ? (
                    <OrderDetail
                      order={selectedOrder}
                      onStatusChange={handleStatusChange}
                      onOpenPrint={(order) => setPrintOrder(order)}
                      onDeleteOrder={handleDeleteOrder}
                      onOrderUpdated={fetchOrders}
                      language={language}
                      onSpoolSuccess={(order) => setSlipSpooledCeremonyOrder(order)}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-center p-8 text-gray-400">
                      <div className="animate-in fade-in zoom-in duration-200">
                        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                        <p className="font-semibold text-sm text-gray-600 dark:text-gray-400">
                          {isId ? "Pilih surat jalan dari daftar sebelah kiri" : "Select an order to view details"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : currentTab === "DIGITIZER" ? (
            <ArchiveDigitizer
              onSuccess={() => {
                fetchOrders();
                setCurrentTab("DELIVERY_ORDERS");
              }}
              language={language}
            />
          ) : currentTab === "INVENTORY" ? (
            <InventoryDashboard language={language} />
          ) : currentTab === "CAD_STUDIO" ? (
            <CadStudio language={language} />
          ) : currentTab === "ANALYTICS" ? (
            <AnalyticsDashboard language={language} />
          ) : (
            <SecurityDashboard
              currentUser={currentUser}
              onUserChange={handleUserChange}
              onLogout={handleLogout}
              language={language}
            />
          )}
          </div>
        </main>
      </div>

      {/* Mobile Slide-Up Bottom Sheet Detail Viewer */}
      {isMobileDetailOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150">
          <div
            ref={mobileDetailRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Detail Surat Jalan ${selectedOrder.orderNumber}`}
            className="bg-white dark:bg-gray-900 rounded-t-2xl border-t border-gray-200 dark:border-gray-800 shadow-2xl h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
          >
            <div className="p-3.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/60">
              <span className="font-bold text-sm text-gray-900 dark:text-white font-mono">
                {selectedOrder.orderNumber}
              </span>
              <button
                onClick={() => setIsMobileDetailOpen(false)}
                aria-label={isId ? "Tutup detail surat jalan" : "Close order detail"}
                className="min-w-[44px] min-h-[44px] rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-800 flex items-center justify-center active:scale-95 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <OrderDetail
                order={selectedOrder}
                onStatusChange={handleStatusChange}
                onOpenPrint={(order) => setPrintOrder(order)}
                onDeleteOrder={handleDeleteOrder}
                onOrderUpdated={fetchOrders}
                language={language}
                onSpoolSuccess={(order) => setSlipSpooledCeremonyOrder(order)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 px-4 flex items-center justify-around shrink-0 shadow-lg z-30">
        <button
          onClick={() => {
            setCurrentTab("DELIVERY_ORDERS");
            setIsMobileDetailOpen(false);
          }}
          className={`flex flex-col items-center text-[10px] font-bold active:scale-95 transition ${
            currentTab === "DELIVERY_ORDERS"
              ? "text-brand dark:text-red-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <FileText className="h-5 w-5" />
          <span>Surat Jalan</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab("INVENTORY");
            setIsMobileDetailOpen(false);
          }}
          className={`flex flex-col items-center text-[10px] font-bold active:scale-95 transition ${
            currentTab === "INVENTORY"
              ? "text-brand dark:text-red-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <Boxes className="h-5 w-5" />
          <span>Stok</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab("CAD_STUDIO");
            setIsMobileDetailOpen(false);
          }}
          className={`flex flex-col items-center text-[10px] font-bold active:scale-95 transition ${
            currentTab === "CAD_STUDIO"
              ? "text-brand dark:text-red-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <Compass className="h-5 w-5" />
          <span>Insole CAD</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab("ANALYTICS");
            setIsMobileDetailOpen(false);
          }}
          className={`flex flex-col items-center text-[10px] font-bold active:scale-95 transition ${
            currentTab === "ANALYTICS"
              ? "text-brand dark:text-red-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <BarChart3 className="h-5 w-5" />
          <span>Analitik</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab("SECURITY");
            setIsMobileDetailOpen(false);
          }}
          className={`flex flex-col items-center text-[10px] font-bold active:scale-95 transition ${
            currentTab === "SECURITY"
              ? "text-brand dark:text-red-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <ShieldCheck className="h-5 w-5" />
          <span>Keamanan</span>
        </button>
      </div>

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileDetailOpen(false);
        }}
        onOpenCreateOrder={() => {
          setStagedDraftData(null);
          setIsFormOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        language={language}
      />

      {/* Khatulistiwa AI Assistant Truly Floating Pop-up Widget */}
      <KhatulistiwaAssistant
        isOpen={isAssistantOpen}
        onToggle={() => setIsAssistantOpen(!isAssistantOpen)}
        onApplyDraftOrder={handleApplyDraftOrder}
        language={language}
      />

      {/* Create Order Modal (Supports AI Staged Prefill) */}
      <OrderFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setStagedDraftData(null);
        }}
        onSuccess={fetchOrders}
        initialDraftData={stagedDraftData}
        language={language}
      />

      {/* Dual Mode Print Modal */}
      <PrintModal
        isOpen={!!printOrder}
        order={printOrder}
        onClose={() => setPrintOrder(null)}
        language={language}
        onSpoolSuccess={(spooledOrder) => {
          if (spooledOrder.status === "CONFIRMED") {
            handleStatusChange(spooledOrder.id, "PRINTED");
          } else {
            setSlipSpooledCeremonyOrder(spooledOrder);
          }
        }}
      />

      {/* UI Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        density={density}
        onDensityChange={handleDensityChange}
        layoutWidth={layoutWidth}
        onLayoutWidthChange={handleLayoutWidthChange}
        theme={theme}
        onThemeChange={handleThemeChange}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Dispatch Guard Confirmation Sheet (P0: Lightweight Confirm on Mobile Kirimkan / Tiba di Lokasi) */}
      <DispatchConfirmModal
        isOpen={!!dispatchGuard}
        order={dispatchGuard?.order || null}
        targetStatus={dispatchGuard?.targetStatus || "DISPATCHED"}
        onConfirm={() => {
          if (dispatchGuard) {
            handleStatusChange(dispatchGuard.order.id, dispatchGuard.targetStatus);
            setDispatchGuard(null);
          }
        }}
        onClose={() => setDispatchGuard(null)}
        language={language}
      />

      {/* Delivered Ceremony Full-Screen Completion Modal */}
      <DeliveredCeremonyModal
        isOpen={!!deliveredCeremonyOrder}
        order={deliveredCeremonyOrder}
        onClose={() => setDeliveredCeremonyOrder(null)}
        language={language}
      />

      {/* Slip Spooled Ceremony Full-Screen Print Ritual Modal */}
      <SlipSpooledCeremonyModal
        isOpen={!!slipSpooledCeremonyOrder}
        order={slipSpooledCeremonyOrder}
        onClose={() => setSlipSpooledCeremonyOrder(null)}
        language={language}
      />

      {/* Global App Toast (Accessible Live Region, replaces native alert) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={
          appToast
            ? `fixed top-4 right-4 z-70 text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150 ${
                appToast.type === "error"
                  ? "bg-red-950 text-red-100 border-red-800 shadow-red-950/50"
                  : "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-700 dark:border-gray-300 shadow-xl"
              }`
            : "sr-only"
        }
      >
        {appToast && (
          <>
            {appToast.type === "error" ? (
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            )}
            <span className="leading-snug">{appToast.message}</span>
            <button
              type="button"
              onClick={() => setAppToast(null)}
              className="ml-2 text-gray-400 hover:text-white p-0.5 rounded focus:outline-none"
              aria-label="Tutup notifikasi"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
