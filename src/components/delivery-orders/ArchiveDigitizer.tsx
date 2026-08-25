"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FootwearSize, SizeBreakdown } from "@/types";
import {
  Keyboard,
  Plus,
  Trash2,
  Upload,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Command,
  Undo2,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  ArrowDown,
  Loader2,
  X,
  Info,
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
  status: "idle" | "saving" | "saved" | "error";
  errorMessage?: string;
}

const CUSTOMER_DIRECTORY = [
  "PT BINTANG SEPATU CEMERLANG",
  "CV BANDUNG SNEAKER WORKSHOP",
  "PT PRIMA FOOTWEAR NUSANTARA",
  "CV MANDIRI INSOLE SUKSES",
  "TOKO BAHAN SEPATU BAROKAH",
  "PT KENCANA JAYA ABADI FOOTWEAR",
  "CV CITRA KREASI ALAS KAKI",
];

const ARTICLE_CATALOG = [
  { code: "EQ-SPORT-01", name: "Insole Dynamic Running Sport EVA+Latex" },
  { code: "EQ-ARCH-01", name: "Insole Ortho High Density EVA 8mm" },
  { code: "EQ-CASUAL-02", name: "Insole Daily Comfort Cushion EVA Soft" },
  { code: "EQ-RUN-02", name: "Insole Dynamic Cushion Latex" },
  { code: "EQ-EVA-01", name: "Insole EVA Footbed Standard" },
];

