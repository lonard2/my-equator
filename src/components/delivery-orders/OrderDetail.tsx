"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { DeliveryOrder, DeliveryOrderStatus, FootwearSize, SizeBreakdown, STANDARD_SIZES } from "@/types";
import { formatIndonesianDate, formatIDR, terbilang } from "@/lib/utils/formatters";
import { getAvailableStatusRollbacks } from "@/lib/orders/status";
import { useModalSafety } from "@/lib/utils/useModalSafety";
import { TouchSizePad } from "./TouchSizePad";
import { StatusBadge } from "./StatusBadge";
import { DispatchConfirmModal } from "./DispatchConfirmModal";
import { STATUS_COLOR_MAP } from "@/lib/utils/statusColors";
import {
  Printer,
  FileDown,
  FileText,
  Truck,
  CheckCircle,
  CheckCircle2,
  Calendar,
  Building,
  MapPin,
  Trash2,
  Edit3,
  Save,
  X,
  Plus,
  Grid,
  Touchpad,
  RotateCcw,
  AlertTriangle,
  Ban,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Info,
} from "lucide-react";

interface OrderDetailProps {
  order: DeliveryOrder;
  onStatusChange: (id: string, newStatus: DeliveryOrderStatus, reason?: string) => boolean | Promise<boolean>;
  onOpenPrint: (order: DeliveryOrder) => void;
  onDeleteOrder: (id: string) => void;
  onOrderUpdated: () => void;
  language: "id" | "en";
  onSpoolSuccess?: (order: DeliveryOrder) => void;
  /** Delegate notifications to the single page-level toast system. */
  onToast?: (message: string) => void;
  /** Sticky thumb-zone action bar for the mobile detail sheet. */
  showBottomActionBar?: boolean;
}

const OVERSIZED_SIZES: FootwearSize[] = [46, 47, 48];

const ROLLBACK_SEMANTICS: Record<DeliveryOrderStatus, { id: string; en: string }> = {
  DRAFT: {
    id: "Buka kembali edit data & size matrix",
    en: "Unlock full edit for order & matrix",
  },
  CONFIRMED: {
    id: "Siap cetak ulang dokumen resmi",
    en: "Ready for official re-printing",
  },
  PRINTED: {
    id: "Ulangi cetak dokumen fisik (Surat Jalan)",
    en: "Re-issue physical printed delivery slip",
  },
  DISPATCHED: {
    id: "Koreksi armada / jadwal pengiriman",
    en: "Update dispatch details or schedule",
  },
  CANCELLED: {
    id: "Batalkan dokumen resmi dengan jejak audit",
    en: "Void and archive document with audit log",
  },
  DELIVERED: {
    id: "Telah diterima di lokasi",
    en: "Delivered on site",
  },
};

interface EditItemRow {
  articleCode: string;
  shoeName: string;
  colorway: string;
  unitPrice: number;
  totalPairs: number;
  subtotal: number;
  sizes: SizeBreakdown;
  notes: string;
}

interface EditableItem {
  id: string;
  articleCode: string;
  articleName: string;
  colorway: string;
  unitPrice: number;
  sizes: SizeBreakdown;
  notes: string;
}

