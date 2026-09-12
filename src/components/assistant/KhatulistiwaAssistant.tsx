"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/lib/ai/types";
import { useModalSafety } from "@/lib/utils/useModalSafety";
import {
  Compass,
  X,
  Send,
  Sparkles,
  FileCheck2,
  Trash2,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  RotateCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface KhatulistiwaAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  onApplyDraftOrder: (draftData: any) => void;
  language: "id" | "en";
}

/**
 * Normalizes draft order payload to ensure footwear size breakdown and total pairs
 * are reliably extracted whether delivered at root or nested under items.
 */
export function normalizeDraftOrder(raw: any) {
  if (!raw) return null;
  const draft = { ...raw };

  let sizeBreakdown: Record<string, number> = { ...(draft.size_breakdown || {}) };

  // If size_breakdown is missing at top-level, aggregate from items
  if (Object.keys(sizeBreakdown).length === 0 && Array.isArray(draft.items)) {
    for (const it of draft.items) {
      if (it && it.sizes && typeof it.sizes === "object") {
        for (const [sizeKey, qtyVal] of Object.entries(it.sizes)) {
          const count = Number(qtyVal);
          if (!isNaN(count) && count > 0) {
            sizeBreakdown[sizeKey] = (sizeBreakdown[sizeKey] || 0) + count;
          }
        }
      }
    }
  }

  let totalPairs = draft.total_pairs;
  if (!totalPairs) {
    const sum = Object.values(sizeBreakdown).reduce((acc, curr) => acc + Number(curr), 0);
    if (sum > 0) {
      totalPairs = sum;
    }
  }

  return {
    ...draft,
    size_breakdown: sizeBreakdown,
    total_pairs: totalPairs,
  };
}

