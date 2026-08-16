"use client";

import React, { useState, useRef, useEffect } from "react";
import { SUPPORTED_MODELS, AIModelOption, ChatMessage } from "@/lib/ai/types";
import {
  Bot,
  Compass,
  X,
  Send,
  Sparkles,
  RefreshCw,
  FileCheck2,
  Boxes,
  Calculator,
  ChevronDown,
  Trash2,
  Maximize2,
  Minimize2,
  Copy,
  Check,
} from "lucide-react";

interface KhatulistiwaAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  onApplyDraftOrder: (draftData: any) => void;
  language: "id" | "en";
}

export function KhatulistiwaAssistant({
  isOpen,
  onToggle,
  onApplyDraftOrder,
  language,
}: KhatulistiwaAssistantProps) {
  const isId = language === "id";
  const [selectedModel, setSelectedModel] = useState<string>("google/gemini-3.5-flash-lite");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: isId
        ? "Halo! Saya **Khatulistiwa AI**, asisten operasional Equator Insole Bandung. Ada yang bisa saya bantu terkait Surat Jalan, stok bahan baku, atau kalkulasi kebutuhan produksi hari ini?"
        : "Hello! I am **Khatulistiwa AI**, the operational assistant for Equator Insole Bandung. How can I help you with delivery orders, inventory, or production BOM calculations today?",
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [stagedDrafts, setStagedDrafts] = useState<Record<number, any>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    {
      label: isId ? "📦 Cek Saldo Stok Bahan" : "📦 Check Inventory",
      prompt: isId
        ? "Tolong berikan status saldo stok bahan baku terkini di gudang, terutama yang berada di bawah safety threshold."
        : "Please give me the latest stock balance of raw materials in the warehouse, especially those below safety thresholds.",
    },
    {
      label: isId ? "📄 Buat Draft Surat Jalan" : "📄 Draft Delivery Order",
      prompt: isId
        ? "Buatkan draft surat jalan untuk PT KMK GLOBAL SPORTS di Tangerang, 300 pasang insole sport (size 39: 60, 40: 80, 41: 80, 42: 80), PO-KMK-889, kirim besok."
        : "Draft a delivery order for PT KMK GLOBAL SPORTS in Tangerang, 300 pairs of sport insoles (size 39: 60, 40: 80, 41: 80, 42: 80), PO-KMK-889, shipping tomorrow.",
    },
    {
      label: isId ? "📊 Hitung Kebutuhan Bahan (BOM)" : "📊 Calculate BOM",
      prompt: isId
        ? "Hitung estimasi kebutuhan lembaran EVA foam dan kain BK mesh untuk produksi 500 pasang insole model Ortho Sport."
        : "Calculate the estimated BOM of EVA foam sheets and BK mesh fabric for producing 500 pairs of Ortho Sport insoles.",
    },
    {
      label: isId ? "📈 Ringkasan Bisnis & DO" : "📈 Business Summary",
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
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isId
            ? "Maaf, terjadi kendala saat menghubungkan ke gateway AI. Menggunakan respons lokal cadangan pabrik."
            : "Sorry, an error occurred while connecting to the AI gateway.",
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

  const handleClearHistory = () => {
    setMessages([
      {
        role: "assistant",
        content: isId
          ? "Riwayat percakapan telah dibersihkan. Ada yang ingin Anda tanyakan seputar pabrik Equator Insole?"
          : "Chat history cleared. How can I assist you with Equator Insole factory operations?",
      },
    ]);
    setStagedDrafts({});
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-20 md:bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-[#8B0000] hover:bg-[#A00000] text-white px-4 py-3 shadow-2xl hover:shadow-red-900/40 active:scale-95 transition-all duration-200 group border-2 border-red-400/40"
          title="Khatulistiwa AI Assistant"
        >
          <div className="relative">
            <Compass className="h-5 w-5 animate-spin-slow group-hover:rotate-45 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
          </div>
          <span className="text-xs font-extrabold tracking-wide hidden sm:inline">Khatulistiwa AI</span>
        </button>
      )}

      {/* Slide-out Assistant Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 bg-[#8B0000] text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20">
                <Compass className="h-5 w-5 text-white animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-wide flex items-center gap-1.5">
                  <span>Khatulistiwa AI</span>
                  <span className="px-1.5 py-0.2 rounded bg-white/20 text-[9px] font-semibold uppercase">
                    Factory Agent
                  </span>
                </h3>
                <p className="text-[11px] text-red-100">Equator Insole Bandung Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg text-red-200 hover:text-white hover:bg-white/10 active:scale-95 transition"
                title="Bersihkan Percakapan"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg text-red-200 hover:text-white hover:bg-white/10 active:scale-95 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Model Selector Bar */}
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2 text-xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {isId ? "Mesin AI:" : "AI Model:"}
            </span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:border-[#8B0000] focus:outline-none"
            >
              {SUPPORTED_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider})
                </option>
              ))}
            </select>
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const staged = stagedDrafts[idx];
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 px-1 font-semibold">
                    <span>{isUser ? (isId ? "Anda" : "You") : "Khatulistiwa AI"}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl max-w-[90%] relative group transition-all leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-[#8B0000] text-white rounded-br-xs shadow-xs font-medium"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-xs border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {msg.content}

                    {/* Copy Button */}
                    {!isUser && (
                      <button
                        onClick={() => handleCopyMessage(msg.content, idx)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-white dark:bg-gray-700 shadow-xs text-gray-500 hover:text-gray-900 transition"
                        title="Salin Pesan"
                      >
                        {copiedIndex === idx ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Staged Draft Action Card if AI generated an order draft */}
                  {staged && (
                    <div className="mt-2 w-full max-w-[90%] rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-3 space-y-2 shadow-xs animate-in zoom-in-95 duration-150">
                      <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold text-xs">
                        <FileCheck2 className="h-4 w-4 text-emerald-600" />
                        <span>{isId ? "Draft Surat Jalan Terstruktur Siap!" : "Structured DO Draft Ready!"}</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-200">
                        Penerima: <strong>{staged.recipient_name}</strong> • PO: {staged.po_number || "-"}
                      </p>
                      <button
                        onClick={() => onApplyDraftOrder(staged)}
                        className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95 transition flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{isId ? "Terapkan ke Form Surat Jalan (1-Click)" : "Apply to Order Form"}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 p-2">
                <Compass className="h-4 w-4 text-[#8B0000] animate-spin" />
                <span className="italic">{isId ? "Khatulistiwa AI sedang memproses..." : "Processing factory query..."}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qp.prompt)}
                className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:border-[#8B0000] hover:text-[#8B0000] whitespace-nowrap active:scale-95 transition"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={
                  isId
                    ? "Tanyakan stok, buat draft DO, atau kalkulasi bahan..."
                    : "Ask about inventory, draft orders, or BOM..."
                }
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || loading}
                className="p-2.5 rounded-xl bg-[#8B0000] hover:bg-[#A00000] text-white shadow-md disabled:opacity-40 active:scale-95 transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