export function OrderDetail({
  order,
  onStatusChange,
  onOpenPrint,
  onDeleteOrder,
  onOrderUpdated,
  language,
  onSpoolSuccess,
  onToast,
  showBottomActionBar,
}: OrderDetailProps) {
  const isId = language === "id";
  const isPrintable = order.status !== "DRAFT" && order.status !== "CANCELLED";
  const printDisabledReason = order.status === "DRAFT"
    ? (isId ? "Konfirm dulu untuk cetak resmi" : "Confirm order before official print")
    : (isId ? "Dokumen dibatalkan, tidak dapat dicetak" : "Cancelled order cannot be printed");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);
  const [showOversized, setShowOversized] = useState(false);
  const [inputMode, setInputMode] = useState<"GRID" | "TOUCH_PAD">("GRID");
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);

  // More Actions Dropdown State
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const closeMoreMenu = () => {
    setIsMoreMenuOpen(false);
    moreMenuTriggerRef.current?.focus();
  };

  // Dispatch Guard State (P0: lightweight confirm sheet on Kirimkan / Tiba di Lokasi)
  const [pendingDispatchStatus, setPendingDispatchStatus] = useState<"DISPATCHED" | "DELIVERED" | null>(null);

  // In-App Delete Confirmation State & Modal Safety
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const deleteModalRef = useModalSafety({
    isOpen: isDeleteModalOpen,
    onClose: () => setIsDeleteModalOpen(false),
  });

  // Status Rollback / Cancellation Modal States & Modal Safety
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<DeliveryOrderStatus>("DRAFT");
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollbackSubmitting, setRollbackSubmitting] = useState(false);
  const [rollbackError, setRollbackError] = useState<string | null>(null);
  const rollbackModalRef = useModalSafety({
    isOpen: isRollbackModalOpen,
    onClose: () => {
      setIsRollbackModalOpen(false);
      setRollbackError(null);
    },
  });

  // Edit form states
  const [recipientName, setRecipientName] = useState(order.recipientName);
  const [destinationAddress, setDestinationAddress] = useState(order.destinationAddress);
  const [poNumber, setPoNumber] = useState(order.poNumber || "");
  const [vehicleNumber, setVehicleNumber] = useState(order.vehicleNumber || "");
  const [driverName, setDriverName] = useState(order.driverName || "");
  const [deliveryDate, setDeliveryDate] = useState(order.deliveryDate);
  const [notes, setNotes] = useState(order.notes || "");
  const [editItems, setEditItems] = useState<EditableItem[]>([]);

  // Check whether operator has made unsaved edits
  const isDirty = useMemo(() => {
    if (!isEditing) return false;
    if (recipientName !== order.recipientName) return true;
    if (destinationAddress !== order.destinationAddress) return true;
    if (poNumber !== (order.poNumber || "")) return true;
    if (vehicleNumber !== (order.vehicleNumber || "")) return true;
    if (driverName !== (order.driverName || "")) return true;
    if (deliveryDate !== order.deliveryDate) return true;
    if (notes !== (order.notes || "")) return true;
    if (editItems.length !== (order.items || []).length) return true;
    for (let i = 0; i < editItems.length; i++) {
      const orig = order.items?.[i];
      if (!orig) return true;
      if (editItems[i].articleCode !== orig.articleCode) return true;
      if (editItems[i].articleName !== orig.articleName) return true;
      if (editItems[i].colorway !== (orig.colorway || "")) return true;
      if (editItems[i].unitPrice !== (orig.unitPrice || 0)) return true;
      if (editItems[i].notes !== (orig.notes || "")) return true;
      const allSizes = new Set([
        ...Object.keys(editItems[i].sizes || {}),
        ...Object.keys(orig.sizes || {}),
      ]);
      for (const sz of allSizes) {
        const q1 = editItems[i].sizes[sz as unknown as FootwearSize] || 0;
        const q2 = orig.sizes[sz as unknown as FootwearSize] || 0;
        if (q1 !== q2) return true;
      }
    }
    return false;
  }, [
    isEditing,
    recipientName,
    destinationAddress,
    poNumber,
    vehicleNumber,
    driverName,
    deliveryDate,
    notes,
    editItems,
    order,
  ]);

  // Discard-edit confirmation modal (replaces native window.confirm)
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const discardCancelRef = useRef<HTMLButtonElement | null>(null);
  const discardModalRef = useModalSafety({
    isOpen: isDiscardModalOpen,
    onClose: () => setIsDiscardModalOpen(false),
    initialFocusRef: discardCancelRef,
  });

  // Unsaved-edit autosave (interruption-safe on mobile Safari where beforeunload is unreliable)
  const editDraftStorageKey = `myequator_do_draft_${order.id}`;
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isEditing || !isDirty) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          editDraftStorageKey,
          JSON.stringify({
            recipientName,
            destinationAddress,
            poNumber,
            vehicleNumber,
            driverName,
            deliveryDate,
            notes,
            items: editItems,
          })
        );
      } catch {
        // storage unavailable (private mode): autosave is best-effort
      }
    }, 800);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [
    isEditing,
    isDirty,
    editDraftStorageKey,
    recipientName,
    destinationAddress,
    poNumber,
    vehicleNumber,
    driverName,
    deliveryDate,
    notes,
    editItems,
  ]);

  const clearEditDraft = () => {
    try {
      localStorage.removeItem(editDraftStorageKey);
    } catch {
      // ignore
    }
  };


  // Check if current order contains oversized footwear sizes
  const hasOversizedSizes = (order.items || []).some((item) =>
    OVERSIZED_SIZES.some((s) => item.sizes && item.sizes[s] && Number(item.sizes[s]) > 0)
  );

  const activeDisplayedSizes = showOversized || hasOversizedSizes
    ? [...STANDARD_SIZES, ...OVERSIZED_SIZES]
    : STANDARD_SIZES;

  const showToast = (msg: string) => {
    // Single notification system: delegate to the page-level app toast.
    onToast?.(msg);
  };

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMoreMenu();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMoreMenu();
      }
    }
    if (isMoreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMoreMenuOpen]);

  // Sync edit state whenever order prop changes
  useEffect(() => {
    setRecipientName(order.recipientName);
    setDestinationAddress(order.destinationAddress);
    setPoNumber(order.poNumber || "");
    setVehicleNumber(order.vehicleNumber || "");
    setDriverName(order.driverName || "");
    setDeliveryDate(order.deliveryDate);
    setNotes(order.notes || "");
    setErrorMessage(null);

    const mapped = (order.items || []).map((item) => ({
      id: item.id,
      articleCode: item.articleCode,
      articleName: item.articleName,
      colorway: item.colorway || "",
      unitPrice: item.unitPrice || 0,
      sizes: { ...item.sizes },
      notes: item.notes || "",
    }));
    setEditItems(mapped);
    setIsEditing(false);
    setActiveItemIndex(0);
    setIsMoreMenuOpen(false);
  }, [order]);

  const handleCopyOrderNumber = async () => {
    // Only report success on a verified write; otherwise surface the number for manual copy.
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(order.orderNumber);
        copied = true;
      }
    } catch {
      copied = false;
    }
    if (!copied) {
      try {
        const ta = document.createElement("textarea");
        ta.value = order.orderNumber;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        copied = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        copied = false;
      }
    }
    if (copied) {
      setCopiedOrderNo(true);
      setTimeout(() => setCopiedOrderNo(false), 2000);
      showToast(isId ? `Nomor ${order.orderNumber} berhasil disalin ke clipboard!` : `Order ${order.orderNumber} copied!`);
    } else {
      showToast(
        isId
          ? `Penyalinan diblokir browser. Salin manual: ${order.orderNumber}`
          : `Copy blocked by browser. Copy manually: ${order.orderNumber}`
      );
    }
    return;
  };

  const handleDownloadPrn = () => {
    setIsMoreMenuOpen(false);
    window.open(`/api/orders/${order.id}/print-escp?format=binary`, "_blank");
    showToast(
      isId
        ? "File stream biner ESC/P untuk printer dot-matrix Epson LX berhasil diunduh."
        : "Binary ESC/P .PRN stream downloaded for Epson LX dot-matrix printer."
    );
    if (onSpoolSuccess) {
      onSpoolSuccess(order);
    }
  };

  const handleAddItem = () => {
    const nextItem = {
      id: `item-${Date.now()}`,
      articleCode: `EQ-ITEM-0${editItems.length + 1}`,
      articleName: "Insole EVA Custom Moulded",
      colorway: "Black",
      unitPrice: 20000,
      sizes: {},
      notes: "",
    };
    setEditItems([...editItems, nextItem]);
    setActiveItemIndex(editItems.length);
  };

  const handleRemoveItem = (id: string) => {
    if (editItems.length <= 1) return;
    const next = editItems.filter((i) => i.id !== id);
    setEditItems(next);
    setActiveItemIndex(Math.max(0, activeItemIndex - 1));
  };

  const handleSizeChange = (itemId: string, size: FootwearSize, value: string) => {
    const clean = value.replace(/[^0-9]/g, "");
    const num = parseInt(clean, 10);
    setEditItems(
      editItems.map((item) => {
        if (item.id !== itemId) return item;
        const newSizes = { ...item.sizes };
        if (isNaN(num) || num <= 0) {
          delete newSizes[size];
        } else {
          newSizes[size] = Math.min(num, 99999);
        }
        return { ...item, sizes: newSizes };
      })
    );
  };

  const handleTouchPadChange = (newSizes: SizeBreakdown) => {
    setEditItems(
      editItems.map((item, idx) => (idx === activeItemIndex ? { ...item, sizes: newSizes } : item))
    );
  };

  // Protect against accidental browser tab navigation while unsaved changes exist
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleStartEdit = () => {
    // Restore an interrupted editing session (autosaved draft) if one exists
    let restored = false;
    try {
      const raw = localStorage.getItem(editDraftStorageKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft && typeof draft === "object") {
          if (typeof draft.recipientName === "string") setRecipientName(draft.recipientName);
          if (typeof draft.destinationAddress === "string") setDestinationAddress(draft.destinationAddress);
          if (typeof draft.poNumber === "string") setPoNumber(draft.poNumber);
          if (typeof draft.vehicleNumber === "string") setVehicleNumber(draft.vehicleNumber);
          if (typeof draft.driverName === "string") setDriverName(draft.driverName);
          if (typeof draft.deliveryDate === "string") setDeliveryDate(draft.deliveryDate);
          if (typeof draft.notes === "string") setNotes(draft.notes);
          if (Array.isArray(draft.items) && draft.items.length > 0) {
            setEditItems(draft.items);
            setActiveItemIndex(0);
          }
          restored = true;
        }
      }
    } catch {
      // corrupted draft: fall through to fresh edit state
    }
    setIsEditing(true);
    if (restored) {
      showToast(
        isId
          ? "Draf perubahan yang belum tersimpan dipulihkan dari sesi terakhir."
          : "Unsaved draft restored from your last session."
      );
    }
  };

  const handleCancelEdit = () => {
    if (isDirty) {
      setIsDiscardModalOpen(true);
      return;
    }
    setIsEditing(false);
  };

  const handleConfirmDiscardEdit = () => {
    clearEditDraft();
    setIsDiscardModalOpen(false);
    resetEditFields();
    setIsEditing(false);
  };

  const resetEditFields = () => {
    setRecipientName(order.recipientName);
    setDestinationAddress(order.destinationAddress);
    setPoNumber(order.poNumber || "");
    setVehicleNumber(order.vehicleNumber || "");
    setDriverName(order.driverName || "");
    setDeliveryDate(order.deliveryDate);
    setNotes(order.notes || "");
    setEditItems(
      (order.items || []).map((item) => ({
        id: item.id,
        articleCode: item.articleCode,
        articleName: item.articleName,
        colorway: item.colorway || "",
        unitPrice: item.unitPrice || 0,
        sizes: { ...item.sizes },
        notes: item.notes || "",
      }))
    );
    setIsEditing(false);
    setErrorMessage(null);
  };

  const handleSaveChanges = async () => {
    setErrorMessage(null);
    if (!recipientName.trim()) {
      setErrorMessage(isId ? "Nama customer wajib diisi." : "Customer name is required.");
      return;
    }
    if (!destinationAddress.trim()) {
      setErrorMessage(isId ? "Alamat tujuan wajib diisi." : "Destination address is required.");
      return;
    }

    let pairsCount = 0;
    editItems.forEach((i) => {
      Object.values(i.sizes).forEach((q) => {
        if (typeof q === "number" && q > 0) pairsCount += q;
      });
    });

    if (pairsCount <= 0) {
      setErrorMessage(isId ? "Surat jalan harus memiliki minimal 1 pasang ukuran insole." : "At least 1 pair is required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: recipientName.trim(),
          destinationAddress: destinationAddress.trim(),
          poNumber: poNumber.trim(),
          vehicleNumber: vehicleNumber.trim(),
          driverName: driverName.trim(),
          deliveryDate,
          notes: notes.trim(),
          items: editItems.map((i) => ({
            id: i.id,
            articleCode: i.articleCode.trim(),
            articleName: i.articleName.trim(),
            colorway: i.colorway.trim(),
            unitPrice: Math.max(0, i.unitPrice || 0),
            sizes: i.sizes,
            notes: i.notes?.trim() || "",
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || (isId ? "Gagal menyimpan perubahan." : "Failed to update order."));
      }
      setIsEditing(false);
      clearEditDraft();
      showToast(isId ? "Perubahan surat jalan berhasil disimpan!" : "Delivery order updated successfully!");
      onOrderUpdated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (isId ? "Gagal menyimpan perubahan surat jalan." : "Failed to update order.");
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  // Ctrl+Enter / Cmd+Enter keyboard shortcut to save changes while editing
  const handleSaveChangesRef = useRef(handleSaveChanges);
  handleSaveChangesRef.current = handleSaveChanges;

  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSaveChangesRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing]);

  const handleExecuteRollback = async () => {
    if (!rollbackReason.trim()) {
      setRollbackError(isId ? "Wajib mengisi alasan rollback atau pembatalan status." : "Rollback reason is required.");
      return;
    }
    setRollbackError(null);
    setRollbackSubmitting(true);
    try {
      const ok = await onStatusChange(order.id, rollbackTarget as DeliveryOrderStatus, rollbackReason);
      if (!ok) {
        setRollbackError(
          isId
            ? "Perubahan status gagal diproses server. Periksa notifikasi dan coba lagi."
            : "The status change was rejected by the server. Check the notification and retry."
        );
        return;
      }
      setIsRollbackModalOpen(false);
      setRollbackReason("");
      showToast(
        isId
          ? `Status berhasil diubah menjadi ${STATUS_COLOR_MAP[rollbackTarget].labelId}`
          : `Status changed to ${STATUS_COLOR_MAP[rollbackTarget].labelEn}`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (isId ? "Gagal mengubah status." : "Failed to change status.");
      setRollbackError(message);
    } finally {
      setRollbackSubmitting(false);
    }
  };

  const availableRollbacks = getAvailableStatusRollbacks(order.status);

  // Calculation for Edit Mode
  let editGrandTotalPairs = 0;
  let editGrandTotalAmount = 0;
  editItems.forEach((item) => {
    let itemPairs = 0;
    Object.values(item.sizes).forEach((qty) => {
      if (typeof qty === "number" && qty > 0) itemPairs += qty;
    });
    editGrandTotalPairs += itemPairs;
    editGrandTotalAmount += itemPairs * (item.unitPrice || 0);
  });

  const nextStatusMap: Partial<
    Record<
      DeliveryOrderStatus,
      { next: DeliveryOrderStatus; label: string; subLabel: string; icon: React.ElementType }
    >
  > = {
    DRAFT: {
      next: "CONFIRMED",
      label: isId ? "Konfirmasi Pesanan" : "Confirm Order",
      subLabel: isId ? "Kunci data pesanan dan verifikasi jadwal produksi" : "Verify production schedule",
      icon: CheckCircle2,
    },
    CONFIRMED: {
      next: "PRINTED",
      label: isId ? "Tandai Tercetak" : "Mark as Printed",
      subLabel: isId ? "Tercetak pada kertas Continuous Form LX-310" : "Spool to continuous paper",
      icon: Printer,
    },
    PRINTED: {
      next: "DISPATCHED",
      label: isId ? "Kirimkan ke Armada" : "Dispatch with Driver",
      subLabel: isId ? "Muat barang ke kendaraan & kirim keluar gudang" : "Hand off to driver for delivery",
      icon: Truck,
    },
    DISPATCHED: {
      next: "DELIVERED",
      label: isId ? "Selesai Diterima" : "Mark as Delivered",
      subLabel: isId ? "Barang telah diterima dan ditandatangani customer" : "Signed receipt confirmed",
      icon: CheckCircle2,
    },
  };

  const nextAction = nextStatusMap[order.status];
  const currentEditItem = editItems[activeItemIndex] || editItems[0];
  const canEdit = order.status === "DRAFT" || order.status === "CONFIRMED";

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-y-auto relative">
      {/* Top Header Banner */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 sm:p-5 sticky top-0 z-20 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyOrderNumber}
                title={isId ? "Klik untuk menyalin nomor DO" : "Click to copy order number"}
                className="group flex items-center gap-1 text-xl font-bold text-gray-900 dark:text-white tracking-tight font-mono hover:text-brand dark:hover:text-red-400 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg px-1 -mx-1"
              >
                <span>{order.orderNumber}</span>
                {copiedOrderNo ? (
                  <Check className="h-4 w-4 text-emerald-600 ml-1" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-gray-400 group-hover:text-brand opacity-60 group-hover:opacity-100 transition ml-1" />
                )}
              </button>

              <StatusBadge status={order.status} size="md" language={language} />

              {isEditing && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1.5">
                  {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse" />}
                  <span>{isId ? (isDirty ? "Mode Edit (Belum Disimpan)" : "Mode Edit Aktif") : (isDirty ? "Editing (Unsaved)" : "Editing")}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isId ? "Dibuat pada" : "Created on"} {formatIndonesianDate(order.createdAt)}
            </p>
          </div>

          {/* Distilled Action Header (wraps on narrow phones; CTA/Edit yield to the sheet bottom bar) */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {!isEditing ? (
              <>
                {/* 1. Primary Forward Action CTA with Explanatory Tooltip Subtext */}
                {nextAction && order.status !== "CANCELLED" && !showBottomActionBar && (
                  <div className="flex flex-col items-end">
                    <button
                      onClick={() => {
                        if (nextAction.next === "DISPATCHED" || nextAction.next === "DELIVERED") {
                          setPendingDispatchStatus(nextAction.next);
                        } else if (nextAction.next === "PRINTED") {
                          // PRINTED is the void boundary: route through the real
                          // print task; status advances only after spool verification.
                          onOpenPrint(order);
                        } else {
                          onStatusChange(order.id, nextAction.next);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-95 focus:outline-none focus-visible:ring-2 ${
                        STATUS_COLOR_MAP[nextAction.next].cta.buttonClasses
                      }`}
                    >
                      <nextAction.icon className="h-3.5 w-3.5" />
                      <span>{nextAction.label}</span>
                    </button>
                    <span className="hidden md:block text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {nextAction.subLabel}
                    </span>
                  </div>
                )}

                {/* 2. Secondary Primary: Edit Order (sheet carries it in the bottom bar) */}
                {canEdit && !showBottomActionBar && (
                  <button
                    onClick={handleStartEdit}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-xs transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-gray-500" />
                    <span>{isId ? "Ubah" : "Edit"}</span>
                  </button>
                )}

                {/* 3. Secondary Primary: Print Trigger (Status-gated) */}
                <button
                  type="button"
                  disabled={!isPrintable}
                  onClick={() => {
                    if (isPrintable) onOpenPrint(order);
                  }}
                  title={!isPrintable ? printDisabledReason : (isId ? "Cetak Surat Jalan & Spooler ESC/P .PRN" : "Print Order & ESC/P .PRN Spooler")}
                  aria-label={!isPrintable ? printDisabledReason : (isId ? "Cetak Surat Jalan & Spooler ESC/P .PRN" : "Print Order & ESC/P .PRN Spooler")}
                  className={`inline-flex items-center gap-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-semibold shadow-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    !isPrintable
                      ? "opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-500"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95"
                  }`}
                >
                  <Printer className="h-3.5 w-3.5 text-gray-500" />
                  <span>{isId ? "Cetak" : "Print"}</span>
                </button>

                {/* 4. Consolidated More Actions Menu (•••) */}
                <div className="relative" ref={menuRef}>
                  <button
                    ref={moreMenuTriggerRef}
                    type="button"
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    aria-expanded={isMoreMenuOpen}
                    aria-label={isId ? "Menu tindakan lainnya" : "More actions"}
                    className="p-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition active:scale-95"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {isMoreMenuOpen && (
                    <div role="menu" aria-label={isId ? "Menu tindakan lainnya" : "More actions"} className="absolute right-0 mt-1.5 w-60 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl py-1.5 z-30 text-xs animate-in fade-in zoom-in-95 duration-100">
                      {/* Download PRN Stream (Status-gated) */}
                      <button
                        role="menuitem"
                        type="button"
                        disabled={!isPrintable}
                        onClick={() => {
                          if (isPrintable) handleDownloadPrn();
                        }}
                        title={!isPrintable ? printDisabledReason : undefined}
                        className={`w-full px-3.5 py-2 text-left flex items-center gap-2.5 transition ${
                          !isPrintable
                            ? "opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-500"
                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <FileDown className="h-4 w-4 text-gray-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-semibold">{isId ? "Unduh Stream .PRN" : "Download .PRN File"}</p>
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              ESC/P
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400">
                            {!isPrintable ? printDisabledReason : "Epson LX-300/310 Continuous Form"}
                          </p>
                        </div>
                      </button>

                      {/* Rollback Status */}
                      {order.status !== "DRAFT" && (
                        <button
                          type="button"
                          onClick={() => {
                            closeMoreMenu();
                            const rollbacks = getAvailableStatusRollbacks(order.status);
                            setRollbackTarget(rollbacks.length > 0 ? rollbacks[0] : "DRAFT");
                            setIsRollbackModalOpen(true);
                          }}
                          className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                        >
                          <RotateCcw className="h-4 w-4 text-amber-600" />
                          <div>
                            <p className="font-semibold">{isId ? "Koreksi / Rollback Status" : "Revert Status"}</p>
                            <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80">
                              {isId ? "Kembalikan ke status sebelumnya" : "Step back to earlier status"}
                            </p>
                          </div>
                        </button>
                      )}

                      {/* Cancel / Void & Archive Order */}
                      {order.status !== "CANCELLED" && (
                        <button
                          type="button"
                          onClick={() => {
                            closeMoreMenu();
                            setRollbackTarget("CANCELLED");
                            setIsRollbackModalOpen(true);
                          }}
                          className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        >
                          <Ban className="h-4 w-4 text-red-600" />
                          <div>
                            <p className="font-semibold">
                              {order.status === "DRAFT"
                                ? isId ? "Batalkan Surat Jalan" : "Cancel Draft Order"
                                : isId ? "Void & Arsipkan Surat Jalan" : "Void & Archive Order"}
                            </p>
                            <p className="text-[10px] text-red-600/80 dark:text-red-400/80">
                              {order.status === "DRAFT"
                                ? isId ? "Set status CANCELLED" : "Mark document as cancelled"
                                : isId ? "Batalkan resmi dengan jejak audit paper-twin" : "Cancel officially with paper-twin audit log"}
                            </p>
                          </div>
                        </button>
                      )}

                      {/* Delete Draft Order (Strictly DRAFT only; PRINTED+ orders require Void & Archive to prevent orphaned paper-twins) */}
                      {order.status === "DRAFT" && (
                        <>
                          <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                          <button
                            type="button"
                            onClick={() => {
                              closeMoreMenu();
                              setIsDeleteModalOpen(true);
                            }}
                            className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition font-semibold"
                          >
                            <Trash2 className="h-4 w-4" />
                            <div>
                              <p>{isId ? "Hapus Draft Surat Jalan" : "Delete Draft Order"}</p>
                              <p className="text-[10px] text-gray-400 font-normal">
                                {isId ? "Hanya draft yang dapat dihapus permanen" : "Only unprinted drafts can be purged"}
                              </p>
                            </div>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* In-Place Editing Actions */
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>{isId ? "Batal" : "Cancel"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={saving}
                  title={isId ? "Simpan Perubahan (Ctrl+Enter)" : "Save Changes (Ctrl+Enter)"}
                  aria-label={isId ? "Simpan Perubahan (Ctrl+Enter)" : "Save Changes (Ctrl+Enter)"}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand hover:bg-brand-strong px-4 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 active:scale-95"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>
                    {saving
                      ? isId
                        ? "Menyimpan..."
                        : "Saving..."
                      : isId
                      ? "Simpan Perubahan"
                      : "Save Changes"}
                  </span>
                  <kbd className="hidden sm:inline-block text-[10px] font-mono px-1 py-0.5 rounded bg-brand-strong/60 text-white/90 border border-white/20">
                    Ctrl+↵
                  </kbd>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Non-blocking Error Banner with Retry Path (Heuristic 9) */}
      {errorMessage && (
        <div
          role="alert"
          className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5 text-xs text-red-800 dark:text-red-300 font-medium">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isEditing && (
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={saving}
                className="text-xs text-brand dark:text-red-400 hover:underline font-bold"
              >
                {isId ? "Coba Lagi" : "Retry"}
              </button>
            )}
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-semibold"
            >
              {isId ? "Tutup" : "Dismiss"}
            </button>
          </div>
        </div>
      )}

      {/* Cancelled Banner */}
      {order.status === "CANCELLED" && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ban className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="font-extrabold text-xs text-red-900 dark:text-red-300">
                {isId ? "Surat Jalan Dibatalkan" : "Delivery Order Cancelled"}
              </p>
              <p className="text-[11px] text-red-700 dark:text-red-400">
                {isId
                  ? "Dokumen ini tidak aktif. Anda dapat membukanya kembali menjadi Draft jika diperlukan koreksi."
                  : "This order is inactive. You can re-open it to Draft status if revisions are needed."}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setRollbackTarget("DRAFT");
              setIsRollbackModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-red-300 dark:border-red-800 text-xs font-bold text-red-700 dark:text-red-300 shadow-xs hover:bg-red-50"
          >
            {isId ? "Buka Menjadi Draft" : "Re-open as Draft"}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
        {/* Animated Operational Lifecycle Stepper */}
        {order.status !== "CANCELLED" && (
          <div className="p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
            <div className="flex items-center justify-between relative">
              {/* Background Connector Bar */}
              <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-gray-100 dark:bg-gray-800 z-0" />
              
              {[
                { key: "DRAFT" as const, stepIdx: 0 },
                { key: "CONFIRMED" as const, stepIdx: 1 },
                { key: "PRINTED" as const, stepIdx: 2 },
                { key: "DISPATCHED" as const, stepIdx: 3 },
                { key: "DELIVERED" as const, stepIdx: 4 },
              ].map((step, idx) => {
                const token = STATUS_COLOR_MAP[step.key];
                const stepOrder: Record<DeliveryOrderStatus, number> = {
                  DRAFT: 0,
                  CONFIRMED: 1,
                  PRINTED: 2,
                  DISPATCHED: 3,
                  DELIVERED: 4,
                  CANCELLED: -1,
                };
                const currentIdx = stepOrder[order.status] ?? 0;
                const isPassed = currentIdx > idx;
                const isCurrent = currentIdx === idx;
                const Icon = token.icon;

                return (
                  <div
                    key={step.key}
                    className="flex flex-col items-center relative z-10"
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isPassed
                          ? `${token.stepper.passedBg} shadow-xs`
                          : isCurrent
                          ? `${token.stepper.activeBg} shadow-md animate-status-pulse ${token.stepper.activeRing}`
                          : token.stepper.idleBg
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span
                      className={`text-[10px] sm:text-[11px] mt-1 font-semibold transition-colors duration-200 text-center ${
                        isCurrent
                          ? token.stepper.activeText
                          : isPassed
                          ? token.stepper.passedText
                          : token.stepper.idleText
                      }`}
                    >
                      {isId ? token.labelId : token.labelEn}
                      <span className="sr-only">
                        {isCurrent
                          ? isId ? " (posisi sekarang)" : " (current step)"
                          : isPassed
                          ? isId ? " (selesai)" : " (done)"
                          : isId ? " (belum)" : " (pending)"}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Cards (View / Edit Mode) */}
        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <Building className="h-3.5 w-3.5 text-brand" />
                <span>{isId ? "Penerima / Customer" : "Customer / Recipient"}</span>
              </div>
              <p className="font-bold text-sm text-gray-900 dark:text-white">{order.recipientName}</p>
              <div className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-400" />
                <span>{order.destinationAddress}</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <Calendar className="h-3.5 w-3.5 text-brand" />
                <span>{isId ? "Jadwal & Referensi" : "Schedule & References"}</span>
              </div>
              <div className="text-xs space-y-1">
                <p className="text-gray-800 dark:text-gray-200">
                  <span className="text-gray-500">{isId ? "Tgl Kirim:" : "Date:"}</span>{" "}
                  <span className="font-semibold">{formatIndonesianDate(order.deliveryDate)}</span>
                </p>
                <p className="text-gray-800 dark:text-gray-200">
                  <span className="text-gray-500">PO / SPK:</span>{" "}
                  <span className="font-semibold font-mono">{order.poNumber || "-"}</span>
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <Truck className="h-3.5 w-3.5 text-brand" />
                <span>{isId ? "Armada & Pengemudi" : "Logistics & Driver"}</span>
              </div>
              <div className="text-xs space-y-1">
                <p className="text-gray-800 dark:text-gray-200">
                  <span className="text-gray-500">{isId ? "Sopir:" : "Driver:"}</span>{" "}
                  <span className="font-semibold">{order.driverName || "-"}</span>
                </p>
                <p className="text-gray-800 dark:text-gray-200">
                  <span className="text-gray-500">{isId ? "No Kendaraan:" : "Vehicle:"}</span>{" "}
                  <span className="font-semibold">{order.vehicleNumber || "-"}</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Interactive Edit Mode for Header Fields */
          <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-gray-900 p-4 sm:p-5 space-y-4 shadow-xs">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-brand" />
              <span>{isId ? "Edit Informasi Surat Jalan" : "Edit Order Information"}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {isId ? "Nama Penerima / Customer *" : "Customer *"}
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-brand focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {isId ? "No. PO / SPK" : "PO / SPK"}
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-brand focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {isId ? "Tanggal Pengiriman" : "Delivery Date"}
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-brand focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {isId ? "Alamat Tujuan Lengkap *" : "Destination Address *"}
                </label>
                <input
                  type="text"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-brand focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {isId ? "Nama Pengemudi / Sopir" : "Driver Name"}
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:border-brand focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Size Matrix Items Table */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  {isId ? "Rincian Matriks Ukuran Sepatu" : "Footwear Size Breakdown Matrix"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowOversized(!showOversized)}
                  className="text-[11px] font-semibold text-gray-500 hover:text-brand dark:hover:text-red-400 flex items-center gap-0.5"
                >
                  <span>{showOversized ? (isId ? "Sembunyikan 46-48" : "Hide 46-48") : (isId ? "+ Jumbo EU 46-48" : "+ Oversize 46-48")}</span>
                  {showOversized ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {isEditing
                  ? isId
                    ? "Ubah jumlah pasang per size langsung di tabel ini"
                    : "Edit pairs per size directly in this grid"
                  : `${order.items?.length || 0} ${isId ? "artikel insole dipesan" : "insole articles ordered"}`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isEditing && (
                <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setInputMode("GRID")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                      inputMode === "GRID"
                        ? "bg-white dark:bg-gray-700 text-brand dark:text-red-300 shadow-xs"
                        : "text-gray-500"
                    }`}
                  >
                    <Grid className="h-3.5 w-3.5" />
                    <span>{isId ? "Tabel" : "Grid"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("TOUCH_PAD")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                      inputMode === "TOUCH_PAD"
                        ? "bg-white dark:bg-gray-700 text-brand dark:text-red-300 shadow-xs"
                        : "text-gray-500"
                    }`}
                  >
                    <Touchpad className="h-3.5 w-3.5" />
                    <span>{isId ? "Pad Sentuh" : "Touch Pad"}</span>
                  </button>
                </div>
              )}

              {isEditing && (
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand dark:text-red-400 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isId ? "+ Tambah Baris" : "+ Add Row"}</span>
                </button>
              )}

              <div className="text-right">
                <span className="text-[11px] text-gray-500 uppercase font-semibold block">
                  {isId ? "Total Pasang" : "Total Pairs"}
                </span>
                <span className="text-base font-extrabold text-brand dark:text-red-400">
                  {isEditing
                    ? `${editGrandTotalPairs.toLocaleString("id-ID")} psg`
                    : `${order.totalQuantity.toLocaleString("id-ID")} psg`}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {!isEditing ? (
              /* View Mode Table */
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3 min-w-[180px]">{isId ? "Artikel & Spesifikasi" : "Article & Specs"}</th>
                    {activeDisplayedSizes.map((size) => (
                      <th
                        key={size}
                        className={`p-2 text-center w-10 font-mono ${
                          size >= 46
                            ? "bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200"
                            : "bg-gray-100/70 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {size}
                      </th>
                    ))}
                    <th className="p-3 text-right w-24">{isId ? "Subtotal" : "Subtotal"}</th>
                    <th className="p-3 text-right w-28">{isId ? "Harga Satuan" : "Unit Price"}</th>
                    <th className="p-3 text-right w-32">{isId ? "Total Nilai" : "Total Amount"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                  {order.items?.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition">
                      <td className="p-3 text-center text-gray-400">{idx + 1}</td>
                      <td className="p-3">
                        <p className="font-bold text-gray-900 dark:text-white">{item.articleName}</p>
                        <p className="text-[11px] text-gray-500 font-mono">
                          {item.articleCode} {item.colorway && `• ${item.colorway}`}
                        </p>
                        {item.notes && <p className="text-[10px] text-amber-600 mt-0.5">{item.notes}</p>}
                      </td>
                      {activeDisplayedSizes.map((size) => {
                        const qty = item.sizes?.[size];
                        return (
                          <td
                            key={size}
                            className={`p-2 text-center font-mono ${
                              qty && qty > 0
                                ? "bg-amber-50/80 dark:bg-amber-950/40 font-bold text-amber-900 dark:text-amber-300"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          >
                            {qty && qty > 0 ? qty : "-"}
                          </td>
                        );
                      })}
                      <td className="p-3 text-right font-bold text-gray-900 dark:text-white">
                        {item.totalPairs.toLocaleString("id-ID")} psg
                      </td>
                      <td className="p-3 text-right text-gray-600 dark:text-gray-300">
                        {item.unitPrice ? formatIDR(item.unitPrice) : "-"}
                      </td>
                      <td className="p-3 text-right font-semibold text-gray-900 dark:text-white">
                        {item.totalPrice ? formatIDR(item.totalPrice) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-800 font-bold border-t border-gray-200 dark:border-gray-700">
                  <tr>
                    <td colSpan={2} className="p-3 text-gray-800 dark:text-gray-200 uppercase">
                      {isId ? "Grand Total Pengiriman" : "Grand Total"}
                    </td>
                    {activeDisplayedSizes.map((size) => {
                      const colSum =
                        order.items?.reduce((sum, item) => sum + (item.sizes?.[size] || 0), 0) || 0;
                      return (
                        <td key={size} className="p-2 text-center font-mono text-gray-900 dark:text-white">
                          {colSum > 0 ? colSum : "-"}
                        </td>
                      );
                    })}
                    <td className="p-3 text-right text-brand dark:text-red-400 font-extrabold">
                      {order.totalQuantity.toLocaleString("id-ID")} psg
                    </td>
                    <td></td>
                    <td className="p-3 text-right text-brand dark:text-red-400 font-extrabold">
                      {order.totalAmount ? formatIDR(order.totalAmount) : "-"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : inputMode === "TOUCH_PAD" ? (
              /* Touch Pad Edit Mode */
              <div className="p-4 space-y-4">
                {/* Active Item Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {editItems.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveItemIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition ${
                        activeItemIndex === idx
                          ? "bg-brand text-white border-brand shadow-xs"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.articleCode || `Item ${idx + 1}`}: {item.articleName}
                    </button>
                  ))}
                </div>

                <TouchSizePad
                  sizes={currentEditItem?.sizes || {}}
                  onChange={handleTouchPadChange}
                  language={language}
                />
              </div>
            ) : (
              /* Interactive Grid Table */
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="p-2.5 text-left w-36">{isId ? "Artikel & Kode" : "Article"}</th>
                    <th className="p-2.5 text-left w-24">{isId ? "Harga (IDR)" : "Price"}</th>
                    {activeDisplayedSizes.map((size) => (
                      <th key={size} className="p-2 text-center w-11 font-mono">
                        {size}
                      </th>
                    ))}
                    <th className="p-2.5 text-right w-20">{isId ? "Total Psg" : "Pairs"}</th>
                    <th className="p-2.5 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {editItems.map((item) => {
                    let itemPairs = 0;
                    Object.values(item.sizes).forEach((qty) => {
                      if (typeof qty === "number" && qty > 0) itemPairs += qty;
                    });

                    return (
                      <tr key={item.id} className="bg-white dark:bg-gray-900">
                        <td className="p-2.5 space-y-1">
                          <input
                            type="text"
                            value={item.articleCode}
                            onChange={(e) =>
                              setEditItems(
                                editItems.map((i) =>
                                  i.id === item.id ? { ...i, articleCode: e.target.value } : i
                                )
                              )
                            }
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1 text-[11px] font-mono bg-white dark:bg-gray-800"
                          />
                          <input
                            type="text"
                            value={item.articleName}
                            onChange={(e) =>
                              setEditItems(
                                editItems.map((i) =>
                                  i.id === item.id ? { ...i, articleName: e.target.value } : i
                                )
                              )
                            }
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-800"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice || ""}
                            onChange={(e) =>
                              setEditItems(
                                editItems.map((i) =>
                                  i.id === item.id
                                    ? { ...i, unitPrice: parseInt(e.target.value, 10) || 0 }
                                    : i
                                )
                              )
                            }
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs bg-white dark:bg-gray-800"
                          />
                        </td>
                        {activeDisplayedSizes.map((size) => {
                          const val = item.sizes[size] || "";
                          return (
                            <td key={size} className="p-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="-"
                                value={val}
                                onChange={(e) => handleSizeChange(item.id, size, e.target.value)}
                                className={`w-full min-h-[44px] text-center rounded-lg border px-1 py-1 text-xs font-mono font-bold transition ${
                                  val && Number(val) > 0
                                    ? "bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800"
                                }`}
                              />
                            </td>
                          );
                        })}
                        <td className="p-2.5 text-right font-extrabold text-xs text-brand dark:text-red-400">
                          {itemPairs} psg
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={editItems.length <= 1}
                            className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Terbilang & Notes */}
        {!isEditing ? (
          <>
            {order.totalAmount && order.totalAmount > 0 && (
              <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-4 shadow-xs">
                <p className="text-xs font-semibold text-red-900 dark:text-red-300 uppercase tracking-wide">
                  {isId ? "Terbilang Formal:" : "Spelled Out in Words:"}
                </p>
                <p className="text-sm font-bold text-brand dark:text-red-400 italic mt-0.5">
                  "{terbilang(order.totalAmount)}"
                </p>
              </div>
            )}

            {order.notes && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xs">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  {isId ? "Catatan Tambahan" : "Notes"}
                </p>
                <p className="text-xs text-gray-800 dark:text-gray-200">{order.notes}</p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {isId ? "Catatan Tambahan Surat Jalan" : "Order Notes"}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs text-gray-900 dark:text-white focus:border-brand focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Sticky Thumb-Zone Action Bar (mobile detail sheet only) */}
      {showBottomActionBar && order.status !== "CANCELLED" && (
        <div className="sticky bottom-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xs border-t border-gray-200 dark:border-gray-800 p-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
          {isEditing ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="min-h-[48px] rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 active:scale-95 transition"
              >
                {isId ? "Batal Edit" : "Cancel Edit"}
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={saving}
                className="min-h-[48px] rounded-xl bg-brand hover:bg-brand-strong text-white text-xs font-bold shadow-xs active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? (isId ? "Menyimpan..." : "Saving...") : isId ? "Simpan Perubahan" : "Save Changes"}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="min-h-[48px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="h-4 w-4 text-gray-500" />
                  <span>{isId ? "Edit" : "Edit"}</span>
                </button>
              )}
              {nextAction && (
                <button
                  type="button"
                  onClick={() => {
                    if (nextAction.next === "DISPATCHED" || nextAction.next === "DELIVERED") {
                      setPendingDispatchStatus(nextAction.next);
                    } else if (nextAction.next === "PRINTED") {
                      onOpenPrint(order);
                    } else {
                      onStatusChange(order.id, nextAction.next);
                    }
                  }}
                  className={`min-h-[48px] rounded-xl text-xs font-bold active:scale-95 transition flex items-center justify-center gap-1.5 ${STATUS_COLOR_MAP[nextAction.next].cta.buttonClasses}`}
                >
                  <nextAction.icon className="h-4 w-4" />
                  <span>{nextAction.label}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            ref={deleteModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-desc"
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 p-5 space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 id="delete-dialog-title" className="font-bold text-sm text-gray-900 dark:text-white">
                  {isId ? "Hapus Draft Surat Jalan Ini?" : "Delete this Draft Delivery Order?"}
                </h3>
                <p id="delete-dialog-desc" className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {isId
                    ? `Draft surat jalan nomor ${order.orderNumber} belum pernah dicetak dan aman untuk dihapus permanen. Dokumen berstatus CONFIRMED ke atas wajib melalui 'Void & Arsip' demi mencegah risiko salinan fisik (paper-twin) yang beredar di pabrik.`
                    : `Draft order ${order.orderNumber} has never been printed and is safe to permanently delete. Orders marked CONFIRMED or beyond must use 'Void & Archive' to prevent untracked physical paper-twins circulating on the factory floor.`}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                {isId ? "Batal" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  onDeleteOrder(order.id);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
              >
                {isId ? "Ya, Hapus Draft" : "Yes, Delete Draft"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Discard Edit Confirmation Modal (replaces native window.confirm) */}
      {isDiscardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            ref={discardModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="discard-dialog-title"
            aria-describedby="discard-dialog-desc"
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150 p-5 space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 id="discard-dialog-title" className="font-bold text-sm text-gray-900 dark:text-white">
                  {isId ? "Buang Perubahan yang Belum Disimpan?" : "Discard Unsaved Changes?"}
                </h3>
                <p id="discard-dialog-desc" className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {isId
                    ? `Ada perubahan pada surat jalan ${order.orderNumber} yang belum disimpan. Lanjutkan mengedit untuk mempertahankannya.`
                    : `Order ${order.orderNumber} has unsaved changes. Continue editing to keep them.`}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                ref={discardCancelRef}
                type="button"
                onClick={() => setIsDiscardModalOpen(false)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {isId ? "Lanjut Mengedit" : "Keep Editing"}
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscardEdit}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-brand hover:bg-brand-strong text-white text-xs font-bold shadow-xs active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {isId ? "Ya, Buang Perubahan" : "Yes, Discard"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Rollback & Cancellation Modal */}
      {isRollbackModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            ref={rollbackModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rollback-dialog-title"
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="p-4 bg-brand text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                <h3 id="rollback-dialog-title" className="font-bold text-sm">
                  {rollbackTarget === "CANCELLED"
                    ? isId ? "Void & Arsipkan Surat Jalan" : "Void & Archive Delivery Order"
                    : isId ? "Koreksi / Rollback Status Surat Jalan" : "Revert Delivery Order Status"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRollbackModalOpen(false);
                  setRollbackError(null);
                }}
                className="p-1 rounded-lg hover:bg-white/10"
                aria-label={isId ? "Tutup dialog" : "Close dialog"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {rollbackError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 font-medium">
                  {rollbackError}
                </div>
              )}

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-300 space-y-0.5">
                  <p className="font-bold">
                    {isId ? "Status Saat Ini: " : "Current Status: "}
                    <span className="underline">
                      {isId ? STATUS_COLOR_MAP[order.status].labelId : STATUS_COLOR_MAP[order.status].labelEn}
                    </span>
                  </p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-400">
                    {rollbackTarget === "CANCELLED" && order.status !== "DRAFT"
                      ? isId
                        ? "Surat jalan ini telah diproses/dicetak dan berpotensi memiliki salinan fisik (paper-twin). Dokumen tidak dihapus melainkan di-Void dan diarsipkan dengan jejak audit resmi."
                        : "This order has been processed/printed and may have a physical paper-twin. The document will not be purged, but Voided and archived with an official audit log."
                      : isId
                        ? "Tindakan ini akan mengembalikan status dokumen dan mencatat alasan pembatalan/koreksi ke jejak audit keamanan."
                        : "This action will reverse the document lifecycle and record the operational reason in the audit log."}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-gray-500 block mb-1.5">
                  {isId ? "Pilih Status Target:" : "Select Target Status:"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Only genuine rollback targets (<=3); CANCELLED has its dedicated More-menu entry */}
                  {availableRollbacks.map((st) => {
                    const semanticHelp = isId ? ROLLBACK_SEMANTICS[st]?.id : ROLLBACK_SEMANTICS[st]?.en;

                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setRollbackTarget(st)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-start justify-between ${
                          rollbackTarget === st
                            ? "border-brand bg-red-50 dark:bg-red-950/50 text-brand dark:text-red-300"
                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0 pr-1">
                          <span className="block text-xs font-bold">
                            {isId ? STATUS_COLOR_MAP[st].labelId : STATUS_COLOR_MAP[st].labelEn}
                          </span>
                          {semanticHelp && (
                            <span className="block text-[10px] font-normal text-gray-500 dark:text-gray-400 leading-tight">
                              {semanticHelp}
                            </span>
                          )}
                        </div>
                        {rollbackTarget === st && (
                          <CheckCircle2 className="h-4 w-4 text-brand dark:text-red-400 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-gray-500 block mb-1">
                  {isId ? "Alasan Rollback / Pembatalan (Wajib Diisi) *" : "Reason for Status Reversal (Required) *"}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={
                    isId
                      ? "Contoh: Koreksi jumlah size matrix oleh QC / Customer meminta penundaan pengiriman..."
                      : "e.g., Size matrix quantity correction by QC / Delivery reschedule requested by customer..."
                  }
                  value={rollbackReason}
                  onChange={(e) => setRollbackReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRollbackModalOpen(false);
                    setRollbackError(null);
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300"
                >
                  {isId ? "Batal" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRollback}
                  disabled={rollbackSubmitting || !rollbackReason.trim()}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-strong disabled:opacity-50 transition active:scale-95"
                >
                  {rollbackSubmitting
                    ? isId ? "Memproses..." : "Processing..."
                    : rollbackTarget === "CANCELLED"
                      ? isId ? "Konfirmasi Void & Arsip" : "Confirm Void & Archive"
                      : isId ? "Konfirmasi Perubahan Status" : "Confirm Status Change"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Guard Confirmation Sheet (P0: Lightweight Confirm on Kirimkan / Tiba di Lokasi) */}
      <DispatchConfirmModal
        isOpen={!!pendingDispatchStatus}
        order={order}
        targetStatus={pendingDispatchStatus || "DISPATCHED"}
        onConfirm={async () => {
          if (!pendingDispatchStatus) return false;
          return onStatusChange(order.id, pendingDispatchStatus);
        }}
        onClose={() => setPendingDispatchStatus(null)}
        language={language}
      />
    </div>
  );
}
