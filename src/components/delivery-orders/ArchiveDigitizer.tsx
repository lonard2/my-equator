"use client";

import React, { useState, useEffect } from "react";
import { FootwearSize, SizeBreakdown } from "@/types";
import {
  Keyboard,
  Plus,
  Trash2,
  Upload,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  HelpCircle,
  Command,
} from "lucide-react";

interface ArchiveDigitizerProps {
  onSuccess: () => void;
  language: "id" | "en";
}

const STANDARD_SIZES: FootwearSize[] = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

interface BatchRow {
  id: string;
  orderNumber: string;
  recipientName: string;
  destinationAddress: string;
  deliveryDate: string;
  articleCode: string;
  articleName: string;
  sizes: SizeBreakdown;
  unitPrice: number;
}

export function ArchiveDigitizer({ onSuccess, language }: ArchiveDigitizerProps) {
  const isId = language === "id";
  const [globalDate, setGlobalDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [rows, setRows] = useState<BatchRow[]>([
    {
      id: "row-1",
      orderNumber: "SJ/EQ/2026/08/0010",
      recipientName: "PT BINTANG SEPATU CEMERLANG",
      destinationAddress: "Jl. Industri Cimahi No. 45, Bandung",
      deliveryDate: globalDate,
      articleCode: "EQ-ARCH-01",
      articleName: "Insole Ortho High Density EVA",
      sizes: { 38: 50, 39: 100, 40: 150, 41: 150, 42: 100 },
      unitPrice: 19500,
    },
    {
      id: "row-2",
      orderNumber: "SJ/EQ/2026/08/0011",
      recipientName: "CV BANDUNG SNEAKER WORKSHOP",
      destinationAddress: "Jl. Soekarno Hatta No. 200, Bandung",
      deliveryDate: globalDate,
      articleCode: "EQ-RUN-02",
      articleName: "Insole Dynamic Cushion Latex",
      sizes: { 39: 30, 40: 60, 41: 60, 42: 40 },
      unitPrice: 24000,
    },
  ]);

  const handleAddRow = () => {
    const nextIndex = rows.length + 10;
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        orderNumber: `SJ/EQ/2026/08/00${nextIndex}`,
        recipientName: "",
        destinationAddress: "Bandung, Jawa Barat",
        deliveryDate: globalDate,
        articleCode: "EQ-EVA-01",
        articleName: "Insole EVA Footbed",
        sizes: {},
        unitPrice: 18000,
      },
    ]);
  };

  const handleApplyGlobalDate = () => {
    setRows(rows.map((r) => ({ ...r, deliveryDate: globalDate })));
  };

  const setDateOffset = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    const dateStr = d.toISOString().split("T")[0];
    setGlobalDate(dateStr);
    setRows(rows.map((r) => ({ ...r, deliveryDate: dateStr })));
  };

  const handleSizeChange = (rowId: string, size: FootwearSize, value: string) => {
    const clean = value.replace(/[^0-9]/g, "");
    const num = parseInt(clean, 10);
    setRows(
      rows.map((row) => {
        if (row.id !== rowId) return row;
        const newSizes = { ...row.sizes };
        if (isNaN(num) || num <= 0) {
          delete newSizes[size];
        } else {
          newSizes[size] = Math.min(num, 99999);
        }
        return { ...row, sizes: newSizes };
      })
    );
  };

  // Vertical Column Stepping (Enter / ArrowDown / ArrowUp for Alex - Power User Persona)
  const handleSizeKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    size: FootwearSize
  ) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      if (rowIndex < rows.length - 1) {
        const nextInput = document.querySelector<HTMLInputElement>(
          `input[data-row-index="${rowIndex + 1}"][data-size="${size}"]`
        );
        nextInput?.focus();
        nextInput?.select();
      } else if (e.key === "Enter") {
        // Auto-add new row on Enter at last row
        handleAddRow();
        setTimeout(() => {
          const nextInput = document.querySelector<HTMLInputElement>(
            `input[data-row-index="${rowIndex + 1}"][data-size="${size}"]`
          );
          nextInput?.focus();
          nextInput?.select();
        }, 60);
      }
    } else if (e.key === "ArrowUp" && rowIndex > 0) {
      e.preventDefault();
      const prevInput = document.querySelector<HTMLInputElement>(
        `input[data-row-index="${rowIndex - 1}"][data-size="${size}"]`
      );
      prevInput?.focus();
      prevInput?.select();
    }
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((r) => r.id !== id));
  };

  // Grand total calculation
  let totalBatchPairs = 0;
  rows.forEach((row) => {
    Object.values(row.sizes).forEach((qty) => {
      if (typeof qty === "number" && qty > 0) totalBatchPairs += qty;
    });
  });

  const handleSaveBatch = async () => {
    setErrorMessage(null);
    const invalid = rows.find((r) => !r.recipientName.trim());
    if (invalid) {
      setErrorMessage(
        isId
          ? "Mohon lengkapi nama customer/penerima untuk semua baris sebelum menyimpan batch."
          : "Please enter customer name for all rows."
      );
      return;
    }

    if (totalBatchPairs <= 0) {
      setErrorMessage(
        isId
          ? "Mohon isi minimal 1 pasang ukuran pada salah satu dokumen surat jalan."
          : "At least one row must contain size quantities."
      );
      return;
    }

    setLoading(true);
    try {
      for (const row of rows) {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: row.orderNumber,
            recipientName: row.recipientName.trim(),
            destinationAddress: row.destinationAddress.trim(),
            deliveryDate: row.deliveryDate,
            status: "CONFIRMED",
            notes: "Batch digitized via Archive Quick Digitizer",
            items: [
              {
                articleCode: row.articleCode.trim() || "EQ-ARCH",
                articleName: row.articleName.trim() || "Insole Insole",
                unitPrice: Math.max(0, row.unitPrice || 0),
                sizes: row.sizes,
              },
            ],
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || (isId ? `Gagal menyimpan ${row.orderNumber}` : `Failed to save ${row.orderNumber}`));
        }
      }

      setSuccessMessage(
        isId
          ? `Sukses mendigitasi ${rows.length} surat jalan (${totalBatchPairs.toLocaleString("id-ID")} pasang)!`
          : `Successfully imported ${rows.length} delivery orders!`
      );
      setTimeout(() => {
        setSuccessMessage(null);
        onSuccess();
      }, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (isId ? "Gagal mendigitasi batch surat jalan." : "Failed to import batch.");
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcut listener (Alt+N: new row, Ctrl+S: submit)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        handleAddRow();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        handleSaveBatch();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto h-full overflow-y-auto pb-24 md:pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-red-100 dark:bg-red-950/70 text-[#8B0000] dark:text-red-400">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">
                  {isId ? "Archive & Paper Quick Digitizer" : "Archive Quick Digitizer"}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowShortcuts(!showShortcuts)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  title={isId ? "Panduan Pintasan Keyboard" : "Keyboard Shortcuts Cheat Sheet"}
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[11px] text-gray-500">
                {isId
                  ? "Entri data cepat untuk arsip fisik surat jalan (Mendukung input tabel desktop & kartu mobile)"
                  : "Rapid batch intake for physical archive slips (Desktop table & Mobile card flows)"}
              </p>
            </div>
          </div>
        </div>

        {/* Global Batch Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl px-3 py-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-gray-600 dark:text-gray-300 font-medium">
              {isId ? "Tgl Global:" : "Date:"}
            </span>
            <input
              type="date"
              value={globalDate}
              onChange={(e) => setGlobalDate(e.target.value)}
              className="bg-transparent text-xs font-semibold focus:outline-none text-gray-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleApplyGlobalDate}
              className="ml-1 text-[11px] font-bold text-[#8B0000] dark:text-red-400 hover:underline"
            >
              {isId ? "Terapkan" : "Apply"}
            </button>
          </div>

          {/* Quick Date Shortcut Chips */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDateOffset(0)}
              className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {isId ? "Hari Ini" : "Today"}
            </button>
            <button
              type="button"
              onClick={() => setDateOffset(1)}
              className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {isId ? "Kemarin (-1)" : "Yesterday"}
            </button>
            <button
              type="button"
              onClick={() => setDateOffset(7)}
              className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {isId ? "Minggu Lalu (-7)" : "Last Week"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition shadow-xs"
          >
            <Plus className="h-4 w-4 text-[#8B0000]" />
            <span>{isId ? "+ Tambah DO" : "+ Add DO"}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveBatch}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#8B0000] hover:bg-[#A00000] text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            <span>
              {loading
                ? isId
                  ? "Menyimpan..."
                  : "Saving..."
                : isId
                ? `Simpan ${rows.length} DO (${totalBatchPairs.toLocaleString("id-ID")} psg)`
                : `Commit ${rows.length} Orders (${totalBatchPairs.toLocaleString("id-ID")} prs)`}
            </span>
          </button>
        </div>
      </div>

      {/* Collapsible Keyboard Shortcut Cheat Sheet (Alex - Power User Persona) */}
      {showShortcuts && (
        <div className="p-4 rounded-3xl bg-gray-900 text-gray-100 border border-gray-800 space-y-2 text-xs shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-red-400 flex items-center gap-1.5">
              <Command className="h-3.5 w-3.5" />
              <span>{isId ? "Pintasan Keyboard Entri Cepat" : "Keyboard Shortcuts"}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowShortcuts(false)}
              className="text-gray-400 hover:text-white text-[11px]"
            >
              {isId ? "Tutup" : "Close"}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 text-[11px]">
            <div className="p-2 rounded-xl bg-gray-800/80">
              <span className="font-mono font-bold text-white bg-gray-700 px-1.5 py-0.5 rounded mr-1.5">Tab</span>
              <span className="text-gray-300">{isId ? "Pindah ke sel ukuran berikutnya" : "Next size cell"}</span>
            </div>
            <div className="p-2 rounded-xl bg-gray-800/80">
              <span className="font-mono font-bold text-white bg-gray-700 px-1.5 py-0.5 rounded mr-1.5">Enter / ↓</span>
              <span className="text-gray-300">{isId ? "Turun baris pada ukuran sama" : "Next row, same size"}</span>
            </div>
            <div className="p-2 rounded-xl bg-gray-800/80">
              <span className="font-mono font-bold text-white bg-gray-700 px-1.5 py-0.5 rounded mr-1.5">Alt + N</span>
              <span className="text-gray-300">{isId ? "Tambah baris surat jalan baru" : "Add new order row"}</span>
            </div>
            <div className="p-2 rounded-xl bg-gray-800/80">
              <span className="font-mono font-bold text-white bg-gray-700 px-1.5 py-0.5 rounded mr-1.5">Ctrl/Cmd + S</span>
              <span className="text-gray-300">{isId ? "Simpan batch ke database" : "Commit batch to DB"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Non-blocking Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-800 dark:text-red-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs text-red-600 font-bold hover:underline"
          >
            {isId ? "Tutup" : "Dismiss"}
          </button>
        </div>
      )}

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* MOBILE-ONLY TOUCH CARD VIEW (md:hidden) */}
      <div className="md:hidden space-y-4">
        {rows.map((row, index) => {
          let rowPairs = 0;
          Object.values(row.sizes).forEach((qty) => {
            if (typeof qty === "number" && qty > 0) rowPairs += qty;
          });

          return (
            <div
              key={row.id}
              className="p-4 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-3"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/70 text-[#8B0000] dark:text-red-400 font-bold text-[10px] flex items-center justify-center">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={row.orderNumber}
                    onChange={(e) =>
                      setRows(
                        rows.map((r) => (r.id === row.id ? { ...r, orderNumber: e.target.value } : r))
                      )
                    }
                    className="font-mono font-black text-xs text-[#8B0000] dark:text-red-400 bg-transparent focus:outline-none w-36"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-50 dark:bg-red-950/70 text-[#8B0000] dark:text-red-300 border border-red-200 dark:border-red-900/60">
                    {rowPairs} psg
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(row.id)}
                    disabled={rows.length <= 1}
                    className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-20 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Stacked Form Fields */}
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">
                    {isId ? "Customer / Pabrik Sepatu *" : "Customer *"}
                  </label>
                  <input
                    type="text"
                    placeholder={isId ? "Contoh: PT Bintang Sepatu" : "Customer name"}
                    value={row.recipientName}
                    onChange={(e) =>
                      setRows(
                        rows.map((r) => (r.id === row.id ? { ...r, recipientName: e.target.value } : r))
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2 text-xs font-bold text-gray-900 dark:text-white focus:border-[#8B0000] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">
                      {isId ? "Tgl Kirim" : "Date"}
                    </label>
                    <input
                      type="date"
                      value={row.deliveryDate}
                      onChange={(e) =>
                        setRows(
                          rows.map((r) => (r.id === row.id ? { ...r, deliveryDate: e.target.value } : r))
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">
                      {isId ? "Artikel / Model" : "Article"}
                    </label>
                    <input
                      type="text"
                      value={row.articleName}
                      onChange={(e) =>
                        setRows(
                          rows.map((r) => (r.id === row.id ? { ...r, articleName: e.target.value } : r))
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Mobile 5x2 Touch Size Pad */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1.5">
                    {isId ? "Matriks Ukuran Sepatu (Pasang)" : "Size Breakdown Matrix"}
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {STANDARD_SIZES.map((size) => {
                      const qty = row.sizes[size] || "";
                      return (
                        <div key={size} className="flex flex-col items-center">
                          <span className="text-[9px] font-bold text-gray-500 mb-0.5 font-mono">{size}</span>
                          <input
                            type="text"
                            data-row-index={index}
                            data-size={size}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="-"
                            value={qty}
                            onChange={(e) => handleSizeChange(row.id, size, e.target.value)}
                            onKeyDown={(e) => handleSizeKeyDown(e, index, size)}
                            className={`w-full text-center rounded-xl border py-2 text-xs font-mono font-extrabold transition ${
                              qty && Number(qty) > 0
                                ? "bg-red-50/90 dark:bg-red-950/70 border-[#8B0000] text-[#8B0000] dark:text-red-300 shadow-xs"
                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Mobile Sticky Bottom Batch Actions */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddRow}
            className="flex-1 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-1.5 active:scale-95 transition shadow-xs"
          >
            <Plus className="h-4 w-4 text-[#8B0000]" />
            <span>{isId ? "+ Tambah DO Baru" : "+ Add Another DO"}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveBatch}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-[#8B0000] hover:bg-[#A00000] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            <span>
              {loading ? (isId ? "Menyimpan..." : "Saving...") : isId ? `Simpan Batch (${totalBatchPairs.toLocaleString("id-ID")} psg)` : `Commit Batch`}
            </span>
          </button>
        </div>
      </div>

      {/* DESKTOP/TABLET SPREADSHEET TABLE VIEW (hidden md:block) */}
      <div className="hidden md:block border border-gray-200 dark:border-gray-800 rounded-3xl bg-white dark:bg-gray-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-3 text-center w-8">#</th>
                <th className="p-3 text-left w-36">{isId ? "No. Surat Jalan" : "Order No."}</th>
                <th className="p-3 text-left w-48">{isId ? "Nama Customer / Pabrik *" : "Customer *"}</th>
                <th className="p-3 text-left w-32">{isId ? "Tgl Kirim" : "Date"}</th>
                <th className="p-3 text-left w-40">{isId ? "Artikel Insole" : "Article"}</th>
                {STANDARD_SIZES.map((size) => (
                  <th key={size} className="p-2 text-center w-10 font-mono bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200">
                    {size}
                  </th>
                ))}
                <th className="p-3 text-right w-20">{isId ? "Total Psg" : "Total Pairs"}</th>
                <th className="p-3 text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {rows.map((row, index) => {
                let rowPairs = 0;
                Object.values(row.sizes).forEach((qty) => {
                  if (typeof qty === "number" && qty > 0) rowPairs += qty;
                });

                return (
                  <tr key={row.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                    <td className="p-3 text-center text-gray-400 font-mono">{index + 1}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.orderNumber}
                        onChange={(e) =>
                          setRows(
                            rows.map((r) => (r.id === row.id ? { ...r, orderNumber: e.target.value } : r))
                          )
                        }
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-xs font-mono font-bold bg-white dark:bg-gray-800 text-[#8B0000] dark:text-red-400"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Nama PT / Toko Sepatu"
                        value={row.recipientName}
                        onChange={(e) =>
                          setRows(
                            rows.map((r) => (r.id === row.id ? { ...r, recipientName: e.target.value } : r))
                          )
                        }
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        value={row.deliveryDate}
                        onChange={(e) =>
                          setRows(
                            rows.map((r) => (r.id === row.id ? { ...r, deliveryDate: e.target.value } : r))
                          )
                        }
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-xs bg-white dark:bg-gray-800"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.articleName}
                        onChange={(e) =>
                          setRows(
                            rows.map((r) => (r.id === row.id ? { ...r, articleName: e.target.value } : r))
                          )
                        }
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-xs bg-white dark:bg-gray-800"
                      />
                    </td>
                    {STANDARD_SIZES.map((size) => {
                      const qty = row.sizes[size] || "";
                      return (
                        <td key={size} className="p-1">
                          <input
                            type="text"
                            data-row-index={index}
                            data-size={size}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="-"
                            value={qty}
                            onChange={(e) => handleSizeChange(row.id, size, e.target.value)}
                            onKeyDown={(e) => handleSizeKeyDown(e, index, size)}
                            className={`w-full text-center rounded-xl border px-1 py-1.5 text-xs font-mono font-bold transition ${
                              qty && Number(qty) > 0
                                ? "bg-red-50/90 dark:bg-red-950/70 border-[#8B0000] text-[#8B0000] dark:text-red-300 shadow-xs"
                                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800"
                            }`}
                          />
                        </td>
                      );
                    })}
                    <td className="p-3 text-right font-extrabold text-xs text-[#8B0000] dark:text-red-400">
                      {rowPairs} psg
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        disabled={rows.length <= 1}
                        className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-20 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100 dark:bg-gray-800 font-bold border-t border-gray-300 dark:border-gray-700">
              <tr>
                <td colSpan={5} className="p-3 text-gray-700 dark:text-gray-300 uppercase">
                  {isId ? `Total Batch (${rows.length} Surat Jalan)` : `Batch Total (${rows.length} Orders)`}
                </td>
                {STANDARD_SIZES.map((size) => {
                  const sum = rows.reduce((s, r) => s + (r.sizes[size] || 0), 0);
                  return (
                    <td key={size} className="p-2 text-center font-mono text-gray-900 dark:text-white">
                      {sum > 0 ? sum : "-"}
                    </td>
                  );
                })}
                <td className="p-3 text-right text-base text-[#8B0000] dark:text-red-400 font-extrabold">
                  {totalBatchPairs.toLocaleString("id-ID")} psg
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
