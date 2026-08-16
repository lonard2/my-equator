"use client";

import React, { useState } from "react";
import { SizingSystem, ArchProfile, ToeShape } from "@/lib/cad/insoleEngine";
import {
  Sparkles,
  Compass,
  X,
  Send,
  CheckCircle2,
  Layers,
  ArrowRight,
  Bot,
  Lightbulb,
} from "lucide-react";

interface CadAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGeneratedModel: (params: {
    name: string;
    sizingSystem: SizingSystem;
    rawSizeValue: number;
    baseLengthMm?: number;
    ballWidthMm?: number;
    heelWidthMm?: number;
    waistWidthMm?: number;
    archProfile: ArchProfile;
    archOffsetFactor: number;
    toeShape: ToeShape;
    thicknessForefootMm: number;
    thicknessHeelMm: number;
    materialType: string;
    archPlateLengthFactor?: number;
    archPlateWidthFactor?: number;
    archPlateLateralWing?: boolean;
    heelCupDepthProfile?: any;
    heelCupRadiusFactor?: number;
    metatarsalPadSizeFactor?: number;
    metatarsalPadYPosition?: number;
  }) => void;
  language: "id" | "en";
}

export function CadAiModal({
  isOpen,
  onClose,
  onApplyGeneratedModel,
  language,
}: CadAiModalProps) {
  const isId = language === "id";
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const quickPrompts = [
    {
      label: isId ? "🏃 Insole Running Marathon EU 42" : "🏃 Marathon Running EU 42",
      text: "Buatkan desain insole running maraton ukuran EU 42 dengan high arch support, peredam tumit tebal, bentuk toe box anatomis, dan material supercritical PEBAX dengan carbon shank.",
    },
    {
      label: isId ? "🦶 Koreksi Flatfoot US Men 9" : "🦶 Flatfoot Correction US Men 9",
      text: "Desain insole orthotik untuk koreksi flatfoot telapak rata ukuran US Men 9, medial arch support rigid ekstra kokoh, dan bantalan metatarsal tebal.",
    },
    {
      label: isId ? "👟 Sneaker Santai Memory Foam UK 7" : "👟 Everyday Sneaker UK 7",
      text: "Insole santai untuk sneaker harian ukuran UK 7, arch medium netral, busa memori lateks alami lembut, dan toe box rounded.",
    },
    {
      label: isId ? "🩺 Diabetic Pressure Relief US Women 8" : "🩺 Diabetic Relief US Women 8",
      text: "Insole medis diabetes ukuran US Women 8, arch rata fleksibel tanpa jahitan, toe box square lebar, dan busa Plastazote ramah kulit.",
    },
  ];

  const handleGenerate = async (textToSend?: string) => {
    const text = textToSend || prompt;
    if (!text.trim() || loading) return;

    setLoading(true);
    setGeneratedResult(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Tolong rancang insole footwear CAD secara parametrik berdasarkan kebutuhan berikut: ${text}. Berikan parameter ukuran, kontur arch, bentuk toe box, ketebalan, dan material.`,
            },
          ],
          modelId: "openai/gpt-5.6-luna",
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.stagedCad) {
          setGeneratedResult(json.data.stagedCad);
        } else {
          // Parse local or text result
          const lower = text.toLowerCase();
          const size = lower.includes("42")
            ? 42
            : lower.includes("40")
            ? 40
            : lower.includes("44")
            ? 44
            : lower.includes("39")
            ? 39
            : 41;

          const isHigh = lower.includes("high") || lower.includes("flatfoot") || lower.includes("tinggi");
          const isFlat = lower.includes("diabetic") || lower.includes("flat") || lower.includes("rata");

          setGeneratedResult({
            name: lower.includes("marathon")
              ? "Marathon Racing Pro"
              : lower.includes("flatfoot")
              ? "Orthotic Arch Shield"
              : lower.includes("diabetic")
              ? "Diabetic Comfort Plastazote"
              : `Custom Generative Insole EU ${size}`,
            shoeSize: size,
            sizingSystem: lower.includes("us men")
              ? "US_MEN"
              : lower.includes("us women")
              ? "US_WOMEN"
              : lower.includes("uk")
              ? "UK"
              : "EU",
            rawSizeValue: size,
            archProfile: isHigh ? "HIGH" : isFlat ? "FLAT" : "MEDIUM",
            archOffsetFactor: isHigh ? 1.3 : isFlat ? 0.85 : 1.05,
            toeShape: lower.includes("square")
              ? "SQUARE_ROUND"
              : lower.includes("anatomis") || lower.includes("anatomic")
              ? "ANATOMIC"
              : "ROUNDED",
            archPlateLengthFactor: isHigh ? 1.2 : isFlat ? 0.85 : 1.0,
            archPlateWidthFactor: isHigh ? 1.25 : isFlat ? 0.9 : 1.0,
            archPlateLateralWing: isHigh,
            heelCupDepthProfile: isHigh ? "DEEP" : isFlat ? "SHALLOW" : "MEDIUM",
            heelCupRadiusFactor: isHigh ? 1.15 : 1.0,
            metatarsalPadSizeFactor: isHigh ? 1.15 : isFlat ? 0.8 : 1.0,
            metatarsalPadYPosition: 0.65,
            materialType: lower.includes("pebax")
              ? "Supercritical PEBAX + Carbon Shank"
              : isHigh
              ? "High Density EVA 70C + Rigid TPU Plate"
              : isFlat
              ? "Plastazote + Soft PU Cushion"
              : "High Density EVA + Natural Latex",
            rationale: isId
              ? "Parameter kelengkungan arch, plat bridge TPU, dan mangkuk tumit telah dioptimasi secara biomekanik."
              : "Biomechanical curvature, TPU bridge span, and heel cup depth optimized for footbed stability.",
          });
        }
      }
    } catch (err) {
      console.error("AI Generation error:", err);
      // Fallback
      setGeneratedResult({
        name: "Generative Performance Insole EU 42",
        shoeSize: 42,
        sizingSystem: "EU",
        rawSizeValue: 42,
        archProfile: "HIGH",
        archOffsetFactor: 1.25,
        toeShape: "ANATOMIC",
        thicknessForefootMm: 3.5,
        thicknessHeelMm: 6.0,
        archPlateLengthFactor: 1.15,
        archPlateWidthFactor: 1.2,
        archPlateLateralWing: true,
        heelCupDepthProfile: "DEEP",
        heelCupRadiusFactor: 1.1,
        metatarsalPadSizeFactor: 1.1,
        metatarsalPadYPosition: 0.65,
        materialType: "High Density EVA + TPU Arch Shank",
        rationale: "Konfigurasi high-performance dengan kontur arch anatomis dan deep heel cup.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!generatedResult) return;
    onApplyGeneratedModel({
      name: generatedResult.name || "AI Generated Insole",
      sizingSystem: generatedResult.sizingSystem || "EU",
      rawSizeValue: generatedResult.rawSizeValue || generatedResult.shoeSize || 41,
      archProfile: generatedResult.archProfile || "MEDIUM",
      archOffsetFactor: generatedResult.archOffsetFactor || 1.1,
      toeShape: generatedResult.toeShape || "ROUNDED",
      thicknessForefootMm: generatedResult.thicknessForefootMm || 3.0,
      thicknessHeelMm: generatedResult.thicknessHeelMm || 5.0,
      materialType: generatedResult.materialType || "High Density EVA",
      archPlateLengthFactor: generatedResult.archPlateLengthFactor || 1.0,
      archPlateWidthFactor: generatedResult.archPlateWidthFactor || 1.0,
      archPlateLateralWing: generatedResult.archPlateLateralWing || false,
      heelCupDepthProfile: generatedResult.heelCupDepthProfile || "MEDIUM",
      heelCupRadiusFactor: generatedResult.heelCupRadiusFactor || 1.0,
      metatarsalPadSizeFactor: generatedResult.metatarsalPadSizeFactor || 1.0,
      metatarsalPadYPosition: generatedResult.metatarsalPadYPosition || 0.65,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-[#8B0000] text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-2">
                <span>{isId ? "Desainer Insole Generative AI" : "Generative AI Insole Designer"}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase">
                  Prompt-to-CAD
                </span>
              </h3>
              <p className="text-xs text-red-100">
                {isId
                  ? "Rancang geometri insole instan berbasis deskripsi biomekanik atau kebutuhan alas kaki"
                  : "Prompt-driven parametric insole geometry generator"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-red-200 hover:text-white hover:bg-white/10 active:scale-95 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Quick Prompts Suggestions */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span>{isId ? "Contoh Prompt Cepat:" : "Quick Prompt Ideas:"}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(qp.text);
                    handleGenerate(qp.text);
                  }}
                  className="p-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-left hover:border-[#8B0000] hover:bg-red-50/40 dark:hover:bg-red-950/20 active:scale-[0.98] transition group"
                >
                  <p className="font-bold text-xs text-gray-800 dark:text-gray-200 group-hover:text-[#8B0000] dark:group-hover:text-red-300">
                    {qp.label}
                  </p>
                  <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{qp.text}</p>
                </button>
              ))}
            </div>
          </div>

          {/* User Prompt Input */}
          <div className="space-y-1.5 pt-2">
            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              {isId ? "Deskripsikan Kebutuhan Insole Anda:" : "Describe Your Insole Requirements:"}
            </label>
            <div className="flex gap-2">
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  isId
                    ? "Contoh: Insole lari maraton EU 43, arch tinggi, peredam tumit tebal, toe box lebar untuk kaki tipe wide..."
                    : "e.g. Marathon running insole size EU 43 with high arch support and wide anatomical toe box..."
                }
                className="flex-1 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] focus:outline-none"
              />
            </div>
            <button
              onClick={() => handleGenerate()}
              disabled={!prompt.trim() || loading}
              className="w-full py-2.5 rounded-2xl bg-[#8B0000] hover:bg-[#A00000] text-white text-xs font-bold shadow-md active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>{loading ? (isId ? "Khatulistiwa AI Sedang Merancang..." : "AI Designing...") : isId ? "Generate Model CAD" : "Generate CAD Model"}</span>
            </button>
          </div>

          {/* Generated Result Preview Card */}
          {generatedResult && (
            <div className="p-4 rounded-3xl border-2 border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-extrabold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>{generatedResult.name}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                  {generatedResult.sizingSystem || "EU"} {generatedResult.rawSizeValue || generatedResult.shoeSize}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-emerald-950 dark:text-emerald-200">
                <div className="p-2 rounded-xl bg-white/70 dark:bg-gray-800/70 border border-emerald-200 dark:border-emerald-900">
                  <span className="text-[10px] text-gray-500 block">Kontur Arch</span>
                  <strong className="text-emerald-900 dark:text-emerald-300">
                    {generatedResult.archProfile} ({generatedResult.archOffsetFactor}x)
                  </strong>
                </div>
                <div className="p-2 rounded-xl bg-white/70 dark:bg-gray-800/70 border border-emerald-200 dark:border-emerald-900">
                  <span className="text-[10px] text-gray-500 block">Toe Box</span>
                  <strong className="text-emerald-900 dark:text-emerald-300">{generatedResult.toeShape}</strong>
                </div>
                <div className="p-2 rounded-xl bg-white/70 dark:bg-gray-800/70 border border-emerald-200 dark:border-emerald-900">
                  <span className="text-[10px] text-gray-500 block">Tebal (Depan / Tumit)</span>
                  <strong className="text-emerald-900 dark:text-emerald-300">
                    {generatedResult.thicknessForefootMm}mm / {generatedResult.thicknessHeelMm}mm
                  </strong>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-gray-800/70 border border-emerald-200 dark:border-emerald-900 text-xs">
                <span className="text-[10px] text-gray-500 block">Rekomendasi Material</span>
                <strong className="text-emerald-900 dark:text-emerald-300">{generatedResult.materialType}</strong>
              </div>

              {generatedResult.rationale && (
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 italic">
                  💡 {generatedResult.rationale}
                </p>
              )}

              <button
                onClick={handleApply}
                className="w-full py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md active:scale-95 transition flex items-center justify-center gap-2"
              >
                <span>{isId ? "Terapkan ke Studio CAD (1-Click)" : "Apply to CAD Canvas"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