export function KhatulistiwaAssistant({
  isOpen,
  onToggle,
  onApplyDraftOrder,
  language,
}: KhatulistiwaAssistantProps) {
  const isId = language === "id";
  const [selectedModel, setSelectedModel] = useState<string>("google/gemini-3.5-flash-lite");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [appliedDrafts, setAppliedDrafts] = useState<Record<number, boolean>>({});
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: isId
        ? "Halo! Saya **Khatulistiwa AI**, asisten operasional Equator Insole Bandung. Ada yang bisa saya bantu terkait Surat Jalan, inventaris bahan baku, atau kalkulasi kebutuhan produksi hari ini?"
        : "Hello! I am **Khatulistiwa AI**, the operational assistant for Equator Insole Bandung. How can I help you with delivery orders, inventory, or production BOM calculations today?",
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [stagedDrafts, setStagedDrafts] = useState<Record<number, any>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cancelClearRef = useRef<HTMLButtonElement>(null);

  // Modal safety for the confirmation dialog (Escape, backdrop, focus trap)
  const confirmModalRef = useModalSafety({
    isOpen: isConfirmClearOpen,
    onClose: () => setIsConfirmClearOpen(false),
    initialFocusRef: cancelClearRef,
  });

  // Modal safety for the floating assistant drawer (Escape closes drawer, auto-focus textarea)
  const assistantWindowRef = useModalSafety({
    isOpen: isOpen && !isConfirmClearOpen,
    onClose: onToggle,
    initialFocusRef: textareaRef,
  });

  // Markdown Formatter Helper
  const renderFormattedContent = (content: string, isUser: boolean) => {
    const lines = content.split("\n");
    return (
      <div className="space-y-1.5 leading-relaxed">
        {lines.map((line, lIdx) => {
          if (!line.trim()) return <div key={lIdx} className="h-1" />;

          // Bullet points
          const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
          const text = isBullet ? line.trim().slice(2) : line;

          // Header
          const isHeader = line.trim().startsWith("### ") || line.trim().startsWith("## ");
          const headerText = isHeader ? line.trim().replace(/^#+\s*/, "") : text;

          // Format bold **text**
          const parts = headerText.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

          const formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong
                  key={pIdx}
                  className={`font-black ${
                    isUser
                      ? "text-white dark:text-neutral-950 underline decoration-white/30"
                      : "text-neutral-950 dark:text-white"
                  }`}
                >
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith("`") && part.endsWith("`")) {
              return (
                <code
                  key={pIdx}
                  className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
                    isUser
                      ? "bg-neutral-800 dark:bg-neutral-200 text-neutral-100 dark:text-neutral-900"
                      : "bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                  }`}
                >
                  {part.slice(1, -1)}
                </code>
              );
            }
            return <React.Fragment key={pIdx}>{part}</React.Fragment>;
          });

          if (isHeader) {
            return (
              <div key={lIdx} className="font-extrabold text-sm pt-1 tracking-tight">
                {formattedLine}
              </div>
            );
          }

          if (isBullet) {
            return (
              <div key={lIdx} className="flex items-start gap-2 ml-1">
                <span
                  className={`text-xs mt-0.5 shrink-0 ${
                    isUser ? "text-neutral-300 dark:text-neutral-600" : "text-brand dark:text-red-400"
                  }`}
                >
                  •
                </span>
                <span className="flex-1">{formattedLine}</span>
              </div>
            );
          }

          return <p key={lIdx}>{formattedLine}</p>;
        })}
      </div>
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isExpanded]);

  const quickPrompts = [
    {
      label: isId ? "Status Saldo Stok Bahan" : "Check Material Inventory",
      prompt: isId
        ? "Tolong berikan status saldo stok bahan baku terkini di gudang, terutama yang berada di bawah safety threshold."
        : "Please give me the latest stock balance of raw materials in the warehouse, especially those below safety thresholds.",
    },
    {
      label: isId ? "Draft Surat Jalan Baru" : "Draft Delivery Order",
      prompt: isId
        ? "Buatkan draft surat jalan untuk PT KMK GLOBAL SPORTS di Tangerang, 300 pasang insole sport (size 39: 60, 40: 80, 41: 80, 42: 80), PO-KMK-889, kirim besok."
        : "Draft a delivery order for PT KMK GLOBAL SPORTS in Tangerang, 300 pairs of sport insoles (size 39: 60, 40: 80, 41: 80, 42: 80), PO-KMK-889, shipping tomorrow.",
    },
    {
      label: isId ? "Kalkulasi Kebutuhan BOM" : "Calculate BOM Requirement",
      prompt: isId
        ? "Hitung estimasi kebutuhan lembaran EVA foam dan kain BK mesh untuk produksi 500 pasang insole model Ortho Sport."
        : "Calculate the estimated BOM of EVA foam sheets and BK mesh fabric for producing 500 pairs of Ortho Sport insoles.",
    },
    {
      label: isId ? "Ringkasan Operasional DO" : "Operations Summary",
      prompt: isId
        ? "Berikan ringkasan volume pasang surat jalan aktif dan nilai aset gudang bulan ini."
        : "Provide a summary of active delivery order pairs volume and total warehouse asset valuation this month.",
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const content = textToSend || inputPrompt;
    if (!content.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputPrompt("");
    setLoading(true);
    setLastFailedPrompt(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          modelId: selectedModel,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: json.data.content,
        };
        const newMessages = [...nextMessages, assistantMsg];
        setMessages(newMessages);

        if (json.data.stagedDraft) {
          setStagedDrafts((prev) => ({
            ...prev,
            [newMessages.length - 1]: json.data.stagedDraft,
          }));
        }
      } else {
        throw new Error(json.error || "Failed to get AI response");
      }
    } catch (err) {
      console.error(err);
      setLastFailedPrompt(content);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isId
            ? "Maaf, terjadi kendala saat menghubungkan ke gateway AI. Silakan periksa koneksi atau coba lagi."
            : "Sorry, an error occurred while connecting to the AI gateway. Please check connection or try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleConfirmClear = () => {
    setMessages([
      {
        role: "assistant",
        content: isId
          ? "Riwayat percakapan telah dibersihkan. Ada yang ingin Anda tanyakan seputar pabrik Equator Insole?"
          : "Chat history cleared. How can I assist you with Equator Insole factory operations?",
      },
    ]);
    setStagedDrafts({});
    setAppliedDrafts({});
    setLastFailedPrompt(null);
    setIsConfirmClearOpen(false);
  };

  return (
    <>
      {/* Floating Action Launcher Button (WCAG 2.5.5 >=44px) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-20 md:bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-brand hover:bg-brand-strong text-white px-5 py-3.5 min-h-[48px] shadow-2xl active:scale-95 transition-all duration-200 group border border-red-400/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          title="Buka Khatulistiwa AI"
          aria-label="Buka Khatulistiwa AI"
        >
          <div className="relative">
            <Compass
              className={`h-6 w-6 text-white ${
                loading ? "animate-spin" : "group-hover:rotate-45 transition-transform"
              }`}
            />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-extrabold tracking-wide leading-tight">Khatulistiwa AI</p>
            <p className="text-[10px] text-red-200 font-medium">
              {isId ? "Asisten Pabrik" : "Factory Assistant"}
            </p>
          </div>
        </button>
      )}

      {/* Spacious & Font-Conscious Floating Window Widget with useModalSafety */}
      {isOpen && (
        <div
          ref={assistantWindowRef}
          role="dialog"
          aria-modal="false"
          aria-label={isId ? "Asisten Operasional Khatulistiwa AI" : "Khatulistiwa AI Operations Assistant"}
          className={`fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden animate-drawer-enter transition-all ${
            isExpanded
              ? "w-[calc(100vw-32px)] sm:w-[740px] md:w-[800px] h-[720px] max-h-[90vh]"
              : "w-[calc(100vw-32px)] sm:w-[520px] md:w-[560px] h-[640px] max-h-[86vh]"
          }`}
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-brand text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 shadow-xs">
                <Compass className={`h-5 w-5 text-white ${loading ? "animate-spin" : ""}`} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base tracking-wide">
                  <span>Khatulistiwa AI</span>
                </h3>
                <p className="text-xs text-red-100 font-medium">
                  {isId ? "Asisten Operasional Pabrik" : "Factory Operations Assistant"}
                </p>
              </div>
            </div>

            {/* Window Controls (All >= 44px touch targets) */}
            <div className="flex items-center gap-1">
              {/* Collapsible Model Selector Toggle */}
              <button
                type="button"
                onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 min-h-[44px] rounded-xl text-red-200 hover:text-white hover:bg-white/15 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white text-xs font-semibold"
                title={isId ? "Konfigurasi Model AI" : "Configure AI Model"}
                aria-expanded={isModelSelectorOpen}
                aria-controls="assistant-model-selector"
                aria-label={isId ? "Pilih mesin AI" : "Select AI engine"}
              >
                <SlidersHorizontal className="h-4 w-4 shrink-0" />
                <span className="hidden md:inline text-[11px] max-w-[90px] truncate">
                  {selectedModel.split("/")[1] || selectedModel}
                </span>
                {isModelSelectorOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:flex p-2.5 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-red-200 hover:text-white hover:bg-white/15 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                title={isExpanded ? (isId ? "Kecilkan Window" : "Contract") : isId ? "Perbesar Window" : "Expand"}
                aria-label={isExpanded ? "Contract window" : "Expand window"}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsConfirmClearOpen(true)}
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-red-200 hover:text-white hover:bg-white/15 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                title={isId ? "Bersihkan Chat" : "Clear Chat"}
                aria-label={isId ? "Bersihkan Chat" : "Clear Chat"}
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onToggle}
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-red-200 hover:text-white hover:bg-white/15 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                title={isId ? "Tutup Widget" : "Close"}
                aria-label="Close Assistant"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Progressive Disclosure Model Selector Bar */}
          {isModelSelectorOpen && (
            <div
              id="assistant-model-selector"
              className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/90 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2.5 text-xs animate-in slide-in-from-top-2 duration-150"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                <span className="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px]">
                  {isId ? "Mesin Model AI:" : "AI Model Engine:"}
                </span>
              </div>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                aria-label={isId ? "Pilih model AI" : "Select AI model"}
                className="min-h-[44px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:border-brand focus:outline-none"
              >
                <option value="google/gemini-3.5-flash-lite">
                  Gemini 3.5 Flash Lite ({isId ? "Cepat & Harian" : "Fast & Daily"})
                </option>
                <option value="google/gemini-3.7-flash">
                  Gemini 3.7 Flash ({isId ? "Vision OCR & Ekstraksi" : "Vision OCR & Forms"})
                </option>
                <option value="deepseek/deepseek-v4-pro-0813">
                  DeepSeek V4 Pro ({isId ? "Analitik & Logika SQL" : "Analytics & SQL Logic"})
                </option>
                <option value="qwen/qwen3.7-plus">
                  Qwen 3.7 Plus ({isId ? "Bilingual & Istilah Pabrik" : "Bilingual & Factory Terms"})
                </option>
                <option value="openai/gpt-5.6-luna">
                  GPT-5.6 Luna ({isId ? "CAD Generatif" : "Generative CAD"})
                </option>
              </select>
            </div>
          )}

          {/* Conversation Stream (Font-Conscious) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4" aria-live="polite">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const rawStaged = stagedDrafts[idx];
              const staged = rawStaged ? normalizeDraftOrder(rawStaged) : null;
              const isApplied = appliedDrafts[idx];

              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1.5 animate-paper-feed`}
                >
                  <div className="flex items-center gap-2 text-[10px] text-neutral-500 dark:text-neutral-400 px-1 font-bold uppercase tracking-wider">
                    <span>{isUser ? (isId ? "Anda" : "You") : "Khatulistiwa AI"}</span>
                  </div>

                  {/* Speech Bubble: Neutral ink for user (Crimson Scarcity compliant) */}
                  <div
                    className={`p-4 rounded-xl max-w-[92%] relative group transition-all leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-br-xs shadow-md font-medium text-xs sm:text-sm"
                        : "bg-neutral-100 dark:bg-neutral-800/90 text-neutral-900 dark:text-neutral-100 rounded-bl-xs border border-neutral-200 dark:border-neutral-700/80 text-xs sm:text-sm shadow-xs"
                    }`}
                  >
                    {renderFormattedContent(msg.content, isUser)}

                    {/* Copy Button (Accessible touch target >= 44px) */}
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.content, idx)}
                        className="absolute top-2 right-2 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-white/90 dark:bg-neutral-700/90 shadow-xs text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white transition active:scale-95 focus:opacity-100"
                        title={isId ? "Salin Pesan" : "Copy Message"}
                        aria-label={isId ? "Salin Pesan" : "Copy Message"}
                      >
                        {copiedIndex === idx ? (
                          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Error Retry Action (P2 Fragile Error Recovery) */}
                  {lastFailedPrompt && idx === messages.length - 1 && !isUser && (
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const toRetry = lastFailedPrompt;
                          setLastFailedPrompt(null);
                          handleSendMessage(toRetry);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-red-100 dark:bg-red-950/70 text-brand dark:text-red-300 font-bold text-xs border border-red-200 dark:border-red-900 hover:bg-red-200 dark:hover:bg-red-900 transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      >
                        <RotateCw className="h-4 w-4" />
                        <span>{isId ? "Coba Lagi" : "Retry"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInputPrompt(lastFailedPrompt);
                          setLastFailedPrompt(null);
                          if (textareaRef.current) {
                            textareaRef.current.focus();
                          }
                        }}
                        className="inline-flex items-center px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"
                      >
                        <span>{isId ? "Edit Prompt" : "Edit Prompt"}</span>
                      </button>
                    </div>
                  )}

                  {/* Staged Draft Action Card with Normalized Footwear Size Matrix (Amber Data Tokens) */}
                  {staged && (
                    <div className="mt-2 w-full max-w-[92%] rounded-xl border-2 border-amber-300 dark:border-amber-700/80 bg-amber-50/90 dark:bg-amber-950/40 p-4 space-y-3 shadow-xs animate-staging-glow animate-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between text-amber-950 dark:text-amber-200 font-bold text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <FileCheck2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>
                            {isId ? "Draft Surat Jalan Siap Ditinjau" : "DO Draft Ready for Review"}
                          </span>
                        </div>
                        {staged.total_pairs && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-200/90 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 font-mono text-[10px] font-bold">
                            {Number(staged.total_pairs).toLocaleString("id-ID")}{" "}
                            {isId ? "Pasang" : "Pairs"}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-amber-950 dark:text-amber-200 space-y-1 font-medium bg-white/80 dark:bg-amber-900/20 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60">
                        <p>
                          <strong>{isId ? "Penerima:" : "Recipient:"}</strong> {staged.recipient_name}
                        </p>
                        <p>
                          <strong>{isId ? "Alamat:" : "Address:"}</strong>{" "}
                          {staged.destination_address}
                        </p>
                        <p>
                          <strong>{isId ? "No. PO / SPK:" : "PO / Work Order:"}</strong>{" "}
                          {staged.po_number || "-"}
                        </p>
                      </div>

                      {/* Footwear Size Breakdown Matrix Pills */}
                      {staged.size_breakdown && Object.keys(staged.size_breakdown).length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-extrabold uppercase text-amber-900 dark:text-amber-300 block tracking-wider">
                            {isId ? "Matriks Rincian Ukuran Sepatu:" : "Footwear Size Breakdown Matrix:"}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(staged.size_breakdown)
                              .filter(([_, qty]) => Number(qty) > 0)
                              .map(([size, qty]) => (
                                <span
                                  key={size}
                                  className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/70 text-amber-950 dark:text-amber-100 font-mono text-[11px] font-bold border border-amber-300 dark:border-amber-700"
                                >
                                  EU {size}: {Number(qty).toLocaleString("id-ID")} psg
                                </span>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Apply Button State */}
                      {isApplied ? (
                        <div className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold border border-emerald-300 dark:border-emerald-700 flex items-center justify-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>
                            {isId
                              ? "Telah Diterapkan ke Form Surat Jalan"
                              : "Applied to Order Form"}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onApplyDraftOrder(staged);
                            setAppliedDrafts((prev) => ({ ...prev, [idx]: true }));
                            // Auto-close assistant to avoid obscuring OrderFormModal
                            onToggle();
                          }}
                          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-strong text-white text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                          <Sparkles className="h-4 w-4 shrink-0" />
                          <span>
                            {isId
                              ? "Terapkan ke Form Surat Jalan (1-Click)"
                              : "Apply to Order Form"}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2.5 text-xs text-neutral-500 dark:text-neutral-400 p-2">
                <Compass className="h-5 w-5 text-brand dark:text-red-400 animate-spin" />
                <span className="italic font-medium">
                  {isId ? "Memproses pertanyaan..." : "Processing your question..."}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips (>=44px touch targets) */}
          <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(qp.prompt)}
                className="px-3.5 py-2.5 min-h-[44px] rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:border-brand hover:text-brand whitespace-nowrap active:scale-95 transition shadow-2xs focus:outline-none focus-visible:ring-1 focus-visible:ring-brand flex items-center"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input Bar (Auto-Expanding Multiline Textarea) */}
          <div className="p-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
                if (textareaRef.current) textareaRef.current.style.height = "auto";
              }}
              className="flex items-end gap-2"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputPrompt}
                onChange={(e) => {
                  setInputPrompt(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                    if (textareaRef.current) textareaRef.current.style.height = "auto";
                  }
                }}
                placeholder={
                  isId
                    ? "Tanyakan stok, draft DO, atau BOM... (Enter = kirim, Shift+Enter = baris baru)"
                    : "Ask stock, draft DO, or BOM... (Enter = send, Shift+Enter = newline)"
                }
                aria-label={isId ? "Pesan untuk Khatulistiwa AI" : "Message for Khatulistiwa AI"}
                className="flex-1 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-2.5 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none resize-none max-h-32"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || loading}
                aria-label={isId ? "Kirim Pesan" : "Send Message"}
                className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-brand hover:bg-brand-strong text-white shadow-md disabled:opacity-40 active:scale-95 transition shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </form>
          </div>

          {/* In-App Focus-Trapped Clear Chat Confirmation Modal (Backdrop dismiss & useModalSafety) */}
          {isConfirmClearOpen && (
            <div
              onClick={() => setIsConfirmClearOpen(false)}
              className="absolute inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            >
              <div
                ref={confirmModalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="clear-chat-title"
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-brand dark:text-red-400">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4
                      id="clear-chat-title"
                      className="font-extrabold text-sm text-neutral-900 dark:text-white"
                    >
                      {isId ? "Bersihkan Percakapan?" : "Clear Chat History?"}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {isId
                        ? "Seluruh riwayat chat dan draft yang belum disimpan akan dihapus."
                        : "All chat messages and unapplied drafts will be permanently cleared."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    ref={cancelClearRef}
                    type="button"
                    onClick={() => setIsConfirmClearOpen(false)}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                  >
                    {isId ? "Batal" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmClear}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-strong text-white text-xs font-bold shadow-md active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    {isId ? "Ya, Bersihkan" : "Yes, Clear"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

