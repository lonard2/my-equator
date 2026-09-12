import React, { useState, useEffect, useCallback, useRef } from "react";
import { TaxInvoice, TaxInvoiceStatus, SptMasaPeriodSummary, CompanyTaxProfile } from "@/types/tax";
import { SptMasaSummaryCard } from "./SptMasaSummaryCard";
import { TaxInvoiceList } from "./TaxInvoiceList";
import { TaxInvoiceDetailDrawer } from "./TaxInvoiceDetailDrawer";
import { TaxBatchGenerateModal } from "./TaxBatchGenerateModal";
import { CoretaxExportModal } from "./CoretaxExportModal";
import { CompanyTaxProfileModal } from "./CompanyTaxProfileModal";
import { TaxManualInvoiceModal } from "./TaxManualInvoiceModal";
import { TaxMaterialPurchasesModal } from "./TaxMaterialPurchasesModal";
import { useModalSafety } from "@/lib/utils/useModalSafety";
import {
  FileSpreadsheet,
  Download,
  Settings,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Building2,
  Sparkles,
  CheckCircle2,
  Plus,
} from "lucide-react";

interface TaxDashboardProps {
  language: "id" | "en";
  userRole?: string;
}

export function TaxDashboard({ language, userRole = "SUPER_ADMIN" }: TaxDashboardProps) {
  const isId = language === "id";

  // Current Tax Period: Default to current year-month
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [currentPeriod, setCurrentPeriod] = useState<string>(defaultPeriod);

  // Data states
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [summary, setSummary] = useState<SptMasaPeriodSummary | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyTaxProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [downloadingDirectExcel, setDownloadingDirectExcel] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);

  // Selected invoices for bulk actions
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

  // Modals & Drawer states
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoice | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isPurchasesModalOpen, setIsPurchasesModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  // Fetch reconciliation and invoices
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { "x-user-role": userRole };

      // 1. Fetch reconciliation summary
      const reconRes = await fetch(`/api/tax/reconciliation?period=${currentPeriod}`, { headers });
      const reconData = await reconRes.json();
      if (reconData.success) {
        setSummary(reconData.data.summary);
        setInvoices(reconData.data.invoices || []);
      } else {
        setError(reconData.error || "Gagal memuat data rekonsiliasi");
      }

      // 2. Fetch company tax profile
      const profRes = await fetch("/api/tax/profile", { headers });
      const profData = await profRes.json();
      if (profData.success) {
        setCompanyProfile(profData.data);
      }
    } catch (err: any) {
      console.error("Tax dashboard fetch error:", err);
      setError(err?.message || "Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }, [currentPeriod, userRole]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Period Navigation Helpers
  const handlePrevMonth = () => {
    const [year, month] = currentPeriod.split("-").map(Number);
    const date = new Date(year, month - 2, 1);
    setCurrentPeriod(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    const [year, month] = currentPeriod.split("-").map(Number);
    const date = new Date(year, month, 1);
    setCurrentPeriod(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (ids: string[]) => {
    setSelectedInvoiceIds(ids);
  };

  // Delete draft invoice trigger
  const handleDeleteInvoice = (id: string) => {
    setInvoiceToDelete(id);
  };

  // Confirm delete draft invoice
  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;
    const id = invoiceToDelete;
    try {
      const res = await fetch(`/api/tax/invoices/${id}`, {
        method: "DELETE",
        headers: { "x-user-role": userRole },
      });
      if (res.ok) {
        fetchData();
        setSelectedInvoiceIds((prev) => prev.filter((i) => i !== id));
        setFeedback({
          type: "success",
          text: isId ? "Draft faktur pajak berhasil dihapus" : "Draft tax invoice deleted successfully",
        });
      } else {
        const data = await res.json().catch(() => ({}));
        setFeedback({
          type: "error",
          text: data.error || (isId ? "Gagal menghapus draft faktur" : "Failed to delete invoice"),
        });
      }
    } catch (err: any) {
      console.error("Failed to delete invoice:", err);
      setFeedback({
        type: "error",
        text: err?.message || (isId ? "Gagal menghapus draft faktur" : "Failed to delete invoice"),
      });
    } finally {
      setInvoiceToDelete(null);
    }
  };

  const handleViewInvoice = (inv: TaxInvoice) => {
    setSelectedInvoice(inv);
    setIsDetailDrawerOpen(true);
  };

  // 1-Click Direct Excel Download (GET)
  const handleDirectDownloadExcel = async () => {
    setDownloadingDirectExcel(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/tax/export-excel?period=${currentPeriod}&role=${userRole}`, {
        headers: { "x-user-role": userRole },
      });
      if (!res.ok) throw new Error("Gagal mengunduh Excel Coretax");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = invoices.length > 0
        ? `Coretax_Faktur_${currentPeriod}.xlsx`
        : `Template_Coretax_DJP_Resmi.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setFeedback({
        type: "success",
        text: isId
          ? invoices.length > 0
            ? `Berhasil mengunduh berkas Excel Coretax masa ${currentPeriod}`
            : "Berhasil mengunduh Template Resmi Excel DJP Coretax (3-Sheet)"
          : "Coretax Excel workbook downloaded successfully",
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || (isId ? "Gagal mengunduh Excel" : "Failed to download Excel"),
      });
    } finally {
      setDownloadingDirectExcel(false);
    }
  };

  // Quick Seed Demo Data
  const handleSeedDemoData = async () => {
    setSeedingDemo(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/tax/seed-demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole,
        },
        body: JSON.stringify({ period: currentPeriod }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memuat data contoh");
      }
      await fetchData();
      setFeedback({
        type: "success",
        text: isId
          ? `Berhasil memuat 4 faktur contoh Coretax untuk masa ${currentPeriod}`
          : `Loaded 4 demo Coretax invoices for period ${currentPeriod}`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Gagal memuat data contoh",
      });
    } finally {
      setSeedingDemo(false);
    }
  };

  // Single Invoice Excel Download
  const handleDownloadSingleExcel = async (inv: TaxInvoice) => {
    try {
      const res = await fetch("/api/tax/export-excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole,
        },
        body: JSON.stringify({ invoiceIds: [inv.id] }),
      });
      if (!res.ok) throw new Error("Gagal mengunduh Excel");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Faktur_${inv.nomorFaktur.replace(/[/\\?%*:|"<>]/g, "-")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Gagal mengunduh file Excel faktur",
      });
    }
  };

  // Status Update helper
  const handleUpdateStatus = async (id: string, newStatus: TaxInvoiceStatus) => {
    try {
      const res = await fetch(`/api/tax/invoices/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setInvoices((prev) =>
          prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
        );
        if (selectedInvoice && selectedInvoice.id === id) {
          setSelectedInvoice((prev) => prev ? { ...prev, status: newStatus } : null);
        }
        fetchData();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto lg:overflow-hidden bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6 space-y-4">
      {/* Top Header & Global Actions Bar */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            {isId ? "Persiapan Pengisian Pajak (Coretax)" : "Coretax Tax Filing Preparation"}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {isId
              ? "Integrasi Surat Jalan & Bahan Baku ke Format Resmi DJP Coretax (XML & Excel) NPWP 16 / NITKU 22"
              : "Integrated delivery orders & materials into official DJP Coretax (XML & Excel) NPWP 16 / NITKU 22"}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              aria-label="Bulan sebelumnya"
              className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-mono font-semibold text-neutral-800 dark:text-neutral-200">
              {currentPeriod}
            </span>
            <button
              onClick={handleNextMonth}
              aria-label="Bulan berikutnya"
              className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            title={isId ? "Segarkan Data" : "Refresh"}
            className="p-2 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Seed Demo Data Button */}
          <button
            onClick={handleSeedDemoData}
            disabled={seedingDemo}
            title={isId ? "Muat contoh 4 faktur siap Coretax" : "Load 4 demo Coretax invoices"}
            className="px-3 py-2 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
          >
            <Sparkles className={`w-4 h-4 text-amber-500 dark:text-amber-400 ${seedingDemo ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isId ? "Contoh Data" : "Demo Data"}</span>
          </button>

          {/* PKP Tax Profile Button */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="px-3 py-2 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Building2 className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <span className="hidden sm:inline">{isId ? "Profil PKP" : "PKP Profile"}</span>
          </button>

          {/* Direct 1-Click Excel Download */}
          <button
            onClick={handleDirectDownloadExcel}
            disabled={downloadingDirectExcel}
            title={isId ? "Unduh langsung workbook Excel resmi DJP (.xlsx)" : "Direct download official DJP Excel (.xlsx)"}
            className="px-3 py-2 bg-white dark:bg-neutral-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">
              {invoices.length > 0
                ? isId ? "Unduh Excel (.xlsx)" : "Download Excel"
                : isId ? "Unduh Template Excel" : "Download Excel Template"}
            </span>
          </button>

          {/* Export Coretax Modal Trigger */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isId ? "Ekspor Coretax" : "Export Coretax"}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast/Banner */}
      {feedback && (
        <div
          className={`shrink-0 p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all shadow-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error alert if any */}
      {error && (
        <div className="shrink-0 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 rounded-xl p-4 flex items-center gap-3 text-xs text-red-800 dark:text-red-300">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Monthly VAT Summary Card (Fixed on desktop) */}
      <div className="shrink-0">
        <SptMasaSummaryCard
          summary={summary}
          language={language}
          onOpenBatchModal={() => setIsBatchModalOpen(true)}
          onOpenPurchasesModal={() => setIsPurchasesModalOpen(true)}
        />
      </div>

      {/* 2. Tax Invoice Table (Scrolls independently) */}
      <div className="flex-1 min-h-0 flex flex-col">
        <TaxInvoiceList
          invoices={invoices}
          language={language}
          selectedIds={selectedInvoiceIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onViewInvoice={handleViewInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          onOpenBatchModal={() => setIsBatchModalOpen(true)}
          onOpenManualModal={() => setIsManualModalOpen(true)}
          onSeedDemoData={handleSeedDemoData}
          onDownloadSingleExcel={handleDownloadSingleExcel}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>

      {/* Drawer: Detail Inspection */}
      <TaxInvoiceDetailDrawer
        invoice={selectedInvoice}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        language={language}
        userRole={userRole}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Modal: Batch Generate from Delivery Orders */}
      <TaxBatchGenerateModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        language={language}
        period={currentPeriod}
        onGenerated={fetchData}
        userRole={userRole}
      />

      {/* Modal: Coretax Export Modal */}
      <CoretaxExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        language={language}
        invoices={invoices}
        selectedIds={selectedInvoiceIds}
        companyProfile={companyProfile}
        userRole={userRole}
        period={currentPeriod}
      />

      {/* Modal: Company PKP Tax Profile */}
      <CompanyTaxProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        language={language}
        profile={companyProfile}
        onSaved={fetchData}
        userRole={userRole}
      />

      {/* Modal: Manual Tax Invoice Creator */}
      <TaxManualInvoiceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        language={language}
        period={currentPeriod}
        onCreated={fetchData}
        userRole={userRole}
      />

      {/* Modal: Raw Material Purchases Inspector (Input VAT) */}
      <TaxMaterialPurchasesModal
        isOpen={isPurchasesModalOpen}
        onClose={() => setIsPurchasesModalOpen(false)}
        language={language}
        period={currentPeriod}
        purchases={summary?.materialPurchases || []}
      />

      {/* Accessible Non-blocking Delete Confirmation Dialog */}
      {invoiceToDelete && (
        <DeleteTaxInvoiceConfirmModal
          isId={isId}
          onClose={() => setInvoiceToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

function DeleteTaxInvoiceConfirmModal({
  isId,
  onClose,
  onConfirm,
}: {
  isId: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useModalSafety({
    isOpen: true,
    onClose,
    initialFocusRef: cancelBtnRef,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-tax-dialog-title"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 id="delete-tax-dialog-title" className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {isId ? "Hapus Draft Faktur Pajak?" : "Delete Draft Invoice?"}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {isId
                ? "Draft faktur ini akan dihapus permanen dari sistem."
                : "This draft invoice will be permanently removed."}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            ref={cancelBtnRef}
            onClick={onClose}
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-medium transition-colors"
          >
            {isId ? "Batal" : "Cancel"}
          </button>
          <button
            onClick={onConfirm}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            {isId ? "Hapus Faktur" : "Delete Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
