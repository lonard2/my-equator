"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FootwearSize, SizeBreakdown, STANDARD_SIZES } from "@/types";
import { formatIDR } from "@/lib/utils/formatters";
import {
  Keyboard,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Command,
  Undo2,
  FileSpreadsheet,
  RotateCcw,
  Loader2,
  X,
  Camera,
} from "lucide-react";

interface ArchiveDigitizerProps {
  onSuccess: () => void;
  language: "id" | "en";
}


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
  photoPreviewUrl?: string;
}

const CUSTOMER_DIRECTORY = [
  "PT BINTANG SEPATU CEMERLANG",
  "CV BANDUNG SNEAKER WORKSHOP",
  "PT PRIMA FOOTWEAR NUSANTARA",
  "CV MANDIRI INSOLE SUKSES",
  "PT SEPATU BINTANG TIMUR",
  "CV FOOTWEAR SENTOSA",
];

const ARTICLE_CATALOG = [
  { code: "EQ-EVA-01", name: "Insole EVA Footbed Standard" },
  { code: "EQ-ARCH-01", name: "Insole Ortho High Density EVA" },
  { code: "EQ-RUN-02", name: "Insole Dynamic Cushion Latex" },
  { code: "EQ-PU-SPORT", name: "Insole PU Molded Sport Cushion" },
  { code: "EQ-TPU-SUPPORT", name: "Insole EVA with TPU Arch Bridge" },
];

