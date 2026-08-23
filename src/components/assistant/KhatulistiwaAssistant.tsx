"use client";

import React, { useState, useRef, useEffect } from "react";
import { SUPPORTED_MODELS, AIModelOption, ChatMessage } from "@/lib/ai/types";
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
  Bot,
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
  const [isExpanded, setIsExpanded] = useState(false);
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
      {/* Floating Action Launcher Button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-20 md:bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-[#8B0000] hover:bg-[#A00000] text-white px-4.5 py-3.5 shadow-2xl hover:shadow-red-900/40 active:scale-95 transition-all duration-200 group border-2 border-red-400/40"
          title="Buka Khatulistiwa AI Floating Copilot"
        >
          <div className="relative">
            <Compass className="h-6 w-6 animate-spin-slow group-hover:rotate-45 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-extrabold tracking-wide leading-tight">Khatulistiwa AI</p>
            <p className="text-[10px] text-red-200 font-medium">Factory Copilot</p>
          </div>
        </button>
      )}

      {/* Spacious & Font-Conscious Floating Window Widget */}
      {isOpen && (
        <div
          className={`fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200 transition-all ${
            isExpanded
              ? "w-[calc(100vw-32px)] sm:w-[740px] md:w-[800px] h-[720px] max-h-[90vh]"
              : "w-[calc(100vw-32px)] sm:w-[520px] md:w-[560px] h-[640px] max-h-[86vh]"
          }`}
        >
          {/* Header */}
          <div className="p-4 bg-[#8B0000] text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 shadow-xs">
                <Compass className="h-5 w-5 text-white animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-2">
                  <span>Khatulistiwa AI</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider">
                    Copilot
                  </span>
                </h3>
                <p className="text-xs text-red-100 font-medium">
                  {isId ? "Asisten Operasional Pabrik Equator Insole" : "Equator Insole Factory Intelligence"}
                </p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:flex p-1.5 rounded-xl text-red-200 hover:text-white hover:bg-white/15 active:scale-95 transition"
                title={isExpanded ? (isId ? "Kecilkan Window" : "Contract") : isId ? "Perbesar Window" : "Expand"}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={handleClearHistory}
                className="p-1.5 rounded-xl text-red-200 hover:text-white hover:bg-white/15 active:scale-95 transition"
                title={isId ? "Bersihkan Chat" : "Clear Chat"}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-xl text-red-200 hover:text-white hover:bg-white/15 active:scale-95 transition"
                title={isId ? "Tutup Widget" : "Close"}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Model Selector Bar */}
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-[11px]">
              {isId ? "Mesin Model AI:" : "AI Model Engine:"}
            </span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:border-[#8B0000] focus:outline-none"
            >
              {SUPPORTED_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider})
                </option>
              ))}
            </select>
          </div>

          {/* Conversation Stream (Font-Conscious) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const staged = stagedDrafts[idx];
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1.5`}
                >
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 px-1 font-bold uppercase tracking-wider">
                    <span>{isUser ? (isId ? "Anda" : "You") : "Khatulistiwa AI"}</span>
                  </div>

                  <div
                    className={`p-4 rounded-3xl max-w-[92%] relative group transition-all leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-[#8B0000] text-white rounded-br-xs shadow-md font-medium text-xs sm:text-sm"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-xs border border-gray-200 dark:border-gray-700 text-xs sm:text-sm shadow-xs"
                    }`}
                  >
                    {msg.content}

                    {/* Copy Button */}
                    {!isUser && (
                      <button
                        onClick={() => handleCopyMessage(msg.content, idx)}
                        className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white dark:bg-gray-700 shadow-xs text-gray-500 hover:text-gray-900 transition active:scale-95"
                        title="Salin Pesan"
                      >
                        {copiedIndex === idx ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Staged Draft Action Card if AI generated an order draft */}
                  {staged && (
                    <div className="mt-2 w-full max-w-[92%] rounded-3xl border-2 border-emerald-300 dark:border-emerald-800 bg-emerald-50/90 dark:bg-emerald-950/50 p-4 space-y-2.5 shadow-sm animate-in zoom-in-95 duration-150">
                      <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold text-xs sm:text-sm">
                        <FileCheck2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{isId ? "Draft Surat Jalan Siap Diterapkan!" : "Structured DO Draft Ready!"}</span>
                      </div>
                      <div className="text-xs text-emerald-800 dark:text-emerald-200 space-y-0.5 font-medium">
                        <p>Penerima: <strong>{staged.recipient_name}</strong></p>
                        <p>Alamat: {staged.destination_address}</p>
                        <p>No. PO / SPK: {staged.po_number || "-"}</p>
                      </div>
                      <button
                        onClick={() => onApplyDraftOrder(staged)}
                        className="w-full py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md active:scale-95 transition flex items-center justify-center gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>{isId ? "Terapkan ke Form Surat Jalan (1-Click)" : "Apply to Order Form"}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2.5 text-xs text-gray-500 p-2">
                <Compass className="h-5 w-5 text-[#8B0000] animate-spin" />
                <span className="italic font-medium">
                  {isId ? "Khatulistiwa AI sedang menganalisis data pabrik..." : "Analyzing factory data..."}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/70 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qp.prompt)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:border-[#8B0000] hover:text-[#8B0000] whitespace-nowrap active:scale-95 transition shadow-2xs"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3.5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
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
                    ? "Tanyakan stok bahan, draft Surat Jalan, atau estimasi BOM..."
                    : "Ask about inventory stock, draft orders, or BOM..."
                }
                className="flex-1 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || loading}
                className="p-3 rounded-2xl bg-[#8B0000] hover:bg-[#A00000] text-white shadow-md disabled:opacity-40 active:scale-95 transition"
              >
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
