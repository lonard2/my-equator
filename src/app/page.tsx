"use client";

import React, { useState, useEffect } from "react";
import { DeliveryOrder, DeliveryOrderStatus, DeviceViewMode, DensityMode, LayoutWidth, ThemeMode, Language } from "@/types";
import { Header } from "@/components/common/Header";
import { Sidebar, NavTab } from "@/components/common/Sidebar";
import { OrderList } from "@/components/delivery-orders/OrderList";
import { OrderDetail } from "@/components/delivery-orders/OrderDetail";
import { OrderFormModal } from "@/components/delivery-orders/OrderFormModal";
import { PrintModal } from "@/components/delivery-orders/PrintModal";
import { ArchiveDigitizer } from "@/components/delivery-orders/ArchiveDigitizer";
import { SettingsModal } from "@/components/common/SettingsModal";
import {
  FileText,
  Boxes,
  Compass,
  BarChart3,
  Bot,
  ShieldCheck,
  Plus,
  Truck,
} from "lucide-react";
import { formatIndonesianDate } from "@/lib/utils/formatters";

export default function HomePage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>("DELIVERY_ORDERS");

  // UI Settings State
  const [deviceMode, setDeviceMode] = useState<DeviceViewMode | "AUTO">("AUTO");
  const [density, setDensity] = useState<DensityMode>("normal");
  const [layoutWidth, setLayoutWidth] = useState<LayoutWidth>("fluid");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [language, setLanguage] = useState<Language>("id");

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
        fetchOrders();
      }
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  };

  const isId = language === "id";

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Global Brand Header */}
      <Header
        deviceMode={deviceMode}
        onDeviceModeChange={setDeviceMode}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        language={language}
        onLanguageToggle={handleLanguageToggle}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container Wrapper */}
      <div
        className={`flex-1 flex overflow-hidden transition-all mx-auto w-full ${
          deviceMode === "TABLET"
            ? "max-w-[860px] my-4 rounded-3xl border-8 border-gray-800 shadow-2xl bg-white dark:bg-gray-900"
            : deviceMode === "MOBILE"
            ? "max-w-[420px] my-4 rounded-[40px] border-[10px] border-gray-900 shadow-2xl bg-white dark:bg-gray-900 overflow-hidden"
            : layoutWidth === "boxed"
            ? "max-w-[1240px] my-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm"
            : "w-full"
        }`}
      >
        {/* Sidebar Navigation */}
        {(deviceMode === "AUTO" || deviceMode === "DESKTOP" || deviceMode === "TABLET") && (
          <div className={deviceMode === "AUTO" ? "hidden md:flex" : "flex"}>
            <Sidebar
              currentTab={currentTab}
              onTabChange={setCurrentTab}
              language={language}
            />
          </div>
        )}

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
          {currentTab === "DELIVERY_ORDERS" ? (
            deviceMode === "MOBILE" ? (
              /* Mobile Simulated Layout */
              <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
                <div className="p-3.5 bg-[#8B0000] text-white flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-sm">Surat Jalan (Warehouse)</h2>
                    <p className="text-[10px] text-red-200">{orders.length} DO Aktif</p>
                  </div>
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="p-1.5 rounded-lg bg-white text-[#8B0000] font-bold text-xs"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 p-2 space-y-2">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => {
                        setSelectedOrder(order);
                        setPrintOrder(order);
                      }}
                      className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 space-y-1.5 cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#8B0000] dark:text-red-400 font-mono">
                          {order.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950 text-[#8B0000] dark:text-red-300">
                          {order.status}
                        </span>
                      </div>
                      <p className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                        {order.recipientName}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>{formatIndonesianDate(order.deliveryDate)}</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {order.totalQuantity} psg
                        </span>
                      </div>
                      {order.status === "PRINTED" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(order.id, "DISPATCHED");
                          }}
                          className="w-full mt-1 py-1 rounded bg-[#8B0000] text-white text-[11px] font-bold flex items-center justify-center gap-1"
                        >
                          <Truck className="h-3 w-3" />
                          <span>Dispatch Armada</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-2 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-around text-[10px] font-semibold text-gray-600 dark:text-gray-400">
                  <button
                    onClick={() => setCurrentTab("DELIVERY_ORDERS")}
                    className="flex flex-col items-center text-[#8B0000] dark:text-red-400"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Surat Jalan</span>
                  </button>
                  <button
                    onClick={() => setCurrentTab("DIGITIZER")}
                    className="flex flex-col items-center"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Quick Digit</span>
                  </button>
                  <button
                    onClick={() => setCurrentTab("INVENTORY")}
                    className="flex flex-col items-center"
                  >
                    <Boxes className="h-4 w-4" />
                    <span>Stok</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Auto Responsive & Desktop/Tablet Master-Detail Layout */
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <div className="w-full md:w-80 lg:w-96 shrink-0 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800">
                  <OrderList
                    orders={orders}
                    selectedOrderId={selectedOrder?.id || null}
                    onSelectOrder={setSelectedOrder}
                    onCreateNew={() => setIsFormOpen(true)}
                    onOpenPrint={(order) => setPrintOrder(order)}
                    language={language}
                  />
                </div>

                <div className="flex-1 h-1/2 md:h-full overflow-hidden">
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
                      <div>
                        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                        <p className="font-semibold text-sm text-gray-600 dark:text-gray-400">
                          {isId ? "Pilih surat jalan dari daftar sebelah kiri" : "Select an order to view details"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : currentTab === "DIGITIZER" ? (
            <ArchiveDigitizer
              onSuccess={() => {
                fetchOrders();
                setCurrentTab("DELIVERY_ORDERS");
              }}
              language={language}
            />
          ) : (
            /* Upcoming Modules Placeholder */
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div className="max-w-md space-y-3 bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="inline-flex p-3 rounded-xl bg-red-50 dark:bg-red-950 text-[#8B0000] dark:text-red-400">
                  {currentTab === "INVENTORY" ? (
                    <Boxes className="h-8 w-8" />
                  ) : currentTab === "CAD_STUDIO" ? (
                    <Compass className="h-8 w-8" />
                  ) : currentTab === "ANALYTICS" ? (
                    <BarChart3 className="h-8 w-8" />
                  ) : currentTab === "AI_ASSISTANT" ? (
                    <Bot className="h-8 w-8" />
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#8B0000] text-white text-xs font-semibold hover:bg-[#A00000] transition"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{isId ? "Kembali ke Surat Jalan" : "Back to Delivery Orders"}</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create Order Modal */}
      <OrderFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchOrders}
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
        deviceMode={deviceMode}
        onDeviceModeChange={setDeviceMode}
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