export function ArchiveDigitizer({ onSuccess, language }: ArchiveDigitizerProps) {
  const isId = language === "id";

  const [globalDate, setGlobalDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  type NonSizeField = "orderNumber" | "recipientName" | "deliveryDate" | "articleCode" | "unitPrice";

  type PendingFocus =
    | { type: "size"; rowIndex: number; size: FootwearSize }
    | { type: "field"; rowIndex: number; field: NonSizeField };

  // Refs for accessible focus return & modal focus trap
  const helpButtonRef = useRef<HTMLButtonElement | null>(null);
  const clearButtonRef = useRef<HTMLButtonElement | null>(null);
  const cancelClearButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmClearButtonRef = useRef<HTMLButtonElement | null>(null);
  const cancelDateButtonRef = useRef<HTMLButtonElement | null>(null);
  const dateOpenerRef = useRef<HTMLElement | null>(null);
  const shortcutsFooterRef = useRef<HTMLButtonElement | null>(null);
  const dateConfirmRef = useRef<HTMLButtonElement | null>(null);
  const pendingFocusRef = useRef<PendingFocus | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [photoPreviewRowId, setPhotoPreviewRowId] = useState<string | null>(null);
  const photoOpenerRef = useRef<HTMLElement | null>(null);
  const photoCloseRef = useRef<HTMLButtonElement | null>(null);

  const openPhotoPreview = (rowId: string) => {
    photoOpenerRef.current = document.activeElement as HTMLElement | null;
    setPhotoPreviewRowId(rowId);
  };

  const closePhotoPreview = () => {
    setPhotoPreviewRowId(null);
    photoOpenerRef.current?.focus();
  };

  // Photo preview overlay: focus the close control on open (modal contract)
  useEffect(() => {
    if (photoPreviewRowId) {
      photoCloseRef.current?.focus();
    }
  }, [photoPreviewRowId]);
  const [editingAddressRowId, setEditingAddressRowId] = useState<string | null>(null);

  // Undo row deletion buffer
  const [deletedRowBuffer, setDeletedRowBuffer] = useState<{ row: BatchRow; index: number } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [savingProgress, setSavingProgress] = useState<{ current: number; total: number; orderNumber: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedOrderNumbers, setFailedOrderNumbers] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successIsCommit, setSuccessIsCommit] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSpreadsheetTip, setShowSpreadsheetTip] = useState(true);
  const [invalidRowIds, setInvalidRowIds] = useState<string[]>([]);

  // Date overwrite confirmation & undo state
  const [pendingDateChange, setPendingDateChange] = useState<{
    targetDate: string;
    label: string;
    offsetDays?: number;
  } | null>(null);

  const [dateUndoBuffer, setDateUndoBuffer] = useState<{
    previousGlobalDate: string;
    previousDates: { id: string; deliveryDate: string }[];
    newDate: string;
  } | null>(null);

  const dateUndoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear table confirm dialog
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Worksheet starts empty: staged rows are real commitments against the factory DB,
  // and demo seed rows looked pre-approved (one Ctrl+S shipped 500 fake pairs).
  const [rows, setRows] = useState<BatchRow[]>([]);

  // Real-time tracking of duplicate order numbers within current batch worksheet
  const duplicateOrderNumbersInBatch = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((r) => {
      const clean = r.orderNumber.trim().toUpperCase();
      if (clean) {
        counts.set(clean, (counts.get(clean) || 0) + 1);
      }
    });
    const duplicates = new Set<string>();
    counts.forEach((count, key) => {
      if (count > 1) duplicates.add(key);
    });
    return duplicates;
  }, [rows]);

  const generateOrderNumber = useCallback((indexOffset: number, dateStr: string) => {
    const parts = dateStr.split("-");
    const y = parts[0] || "2026";
    const m = parts[1] || "08";
    const padded = String(indexOffset).padStart(4, "0");
    return `SJ/EQ/${y}/${m}/${padded}`;
  }, []);

  const handleAddRow = useCallback(() => {
    let nextSeq = rows.length + 1;
    let newOrderNumber = generateOrderNumber(nextSeq, globalDate);
    const existingNumbers = new Set(rows.map((r) => r.orderNumber.trim().toUpperCase()));
    while (existingNumbers.has(newOrderNumber.toUpperCase())) {
      nextSeq++;
      newOrderNumber = generateOrderNumber(nextSeq, globalDate);
    }

    const newRow: BatchRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderNumber: newOrderNumber,
      recipientName: "",
      destinationAddress: "Bandung, Jawa Barat",
      deliveryDate: globalDate,
      articleCode: "EQ-EVA-01",
      articleName: "Insole EVA Footbed Standard",
      sizes: {},
      unitPrice: 0,
      status: "idle",
    };
    setRows((prev) => [...prev, newRow]);
  }, [rows, globalDate, generateOrderNumber]);

  // Focus cancel button on clear confirmation dialog open (Cancel-first WCAG safety)
  useEffect(() => {
    if (showClearConfirm) {
      cancelClearButtonRef.current?.focus();
    }
  }, [showClearConfirm]);

  // Shortcuts modal: focus the close control on open
  const shortcutsCloseRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (showShortcuts) {
      shortcutsCloseRef.current?.focus();
    }
  }, [showShortcuts]);

  // Date overwrite modal: cancel-first focus on open
  useEffect(() => {
    if (pendingDateChange) {
      cancelDateButtonRef.current?.focus();
    }
  }, [pendingDateChange]);

  // Shared Tab focus trap for the three in-app modals
  const trapModalTab = (
    e: React.KeyboardEvent,
    firstRef: React.RefObject<HTMLElement | null>,
    lastRef: React.RefObject<HTMLElement | null>
  ) => {
    if (e.key !== "Tab") return;
    if (e.shiftKey) {
      if (document.activeElement === firstRef.current) {
        e.preventDefault();
        lastRef.current?.focus();
      }
    } else if (document.activeElement === lastRef.current) {
      e.preventDefault();
      firstRef.current?.focus();
    }
  };

  // Deterministic row auto-spawn focus resolution (eliminates querySelector / setTimeout race condition)
  useEffect(() => {
    if (pendingFocusRef.current) {
      const pending = pendingFocusRef.current;
      pendingFocusRef.current = null;

      if (pending.type === "size") {
        const targetInput = document.querySelector<HTMLInputElement>(
          `input[data-row-index="${pending.rowIndex}"][data-size="${pending.size}"]`
        );
        if (targetInput) {
          targetInput.focus();
          targetInput.select();
        }
      } else if (pending.type === "field") {
        const targetInput = document.querySelector<HTMLInputElement>(
          `input[data-row-index="${pending.rowIndex}"][data-field="${pending.field}"]`
        );
        if (targetInput) {
          targetInput.focus();
          targetInput.select?.();
        }
      }
    }
  }, [rows.length]);

  const getOffsetDateStr = useCallback((offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split("T")[0];
  }, []);

  const isTodayActive = globalDate === getOffsetDateStr(0);
  const isYesterdayActive = globalDate === getOffsetDateStr(1);
  const isWeekAgoActive = globalDate === getOffsetDateStr(7);
  const isCustomActive = !isTodayActive && !isYesterdayActive && !isWeekAgoActive;

  const applyDateChangeWithUndo = useCallback(
    (targetDate: string) => {
      if (dateUndoTimeoutRef.current) clearTimeout(dateUndoTimeoutRef.current);

      // Snapshot current dates for 1-click Undo
      setDateUndoBuffer({
        previousGlobalDate: globalDate,
        previousDates: rows.map((r) => ({ id: r.id, deliveryDate: r.deliveryDate })),
        newDate: targetDate,
      });

      setGlobalDate(targetDate);
      setRows((prev) => prev.map((r) => ({ ...r, deliveryDate: targetDate })));
      setPendingDateChange(null);

      // Auto-dismiss undo notification after 6 seconds
      dateUndoTimeoutRef.current = setTimeout(() => {
        setDateUndoBuffer(null);
      }, 6000);
    },
    [globalDate, rows]
  );

  const executeOrConfirmDateChange = useCallback(
    (targetDate: string, label: string, offsetDays?: number) => {
      // Check if any row has a date differing from current globalDate
      const divergentRows = rows.filter((r) => r.deliveryDate !== globalDate);

      if (divergentRows.length > 0) {
        dateOpenerRef.current = document.activeElement as HTMLElement | null;
        setPendingDateChange({ targetDate, label, offsetDays });
      } else {
        applyDateChangeWithUndo(targetDate);
      }
    },
    [rows, globalDate, applyDateChangeWithUndo]
  );

  const requestDateOffset = useCallback(
    (offsetDays: number) => {
      const targetDate = getOffsetDateStr(offsetDays);
      const label =
        offsetDays === 0
          ? isId ? "Hari Ini" : "Today"
          : offsetDays === 1
          ? isId ? "Kemarin" : "Yesterday"
          : isId ? "Minggu Lalu" : "7 Days Ago";

      executeOrConfirmDateChange(targetDate, label, offsetDays);
    },
    [getOffsetDateStr, isId, executeOrConfirmDateChange]
  );

  const requestApplyGlobalDate = useCallback(() => {
    executeOrConfirmDateChange(
      globalDate,
      isId ? "Tanggal Massal" : "Global Date"
    );
  }, [globalDate, isId, executeOrConfirmDateChange]);

  const handleUndoDateChange = useCallback(() => {
    if (!dateUndoBuffer) return;
    setRows((prev) =>
      prev.map((r) => {
        const found = dateUndoBuffer.previousDates.find((p) => p.id === r.id);
        return found ? { ...r, deliveryDate: found.deliveryDate } : r;
      })
    );
    setGlobalDate(dateUndoBuffer.previousGlobalDate);
    setDateUndoBuffer(null);
    if (dateUndoTimeoutRef.current) clearTimeout(dateUndoTimeoutRef.current);
  }, [dateUndoBuffer]);

  const handleRowChange = <K extends keyof BatchRow>(id: string, field: K, value: BatchRow[K]) => {
    setInvalidRowIds((prev) => prev.filter((rowId) => rowId !== id));
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        // A corrected row drops its stale failure state immediately —
        // red tint + "Gagal" must never outlive the fix that caused them.
        const cleared = r.status === "error" ? { status: "idle" as const, errorMessage: undefined } : {};
        if (field === "articleCode") {
          const matched = ARTICLE_CATALOG.find((a) => a.code === value);
          return { ...r, ...cleared, articleCode: value as string, articleName: matched ? matched.name : r.articleName };
        }
        return { ...r, ...cleared, [field]: value };
      })
    );
  };

  const handleCapturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let nextSeq = rows.length + 1;
    let newOrderNumber = generateOrderNumber(nextSeq, globalDate);
    const existingNumbers = new Set(rows.map((r) => r.orderNumber.trim().toUpperCase()));
    while (existingNumbers.has(newOrderNumber.toUpperCase())) {
      nextSeq++;
      newOrderNumber = generateOrderNumber(nextSeq, globalDate);
    }

    const previewUrl = URL.createObjectURL(file);
    const newRow: BatchRow = {
      id: `row-photo-${Date.now()}`,
      orderNumber: newOrderNumber,
      recipientName: "",
      destinationAddress: "Bandung, Jawa Barat",
      deliveryDate: globalDate,
      articleCode: "EQ-EVA-01",
      articleName: "Insole EVA Footbed Standard",
      sizes: {},
      unitPrice: 0,
      status: "idle",
      photoPreviewUrl: previewUrl,
    };

    setRows((prev) => [...prev, newRow]);
    setSuccessIsCommit(false);
    setSuccessMessage(
      isId
        ? `Foto referensi "${file.name}" dilampirkan ke baris kerja. Baris ini adalah transkrip manual: lengkapi customer, ukuran, dan harga dengan membaca foto.`
        : `Reference photo "${file.name}" attached to the row. This is a manual transcript: fill in customer, sizes, and price by reading the photo.`
    );
    e.target.value = "";
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
   * Keyboard contract for size matrix inputs:
   * - Enter in the last size cell (45) commits the row and advances to first size (36) of next row (per module AGENTS.md)
   * - Enter in non-last size cells steps vertically down to the same size in next row
   * - Down Arrow steps vertically down to same size in next row
   * - Up Arrow steps vertically up to same size in previous row
   * - Deterministic row auto-spawn without arbitrary 60ms setTimeout race
   */
  const handleSizeKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    size: FootwearSize
  ) => {
    const LAST_SIZE = STANDARD_SIZES[STANDARD_SIZES.length - 1];
    const FIRST_SIZE = STANDARD_SIZES[0];

    if (e.key === "Enter") {
      e.preventDefault();
      const nextRowIndex = rowIndex + 1;

      if (size === LAST_SIZE) {
        // Enter in the last size cell commits the row and advances to first size of next row (per module AGENTS.md)
        if (nextRowIndex < rows.length) {
          const nextInput = document.querySelector<HTMLInputElement>(
            `input[data-row-index="${nextRowIndex}"][data-size="${FIRST_SIZE}"]`
          );
          if (nextInput) {
            nextInput.focus();
            nextInput.select();
          }
        } else {
          // Last row in batch: spawn new row and focus first size deterministically via ref
          pendingFocusRef.current = { type: "size", rowIndex: nextRowIndex, size: FIRST_SIZE };
          handleAddRow();
        }
      } else {
        // Non-last size: vertical column stepping to same size in next row
        if (nextRowIndex < rows.length) {
          const nextInput = document.querySelector<HTMLInputElement>(
            `input[data-row-index="${nextRowIndex}"][data-size="${size}"]`
          );
          if (nextInput) {
            nextInput.focus();
            nextInput.select();
          }
        } else {
          // Last row in batch: spawn new row and focus same size deterministically via ref
          pendingFocusRef.current = { type: "size", rowIndex: nextRowIndex, size };
          handleAddRow();
        }
      }
    } else if (e.key === "ArrowDown") {
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
        // Last row: automatically spawn new row and focus same size deterministically via ref
        pendingFocusRef.current = { type: "size", rowIndex: nextRowIndex, size };
        handleAddRow();
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

  /**
   * Vertical grid navigation for fields outside size cells (orderNumber, recipient, date, article, price).
   * Up/Down arrows traverse rows in the same column; Down on the last row spawns a new row with focus retained.
   */
  const handleFieldKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    field: NonSizeField
  ) => {
    // Native date inputs own their arrow keys (segment navigation)
    if ((e.target as HTMLInputElement).type === "date") return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextRowIndex = rowIndex + 1;

      if (nextRowIndex < rows.length) {
        const nextInput = document.querySelector<HTMLInputElement>(
          `input[data-row-index="${nextRowIndex}"][data-field="${field}"]`
        );
        if (nextInput) {
          nextInput.focus();
          nextInput.select?.();
        }
      } else {
        // Last row: automatically spawn a new row and keep focus in same column
        pendingFocusRef.current = { type: "field", rowIndex: nextRowIndex, field };
        handleAddRow();
      }
    } else if (e.key === "ArrowUp") {
      if (rowIndex > 0) {
        e.preventDefault();
        const prevInput = document.querySelector<HTMLInputElement>(
          `input[data-row-index="${rowIndex - 1}"][data-field="${field}"]`
        );
        if (prevInput) {
          prevInput.focus();
          prevInput.select?.();
        }
      }
    }
  };

  const handleDeleteRow = (id: string) => {
    const targetIndex = rows.findIndex((r) => r.id === id);
    if (targetIndex === -1) return;
    const targetRow = rows[targetIndex];
    if (targetRow.photoPreviewUrl) URL.revokeObjectURL(targetRow.photoPreviewUrl);

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
    rows.forEach((r) => r.photoPreviewUrl && URL.revokeObjectURL(r.photoPreviewUrl));
    setRows([]);
    setFailedOrderNumbers([]);
    setShowClearConfirm(false);
    setPhotoPreviewRowId(null);
    clearButtonRef.current?.focus();
    handleAddRow();
  };

  // Revoke any staged object URLs when the surface unmounts
  useEffect(() => {
    return () => {
      rows.forEach((r) => r.photoPreviewUrl && URL.revokeObjectURL(r.photoPreviewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRowTotalPairs = (sizes: SizeBreakdown) => {
    return Object.values(sizes).reduce((sum, q) => sum + (q || 0), 0);
  };

  const totalBatchPairs = useMemo(() => {
    return rows.reduce((sum, r) => sum + getRowTotalPairs(r.sizes), 0);
  }, [rows]);

  // Batch monetary value: the last human checkpoint shows the money, not just pairs
  const totalBatchValueIDR = useMemo(() => {
    return rows.reduce((sum, r) => sum + getRowTotalPairs(r.sizes) * (r.unitPrice || 0), 0);
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

    const existingNumbers = new Set(rows.map((r) => r.orderNumber.trim().toUpperCase()));
    let nextSeq = rows.length + 1;
    let offCatalogCount = 0;

    const newParsedRows: BatchRow[] = lines.map((line, idx) => {
      const cells = line.split("\t").map((c) => c.trim());
      const recipient = cells[0] || `Customer Import ${idx + 1}`;
      const rawArticle = cells[1]?.trim() || "EQ-EVA-01";

      const matchedArticle = ARTICLE_CATALOG.find(
        (a) => a.code.toUpperCase() === rawArticle.toUpperCase() || a.name.toLowerCase().includes(rawArticle.toLowerCase())
      );
      if (!matchedArticle && cells[1]?.trim()) {
        offCatalogCount++;
      }
      const articleCode = matchedArticle ? matchedArticle.code : "EQ-EVA-01";
      const articleName = matchedArticle ? matchedArticle.name : (rawArticle ? `${rawArticle} (Katalog Standar)` : "Insole EVA Footbed Standard");

      const sizeQtyMap: SizeBreakdown = {};

      // Check if subsequent columns are numbers for sizes 36-45
      STANDARD_SIZES.forEach((sz, szIdx) => {
        const cellVal = cells[szIdx + 2];
        if (cellVal && !isNaN(parseInt(cellVal, 10))) {
          const qty = parseInt(cellVal, 10);
          if (qty > 0) sizeQtyMap[sz] = qty;
        }
      });

      // Detect a trailing numeric column as the unit price (>= 1000 avoids size quantities)
      const trailingPrice = cells
        .slice(2 + STANDARD_SIZES.length)
        .map((c) => parseInt(c.replace(/[^0-9]/g, ""), 10))
        .find((n) => !isNaN(n) && n >= 1000);
      // No detected price stages at 0: commit validation blocks until the clerk fills it.
      // Fabricating a default (Rp 18.000) was shipping invisible economics.
      const unitPrice = trailingPrice ?? 0;

      // Sequential collision-free order number generation
      let orderNumber = generateOrderNumber(nextSeq, globalDate);
      while (existingNumbers.has(orderNumber.toUpperCase())) {
        nextSeq++;
        orderNumber = generateOrderNumber(nextSeq, globalDate);
      }
      existingNumbers.add(orderNumber.toUpperCase());
      nextSeq++;

      return {
        id: `row-paste-${Date.now()}-${idx}`,
        orderNumber,
        recipientName: recipient,
        destinationAddress: "Bandung, Jawa Barat",
        deliveryDate: globalDate,
        articleCode,
        articleName,
        sizes: sizeQtyMap,
        unitPrice,
        status: "idle",
      };
    });

    setRows((prev) => [...prev, ...newParsedRows]);
    setSuccessIsCommit(false);

    const missingPriceCount = newParsedRows.filter((r) => r.unitPrice === 0).length;
    const catalogNotice =
      offCatalogCount > 0
        ? isId
          ? ` (${offCatalogCount} artikel di luar katalog disesuaikan ke standar)`
          : ` (${offCatalogCount} off-catalog items mapped to standard)`
        : "";
    const priceNotice =
      missingPriceCount > 0
        ? isId
          ? ` ${missingPriceCount} baris belum memiliki harga satuan — kolom Harga wajib diisi sebelum menyimpan.`
          : ` ${missingPriceCount} rows have no unit price — fill the Price column before committing.`
        : "";

    setSuccessMessage(
      isId
        ? `${newParsedRows.length} baris Surat Jalan dimasukkan ke lembar kerja (draf belum disimpan ke database)${catalogNotice}.${priceNotice} Tekan 'Simpan ke Database' untuk menyimpan resmi.`
        : `${newParsedRows.length} delivery orders staged to worksheet (drafts not yet committed to database)${catalogNotice}.${priceNotice} Click 'Commit to Database' to persist.`
    );
  };

  /**
   * Atomic batch commitment with per-row status tracking and partial failure resilience
   */
  const handleSaveBatch = async () => {
    // Re-entrancy guard: Ctrl+S during an active sequential commit must be a no-op
    if (savingProgress) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setSuccessIsCommit(false);
    setInvalidRowIds([]);
    setFailedOrderNumbers([]);

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
    const missingPriceRows: number[] = [];

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
      if (!r.unitPrice || r.unitPrice <= 0) {
        rowHasError = true;
        missingPriceRows.push(idx + 1);
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
      if (missingPriceRows.length > 0) {
        errorDetails.push(
          isId
            ? `Harga satuan belum diisi pada baris: #${missingPriceRows.join(", #")}`
            : `Unit price missing in rows: #${missingPriceRows.join(", #")}`
        );
      }

      setErrorMessage(errorDetails.join(" • "));

      // Auto-scroll to first invalid row
      const firstInvalidEl = document.querySelector(`[data-row-id="${invalids[0]}"]`);
      firstInvalidEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // 1. In-Batch Duplicate SJ Collision Guard
    if (duplicateOrderNumbersInBatch.size > 0) {
      const duplicateList = Array.from(duplicateOrderNumbersInBatch);
      const collidingRowIds = rows
        .filter((r) => duplicateOrderNumbersInBatch.has(r.orderNumber.trim().toUpperCase()))
        .map((r) => r.id);

      setRows((prev) =>
        prev.map((r) => {
          if (duplicateOrderNumbersInBatch.has(r.orderNumber.trim().toUpperCase())) {
            return {
              ...r,
              status: "error",
              errorMessage: isId
                ? "Duplikasi nomor Surat Jalan dalam lembar kerja ini"
                : "Duplicate order number within this worksheet",
            };
          }
          return r;
        })
      );

      setInvalidRowIds(collidingRowIds);
      setFailedOrderNumbers(duplicateList);
      setErrorMessage(
        isId
          ? `Terdapat ${duplicateList.length} nomor Surat Jalan duplikat di lembar kerja: ${duplicateList.join(", ")}. Setiap Surat Jalan wajib memiliki nomor unik sebelum disimpan.`
          : `Found ${duplicateList.length} duplicate Order Numbers in worksheet: ${duplicateList.join(", ")}. Each order must have a unique number before saving.`
      );

      const firstInvalidEl = document.querySelector(`[data-row-id="${collidingRowIds[0]}"]`);
      firstInvalidEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // 2. Database Existing SJ Collision Guard
    try {
      const checkRes = await fetch("/api/orders");
      const checkJson = await checkRes.json();
      if (checkJson.success && Array.isArray(checkJson.data)) {
        const existingDbSet = new Set(
          checkJson.data
            .map((o: any) => o.orderNumber?.trim().toUpperCase())
            .filter(Boolean)
        );

        const dbCollisions = rows
          .map((r) => r.orderNumber.trim())
          .filter((num) => existingDbSet.has(num.toUpperCase()));

        if (dbCollisions.length > 0) {
          const uniqueCollisions = Array.from(new Set(dbCollisions));
          const collidingRowIds = rows
            .filter((r) => uniqueCollisions.some((c) => c.toUpperCase() === r.orderNumber.trim().toUpperCase()))
            .map((r) => r.id);

          setRows((prev) =>
            prev.map((r) => {
              if (uniqueCollisions.some((c) => c.toUpperCase() === r.orderNumber.trim().toUpperCase())) {
                return {
                  ...r,
                  status: "error",
                  errorMessage: isId
                    ? "Nomor Surat Jalan sudah terdaftar di database pabrik"
                    : "Order number already registered in factory database",
                };
              }
              return r;
            })
          );

          setInvalidRowIds(collidingRowIds);
          setFailedOrderNumbers(uniqueCollisions);
          setErrorMessage(
            isId
              ? `Nomor Surat Jalan sudah terdaftar di database: ${uniqueCollisions.join(", ")}. Ubah nomor pada baris yang ditandai agar tidak menimpa data yang sudah ada.`
              : `Order numbers already registered in database: ${uniqueCollisions.join(", ")}. Please update marked rows to avoid collisions.`
          );

          const firstInvalidEl = document.querySelector(`[data-row-id="${collidingRowIds[0]}"]`);
          firstInvalidEl?.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
      }
    } catch (err) {
      console.warn("Pre-commit DB collision check error:", err);
    }

    setSavingProgress({ current: 1, total: rows.length, orderNumber: rows[0].orderNumber });

    const failedRowIds = new Set<string>();
    const errorByRowId = new Map<string, string>();
    const failedSjNumbers: string[] = [];
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
          failedSjNumbers.push(row.orderNumber);
          failedRowIds.add(row.id);
          errorByRowId.set(row.id, json.error || (isId ? "Gagal menyimpan ke database" : "Failed to commit"));
        }
      } catch (err: any) {
        failedCount++;
        failedSjNumbers.push(row.orderNumber);
        failedRowIds.add(row.id);
        errorByRowId.set(row.id, err?.message || (isId ? "Kesalahan jaringan" : "Network error"));
      }
    }

    setSavingProgress(null);

    if (failedCount === 0) {
      setFailedOrderNumbers([]);
      setSuccessIsCommit(true);
      setSuccessMessage(
        isId
          ? `Berhasil menyimpan ${savedCount} Surat Jalan (Total ${totalBatchPairs.toLocaleString("id-ID")} pasang)! Mengalihkan ke daftar Surat Jalan...`
          : `Successfully saved ${savedCount} Delivery Orders (${totalBatchPairs.toLocaleString("id-ID")} pairs)! Redirecting...`
      );
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } else {
      // Retain only failed rows so user can fix and retry without creating duplicates.
      // Built from latest state so edits made during the commit are never reverted.
      setRows((prev) =>
        prev
          .filter((r) => failedRowIds.has(r.id))
          .map((r) => ({ ...r, status: "error" as const, errorMessage: errorByRowId.get(r.id) }))
      );
      setFailedOrderNumbers(failedSjNumbers);
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
      // Batch shortcuts never fire behind an open modal (Ctrl+S must not commit behind a dialog)
      const modalOpen = showShortcuts || showClearConfirm || !!pendingDateChange || !!photoPreviewRowId;
      if ((e.altKey && (e.key === "n" || e.key === "N")) || ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S"))) {
        if (modalOpen) return;
      }
      if (e.key === "Escape") {
        if (showShortcuts) {
          setShowShortcuts(false);
          helpButtonRef.current?.focus();
        }
        if (showClearConfirm) {
          setShowClearConfirm(false);
          clearButtonRef.current?.focus();
        }
        if (pendingDateChange) {
          setPendingDateChange(null);
          dateOpenerRef.current?.focus();
        }
      }
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
  }, [handleAddRow, handleSaveBatch, showShortcuts, showClearConfirm, pendingDateChange]);

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

      {/* Undo Deleted Row Toast Notification (Accessible Live Region) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={
          deletedRowBuffer
            ? "fixed bottom-20 md:bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4"
            : "sr-only"
        }
      >
        {deletedRowBuffer && (
          <>
            <span className="text-xs font-bold">
              {isId
                ? `Baris ${deletedRowBuffer.row.orderNumber} (${deletedRowBuffer.row.recipientName || "Tanpa Nama"}) dihapus`
                : `Row ${deletedRowBuffer.row.orderNumber} removed`}
            </span>
            <button
              type="button"
              onClick={handleUndoDelete}
              className="inline-flex items-center gap-1 min-h-[44px] px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>{isId ? "Batalkan Hapus" : "Undo"}</span>
            </button>
          </>
        )}
      </div>

      {/* Header & Date Batch Control */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/70 text-brand dark:text-red-400">
            <Keyboard className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                {isId ? "Digitalisasi Massal Arsip Surat Jalan" : "Batch Delivery Order Digitizer"}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-red-50 dark:bg-red-950/60 text-brand dark:text-red-300 border border-red-200 dark:border-red-900/60">
                {isId ? "GRID CEPAT" : "KEYBOARD-FIRST"}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              {isId
                ? "Digitalisasi massal tumpukan arsip fisik surat jalan pabrik dengan keyboard-first grid"
                : "Rapid keyboard-first batch entry for physical paper delivery slips and manifests"}
            </p>
          </div>
        </div>

        {/* Hidden Camera / File Input for Physical Slip Ingestion */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleCapturePhoto}
          className="hidden"
          aria-hidden="true"
        />

        {/* Global Date & Action Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Unified Batch Date Segmented Control Group */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xs">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => requestDateOffset(0)}
                aria-pressed={isTodayActive}
                className={`px-2.5 py-1 rounded-lg text-xs transition ${
                  isTodayActive
                    ? "font-extrabold bg-white dark:bg-gray-700 text-brand dark:text-red-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10"
                    : "font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-gray-700/60"
                }`}
                title={isId ? "Atur tanggal massal ke hari ini" : "Set batch date to today"}
              >
                {isId ? "Hari Ini" : "Today"}
              </button>
              <button
                type="button"
                onClick={() => requestDateOffset(1)}
                aria-pressed={isYesterdayActive}
                className={`px-2.5 py-1 rounded-lg text-xs transition ${
                  isYesterdayActive
                    ? "font-extrabold bg-white dark:bg-gray-700 text-brand dark:text-red-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10"
                    : "font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-gray-700/60"
                }`}
                title={isId ? "Atur tanggal massal ke kemarin (-1 hari)" : "Set batch date to yesterday"}
              >
                {isId ? "Kemarin" : "-1 Day"}
              </button>
              <button
                type="button"
                onClick={() => requestDateOffset(7)}
                aria-pressed={isWeekAgoActive}
                className={`px-2.5 py-1 rounded-lg text-xs transition ${
                  isWeekAgoActive
                    ? "font-extrabold bg-white dark:bg-gray-700 text-brand dark:text-red-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10"
                    : "font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-gray-700/60"
                }`}
                title={isId ? "Atur tanggal massal ke 7 hari lalu" : "Set batch date to 7 days ago"}
              >
                {isId ? "Minggu Lalu" : "-7 Days"}
              </button>
            </div>

            <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1.5" />

            {/* Calendar Custom Date Picker sharing the exact same confirm & undo guard */}
            <div className="flex items-center gap-1.5 px-2 py-0.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <input
                type="date"
                aria-label={isId ? "Tanggal surat jalan massal" : "Global delivery date"}
                value={globalDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  if (!newDate) return;
                  executeOrConfirmDateChange(newDate, isId ? `Tanggal ${newDate}` : `Date ${newDate}`);
                }}
                className={`bg-transparent text-xs font-mono font-bold focus:outline-none cursor-pointer ${
                  isCustomActive
                    ? "text-brand dark:text-red-400 underline decoration-dotted decoration-brand/60"
                    : "text-gray-800 dark:text-gray-200"
                }`}
              />
            </div>
          </div>

          <button
            ref={helpButtonRef}
            type="button"
            onClick={() => setShowShortcuts(true)}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition focus-visible:ring-2 focus-visible:ring-brand"
            title={isId ? "Buka Panduan Pintasan Keyboard" : "Open Keyboard Shortcuts"}
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Camera Slip Intake Button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition focus-visible:ring-2 focus-visible:ring-brand inline-flex items-center gap-1.5"
            title={isId ? "Lampirkan foto referensi slip fisik (transkrip manual)" : "Attach a reference photo of the physical slip (manual transcription)"}
          >
            <Camera className="h-3.5 w-3.5 text-brand" />
            <span className="hidden sm:inline">{isId ? "Lampirkan Foto" : "Attach Photo"}</span>
          </button>

          {/* Top Quick Commit Trigger (Casey mobile convenience: no scroll past 50 cards) */}
          <button
            type="button"
            onClick={handleSaveBatch}
            disabled={!!savingProgress || rows.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-strong text-white text-xs font-bold shadow-xs active:scale-95 transition disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
            title={isId ? "Simpan seluruh baris surat jalan ke database (Pintasan: Ctrl+S)" : "Commit all orders to database (Ctrl+S)"}
          >
            {savingProgress ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            <span>{isId ? "Simpan ke DB" : "Commit DB"}</span>
          </button>

          {/* Clear Table Trigger */}
          <button
            ref={clearButtonRef}
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition focus-visible:ring-2 focus-visible:ring-brand"
            title={isId ? "Kosongkan seluruh lembar kerja dan mulai baru" : "Clear entire digitizer worksheet and start fresh"}
          >
            <RotateCcw className="h-3.5 w-3.5 inline mr-1" />
            <span>{isId ? "Kosongkan Lembar Kerja" : "Clear Worksheet"}</span>
          </button>

        </div>
      </div>

      {/* Helpful Excel/Sheets Clipboard Import Tip Banner */}
      {showSpreadsheetTip && (
        <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>{isId ? "Tempel Data Spreadsheet:" : "Paste Spreadsheet Table:"}</strong>{" "}
              {isId
                ? "Salin tabel dari Excel/Sheets lalu tekan Ctrl+V di halaman ini untuk memasukkan draf baris (staged)."
                : "Copy table cells from Excel or Google Sheets and press Ctrl+V to stage draft rows."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSpreadsheetTip(false)}
            className="p-1 text-amber-600 hover:text-amber-900 dark:hover:text-amber-100 transition"
            title={isId ? "Tutup petunjuk" : "Dismiss tip"}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onKeyDown={(e) => trapModalTab(e, shortcutsCloseRef, shortcutsFooterRef)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-dialog-title"
            className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Command className="h-5 w-5 text-brand" />
                <h3 id="shortcuts-dialog-title" className="font-extrabold text-sm text-gray-900 dark:text-white">
                  {isId ? "Pintasan Keyboard Digitizer" : "Digitizer Keyboard Shortcuts"}
                </h3>
              </div>
              <button
                ref={shortcutsCloseRef}
                type="button"
                onClick={() => {
                  setShowShortcuts(false);
                  helpButtonRef.current?.focus();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-600 dark:text-gray-300">
                  {isId ? "Selesaikan baris & lanjut baris baru (di ukuran akhir 45)" : "Commit row & advance to next row (at size 45)"}
                </span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 font-mono font-bold text-[10px]">
                  Enter
                </kbd>
              </div>

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
              ref={shortcutsFooterRef}
              type="button"
              onClick={() => {
                setShowShortcuts(false);
                helpButtonRef.current?.focus();
              }}
              className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              {isId ? "Tutup Panduan" : "Close"}
            </button>
          </div>
        </div>
      )}

      {/* Notifications & Progress Banners: Accessible Live Region for Error Alerts */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className={
          errorMessage
            ? "p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 space-y-2 text-red-700 dark:text-red-300 text-xs shadow-xs animate-in fade-in"
            : "sr-only"
        }
      >
        {errorMessage && (
          <>
            <div className="flex items-start justify-between gap-2 font-bold">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setFailedOrderNumbers([]);
                }}
                aria-label={isId ? "Tutup notifikasi galat" : "Dismiss error notification"}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg shrink-0 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {failedOrderNumbers.length > 0 && (
              <div className="pt-2 border-t border-red-200/70 dark:border-red-900/50 flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                  {isId ? "Surat Jalan yang gagal disimpan:" : "Failed Delivery Orders:"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {failedOrderNumbers.map((sj) => (
                    <span
                      key={sj}
                      data-testid="failed-sj-pill"
                      className="px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-red-100 dark:bg-red-900/80 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800"
                    >
                      {sj}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-bold shadow-xs animate-in fade-in ${
            successIsCommit
              ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300"
              : "bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
          }`}
        >
          {successIsCommit ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 shrink-0 text-gray-500" />
          )}
          <span>{successMessage}</span>
        </div>
      )}

      {/* Live Saving Progress Banner */}
      {savingProgress && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="false"
          className="p-4 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xl flex items-center justify-between gap-3 animate-in fade-in"
        >
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
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs overflow-hidden flex flex-col flex-1">
        {/* MOBILE VIEW (< md) Touch Card Feed */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800 p-2 space-y-3">
          {rows.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3 my-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-red-50 dark:bg-red-950/60 flex items-center justify-center text-brand dark:text-red-400">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
                {isId ? "Lembar Kerja Kosong" : "Worksheet is Empty"}
              </h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                {isId
                  ? "Belum ada draf surat jalan. Tambah baris baru atau foto fisik slip surat jalan."
                  : "No delivery order rows staged. Add a row or capture a slip photo."}
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-strong transition shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>{isId ? "Tambah Baris" : "Add Row"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold hover:bg-gray-200 transition"
                >
                  <Camera className="h-4 w-4 text-brand" />
                  <span>{isId ? "Foto Slip" : "Capture Slip"}</span>
                </button>
              </div>
            </div>
          ) : (
            rows.map((row, idx) => {
              const rowTotal = getRowTotalPairs(row.sizes);
              const isInvalid = invalidRowIds.includes(row.id);
              const isBatchDuplicate = duplicateOrderNumbersInBatch.has(row.orderNumber.trim().toUpperCase());

              const cardStatusClass =
                row.status === "saving"
                  ? "border-amber-400 border-l-4 border-l-amber-500 bg-amber-50/15 dark:bg-amber-950/15"
                  : row.status === "saved"
                  ? "border-emerald-400 border-l-4 border-l-emerald-500 bg-emerald-50/15 dark:bg-emerald-950/15"
                  : row.status === "error"
                  ? "border-red-500 border-l-4 border-l-red-600 bg-red-50/25 dark:bg-red-950/25"
                  : isInvalid
                  ? "border-red-500 border-l-4 border-l-red-400 ring-2 ring-red-200 dark:ring-red-950"
                  : isBatchDuplicate
                  ? "border-amber-400 border-l-4 border-l-amber-400 ring-2 ring-amber-200 dark:ring-amber-950"
                  : "border-gray-200 dark:border-gray-800 border-l-4 border-l-transparent";

              return (
                <div
                  key={row.id}
                  data-row-id={row.id}
                  data-row-status={row.status}
                  className={`p-3.5 rounded-xl border bg-white dark:bg-gray-900 shadow-xs space-y-3 transition ${cardStatusClass}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 shrink-0 inline-flex items-center gap-1">
                        #{idx + 1}
                        {row.photoPreviewUrl && (
                          <button
                            type="button"
                            data-testid="mobile-photo-preview-trigger"
                            onClick={() => openPhotoPreview(row.id)}
                            title={isId ? "Lihat foto referensi" : "View reference photo"}
                            aria-label={isId ? `Lihat foto referensi baris ${idx + 1}` : `View reference photo row ${idx + 1}`}
                            className="text-brand dark:text-red-400 hover:text-brand-strong transition"
                          >
                            <Camera className="h-3 w-3" />
                          </button>
                        )}
                        {row.photoPreviewUrl && (
                          <span className="text-[10px] font-bold uppercase text-gray-400">
                            {isId ? "Transkrip Manual" : "Manual"}
                          </span>
                        )}
                      </span>
                    <input
                      type="text"
                      value={row.orderNumber}
                      onChange={(e) => handleRowChange(row.id, "orderNumber", e.target.value)}
                      placeholder="SJ/EQ/..."
                      aria-label={isId ? `Nomor surat jalan baris ${idx + 1}` : `Order number row ${idx + 1}`}
                      className={`font-mono font-semibold text-xs rounded-lg border px-2 py-1 max-w-[175px] transition focus:outline-none ${
                        isBatchDuplicate
                          ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 focus:border-amber-600"
                          : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-600 focus:border-brand focus:ring-1 focus:ring-brand shadow-2xs"
                      }`}
                    />

                    {/* Mobile in-batch duplicate warning */}
                    {isBatchDuplicate && (
                      <span
                        data-testid="mobile-duplicate-sj-warning"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                      >
                        {isId ? "Duplikat" : "Duplicate"}
                      </span>
                    )}

                    {/* Mobile per-row status chip */}
                    {row.status === "saving" && (
                      <span
                        data-testid="mobile-row-status-saving"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
                      >
                        <Loader2 className="h-2.5 w-2.5 animate-spin text-amber-600 dark:text-amber-400" />
                        {isId ? "Menyimpan" : "Saving"}
                      </span>
                    )}
                    {row.status === "saved" && (
                      <span
                        data-testid="mobile-row-status-saved"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                        {isId ? "Tersimpan" : "Saved"}
                      </span>
                    )}
                    {row.status === "error" && (
                      <span
                        data-testid="mobile-row-status-error"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200"
                      >
                        <AlertCircle className="h-2.5 w-2.5 text-red-600 dark:text-red-400" />
                        {isId ? "Gagal" : "Failed"}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteRow(row.id)}
                    aria-label={isId ? `Hapus baris ${row.orderNumber}` : `Delete row ${row.orderNumber}`}
                    className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-gray-500 hover:text-red-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Per-row error message on failure */}
                {row.status === "error" && row.errorMessage && (
                  <div
                    data-testid="mobile-row-error-message"
                    className="p-2 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-[11px] font-medium flex items-start gap-1.5"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                    <span>{row.errorMessage}</span>
                  </div>
                )}

                {/* Field 1: Customer / Penerima */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 block">
                    {isId ? "Customer / Penerima" : "Customer Name"}
                  </label>
                  <input
                    type="text"
                    list="customer-directory-suggestions"
                    value={row.recipientName}
                    onChange={(e) => handleRowChange(row.id, "recipientName", e.target.value)}
                    placeholder={isId ? "Ketik nama PT / Toko Sepatu..." : "Customer Company..."}
                    aria-label={isId ? `Nama customer baris ${idx + 1}` : `Customer name row ${idx + 1}`}
                    className={`w-full min-h-[40px] rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none ${
                      isInvalid && !row.recipientName.trim()
                        ? "border-red-500 ring-2 ring-red-200 dark:ring-red-950 bg-red-50/50"
                        : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-brand"
                    }`}
                  />
                </div>

                {/* Field 2: Alamat Tujuan (Explicit Mobile Surface) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 block">
                    {isId ? "Alamat Tujuan" : "Destination Address"}
                  </label>
                  <input
                    type="text"
                    value={row.destinationAddress}
                    onChange={(e) => handleRowChange(row.id, "destinationAddress", e.target.value)}
                    placeholder={isId ? "Alamat tujuan pengiriman..." : "Delivery destination..."}
                    aria-label={isId ? `Alamat tujuan baris ${idx + 1}` : `Destination address row ${idx + 1}`}
                    className="w-full min-h-[40px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-brand"
                  />
                </div>

                {/* Fields 3, 4, 5: Model Artikel, Tanggal Kirim, Harga Satuan (Explicit Mobile Surface) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Model Artikel */}
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 block">
                      {isId ? "Model Artikel" : "Insole Article"}
                    </label>
                    <input
                      type="text"
                      list="article-catalog-suggestions"
                      value={row.articleCode}
                      onChange={(e) => handleRowChange(row.id, "articleCode", e.target.value)}
                      placeholder="EQ-EVA-01"
                      aria-label={isId ? `Model artikel baris ${idx + 1}` : `Article model row ${idx + 1}`}
                      className="w-full min-h-[40px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-brand"
                    />
                  </div>

                  {/* Tanggal Kirim */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 block">
                      {isId ? "Tanggal Kirim" : "Delivery Date"}
                    </label>
                    <input
                      type="date"
                      value={row.deliveryDate}
                      onChange={(e) => handleRowChange(row.id, "deliveryDate", e.target.value)}
                      aria-label={isId ? `Tanggal kirim baris ${idx + 1}` : `Delivery date row ${idx + 1}`}
                      className="w-full min-h-[40px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-2 text-xs font-mono text-gray-900 dark:text-white focus:outline-none focus:border-brand"
                    />
                  </div>

                  {/* Harga Satuan */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 block">
                      {isId ? "Harga Satuan (Rp)" : "Unit Price (Rp)"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={row.unitPrice}
                      onChange={(e) => handleRowChange(row.id, "unitPrice", Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="18000"
                      aria-label={isId ? `Harga satuan baris ${idx + 1}` : `Unit price row ${idx + 1}`}
                      className="w-full min-h-[40px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                {/* Mobile 5x2 Touch Numeric Grid */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      {isId ? "Matriks Ukuran (EU 36-45)" : "Size Breakdown"}
                    </span>
                    <span className="font-mono font-black text-xs text-brand dark:text-red-400 tabular-nums">
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
                              ? "border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/50"
                              : "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40"
                          }`}
                        >
                          <span className="text-[10px] font-mono font-bold text-gray-500 block">
                            {size}
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            aria-label={isId ? `Ukuran ${size}, Baris ${idx + 1}` : `Size ${size}, Row ${idx + 1}`}
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
          })
        )}
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
                <th className="p-2.5 w-28 text-right bg-gray-50 dark:bg-gray-800/60 border-l border-gray-200 dark:border-gray-700">
                  {isId ? "Harga (Rp)" : "Unit Price"}
                </th>

                {/* Sizing Columns (EU 36-45) with minimum 50px width */}
                {STANDARD_SIZES.map((size) => (
                  <th key={size} className="p-2 text-center min-w-[50px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono font-extrabold border-l border-gray-200 dark:border-gray-700">
                    {size}
                  </th>
                ))}

                <th className="p-2.5 text-right w-24 bg-gray-50 dark:bg-gray-800/80 border-l border-gray-200 dark:border-gray-700">{isId ? "Total (psg)" : "Total"}</th>
                <th className="p-2.5 text-center w-14 min-w-[56px]">{isId ? "Aksi" : "Action"}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={17} className="p-12 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-red-50 dark:bg-red-950/60 flex items-center justify-center text-brand dark:text-red-400">
                        <FileSpreadsheet className="h-6 w-6" />
                      </div>
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
                        {isId ? "Lembar Kerja Masih Kosong" : "Worksheet is Empty"}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {isId
                          ? "Belum ada baris surat jalan. Tambah baris manual (Alt+N), ambil foto fisik slip surat jalan, atau tempel tabel dari spreadsheet (Ctrl+V)."
                          : "No delivery order rows staged. Add a row manually (Alt+N), capture a paper slip photo, or paste from spreadsheet (Ctrl+V)."}
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleAddRow}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-strong transition shadow-xs"
                        >
                          <Plus className="h-4 w-4" />
                          <span>{isId ? "Tambah Baris (Alt+N)" : "Add Row (Alt+N)"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                          <Camera className="h-4 w-4 text-brand" />
                          <span>{isId ? "Lampirkan Foto Referensi" : "Attach Reference Photo"}</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, rIdx) => {
                  const rowTotal = getRowTotalPairs(row.sizes);
                  const isInvalid = invalidRowIds.includes(row.id);
                  const isBatchDuplicate = duplicateOrderNumbersInBatch.has(row.orderNumber.trim().toUpperCase());

                  const firstCellBorderClass =
                    row.status === "saving"
                      ? "border-l-4 border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/30"
                      : row.status === "saved"
                      ? "border-l-4 border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30"
                      : row.status === "error"
                      ? "border-l-4 border-l-red-600 bg-red-50/50 dark:bg-red-950/40"
                      : isInvalid || isBatchDuplicate
                      ? "border-l-4 border-l-red-400 bg-red-50/30 dark:bg-red-950/20"
                      : "border-l-4 border-l-transparent bg-white dark:bg-gray-900";

                  return (
                    <tr
                      key={row.id}
                      data-row-id={row.id}
                      data-row-status={row.status}
                      className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition ${
                        row.status === "saving"
                          ? "bg-amber-50/15 dark:bg-amber-950/10"
                          : row.status === "saved"
                          ? "bg-emerald-50/15 dark:bg-emerald-950/10"
                          : row.status === "error"
                          ? "bg-red-50/25 dark:bg-red-950/15"
                          : isInvalid
                          ? "bg-red-50/20 dark:bg-red-950/10"
                          : isBatchDuplicate
                          ? "bg-amber-50/20 dark:bg-amber-950/10"
                          : ""
                      }`}
                    >
                      <td className={`p-2 text-center text-gray-400 font-mono sticky left-0 z-10 ${firstCellBorderClass}`}>
                        <div className="flex items-center justify-center gap-1">
                          <span>{rIdx + 1}</span>
                          {row.photoPreviewUrl && (
                            <button
                              type="button"
                              data-testid="photo-slip-badge"
                              onClick={() => openPhotoPreview(row.id)}
                              title={isId ? "Lihat foto referensi" : "View reference photo"}
                              aria-label={isId ? `Lihat foto referensi baris ${rIdx + 1}` : `View reference photo row ${rIdx + 1}`}
                              className="text-brand dark:text-red-400 hover:text-brand-strong transition"
                            >
                              <Camera className="h-3 w-3" />
                            </button>
                          )}
                          {row.photoPreviewUrl && (
                            <span
                              data-testid="manual-transcript-label"
                              title={isId ? "Transkrip manual dari foto referensi" : "Manual transcript from reference photo"}
                              className="hidden lg:inline text-[10px] font-bold uppercase text-gray-400"
                            >
                              {isId ? "Manual" : "Manual"}
                            </span>
                          )}
                        </div>
                      </td>

                    <td className="p-2 sticky left-10 bg-white dark:bg-gray-900 z-10 shadow-xs border-r border-gray-200 dark:border-gray-800">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          data-row-index={rIdx}
                          data-field="orderNumber"
                          value={row.orderNumber}
                          onChange={(e) => handleRowChange(row.id, "orderNumber", e.target.value)}
                          onKeyDown={(e) => handleFieldKeyDown(e, rIdx, "orderNumber")}
                          placeholder="SJ/EQ/..."
                          aria-label={isId ? `Nomor surat jalan baris ${rIdx + 1}` : `Order number row ${rIdx + 1}`}
                          className={`w-full rounded-lg border px-2 py-1 font-mono font-semibold text-xs transition focus:outline-none ${
                            isBatchDuplicate
                              ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 focus:border-amber-600"
                              : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-600 focus:border-brand focus:ring-1 focus:ring-brand shadow-2xs"
                          }`}
                        />
                        {isBatchDuplicate && (
                          <span
                            data-testid="duplicate-sj-warning"
                            title={isId ? "Nomor Surat Jalan ini duplikat dalam lembar kerja" : "Duplicate order number in worksheet"}
                            className="shrink-0 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-100 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                          >
                            {isId ? "Duplikat" : "Duplicate"}
                          </span>
                        )}
                        {row.status === "saving" && (
                          <span
                            data-testid="row-status-saving"
                            title={isId ? "Menyimpan ke database..." : "Saving..."}
                            className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
                          >
                            <Loader2 className="h-3 w-3 animate-spin text-amber-600 dark:text-amber-400" />
                            <span className="sr-only sm:not-sr-only sm:inline">{isId ? "Menyimpan" : "Saving"}</span>
                          </span>
                        )}
                        {row.status === "saved" && (
                          <span
                            data-testid="row-status-saved"
                            title={isId ? "Tersimpan di database" : "Saved"}
                            className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                          >
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="sr-only sm:not-sr-only sm:inline">{isId ? "Tersimpan" : "Saved"}</span>
                          </span>
                        )}
                        {row.status === "error" && (
                          <span
                            data-testid="row-status-error"
                            title={row.errorMessage || (isId ? "Gagal menyimpan" : "Save failed")}
                            className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200"
                          >
                            <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                            <span className="sr-only sm:not-sr-only sm:inline">{isId ? "Gagal" : "Failed"}</span>
                          </span>
                        )}
                      </div>
                      {row.status === "error" && row.errorMessage && (
                        <p data-testid="row-error-message" className="text-[10px] text-red-600 dark:text-red-400 font-medium leading-tight mt-1">
                          {row.errorMessage}
                        </p>
                      )}
                    </td>

                    <td className="p-2">
                      <input
                        type="text"
                        list="customer-directory-suggestions"
                        data-row-index={rIdx}
                        data-field="recipientName"
                        value={row.recipientName}
                        onChange={(e) => handleRowChange(row.id, "recipientName", e.target.value)}
                        onKeyDown={(e) => handleFieldKeyDown(e, rIdx, "recipientName")}
                        placeholder={isId ? "Ketik PT / CV Customer..." : "Customer name..."}
                        aria-label={isId ? `Nama customer baris ${rIdx + 1}` : `Customer name row ${rIdx + 1}`}
                        className={`w-full rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none ${
                          isInvalid && !row.recipientName.trim()
                            ? "border-red-500 ring-2 ring-red-200 dark:ring-red-950 bg-red-50/50"
                            : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-brand"
                        }`}
                      />
                      {/* Destination address: visible and editable — never commit what the grid cannot show */}
                      {editingAddressRowId === row.id ? (
                        <input
                          type="text"
                          autoFocus
                          value={row.destinationAddress}
                          onChange={(e) => handleRowChange(row.id, "destinationAddress", e.target.value)}
                          onBlur={() => setEditingAddressRowId(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Escape") {
                              e.preventDefault();
                              setEditingAddressRowId(null);
                            }
                          }}
                          aria-label={isId ? `Alamat tujuan baris ${rIdx + 1}` : `Destination address row ${rIdx + 1}`}
                          className="w-full mt-1 rounded-lg border border-brand bg-white dark:bg-gray-800 px-2 py-0.5 text-[10px] text-gray-700 dark:text-gray-300 focus:outline-none"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingAddressRowId(row.id)}
                          title={isId ? "Klik untuk mengubah alamat tujuan" : "Click to edit destination address"}
                          className="block w-full text-left mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 hover:text-brand dark:hover:text-red-400 truncate"
                        >
                          {row.destinationAddress || (isId ? "+ Tambah alamat" : "+ Add address")}
                        </button>
                      )}
                    </td>

                    <td className="p-2">
                      <input
                        type="date"
                        data-row-index={rIdx}
                        data-field="deliveryDate"
                        aria-label={isId ? `Tanggal surat jalan baris ${rIdx + 1}` : `Delivery date row ${rIdx + 1}`}
                        value={row.deliveryDate}
                        onChange={(e) => handleRowChange(row.id, "deliveryDate", e.target.value)}
                        onKeyDown={(e) => handleFieldKeyDown(e, rIdx, "deliveryDate")}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-1.5 py-1 font-mono text-[11px] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-brand"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="text"
                        list="article-catalog-suggestions"
                        data-row-index={rIdx}
                        data-field="articleCode"
                        value={row.articleCode}
                        onChange={(e) => handleRowChange(row.id, "articleCode", e.target.value)}
                        onKeyDown={(e) => handleFieldKeyDown(e, rIdx, "articleCode")}
                        placeholder="EQ-EVA-01"
                        aria-label={isId ? `Model artikel baris ${rIdx + 1}` : `Article model row ${rIdx + 1}`}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:border-brand"
                      />
                    </td>

                    <td className="p-2 border-l border-gray-100 dark:border-gray-800">
                      <input
                        type="number"
                        min="0"
                        step="500"
                        data-row-index={rIdx}
                        data-field="unitPrice"
                        value={row.unitPrice}
                        onChange={(e) => handleRowChange(row.id, "unitPrice", Math.max(0, parseInt(e.target.value, 10) || 0))}
                        onKeyDown={(e) => handleFieldKeyDown(e, rIdx, "unitPrice")}
                        aria-label={isId ? `Harga satuan baris ${rIdx + 1}` : `Unit price row ${rIdx + 1}`}
                        className="w-full text-right rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 font-mono font-bold text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:border-brand tabular-nums"
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
                            aria-label={isId ? `Ukuran ${size}, Baris ${rIdx + 1}` : `Size ${size}, Row ${rIdx + 1}`}
                            value={qty === 0 ? "" : qty}
                            onChange={(e) => handleSizeChange(row.id, size, e.target.value)}
                            onKeyDown={(e) => handleSizeKeyDown(e, rIdx, size)}
                            placeholder="·"
                            className={`w-full min-w-[48px] text-center rounded-lg border px-1.5 py-1 font-mono font-extrabold text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand tabular-nums ${
                              hasQty
                                ? "bg-amber-50/90 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300"
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
                        aria-label={isId ? `Hapus baris ${rIdx + 1}` : `Delete row ${rIdx + 1}`}
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-gray-500 hover:text-red-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition focus-visible:ring-2 focus-visible:ring-brand"
                        title={isId ? "Hapus Baris Ini (Undo Tersedia)" : "Delete Row (Undo Available)"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>

            {/* Batch Aggregate Summary Footer (Sticky) */}
            <tfoot className="bg-gray-100/95 dark:bg-gray-800/95 backdrop-blur-xs font-bold border-t-2 border-gray-300 dark:border-gray-700 text-xs sticky bottom-0 z-20 shadow-md">
              <tr>
                <td colSpan={6} className="p-3 text-gray-700 dark:text-gray-300 sticky left-0 bg-gray-100/95 dark:bg-gray-800/95 z-30">
                  {isId ? `Total Batch Rekap (${rows.length} Surat Jalan)` : `Batch Manifest Total (${rows.length} Orders)`}
                  {totalBatchValueIDR > 0 && (
                    <span className="ml-2 font-mono font-black text-brand dark:text-red-400 tabular-nums">
                      {formatIDR(totalBatchValueIDR)}
                    </span>
                  )}
                </td>

                {STANDARD_SIZES.map((size) => {
                  const columnSum = rows.reduce((sum, r) => sum + (r.sizes[size] || 0), 0);
                  return (
                    <td key={size} className="p-2 text-center font-mono font-black text-gray-900 dark:text-white tabular-nums border-l border-gray-200 dark:border-gray-700">
                      {columnSum > 0 ? columnSum : "-"}
                    </td>
                  );
                })}

                <td className="p-3 text-right font-mono font-black text-sm text-brand dark:text-red-400 tabular-nums border-l border-gray-200 dark:border-gray-700">
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 shadow-xs active:scale-95 transition focus-visible:ring-2 focus-visible:ring-brand"
              title={isId ? "Tambah baris surat jalan baru (Pintasan: Alt+N)" : "Add new row (Alt+N)"}
            >
              <Plus className="h-4 w-4 text-brand" />
              <span>{isId ? "Tambah Baris (Alt+N)" : "Add Row (Alt+N)"}</span>
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 shadow-xs active:scale-95 transition focus-visible:ring-2 focus-visible:ring-brand"
              title={isId ? "Lampirkan foto referensi slip fisik (transkrip manual)" : "Attach a reference photo of the physical slip (manual transcription)"}
            >
              <Camera className="h-4 w-4 text-brand" />
              <span>{isId ? "Lampirkan Foto" : "Attach Photo"}</span>
            </button>

            <span className="text-[11px] text-gray-500 font-mono hidden sm:inline tabular-nums">
              {rows.length} {isId ? "baris disiapkan" : "staged rows"} • {totalBatchPairs.toLocaleString("id-ID")} psg
              {totalBatchValueIDR > 0 && ` • ${formatIDR(totalBatchValueIDR)}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveBatch}
              disabled={!!savingProgress || rows.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-strong text-white text-xs font-bold shadow-md active:scale-95 transition disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
              title={isId ? "Simpan seluruh baris surat jalan ke database (Pintasan: Ctrl+S)" : "Commit all orders to database (Ctrl+S)"}
            >
              {savingProgress ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isId ? `Menyimpan ke DB (${savingProgress.current}/${savingProgress.total})...` : `Saving to DB (${savingProgress.current}/${savingProgress.total})...`}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isId ? `Simpan ke Database (${rows.length} Surat Jalan)` : `Commit to Database (${rows.length} Orders)`}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Clear Table Confirmation Dialog */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setShowClearConfirm(false);
              clearButtonRef.current?.focus();
            } else if (e.key === "Tab") {
              if (e.shiftKey) {
                if (document.activeElement === cancelClearButtonRef.current) {
                  e.preventDefault();
                  confirmClearButtonRef.current?.focus();
                }
              } else {
                if (document.activeElement === confirmClearButtonRef.current) {
                  e.preventDefault();
                  cancelClearButtonRef.current?.focus();
                }
              }
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-dialog-title"
            className="w-full max-w-sm rounded-xl bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-3"
          >
            <h4 id="clear-dialog-title" className="font-extrabold text-sm text-gray-900 dark:text-white">
              {isId ? "Kosongkan Lembar Kerja?" : "Clear Worksheet?"}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {isId
                ? `Semua data (${rows.length} baris, ${totalBatchPairs} pasang) yang belum disimpan akan dihapus. Lembar kerja akan direset ke 1 baris kosong baru.`
                : `All unsaved data (${rows.length} rows, ${totalBatchPairs} pairs) will be discarded. The worksheet will be reset to a blank row.`}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                ref={cancelClearButtonRef}
                type="button"
                onClick={() => {
                  setShowClearConfirm(false);
                  clearButtonRef.current?.focus();
                }}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition focus-visible:ring-2 focus-visible:ring-brand"
              >
                {isId ? "Batal, Lanjut Mengisi" : "Cancel"}
              </button>
              <button
                ref={confirmClearButtonRef}
                type="button"
                onClick={handleClearAllRows}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs active:scale-95 transition focus-visible:ring-2 focus-visible:ring-brand"
              >
                {isId ? "Ya, Kosongkan Lembar Kerja" : "Clear Worksheet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Change Overwrite Confirmation Dialog */}
      {pendingDateChange && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onKeyDown={(e) => trapModalTab(e, cancelDateButtonRef, dateConfirmRef)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="date-confirm-dialog-title"
            className="w-full max-w-sm rounded-xl bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <h4 id="date-confirm-dialog-title" className="font-extrabold text-sm text-gray-900 dark:text-white">
                {isId ? "Konfirmasi Perubahan Tanggal Massal" : "Confirm Batch Date Overwrite"}
              </h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {isId
                ? `Terdapat ${rows.filter((r) => r.deliveryDate !== globalDate).length} baris dengan tanggal pengiriman khusus yang berbeda dari tanggal massal (${globalDate}). Menetapkan ${pendingDateChange.label} (${pendingDateChange.targetDate}) akan menimpa seluruh baris.`
                : `${rows.filter((r) => r.deliveryDate !== globalDate).length} rows have custom delivery dates differing from the global date (${globalDate}). Setting ${pendingDateChange.label} (${pendingDateChange.targetDate}) will overwrite all rows.`}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                ref={cancelDateButtonRef}
                type="button"
                onClick={() => {
                  setPendingDateChange(null);
                  dateOpenerRef.current?.focus();
                }}
                className="px-3.5 py-2 min-h-[44px] rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                {isId ? "Batal (Pertahankan)" : "Cancel (Keep Dates)"}
              </button>
              <button
                ref={dateConfirmRef}
                type="button"
                onClick={() => applyDateChangeWithUndo(pendingDateChange.targetDate)}
                className="px-3.5 py-2 min-h-[44px] rounded-xl bg-brand hover:bg-brand-dark text-xs font-bold text-white shadow-xs active:scale-95 transition"
              >
                {isId ? "Ya, Timpa Semua" : "Overwrite All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reference Photo Preview Overlay (click-to-open from the row badge) */}
      {photoPreviewRowId && (() => {
        const previewRow = rows.find((r) => r.id === photoPreviewRowId);
        if (!previewRow?.photoPreviewUrl) return null;
        return (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
            onClick={closePhotoPreview}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={isId ? "Foto referensi slip" : "Slip reference photo"}
              tabIndex={-1}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  closePhotoPreview();
                }
                trapModalTab(e, photoCloseRef, photoCloseRef);
              }}
              className="max-w-lg w-full bg-gray-950 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewRow.photoPreviewUrl}
                alt={isId ? `Foto referensi slip ${previewRow.orderNumber}` : `Reference photo for slip ${previewRow.orderNumber}`}
                className="w-full max-h-[70vh] object-contain bg-black"
              />
              <div className="p-3 flex items-center justify-between bg-gray-900 border-t border-gray-800">
                <div>
                  <p className="font-mono font-bold text-xs text-gray-200">{previewRow.orderNumber}</p>
                  <p className="text-[10px] text-gray-500">
                    {isId ? "Foto referensi — transkrip manual di lembar kerja" : "Reference photo — manual transcript in the worksheet"}
                  </p>
                </div>
                <button
                  ref={photoCloseRef}
                  type="button"
                  onClick={closePhotoPreview}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition"
                  aria-label={isId ? "Tutup foto referensi" : "Close reference photo"}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Date Overwrite Undo Toast Notification (Accessible Live Region) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={
          dateUndoBuffer
            ? "fixed bottom-20 md:bottom-6 left-6 z-50 px-4 py-3 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4"
            : "sr-only"
        }
      >
        {dateUndoBuffer && (
          <>
            <span className="text-xs font-bold">
              {isId
                ? `Tanggal seluruh baris diubah ke ${dateUndoBuffer.newDate}`
                : `All row dates updated to ${dateUndoBuffer.newDate}`}
            </span>
            <button
              type="button"
              onClick={handleUndoDateChange}
              className="inline-flex items-center gap-1 min-h-[44px] px-3 py-2 rounded-xl bg-brand hover:bg-brand-strong text-white text-xs font-bold shadow-xs active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>{isId ? "Batalkan (Undo)" : "Undo"}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
