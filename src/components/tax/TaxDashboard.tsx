"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TaxInvoice, SptMasaPeriodSummary, CompanyTaxProfile } from "@/types/tax";
import { SptMasaSummaryCard } from "./SptMasaSummaryCard";
import { TaxInvoiceList } from "./TaxInvoiceList";
import { TaxInvoiceDetailDrawer } from "./TaxInvoiceDetailDrawer";
import { TaxBatchGenerateModal } from "./TaxBatchGenerateModal";
import { CoretaxExportModal } from "./CoretaxExportModal";
import { CompanyTaxProfileModal } from "./CompanyTaxProfileModal";
import {
  FileSpreadsheet,
  Download,
  Settings,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Building2,
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

  // Selected invoices for bulk actions
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

  // Modals & Drawer states
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoice | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

  // Delete draft invoice
  const handleDeleteInvoice = async (id: string) => {
    if (!confirm(isId ? "Hapus draft faktur pajak ini?" : "Delete this draft invoice?")) return;

    try {
      const res = await fetch(`/api/tax/invoices/${id}`, {
        method: "DELETE",
        headers: { "x-user-role": userRole },
      });
      if (res.ok) {
        fetchData();
        setSelectedInvoiceIds((prev) => prev.filter((i) => i !== id));
      }
    } catch (err) {
      console.error("Failed to delete invoice:", err);
    }
  };

  const handleViewInvoice = (inv: TaxInvoice) => {
    setSelectedInvoice(inv);
    setIsDetailDrawerOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Global Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-red-950/60 border border-red-800 text-red-400">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            {isId ? "Persiapan Pengisian Pajak (Coretax)" : "Coretax Tax Filing Preparation"}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {isId
              ? "Integrasi Surat Jalan & Bahan Baku ke Format Resmi DJP Coretax (XML & Excel) NPWP 16 / NITKU 22"
              : "Integrated delivery orders & materials into official DJP Coretax (XML & Excel) NPWP 16 / NITKU 22"}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            <button
              onClick={handlePrevMonth}
              aria-label="Bulan sebelumnya"
              className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-mono font-semibold text-neutral-200">
              {currentPeriod}
            </span>
            <button
              onClick={handleNextMonth}
              aria-label="Bulan berikutnya"
              className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded hover:bg-neutral-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            title={isId ? "Segarkan Data" : "Refresh"}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* PKP Tax Profile Button */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Building2 className="w-4 h-4 text-neutral-400" />
            <span className="hidden sm:inline">{isId ? "Profil PKP" : "PKP Profile"}</span>
          </button>

          {/* Export Coretax Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isId ? "Ekspor Coretax" : "Export Coretax"}</span>
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="bg-red-950/40 border border-red-800/80 rounded-xl p-4 flex items-center gap-3 text-xs text-red-300">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Monthly VAT Summary Card */}
      <SptMasaSummaryCard
        summary={summary}
        language={language}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
      />

      {/* 2. Tax Invoice Table */}
      <TaxInvoiceList
        invoices={invoices}
        language={language}
        selectedIds={selectedInvoiceIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onViewInvoice={handleViewInvoice}
        onDeleteInvoice={handleDeleteInvoice}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
      />

      {/* Drawer: Detail Inspection */}
      <TaxInvoiceDetailDrawer
        invoice={selectedInvoice}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        language={language}
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
    </div>
  );
}
