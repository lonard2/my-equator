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
import { InventoryDashboard } from "@/components/inventory/InventoryDashboard";
import { CadStudio } from "@/components/design-studio/CadStudio";
import { KhatulistiwaAssistant } from "@/components/assistant/KhatulistiwaAssistant";
import { SettingsModal } from "@/components/common/SettingsModal";
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
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  Sliders,
} from "lucide-react";
import { formatIndonesianDate } from "@/lib/utils/formatters";

export default function HomePage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>("DELIVERY_ORDERS");

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
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);

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
    fetchOrders();
  }, []);

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
    setLanguage(language === "id" ? "en" : "id");
  };

  const handleStatusChange = async (id: string, newStatus: DeliveryOrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        fetchOrders();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setSelectedOrder(null);
        setIsMobileDetailOpen(false);
        fetchOrders();
      }
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  };

  const handleApplyDraftOrder = (draftData: any) => {
    setStagedDraftData(draftData);
    setIsAssistantOpen(false);
    setIsFormOpen(true);
  };

  const isId = language === "id";

  // Factory Summary Metrics
  const totalVolumePairs = orders.reduce((sum, o) => sum + o.totalQuantity, 0);
  const readyOrDispatchedCount = orders.filter((o) => o.status === "PRINTED" || o.status === "DISPATCHED").length;
  const completedCount = orders.filter((o) => o.status === "DELIVERED").length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Global Brand Header with Compass Logo */}
      <Header
        theme={theme}
        onThemeToggle={handleThemeToggle}
        language={language}
        onLanguageToggle={handleLanguageToggle}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container Wrapper */}
      <div
        className={`flex-1 flex overflow-hidden w-full mx-auto transition-all ${
          layoutWidth === "boxed" ? "max-w-[1340px] my-2 sm:px-4" : "w-full"
        }`}
      >
        {/* Sidebar Navigation (Visible on Tablet & Desktop) */}
        <div className="hidden md:flex shrink-0 transition-all duration-200">
          <Sidebar
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            language={language}
          />
        </div>

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
          {currentTab === "DELIVERY_ORDERS" ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Tablet & Desktop Top KPI Ribbon */}
              <div className="hidden md:grid grid-cols-3 gap-3 p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-red-50/70 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 hover:shadow-xs transition">
                  <div className="p-2 rounded-xl bg-white dark:bg-gray-800 text-[#8B0000] dark:text-red-300 shadow-xs">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-red-900/70 dark:text-red-300">
                      {isId ? "Surat Jalan Aktif" : "Active Orders"}
                    </p>
                    <p className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
                      {orders.length} <span className="text-xs font-normal text-gray-500">Dokumen</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 hover:shadow-xs transition">
                  <div className="p-2 rounded-xl bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 shadow-xs">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-amber-900/70 dark:text-amber-300">
                      {isId ? "Total Pasang Terjadwal" : "Total Scheduled Pairs"}
                    </p>
                    <p className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
                      {totalVolumePairs.toLocaleString("id-ID")}{" "}
                      <span className="text-xs font-normal text-gray-500">pasang</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 hover:shadow-xs transition">
                  <div className="p-2 rounded-xl bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-xs">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-emerald-900/70 dark:text-emerald-300">
                      {isId ? "Proses Pengiriman / Selesai" : "In Transit / Delivered"}
                    </p>
                    <p className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
                      {readyOrDispatchedCount} <span className="text-xs font-normal text-gray-500">Kirim</span>{" "}
                      • {completedCount} <span className="text-xs font-normal text-gray-500">Selesai</span>
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
                  {/* Mobile Header Card */}
                  <div className="md:hidden p-3.5 bg-[#8B0000] text-white flex items-center justify-between shadow-xs">
                    <div>
                      <h2 className="font-bold text-sm">Surat Jalan (Warehouse)</h2>
                      <p className="text-[10px] text-red-200">{orders.length} DO Aktif di Sistem</p>
                    </div>
                    <button
                      onClick={() => {
                        setStagedDraftData(null);
                        setIsFormOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-[#8B0000] font-bold text-xs shadow-xs active:scale-95 transition"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Buat DO</span>
                    </button>
                  </div>

                  {/* Mobile Specific Card Feed */}
                  <div className="md:hidden flex-1 overflow-y-auto p-3 space-y-3 pb-20">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsMobileDetailOpen(true);
                        }}
                        className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-2.5 shadow-xs active:scale-[0.98] transition-all cursor-pointer hover:border-red-300"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#8B0000] dark:text-red-400 font-mono">
                            {order.orderNumber}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950 text-[#8B0000] dark:text-red-300">
                            {order.status}
                          </span>
                        </div>

                        <div>
                          <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                            {order.recipientName}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                            {order.destinationAddress}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 dark:border-gray-800">
                          <span className="text-gray-500">{formatIndonesianDate(order.deliveryDate)}</span>
                          <span className="font-extrabold text-[#8B0000] dark:text-red-400">
                            {order.totalQuantity.toLocaleString("id-ID")} psg
                          </span>
                        </div>

                        {/* Mobile 1-Tap Quick Action Row */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrintOrder(order);
                            }}
                            className="py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1 active:scale-95 transition"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Slip Cetak</span>
                          </button>
                          {order.status === "PRINTED" || order.status === "CONFIRMED" ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(order.id, "DISPATCHED");
                              }}
                              className="py-2 rounded-xl bg-[#8B0000] text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs active:scale-95 transition"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              <span>Dispatch</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                                setIsMobileDetailOpen(true);
                              }}
                              className="py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1 active:scale-95 transition"
                            >
                              <span>Detail</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
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
                    />
                  </div>
                </div>

                {/* Right Rail (Detail Workspace) */}
                <div className="hidden md:flex flex-1 flex-col h-full overflow-hidden relative">
                  {/* Tablet/Desktop Expand / Collapse List Rail Button */}
                  <div className="absolute top-4 left-4 z-20">
                    <button
                      onClick={() => setIsListRailCollapsed(!isListRailCollapsed)}
                      className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 hover:text-[#8B0000] active:scale-95 transition"
                      title={isListRailCollapsed ? "Buka Daftar Surat Jalan" : "Tutup Panel Samping"}
                    >
                      {isListRailCollapsed ? (
                        <PanelLeftOpen className="h-4 w-4" />
                      ) : (
                        <PanelLeftClose className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {selectedOrder ? (
                    <OrderDetail
                      order={selectedOrder}
                      onStatusChange={handleStatusChange}
                      onOpenPrint={(order) => setPrintOrder(order)}
                      onDeleteOrder={handleDeleteOrder}
                      onOrderUpdated={fetchOrders}
                      language={language}
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
          ) : (
            /* Upcoming Modules Placeholder (Analytics & Security) */
            <div className="flex-1 flex items-center justify-center p-8 text-center animate-in fade-in duration-200">
              <div className="max-w-md space-y-3 bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="inline-flex p-3 rounded-2xl bg-red-50 dark:bg-red-950 text-[#8B0000] dark:text-red-400 shadow-inner">
                  {currentTab === "ANALYTICS" ? (
                    <BarChart3 className="h-8 w-8" />
                  ) : (
                    <ShieldCheck className="h-8 w-8" />
                  )}
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {isId ? "Modul ini dijadwalkan pada fase berikutnya" : "Module Scheduled for Upcoming Phase"}
                </h3>
                <p className="text-xs text-gray-500">
                  {isId
                    ? "Arsitektur, skema database, dan panduan AGENTS.md telah siap untuk dikembangkan."
                    : "Architecture and database schema ready in accordance with AGENTS.md roadmap."}
                </p>
                <button
                  onClick={() => setCurrentTab("DELIVERY_ORDERS")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B0000] text-white text-xs font-semibold hover:bg-[#A00000] active:scale-95 shadow-md transition"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{isId ? "Kembali ke Surat Jalan" : "Back to Delivery Orders"}</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Slide-Up Bottom Sheet Detail Viewer */}
      {isMobileDetailOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl border-t border-gray-200 dark:border-gray-800 shadow-2xl h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="p-3.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/60">
              <span className="font-bold text-sm text-gray-900 dark:text-white font-mono">
                {selectedOrder.orderNumber}
              </span>
              <button
                onClick={() => setIsMobileDetailOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 active:scale-95 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <OrderDetail
                order={selectedOrder}
                onStatusChange={handleStatusChange}
                onOpenPrint={(order) => {
                  setIsMobileDetailOpen(false);
                  setPrintOrder(order);
                }}
                onDeleteOrder={handleDeleteOrder}
                onOrderUpdated={fetchOrders}
                language={language}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Thumb Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 flex items-center justify-around py-2 px-3 shadow-lg">
        <button
          onClick={() => {
            setCurrentTab("DELIVERY_ORDERS");
            setIsMobileDetailOpen(false);
          }}
          className={`flex flex-col items-center text-[10px] font-bold active:scale-95 transition ${
            currentTab === "DELIVERY_ORDERS"
              ? "text-[#8B0000] dark:text-red-400"
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
              ? "text-[#8B0000] dark:text-red-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <Boxes className="h-5 w-5" />
          <span>Stok</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab("DIGITIZER");
            setIsMobileDetailOpen(false);
          }}
          className={`flex flex-col items-center text-[10px] font-bold active:scale-95 transition ${
            currentTab === "DIGITIZER"
              ? "text-[#8B0000] dark:text-red-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <Plus className="h-5 w-5" />
          <span>Quick Digit</span>
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex flex-col items-center text-[10px] font-bold text-gray-500 dark:text-gray-400 active:scale-95 transition"
        >
          <Sliders className="h-5 w-5" />
          <span>Settings</span>
        </button>
      </div>

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
    </div>
  );
}