export function ArchiveDigitizer({ onSuccess, language }: ArchiveDigitizerProps) {
  const isId = language === "id";
  const [globalDate, setGlobalDate] = useState(new Date().toISOString().split("T")[0]);
  const [savingProgress, setSavingProgress] = useState<{ current: number; total: number; orderNumber: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSpreadsheetTip, setShowSpreadsheetTip] = useState(true);
  const [invalidRowIds, setInvalidRowIds] = useState<string[]>([]);

  // Undo row deletion buffer
  const [deletedRowBuffer, setDeletedRowBuffer] = useState<{ row: BatchRow; index: number } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear table confirm dialog
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
      status: "idle",
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
      status: "idle",
    },
  ]);

  const generateOrderNumber = useCallback((indexOffset: number, dateStr: string) => {
    const parts = dateStr.split("-");
    const y = parts[0] || "2026";
    const m = parts[1] || "08";
    const padded = String(indexOffset).padStart(4, "0");
    return `SJ/EQ/${y}/${m}/${padded}`;
  }, []);

  const handleAddRow = useCallback(() => {
    const nextSeq = rows.length + 10;
    const newRow: BatchRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderNumber: generateOrderNumber(nextSeq, globalDate),
      recipientName: "",
      destinationAddress: "Bandung, Jawa Barat",
      deliveryDate: globalDate,
      articleCode: "EQ-EVA-01",
      articleName: "Insole EVA Footbed Standard",
      sizes: {},
      unitPrice: 18000,
      status: "idle",
    };
    setRows((prev) => [...prev, newRow]);
  }, [rows.length, globalDate, generateOrderNumber]);

  const handleApplyGlobalDate = () => {
    setRows((prev) => prev.map((r) => ({ ...r, deliveryDate: globalDate })));
  };

  const setDateOffset = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    const dateStr = d.toISOString().split("T")[0];
    setGlobalDate(dateStr);
    setRows((prev) => prev.map((r) => ({ ...r, deliveryDate: dateStr })));
  };

  const handleRowChange = (id: string, field: keyof BatchRow, value: any) => {
    setInvalidRowIds((prev) => prev.filter((rowId) => rowId !== id));
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (field === "articleCode") {
          const matched = ARTICLE_CATALOG.find((a) => a.code === value);
          return { ...r, articleCode: value, articleName: matched ? matched.name : r.articleName };
        }
        return { ...r, [field]: value };
      })
    );
  };

  const handleSizeChange = (id: string, size: FootwearSize, valStr: string) => {
    const sanitized = valStr.replace(/[^0-9]/g, "");
    const qty = sanitized === "" ? 0 : Math.min(99999, parseInt(sanitized, 10));

    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const newSizes = { ...r.sizes };
        if (qty > 0) {
          newSizes[size] = qty;
        } else {
          delete newSizes[size];
        }
        return { ...r, sizes: newSizes };
      })
    );
  };

  /**
   * Vertical column-stepping keydown handler:
   * When Enter or Down Arrow is pressed inside a size input, jumps downward to the same size in next row.
   */
  const handleSizeKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    size: FootwearSize
  ) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextRowIndex = rowIndex + 1;

      if (nextRowIndex < rows.length) {
        const nextInput = document.querySelector<HTMLInputElement>(
          `input[data-row-index="${nextRowIndex}"][data-size="${size}"]`
        );
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      } else {
        // Last row: automatically spawn a new row and focus same size
        handleAddRow();
        setTimeout(() => {
          const nextInput = document.querySelector<HTMLInputElement>(
            `input[data-row-index="${nextRowIndex}"][data-size="${size}"]`
          );
          if (nextInput) {
            nextInput.focus();
            nextInput.select();
          }
        }, 60);
      }
    } else if (e.key === "ArrowUp") {
      if (rowIndex > 0) {
        e.preventDefault();
        const prevInput = document.querySelector<HTMLInputElement>(
          `input[data-row-index="${rowIndex - 1}"][data-size="${size}"]`
        );
        if (prevInput) {
          prevInput.focus();
          prevInput.select();
        }
      }
    }
  };

  const handleDeleteRow = (id: string) => {
    const targetIndex = rows.findIndex((r) => r.id === id);
    if (targetIndex === -1) return;
    const targetRow = rows[targetIndex];

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setDeletedRowBuffer({ row: targetRow, index: targetIndex });

    setRows((prev) => prev.filter((r) => r.id !== id));

    undoTimeoutRef.current = setTimeout(() => {
      setDeletedRowBuffer(null);
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (!deletedRowBuffer) return;
    setRows((prev) => {
      const copy = [...prev];
      copy.splice(deletedRowBuffer.index, 0, deletedRowBuffer.row);
      return copy;
    });
    setDeletedRowBuffer(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  };

  const handleClearAllRows = () => {
    setRows([]);
    setShowClearConfirm(false);
    handleAddRow();
  };

  const getRowTotalPairs = (sizes: SizeBreakdown) => {
    return Object.values(sizes).reduce((sum, q) => sum + (q || 0), 0);
  };

  const totalBatchPairs = useMemo(() => {
    return rows.reduce((sum, r) => sum + getRowTotalPairs(r.sizes), 0);
  }, [rows]);

  const isDirty = useMemo(() => {
    return rows.some((r) => r.recipientName.trim().length > 0 || getRowTotalPairs(r.sizes) > 0);
  }, [rows]);

  /**
   * Clipboard TSV / Excel Paste Ingestion
   */
  const handlePasteSpreadsheet = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text || !text.includes("\t")) return; // Only process tab-delimited paste

    e.preventDefault();
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) return;

    const newParsedRows: BatchRow[] = lines.map((line, idx) => {
      const cells = line.split("\t").map((c) => c.trim());
      const recipient = cells[0] || `Customer Import ${idx + 1}`;
      const article = cells[1] || "EQ-EVA-01";
      const sizeQtyMap: SizeBreakdown = {};

      // Check if subsequent columns are numbers for sizes 36-45
      STANDARD_SIZES.forEach((sz, szIdx) => {
        const cellVal = cells[szIdx + 2];
        if (cellVal && !isNaN(parseInt(cellVal, 10))) {
          const qty = parseInt(cellVal, 10);
          if (qty > 0) sizeQtyMap[sz] = qty;
        }
      });

      return {
        id: `row-paste-${Date.now()}-${idx}`,
        orderNumber: generateOrderNumber(rows.length + idx + 10, globalDate),
        recipientName: recipient,
        destinationAddress: "Bandung, Jawa Barat",
        deliveryDate: globalDate,
        articleCode: article,
        articleName: "Insole Footwear Import",
        sizes: sizeQtyMap,
        unitPrice: 18000,
        status: "idle",
      };
    });

    setRows((prev) => [...prev, ...newParsedRows]);
    setSuccessMessage(
      isId
        ? `Berhasil mengimpor ${newParsedRows.length} baris Surat Jalan dari clipboard spreadsheet!`
        : `Successfully imported ${newParsedRows.length} delivery orders from spreadsheet clipboard!`
    );
  };

  /**
   * Atomic batch commitment with per-row status tracking and partial failure resilience
   */
  const handleSaveBatch = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setInvalidRowIds([]);

    if (rows.length === 0) {
      setErrorMessage(
        isId
          ? "Tabel baris surat jalan masih kosong. Klik 'Tambah Baris' untuk memulai."
          : "Batch table is empty. Click 'Add Row' to start."
      );
      return;
    }

    const invalids: string[] = [];
    const missingNameRows: number[] = [];
    const zeroPairRows: number[] = [];

    rows.forEach((r, idx) => {
      const totalPairs = getRowTotalPairs(r.sizes);
      let rowHasError = false;

      if (!r.recipientName.trim()) {
        rowHasError = true;
        missingNameRows.push(idx + 1);
      }
      if (totalPairs === 0) {
        rowHasError = true;
        zeroPairRows.push(idx + 1);
      }

      if (rowHasError) {
        invalids.push(r.id);
      }
    });

    if (invalids.length > 0) {
      setInvalidRowIds(invalids);
      const errorDetails: string[] = [];
      if (missingNameRows.length > 0) {
        errorDetails.push(
          isId
            ? `Nama customer belum diisi pada baris: #${missingNameRows.join(", #")}`
            : `Customer name missing in rows: #${missingNameRows.join(", #")}`
        );
      }
      if (zeroPairRows.length > 0) {
        errorDetails.push(
          isId
            ? `Jumlah ukuran masih 0 pasang pada baris: #${zeroPairRows.join(", #")}`
            : `Zero pairs entered in rows: #${zeroPairRows.join(", #")}`
        );
      }

      setErrorMessage(errorDetails.join(" • "));

      // Auto-scroll to first invalid row
      const firstInvalidEl = document.querySelector(`[data-row-id="${invalids[0]}"]`);
      firstInvalidEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSavingProgress({ current: 1, total: rows.length, orderNumber: rows[0].orderNumber });

    const remainingRows: BatchRow[] = [];
    let savedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      setSavingProgress({ current: i + 1, total: rows.length, orderNumber: row.orderNumber });

      // Mark row as saving
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, status: "saving" } : r))
      );

      try {
        const payload = {
          orderNumber: row.orderNumber,
          customer: {
            name: row.recipientName.trim(),
            address: row.destinationAddress.trim(),
            phone: "-",
          },
          items: [
            {
              articleCode: row.articleCode,
              articleName: row.articleName,
              sizes: row.sizes,
              unitPrice: row.unitPrice,
            },
          ],
          deliveryDate: row.deliveryDate,
          status: "DRAFT",
          signatures: {
            receiver: "",
            driver: "",
            warehouse: "Operator Digitalisasi",
          },
          notes: "Diimpor melalui Archive & Paper Quick Digitizer",
        };

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (json.success) {
          savedCount++;
          // Mark as saved temporarily
          setRows((prev) =>
            prev.map((r) => (r.id === row.id ? { ...r, status: "saved" } : r))
          );
        } else {
          failedCount++;
          remainingRows.push({
            ...row,
            status: "error",
            errorMessage: json.error || (isId ? "Gagal menyimpan ke database" : "Failed to commit"),
          });
        }
      } catch (err: any) {
        failedCount++;
        remainingRows.push({
          ...row,
          status: "error",
          errorMessage: err?.message || (isId ? "Kesalahan jaringan" : "Network error"),
        });
      }
    }

    setSavingProgress(null);

    if (failedCount === 0) {
      setSuccessMessage(
        isId
          ? `✓ Berhasil menyimpan ${savedCount} Surat Jalan (Total ${totalBatchPairs.toLocaleString("id-ID")} pasang)! Mengalihkan ke daftar Surat Jalan...`
          : `✓ Successfully saved ${savedCount} Delivery Orders (${totalBatchPairs.toLocaleString("id-ID")} pairs)! Redirecting...`
      );
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } else {
      // Retain only failed rows so user can fix and retry without creating duplicates
      setRows(remainingRows);
      setErrorMessage(
        isId
          ? `${savedCount} Surat Jalan berhasil disimpan. ${failedCount} baris gagal dan tetap dipertahankan pada lembar kerja untuk Anda periksa kembali.`
          : `${savedCount} orders saved. ${failedCount} rows failed and are retained in the worksheet for retry.`
      );
    }
  };

  // Keyboard shortcut listener (memoized with stable handler)
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
  }, [handleAddRow, handleSaveBatch]);

  return (
    <div
      onPaste={handlePasteSpreadsheet}
      className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50/70 dark:bg-gray-950 p-3 sm:p-6 space-y-4 pb-28 md:pb-8"
    >
      {/* Autocomplete Suggestions Datalists */}
      <datalist id="customer-directory-suggestions">
        {CUSTOMER_DIRECTORY.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <datalist id="article-catalog-suggestions">
        {ARTICLE_CATALOG.map((a) => (
          <option key={a.code} value={a.code}>
            {a.name}
          </option>
        ))}
      </datalist>

      {/* Undo Deleted Row Toast Notification */}
      {deletedRowBuffer && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <span className="text-xs font-bold">
            {isId
              ? `Baris ${deletedRowBuffer.row.orderNumber} (${deletedRowBuffer.row.recipientName || "Tanpa Nama"}) dihapus`
              : `Row ${deletedRowBuffer.row.orderNumber} removed`}
          </span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs active:scale-95 transition"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>{isId ? "Batalkan Hapus" : "Undo"}</span>
          </button>
        </div>
      )}

      {/* Header & Date Batch Control */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-red-100 dark:bg-red-950/70 text-[#8B0000] dark:text-red-400">
            <Keyboard className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">
                {isId ? "Archive & Paper Quick Digitizer" : "Archive & Paper Quick Digitizer"}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-red-50 dark:bg-red-950/60 text-[#8B0000] dark:text-red-300 border border-red-200 dark:border-red-900/60">
                BATCH
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              {isId
                ? "Digitalisasi massal tumpukan arsip fisik surat jalan pabrik dengan keyboard-first grid"
                : "Rapid keyboard-first batch entry for physical paper delivery slips and manifests"}
            </p>
          </div>
        </div>

        {/* Global Date & Action Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Offset Chips */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setDateOffset(0)}
              className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-2xs hover:bg-gray-50"
              title={isId ? "Atur tanggal ke hari ini" : "Set date to today"}
            >
              {isId ? "Hari Ini" : "Today"}
            </button>
            <button
              type="button"
              onClick={() => setDateOffset(1)}
              className="px-2.5 py-1 rounded-xl text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              title={isId ? "Atur tanggal ke kemarin (-1 hari)" : "Set date to yesterday"}
            >
              {isId ? "Kemarin" : "-1 Day"}
            </button>
            <button
              type="button"
              onClick={() => setDateOffset(7)}
              className="px-2.5 py-1 rounded-xl text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              title={isId ? "Atur tanggal ke 7 hari lalu" : "Set date to 7 days ago"}
            >
              {isId ? "Minggu Lalu" : "-7 Days"}
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-2.5 py-1">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <input
              type="date"
              aria-label={isId ? "Tanggal surat jalan massal" : "Global delivery date"}
              value={globalDate}
              onChange={(e) => setGlobalDate(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-gray-800 dark:text-gray-200 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyGlobalDate}
              className="text-[10px] font-bold text-[#8B0000] dark:text-red-400 hover:underline ml-1"
              title={isId ? "Terapkan tanggal ini ke seluruh baris tabel di bawah" : "Apply this date to all rows"}
            >
              {isId ? "Terapkan Semua" : "Apply All"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowShortcuts(true)}
            className="p-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition"
            title={isId ? "Buka Panduan Pintasan Keyboard" : "Open Keyboard Shortcuts"}
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Start Clean Table Trigger */}
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-2 rounded-2xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title={isId ? "Kosongkan seluruh tabel dan mulai lembar baru" : "Clear all rows and start fresh"}
          >
            <RotateCcw className="h-3.5 w-3.5 inline mr-1" />
            <span>{isId ? "Mulai Bersih" : "Clear All"}</span>
          </button>
        </div>
      </div>

      {/* Helpful Excel/Sheets Clipboard Import Tip Banner */}
      {showSpreadsheetTip && (
        <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>{isId ? "Impor Cepat Excel:" : "Fast Excel Import:"}</strong>{" "}
              {isId
                ? "Anda dapat meng-copy tabel dari Excel/Sheets lalu tekan Ctrl+V di halaman ini untuk auto-input baris."
                : "You can copy a table range from Excel or Google Sheets and press Ctrl+V to auto-populate rows."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSpreadsheetTip(false)}
            className="p-1 text-amber-600 hover:text-amber-900 dark:hover:text-amber-100"
            title={isId ? "Tutup petunjuk" : "Dismiss tip"}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Command className="h-5 w-5 text-[#8B0000]" />
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                  {isId ? "Pintasan Keyboard Digitizer" : "Digitizer Keyboard Shortcuts"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-600 dark:text-gray-300">
                  {isId ? "Lompat vertikal ke baris bawah ukuran sama" : "Step vertically down in same size column"}
                </span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 font-mono font-bold text-[10px]">
                  Enter / ↓
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-600 dark:text-gray-300">
                  {isId ? "Pindah ke kolom ukuran berikutnya" : "Move to next column/size"}
                </span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 font-mono font-bold text-[10px]">
                  Tab
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-600 dark:text-gray-300">
                  {isId ? "Tambah baris surat jalan baru" : "Add new delivery order row"}
                </span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 font-mono font-bold text-[10px]">
                  Alt + N
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-600 dark:text-gray-300">
                  {isId ? "Simpan seluruh batch ke database" : "Commit batch to database"}
                </span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 font-mono font-bold text-[10px]">
                  Ctrl + S
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-600 dark:text-gray-300">
                  {isId ? "Paste tabel dari Excel / Google Sheets" : "Paste table range from Excel"}
                </span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 font-mono font-bold text-[10px]">
                  Ctrl + V
                </kbd>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowShortcuts(false)}
              className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200"
            >
              {isId ? "Tutup Panduan" : "Close"}
            </button>
          </div>
        </div>
      )}

      {/* Notifications & Progress Banners */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 flex items-center justify-between gap-2 text-red-700 dark:text-red-300 text-xs font-bold shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="p-1 hover:bg-red-100 rounded-lg">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Live Saving Progress Banner */}
      {savingProgress && (
        <div className="p-4 rounded-2xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xl flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
            <div>
              <p className="text-xs font-bold">
                {isId
                  ? `Menyimpan ${savingProgress.current} dari ${savingProgress.total} Surat Jalan ke database...`
                  : `Saving ${savingProgress.current} of ${savingProgress.total} orders to database...`}
              </p>
              <p className="text-[10px] font-mono opacity-75">{savingProgress.orderNumber}</p>
            </div>
          </div>
          <div className="w-24 h-2 rounded-full bg-white/20 dark:bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-200"
              style={{ width: `${(savingProgress.current / savingProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Grid Container */}
      <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs overflow-hidden flex flex-col flex-1">
        {/* MOBILE VIEW (< md) Touch Card Feed */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800 p-2 space-y-3">
          {rows.map((row, idx) => {
            const rowTotal = getRowTotalPairs(row.sizes);
            const isInvalid = invalidRowIds.includes(row.id);

            return (
              <div
                key={row.id}
                data-row-id={row.id}
                className={`p-3.5 rounded-2xl border bg-white dark:bg-gray-900 shadow-xs space-y-3 transition ${
                  isInvalid
                    ? "border-red-500 ring-2 ring-red-200 dark:ring-red-950"
                    : "border-gray-200 dark:border-gray-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      #{idx + 1}
                    </span>
                    <span className="font-mono font-bold text-xs text-[#8B0000] dark:text-red-400">
                      {row.orderNumber}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteRow(row.id)}
                    aria-label={isId ? `Hapus baris ${row.orderNumber}` : `Delete row ${row.orderNumber}`}
                    className="p-1.5 rounded-xl text-gray-500 hover:text-red-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-gray-400 block">
                    {isId ? "Customer / Penerima" : "Customer Name"}
                  </label>
                  <input
                    type="text"
                    list="customer-directory-suggestions"
                    value={row.recipientName}
                    onChange={(e) => handleRowChange(row.id, "recipientName", e.target.value)}
                    placeholder={isId ? "Ketik nama PT / Toko Sepatu..." : "Customer Company..."}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#8B0000]"
                  />
                </div>

                {/* Mobile 5x2 Touch Numeric Grid */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      {isId ? "Matriks Ukuran (EU 36–45)" : "Size Breakdown"}
                    </span>
                    <span className="font-mono font-black text-xs text-[#8B0000] dark:text-red-400 tabular-nums">
                      {rowTotal} <span className="text-[10px] font-normal text-gray-500">psg</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {STANDARD_SIZES.map((size) => {
                      const qty = row.sizes[size] || 0;
                      const hasQty = qty > 0;
                      return (
                        <div
                          key={size}
                          className={`rounded-xl border p-1 text-center transition ${
                            hasQty
                              ? "border-[#8B0000] bg-red-50/80 dark:bg-red-950/60"
                              : "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40"
                          }`}
                        >
                          <span className="text-[9px] font-mono font-bold text-gray-500 block">
                            {size}
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            aria-label={`Ukuran ${size}, Baris ${idx + 1}`}
                            value={qty === 0 ? "" : qty}
                            onChange={(e) => handleSizeChange(row.id, size, e.target.value)}
                            placeholder="0"
                            className="w-full text-center font-mono font-extrabold text-xs bg-transparent text-gray-900 dark:text-white focus:outline-none tabular-nums"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* DESKTOP VIEW (>= md) 16-Column High-Speed Table */}
        <div className="hidden md:block overflow-x-auto flex-1 max-h-[650px] relative">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 shadow-2xs">
              <tr>
                <th className="p-2.5 w-10 text-center sticky left-0 bg-gray-100 dark:bg-gray-800 z-30">No</th>
                <th className="p-2.5 w-36 sticky left-10 bg-gray-100 dark:bg-gray-800 z-30 shadow-xs border-r border-gray-200 dark:border-gray-700">
                  {isId ? "No. Surat Jalan" : "Order Number"}
                </th>
                <th className="p-2.5 min-w-[220px]">{isId ? "Penerima / Customer" : "Customer / Recipient"}</th>
                <th className="p-2.5 w-28">{isId ? "Tanggal" : "Date"}</th>
                <th className="p-2.5 min-w-[160px]">{isId ? "Model Artikel" : "Insole Article"}</th>

                {/* Sizing Columns (EU 36–45) with minimum 50px width */}
                {STANDARD_SIZES.map((size) => (
                  <th key={size} className="p-2 text-center min-w-[50px] bg-red-50/60 dark:bg-red-950/40 text-[#8B0000] dark:text-red-300 font-mono font-extrabold border-l border-red-100 dark:border-red-900/40">
                    {size}
                  </th>
                ))}

                <th className="p-2.5 text-right w-24 bg-gray-50 dark:bg-gray-800/80 border-l border-gray-200 dark:border-gray-700">{isId ? "Total (psg)" : "Total"}</th>
                <th className="p-2.5 text-center w-12">{isId ? "Aksi" : "Action"}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
              {rows.map((row, rIdx) => {
                const rowTotal = getRowTotalPairs(row.sizes);
                const isInvalid = invalidRowIds.includes(row.id);

                return (
                  <tr
                    key={row.id}
                    data-row-id={row.id}
                    className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition ${
                      isInvalid ? "bg-red-50/40 dark:bg-red-950/20" : ""
                    }`}
                  >
                    <td className="p-2 text-center text-gray-400 font-mono sticky left-0 bg-white dark:bg-gray-900 z-10">
                      {rIdx + 1}
                    </td>

                    <td className="p-2 sticky left-10 bg-white dark:bg-gray-900 z-10 shadow-xs border-r border-gray-200 dark:border-gray-800">
                      <input
                        type="text"
                        value={row.orderNumber}
                        onChange={(e) => handleRowChange(row.id, "orderNumber", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 font-mono font-bold text-xs text-[#8B0000] dark:text-red-400 focus:outline-none focus:border-[#8B0000]"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="text"
                        list="customer-directory-suggestions"
                        value={row.recipientName}
                        onChange={(e) => handleRowChange(row.id, "recipientName", e.target.value)}
                        placeholder={isId ? "Ketik PT / CV Customer..." : "Customer name..."}
                        className={`w-full rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none ${
                          isInvalid && !row.recipientName.trim()
                            ? "border-red-500 ring-2 ring-red-200 dark:ring-red-950 bg-red-50/50"
                            : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-[#8B0000]"
                        }`}
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="date"
                        aria-label={`Tanggal surat jalan baris ${rIdx + 1}`}
                        value={row.deliveryDate}
                        onChange={(e) => handleRowChange(row.id, "deliveryDate", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-1.5 py-1 font-mono text-[11px] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#8B0000]"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="text"
                        list="article-catalog-suggestions"
                        value={row.articleCode}
                        onChange={(e) => handleRowChange(row.id, "articleCode", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#8B0000]"
                      />
                    </td>

                    {/* Sizing Matrix 36-45 Inputs with Vertical Enter/Down Stepping */}
                    {STANDARD_SIZES.map((size) => {
                      const qty = row.sizes[size] || 0;
                      const hasQty = qty > 0;
                      return (
                        <td key={size} className="p-1.5 text-center border-l border-gray-100 dark:border-gray-800">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            data-row-index={rIdx}
                            data-size={size}
                            aria-label={`Ukuran ${size}, Baris ${rIdx + 1}`}
                            value={qty === 0 ? "" : qty}
                            onChange={(e) => handleSizeChange(row.id, size, e.target.value)}
                            onKeyDown={(e) => handleSizeKeyDown(e, rIdx, size)}
                            placeholder="·"
                            className={`w-full min-w-[48px] text-center rounded-lg border px-1.5 py-1 font-mono font-extrabold text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B0000] tabular-nums ${
                              hasQty
                                ? "bg-red-50/90 dark:bg-red-950/70 border-[#8B0000] text-[#8B0000] dark:text-red-300"
                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400"
                            }`}
                          />
                        </td>
                      );
                    })}

                    <td className="p-2 text-right bg-gray-50/50 dark:bg-gray-800/40 border-l border-gray-200 dark:border-gray-700">
                      <span className="font-mono font-black text-xs text-gray-900 dark:text-white tabular-nums">
                        {rowTotal}
                      </span>
                    </td>

                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(row.id)}
                        aria-label={`Hapus baris ${rIdx + 1}`}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        title={isId ? "Hapus Baris Ini (Undo Tersedia)" : "Delete Row (Undo Available)"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Batch Aggregate Summary Footer (Sticky) */}
            <tfoot className="bg-gray-100/95 dark:bg-gray-800/95 backdrop-blur-xs font-bold border-t-2 border-gray-300 dark:border-gray-700 text-xs sticky bottom-0 z-20 shadow-md">
              <tr>
                <td colSpan={5} className="p-3 text-gray-700 dark:text-gray-300 sticky left-0 bg-gray-100/95 dark:bg-gray-800/95 z-30">
                  {isId ? `Total Batch Rekap (${rows.length} Surat Jalan)` : `Batch Manifest Total (${rows.length} Orders)`}
                </td>

                {STANDARD_SIZES.map((size) => {
                  const columnSum = rows.reduce((sum, r) => sum + (r.sizes[size] || 0), 0);
                  return (
                    <td key={size} className="p-2 text-center font-mono font-black text-gray-900 dark:text-white tabular-nums border-l border-gray-200 dark:border-gray-700">
                      {columnSum > 0 ? columnSum : "-"}
                    </td>
                  );
                })}

                <td className="p-3 text-right font-mono font-black text-sm text-[#8B0000] dark:text-red-400 tabular-nums border-l border-gray-200 dark:border-gray-700">
                  {totalBatchPairs.toLocaleString("id-ID")}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Action Bottom Bar */}
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 text-xs font-bold text-gray-700 dark:text-gray-200 shadow-xs active:scale-95 transition"
              title={isId ? "Tambah baris surat jalan baru (Pintasan: Alt+N)" : "Add new row (Alt+N)"}
            >
              <Plus className="h-4 w-4 text-[#8B0000]" />
              <span>{isId ? "Tambah Baris (Alt+N)" : "Add Row (Alt+N)"}</span>
            </button>

            <span className="text-[11px] text-gray-500 font-mono hidden sm:inline tabular-nums">
              {rows.length} {isId ? "baris disiapkan" : "staged rows"} • {totalBatchPairs.toLocaleString("id-ID")} psg
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveBatch}
              disabled={!!savingProgress || rows.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-[#8B0000] hover:bg-[#A00000] text-white text-xs font-bold shadow-md active:scale-95 transition disabled:opacity-50"
              title={isId ? "Simpan seluruh baris surat jalan ke database (Pintasan: Ctrl+S)" : "Commit all orders to database (Ctrl+S)"}
            >
              {savingProgress ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isId ? `Menyimpan (${savingProgress.current}/${savingProgress.total})...` : `Saving (${savingProgress.current}/${savingProgress.total})...`}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isId ? `Simpan Batch (${rows.length} Surat Jalan)` : `Commit Batch (${rows.length} Orders)`}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Clear Table Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-3">
            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
              {isId ? "Kosongkan seluruh lembar kerja?" : "Clear entire digitizer worksheet?"}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {isId
                ? `Semua data (${rows.length} baris, ${totalBatchPairs} pasang) yang belum disimpan akan dihapus. Lembar kerja akan direset ke 1 baris kosong baru.`
                : `All unsaved data (${rows.length} rows, ${totalBatchPairs} pairs) will be discarded. The worksheet will be reset to a blank row.`}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isId ? "Batal, Lanjut Mengisi" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleClearAllRows}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs active:scale-95 transition"
              >
                {isId ? "Ya, Kosongkan Lembar Kerja" : "Clear All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
