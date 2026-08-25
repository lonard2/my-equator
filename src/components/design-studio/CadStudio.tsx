"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  buildInsoleGeometry,
  calculateInsoleLength,
  calculateDefaultWidths,
  convertSizing,
  calculatePerimeterLength,
  INSOLE_PRESETS,
  InsoleParameters,
  SizingSystem,
  ArchProfile,
  HeelCupDepthProfile,
  FootType,
  ToeShape,
  InsoleGeometry,
} from "@/lib/cad/insoleEngine";
import {
  Compass,
  Download,
  Save,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Sparkles,
  FolderOpen,
  Share2,
  Info,
  Sliders,
  Globe2,
  PanelRightClose,
  PanelRightOpen,
  Wrench,
  Shield,
  Eye,
  SlidersHorizontal,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  X,
  Printer,
  Cpu,
  Scissors,
  Check,
  HelpCircle,
  Clock,
  Trash2,
  Keyboard,
} from "lucide-react";
import { CadAiModal } from "./CadAiModal";

interface CadStudioProps {
  language: "id" | "en";
}

type MobileCadView = "CANVAS" | "PARAMETERS" | "ORTHOTICS" | "EXPORT";

export function CadStudio({ language }: CadStudioProps) {
  const isId = language === "id";

  // Mobile Active View Mode Tab
  const [mobileCadView, setMobileCadView] = useState<MobileCadView>("CANVAS");

  // Sizing System & Values
  const [sizingSystem, setSizingSystem] = useState<SizingSystem>("EU");
  const [rawSizeValue, setRawSizeValue] = useState<number>(41);
  const [customLengthMm, setCustomLengthMm] = useState<number>(266.7);

  // Insole Geometry Parameters
  const [foot, setFoot] = useState<FootType>("RIGHT");
  const [archProfile, setArchProfile] = useState<ArchProfile>("MEDIUM");
  const [archFactor, setArchFactor] = useState<number>(1.0);
  const [toeShape, setToeShape] = useState<ToeShape>("ROUNDED");
  const [ballWidth, setBallWidth] = useState<number>(96);
  const [heelWidth, setHeelWidth] = useState<number>(67);
  const [waistWidth, setWaistWidth] = useState<number>(58.7);
  const [forefootThickness, setForefootThickness] = useState<number>(3.0);
  const [heelThickness, setHeelThickness] = useState<number>(5.0);
  const [materialType, setMaterialType] = useState<string>("High Density EVA 65C");
  const [blueprintName, setBlueprintName] = useState<string>("Anatomical Insole Model");

  // Customizable Orthotic Component Layers
  const [archPlateLength, setArchPlateLength] = useState<number>(1.0);
  const [archPlateWidth, setArchPlateWidth] = useState<number>(1.0);
  const [archPlateLateralWing, setArchPlateLateralWing] = useState<boolean>(false);
  const [heelCupDepth, setHeelCupDepth] = useState<HeelCupDepthProfile>("MEDIUM");
  const [heelCupRadius, setHeelCupRadius] = useState<number>(1.0);
  const [metatarsalSize, setMetatarsalSize] = useState<number>(1.0);
  const [metatarsalYPos, setMetatarsalYPos] = useState<number>(0.65);

  // Layer Visibility Controls
  const [showOutline, setShowOutline] = useState(true);
  const [showArchPlate, setShowArchPlate] = useState(true);
  const [showHeelCup, setShowHeelCup] = useState(true);
  const [showMetatarsal, setShowMetatarsal] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Viewport Zoom & Pan (Touch + Mouse Pointer Events)
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Modals & Feedback States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [savedBlueprints, setSavedBlueprints] = useState<any[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<"COMPONENTS" | "LAYERS" | "SPECS">("COMPONENTS");
  const [isCncPreFlightOpen, setIsCncPreFlightOpen] = useState(false);
  const [exporting, setExporting] = useState<"DXF" | "SVG" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Recalculate derived dimensions when sizing changes
  useEffect(() => {
    const conversion = convertSizing(sizingSystem, rawSizeValue);
    const targetLength = sizingSystem === "CUSTOM_MM" ? customLengthMm : conversion.insoleLengthMm;
    const defaults = calculateDefaultWidths(targetLength);
    setBallWidth(defaults.ballWidth);
    setHeelWidth(defaults.heelWidth);
    setWaistWidth(defaults.waistWidth);
  }, [sizingSystem, rawSizeValue, customLengthMm]);

  // Fetch Blueprints
  const fetchBlueprints = async () => {
    try {
      const res = await fetch("/api/cad/blueprints");
      const json = await res.json();
      if (json.success) setSavedBlueprints(json.data || []);
    } catch (err) {
      console.error("Failed to load blueprints:", err);
    }
  };

  useEffect(() => {
    fetchBlueprints();
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveBlueprint();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoomScale((z) => Math.min(2.5, z + 0.15));
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setZoomScale((z) => Math.max(0.5, z - 0.15));
      } else if (e.key === "0") {
        e.preventDefault();
        setZoomScale(1.0);
        setPanOffset({ x: 0, y: 0 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [blueprintName, sizingSystem, rawSizeValue, customLengthMm, foot, archProfile, archFactor, toeShape, ballWidth, heelWidth, waistWidth, forefootThickness, heelThickness, materialType, archPlateLength, archPlateWidth, archPlateLateralWing, heelCupDepth, heelCupRadius, metatarsalSize, metatarsalYPos]);

  // Compute Active Sizing Conversion
  const conversion = convertSizing(sizingSystem, rawSizeValue);
  const effectiveLength = sizingSystem === "CUSTOM_MM" ? customLengthMm : conversion.insoleLengthMm;

  // Build Insole Geometry
  const geometryParams: InsoleParameters = {
    shoeSize: conversion.eu,
    sizingSystem,
    rawSizeValue,
    baseLengthMm: effectiveLength,
    archProfile,
    archOffsetFactor: archFactor,
    toeShape,
    ballWidthMm: ballWidth,
    heelWidthMm: heelWidth,
    waistWidthMm: waistWidth,
    thicknessForefootMm: forefootThickness,
    thicknessHeelMm: heelThickness,
    materialType,
    archPlateLengthFactor: archPlateLength,
    archPlateWidthFactor: archPlateWidth,
    archPlateLateralWing,
    heelCupDepthProfile: heelCupDepth,
    heelCupRadiusFactor: heelCupRadius,
    metatarsalPadSizeFactor: metatarsalSize,
    metatarsalPadYPosition: metatarsalYPos,
  };

  const geometry: InsoleGeometry = buildInsoleGeometry(geometryParams);

  // Apply Preset
  const handleApplyPreset = (preset: typeof INSOLE_PRESETS[0]) => {
    setArchProfile(preset.archProfile);
    setArchFactor(preset.archOffsetFactor);
    setToeShape(preset.toeShape);
    setForefootThickness(preset.thicknessForefootMm);
    setHeelThickness(preset.thicknessHeelMm);
    setMaterialType(preset.materialType);
    setBlueprintName(preset.name);
    if (preset.archPlateLengthFactor) setArchPlateLength(preset.archPlateLengthFactor);
    if (preset.archPlateWidthFactor) setArchPlateWidth(preset.archPlateWidthFactor);
    if (preset.archPlateLateralWing !== undefined) setArchPlateLateralWing(preset.archPlateLateralWing);
    if (preset.heelCupDepthProfile) setHeelCupDepth(preset.heelCupDepthProfile);
    if (preset.heelCupRadiusFactor) setHeelCupRadius(preset.heelCupRadiusFactor);
    if (preset.metatarsalPadSizeFactor) setMetatarsalSize(preset.metatarsalPadSizeFactor);
    if (preset.metatarsalPadYPosition) setMetatarsalYPos(preset.metatarsalPadYPosition);
    showToast(isId ? `Preset "${preset.name}" diterapkan` : `Preset "${preset.name}" applied`);
  };

  // Load Saved Blueprint
  const handleLoadSavedBlueprint = (bp: any) => {
    if (bp.name) setBlueprintName(bp.name);
    if (bp.sizingSystem) setSizingSystem(bp.sizingSystem);
    if (bp.rawSizeValue) setRawSizeValue(bp.rawSizeValue);
    if (bp.customLengthMm) setCustomLengthMm(bp.customLengthMm);
    if (bp.foot) setFoot(bp.foot);
    if (bp.archProfile) setArchProfile(bp.archProfile);
    if (bp.archFactor) setArchFactor(bp.archFactor);
    if (bp.toeShape) setToeShape(bp.toeShape);
    if (bp.ballWidthMm) setBallWidth(bp.ballWidthMm);
    if (bp.heelWidthMm) setHeelWidth(bp.heelWidthMm);
    if (bp.waistWidthMm) setWaistWidth(bp.waistWidthMm);
    if (bp.thicknessForefootMm) setForefootThickness(bp.thicknessForefootMm);
    if (bp.thicknessHeelMm) setHeelThickness(bp.thicknessHeelMm);
    if (bp.materialType) setMaterialType(bp.materialType);
    if (bp.archPlateLengthFactor) setArchPlateLength(bp.archPlateLengthFactor);
    if (bp.archPlateWidthFactor) setArchPlateWidth(bp.archPlateWidthFactor);
    if (bp.archPlateLateralWing !== undefined) setArchPlateLateralWing(bp.archPlateLateralWing);
    if (bp.heelCupDepth) setHeelCupDepth(bp.heelCupDepth);
    if (bp.heelCupRadiusFactor) setHeelCupRadius(bp.heelCupRadiusFactor);
    if (bp.metatarsalPadSizeFactor) setMetatarsalSize(bp.metatarsalPadSizeFactor);
    if (bp.metatarsalPadYPosition) setMetatarsalYPos(bp.metatarsalPadYPosition);
    setIsLibraryOpen(false);
    showToast(isId ? `Blueprint "${bp.name}" berhasil dimuat` : `Blueprint "${bp.name}" loaded`);
  };

  // Apply Generative AI Insole Parameters
  const handleApplyAiGeneration = (aiData: any) => {
    if (aiData.archProfile) setArchProfile(aiData.archProfile);
    if (aiData.archFactor) setArchFactor(aiData.archFactor);
    if (aiData.toeShape) setToeShape(aiData.toeShape);
    if (aiData.forefootThickness) setForefootThickness(aiData.forefootThickness);
    if (aiData.heelThickness) setHeelThickness(aiData.heelThickness);
    if (aiData.materialType) setMaterialType(aiData.materialType);
    if (aiData.name) setBlueprintName(aiData.name);
    if (aiData.archPlateLengthFactor) setArchPlateLength(aiData.archPlateLengthFactor);
    if (aiData.archPlateWidthFactor) setArchPlateWidth(aiData.archPlateWidthFactor);
    if (aiData.archPlateLateralWing !== undefined) setArchPlateLateralWing(aiData.archPlateLateralWing);
    if (aiData.heelCupDepth) setHeelCupDepth(aiData.heelCupDepth);
    if (aiData.metatarsalPadSizeFactor) setMetatarsalSize(aiData.metatarsalPadSizeFactor);
    setMobileCadView("CANVAS");
    showToast(isId ? "Desain AI berhasil diintegrasikan ke canvas CAD" : "AI Insole design loaded into CAD canvas");
  };

  // Export DXF (AutoCAD R12 / CorelDRAW)
  const handleExportDxf = async () => {
    try {
      setExporting("DXF");
      const res = await fetch("/api/cad/export-dxf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: geometry.size,
          sizingSystem,
          rawSizeValue,
          customLengthMm: sizingSystem === "CUSTOM_MM" ? customLengthMm : undefined,
          foot,
          archProfile,
          archFactor,
          toeShape,
          ballWidthMm: ballWidth,
          heelWidthMm: heelWidth,
          waistWidthMm: waistWidth,
          thicknessForefootMm: forefootThickness,
          thicknessHeelMm: heelThickness,
          materialType,
          archPlateLengthFactor: archPlateLength,
          archPlateWidthFactor: archPlateWidth,
          archPlateLateralWing,
          heelCupDepth,
          heelCupRadiusFactor: heelCupRadius,
          metatarsalPadSizeFactor: metatarsalSize,
          metatarsalPadYPosition: metatarsalYPos,
        }),
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Equator_Insole_${geometry.sizingLabel.replace(/\s+/g, "_")}_${foot}_R12.dxf`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast(isId ? "File AutoCAD R12 DXF berhasil diunduh" : "AutoCAD R12 DXF file downloaded");
    } catch (err) {
      console.error("DXF export failed:", err);
      showToast(isId ? "Gagal mengekspor file DXF." : "Failed to export DXF file.");
    } finally {
      setExporting(null);
    }
  };

  // Export SVG
  const handleExportSvg = async () => {
    try {
      setExporting("SVG");
      const res = await fetch("/api/cad/export-svg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: geometry.size,
          sizingSystem,
          rawSizeValue,
          customLengthMm: sizingSystem === "CUSTOM_MM" ? customLengthMm : undefined,
          foot,
          archProfile,
          archFactor,
          toeShape,
          ballWidthMm: ballWidth,
          heelWidthMm: heelWidth,
          waistWidthMm: waistWidth,
          thicknessForefootMm: forefootThickness,
          thicknessHeelMm: heelThickness,
          materialType,
          archPlateLengthFactor: archPlateLength,
          archPlateWidthFactor: archPlateWidth,
          archPlateLateralWing,
          heelCupDepth,
          heelCupRadiusFactor: heelCupRadius,
          metatarsalPadSizeFactor: metatarsalSize,
          metatarsalPadYPosition: metatarsalYPos,
        }),
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Equator_Insole_${geometry.sizingLabel.replace(/\s+/g, "_")}_${foot}.svg`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast(isId ? "File Vector SVG berhasil diunduh" : "Vector SVG file downloaded");
    } catch (err) {
      console.error("SVG export failed:", err);
      showToast(isId ? "Gagal mengekspor file SVG." : "Failed to export SVG file.");
    } finally {
      setExporting(null);
    }
  };

  // Save Blueprint to Database
  const handleSaveBlueprint = async () => {
    try {
      const res = await fetch("/api/cad/blueprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: blueprintName,
          articleCode: `EQ-CAD-${geometry.size}-${Date.now().toString().slice(-4)}`,
          sizingSystem,
          rawSizeValue,
          customLengthMm: sizingSystem === "CUSTOM_MM" ? customLengthMm : undefined,
          foot,
          archProfile,
          archFactor,
          toeShape,
          ballWidthMm: ballWidth,
          heelWidthMm: heelWidth,
          waistWidthMm: waistWidth,
          thicknessForefootMm: forefootThickness,
          thicknessHeelMm: heelThickness,
          materialType,
          archPlateLengthFactor: archPlateLength,
          archPlateWidthFactor: archPlateWidth,
          archPlateLateralWing,
          heelCupDepth,
          heelCupRadiusFactor: heelCupRadius,
          metatarsalPadSizeFactor: metatarsalSize,
          metatarsalPadYPosition: metatarsalYPos,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(isId ? "Blueprint CAD berhasil disimpan ke database!" : "CAD Blueprint saved to database!");
        fetchBlueprints();
      } else {
        showToast(json.error || (isId ? "Gagal menyimpan blueprint." : "Failed to save blueprint."));
      }
    } catch (err) {
      console.error("Failed to save blueprint:", err);
      showToast(isId ? "Terjadi kesalahan saat menyimpan blueprint." : "Error saving blueprint.");
    }
  };

  // Unified Pointer Handlers for Mouse & Touch Panning
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsPanning(true);
    setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsPanning(false);
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture?.(e.pointerId);
    } catch (_) {}
  };

  // Calculations for Pre-Flight & Yields
  const singlePerimeter = calculatePerimeterLength(
    foot === "LEFT" ? geometry.outlinePointsLeft : geometry.outlinePointsRight
  );
  const totalPerimeter = foot === "PAIR" ? singlePerimeter * 2 : singlePerimeter;
  const pairGap = 25;
  const singleW = geometry.bounds.width;
  const totalW = foot === "PAIR" ? singleW * 2 + pairGap : singleW;
  const totalH = geometry.bounds.height;

  // Viewport dimensions
  const vbW = totalW;
  const vbH = totalH;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-950 text-gray-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-60 px-4 py-2.5 rounded-2xl bg-gray-900 text-white border border-gray-700 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="p-3 sm:p-4 border-b border-gray-800 bg-gray-900/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-[#8B0000]/20 text-[#8B0000] dark:text-red-400 border border-[#8B0000]/30 shrink-0">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                {isId ? "Insole CAD & Generative Design Studio" : "Insole CAD & Design Studio"}
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-red-950/80 text-red-400 border border-red-900/60 font-mono text-[10px] font-bold">
                R12 DXF
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {isId
                ? "Parametric vector shoe insole curve generator & CorelDRAW compatible die exporter"
                : "Vector insole curve generator with AutoCAD R12 DXF stream export for CNC & laser cutting"}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-bold active:scale-95 transition"
            title={isId ? "Buka Arsip Blueprint Tersimpan" : "Open Saved Blueprint Archive"}
          >
            <FolderOpen className="h-4 w-4 text-amber-400" />
            <span>{isId ? "Arsip CAD" : "Library"}</span>
            {savedBlueprints.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-900 text-red-200 text-[10px] font-mono">
                {savedBlueprints.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-2xl bg-gradient-to-r from-red-800 to-[#8B0000] hover:from-red-700 hover:to-red-900 text-white text-xs font-bold shadow-lg shadow-red-950/50 active:scale-95 transition"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>{isId ? "AI Generative Model" : "AI Generative Model"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCncPreFlightOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95 transition"
          >
            <Scissors className="h-4 w-4" />
            <span>{isId ? "Verifikasi & Ekspor CNC" : "CNC Pre-Flight & Export"}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveBlueprint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-bold active:scale-95 transition"
            title="Ctrl+S / Cmd+S"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">{isId ? "Simpan" : "Save"}</span>
          </button>
        </div>
      </div>

      {/* Mobile Mode Switcher Bar (md:hidden) */}
      <div className="md:hidden p-2 border-b border-gray-800 bg-gray-900 flex items-center justify-between text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileCadView("CANVAS")}
          className={`flex-1 py-2 rounded-xl text-center transition ${
            mobileCadView === "CANVAS" ? "bg-[#8B0000] text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          {isId ? "1. Canvas" : "1. Canvas"}
        </button>
        <button
          type="button"
          onClick={() => setMobileCadView("PARAMETERS")}
          className={`flex-1 py-2 rounded-xl text-center transition ${
            mobileCadView === "PARAMETERS" ? "bg-[#8B0000] text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          {isId ? "2. Ukuran" : "2. Sizing"}
        </button>
        <button
          type="button"
          onClick={() => setMobileCadView("ORTHOTICS")}
          className={`flex-1 py-2 rounded-xl text-center transition ${
            mobileCadView === "ORTHOTICS" ? "bg-[#8B0000] text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          {isId ? "3. Ortotik" : "3. Orthotics"}
        </button>
        <button
          type="button"
          onClick={() => setMobileCadView("EXPORT")}
          className={`flex-1 py-2 rounded-xl text-center transition ${
            mobileCadView === "EXPORT" ? "bg-[#8B0000] text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          {isId ? "4. Ekspor" : "4. Export"}
        </button>
      </div>

      {/* Main CAD Studio Body Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Sizing, Presets, and Caliper Parameters */}
        <div
          className={`w-full md:w-80 lg:w-88 border-r border-gray-800 bg-gray-900/95 overflow-y-auto p-4 space-y-4 text-xs ${
            mobileCadView === "PARAMETERS" ? "block" : "hidden md:block"
          }`}
        >
          {/* Blueprint Name Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400">
              {isId ? "Nama Model / Artikel CAD" : "CAD Model / Article Name"}
            </label>
            <input
              type="text"
              value={blueprintName}
              onChange={(e) => setBlueprintName(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-1.5 text-white font-bold text-xs focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] focus:outline-none"
              placeholder="e.g. Ergonomic Running Insole"
            />
          </div>

          {/* Sizing Standard Selector */}
          <div className="p-3.5 rounded-2xl bg-gray-800/60 border border-gray-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-gray-400">
                {isId ? "Sistem Standar Ukuran" : "Sizing Standard System"}
              </span>
              <span className="font-mono text-[10px] text-red-400 font-bold">{geometry.sizingLabel}</span>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {(["EU", "US_MEN", "US_WOMEN", "UK", "MONDOPOINT_CM", "CUSTOM_MM"] as SizingSystem[]).map((sys) => (
                <button
                  key={sys}
                  type="button"
                  onClick={() => setSizingSystem(sys)}
                  className={`py-1.5 rounded-lg text-[10px] font-bold border transition ${
                    sizingSystem === sys
                      ? "bg-[#8B0000] text-white border-[#8B0000]"
                      : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
                  }`}
                >
                  {sys.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* Size Slider or Custom Input */}
            {sizingSystem === "CUSTOM_MM" ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">
                  {isId ? "Panjang Kustom (mm)" : "Custom Length (mm)"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={180}
                  max={340}
                  value={customLengthMm}
                  onChange={(e) => setCustomLengthMm(parseFloat(e.target.value) || 260)}
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-1.5 font-mono font-bold text-white text-xs focus:border-[#8B0000] focus:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-gray-400">
                    {isId ? "Ukuran Sepatu" : "Shoe Size"}
                  </span>
                  <span className="font-mono font-black text-sm text-white">{rawSizeValue}</span>
                </div>
                <input
                  type="range"
                  min={sizingSystem === "EU" ? 35 : sizingSystem === "MONDOPOINT_CM" ? 22 : 4}
                  max={sizingSystem === "EU" ? 48 : sizingSystem === "MONDOPOINT_CM" ? 31 : 14}
                  step={sizingSystem === "MONDOPOINT_CM" ? 0.5 : 1}
                  value={rawSizeValue}
                  onChange={(e) => setRawSizeValue(parseFloat(e.target.value))}
                  className="w-full accent-[#8B0000]"
                />
              </div>
            )}
          </div>

          {/* Foot Laterality (Left / Right / Pair Switcher) */}
          <div className="p-3.5 rounded-2xl bg-gray-800/60 border border-gray-700/60 space-y-2">
            <span className="text-[10px] font-bold uppercase text-gray-400 block">
              {isId ? "Orientasi Kaki (Simetri)" : "Foot Symmetry & Laterality"}
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setFoot("LEFT")}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  foot === "LEFT"
                    ? "bg-blue-900/80 text-blue-200 border-blue-600"
                    : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
                }`}
              >
                {isId ? "Kiri (Left)" : "Left"}
              </button>
              <button
                type="button"
                onClick={() => setFoot("RIGHT")}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  foot === "RIGHT"
                    ? "bg-[#8B0000] text-white border-[#8B0000]"
                    : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
                }`}
              >
                {isId ? "Kanan (Right)" : "Right"}
              </button>
              <button
                type="button"
                onClick={() => setFoot("PAIR")}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  foot === "PAIR"
                    ? "bg-emerald-800 text-emerald-100 border-emerald-500 shadow-xs"
                    : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
                }`}
              >
                {isId ? "Sepasang (Pair)" : "Pair (L+R)"}
              </button>
            </div>
          </div>

          {/* Caliper Direct-Entry & Width Adjusters */}
          <div className="p-3.5 rounded-2xl bg-gray-800/60 border border-gray-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-gray-400">
                {isId ? "Pengukuran Caliper Presisi (mm)" : "Precision Caliper Dimensions (mm)"}
              </span>
              <Wrench className="h-3.5 w-3.5 text-gray-400" />
            </div>

            {/* Forefoot Ball Width */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase text-gray-400">
                  {isId ? "Lebar Bola Kaki (Ball)" : "Forefoot Ball Width"}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min={70}
                    max={130}
                    value={ballWidth}
                    onChange={(e) => setBallWidth(Math.max(70, Math.min(130, parseFloat(e.target.value) || 70)))}
                    className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-700 bg-gray-900 font-mono font-bold text-xs text-right text-amber-400 tabular-nums focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]"
                  />
                  <span className="text-[10px] text-gray-400 font-semibold">mm</span>
                </div>
              </div>
              <input
                type="range"
                min={70}
                max={130}
                step={0.5}
                value={ballWidth}
                onChange={(e) => setBallWidth(parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Rearfoot Heel Width */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase text-gray-400">
                  {isId ? "Lebar Mangkuk Tumit (Heel)" : "Rearfoot Heel Width"}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min={45}
                    max={95}
                    value={heelWidth}
                    onChange={(e) => setHeelWidth(Math.max(45, Math.min(95, parseFloat(e.target.value) || 45)))}
                    className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-700 bg-gray-900 font-mono font-bold text-xs text-right text-emerald-400 tabular-nums focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]"
                  />
                  <span className="text-[10px] text-gray-400 font-semibold">mm</span>
                </div>
              </div>
              <input
                type="range"
                min={45}
                max={95}
                step={0.5}
                value={heelWidth}
                onChange={(e) => setHeelWidth(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Arch Flange Factor */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase text-gray-400">
                  {isId ? "Tinggi Lekukan Arch (Flange)" : "Arch Flange Height"}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.05"
                    min={0.75}
                    max={1.45}
                    value={archFactor}
                    onChange={(e) => setArchFactor(Math.max(0.75, Math.min(1.45, parseFloat(e.target.value) || 1.0)))}
                    className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-700 bg-gray-900 font-mono font-bold text-xs text-right text-red-400 tabular-nums focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]"
                  />
                  <span className="text-[10px] text-gray-400 font-semibold">x</span>
                </div>
              </div>
              <input
                type="range"
                min={0.75}
                max={1.45}
                step={0.05}
                value={archFactor}
                onChange={(e) => setArchFactor(parseFloat(e.target.value))}
                className="w-full accent-[#8B0000]"
              />
            </div>
          </div>

          {/* Factory Presets Selector */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-gray-400 block">
              {isId ? "Preset Insole Pabrik" : "Factory Insole Presets"}
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {INSOLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="p-2.5 rounded-xl border border-gray-800 bg-gray-800/60 hover:bg-gray-800 text-left transition flex items-center justify-between group active:scale-98"
                >
                  <div>
                    <p className="font-bold text-xs text-gray-200 group-hover:text-white">{preset.name}</p>
                    <p className="text-[10px] text-gray-400">{preset.description}</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 font-mono">
                    {preset.archProfile}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Interactive SVG / CAD Viewport */}
        <div
          className={`flex-1 relative bg-gray-900 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${
            mobileCadView === "CANVAS" ? "flex" : "hidden md:flex"
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => setIsPanning(false)}
          style={{ touchAction: "none" }}
        >
          {/* Millimeter Grid Backdrop */}
          {showGrid && (
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #ffffff 1px, transparent 1px),
                  linear-gradient(to bottom, #ffffff 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
              }}
            />
          )}

          {/* Floating Viewport Overlay Toolbar */}
          <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-20 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-gray-900/85 backdrop-blur-md border border-gray-700 shadow-xl text-white pointer-events-auto">
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(2.5, z + 0.15))}
                className="p-1.5 rounded-xl hover:bg-gray-800 active:scale-90 transition-transform"
                title="Zoom In (+)"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(0.5, z - 0.15))}
                className="p-1.5 rounded-xl hover:bg-gray-800 active:scale-90 transition-transform"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoomScale(1.0);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-1.5 rounded-xl hover:bg-gray-800 active:scale-90 transition-transform"
                title="Reset View (0)"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <div className="h-4 w-px bg-gray-700 mx-1" />
              <span className="text-[11px] font-mono font-bold px-1.5 text-gray-300">
                {Math.round(zoomScale * 100)}%
              </span>
            </div>

            {/* Desktop Right Sidebar Collapse / Expand Button */}
            <div className="hidden md:block pointer-events-auto">
              <button
                type="button"
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                className="p-2 rounded-2xl bg-gray-900/85 backdrop-blur-md border border-gray-700 hover:bg-gray-800 text-white active:scale-95 transition shadow-xl flex items-center gap-1.5 text-xs font-semibold"
                title={isRightSidebarOpen ? "Tutup Panel" : "Buka Panel"}
              >
                {isRightSidebarOpen ? (
                  <>
                    <PanelRightClose className="h-4 w-4 text-red-400" />
                    <span className="hidden sm:inline text-[11px]">{isId ? "Tutup Panel" : "Hide"}</span>
                  </>
                ) : (
                  <>
                    <PanelRightOpen className="h-4 w-4 text-red-400" />
                    <span className="hidden sm:inline text-[11px]">{isId ? "Layer & Ortotik" : "Layers"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Insole SVG Vector Drafting Space */}
          <div
            className="transition-transform duration-75"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
            }}
          >
            <svg
              viewBox={`0 0 ${vbW} ${vbH}`}
              className="drop-shadow-2xl"
              style={{
                width: `${vbW * (foot === "PAIR" ? 1.15 : 1.45)}px`,
                height: `${vbH * (foot === "PAIR" ? 1.15 : 1.45)}px`,
              }}
            >
              {/* SINGLE FOOT VIEW */}
              {foot !== "PAIR" ? (
                <g id="single-insole-viewport">
                  {/* Outer Cut Outline */}
                  {showOutline && (
                    <path
                      d={foot === "LEFT" ? geometry.svgPathLeft : geometry.svgPathRight}
                      className="fill-gray-100/95 dark:fill-gray-800/95 stroke-[#8B0000] stroke-[1.8] drop-shadow-md"
                    />
                  )}

                  {/* Arch Support Plate (Red) */}
                  {showArchPlate && (
                    <path
                      d={foot === "LEFT" ? geometry.archPlateSvgLeft : geometry.archPlateSvgRight}
                      className="fill-red-500/20 stroke-red-500 stroke-[1.2] stroke-dasharray-[3,3]"
                    />
                  )}

                  {/* Heel Cup Pad (Green) */}
                  {showHeelCup && (
                    <path
                      d={foot === "LEFT" ? geometry.heelCupSvgLeft : geometry.heelCupSvgRight}
                      className="fill-emerald-500/20 stroke-emerald-500 stroke-[1.2] stroke-dasharray-[3,3]"
                    />
                  )}

                  {/* Metatarsal Cushion Dome (Cyan) */}
                  {showMetatarsal && (
                    <path
                      d={foot === "LEFT" ? geometry.metatarsalSvgLeft : geometry.metatarsalSvgRight}
                      className="fill-cyan-500/20 stroke-cyan-500 stroke-[1.2] stroke-dasharray-[3,3]"
                    />
                  )}

                  {/* Dimension Reference Lines & Labels */}
                  {showDimensions && (
                    <g fontFamily="monospace" fontSize="7" fill="#3b82f6" fontWeight="bold">
                      {/* Vertical Length Dimension Line */}
                      <line
                        x1={vbW - 15}
                        y1={15}
                        x2={vbW - 15}
                        y2={vbH - 15}
                        stroke="#3b82f6"
                        strokeWidth="0.8"
                        strokeDasharray="2,2"
                      />
                      <text
                        x={vbW - 12}
                        y={vbH / 2}
                        transform={`rotate(90, ${vbW - 12}, ${vbH / 2})`}
                      >
                        L: {geometry.length} mm
                      </text>

                      {/* Forefoot Width Dimension Line */}
                      <line
                        x1={vbW / 2 - ballWidth / 2}
                        y1={vbH * 0.28}
                        x2={vbW / 2 + ballWidth / 2}
                        y2={vbH * 0.28}
                        stroke="#eab308"
                        strokeWidth="0.8"
                        strokeDasharray="2,2"
                      />
                      <text
                        x={vbW / 2}
                        y={vbH * 0.26}
                        fill="#eab308"
                        textAnchor="middle"
                      >
                        W(Ball): {ballWidth} mm
                      </text>
                    </g>
                  )}
                </g>
              ) : (
                /* Symmetrical Pair View Mode */
                <g id="pair-insole-viewport">
                  {/* Left Foot Insole */}
                  <g id="insole-left-side">
                    {showOutline && (
                      <path
                        d={geometry.svgPathLeft}
                        className="fill-gray-100/95 dark:fill-gray-800/95 stroke-[#8B0000] stroke-[1.8] drop-shadow-md"
                      />
                    )}
                    {showArchPlate && (
                      <path
                        d={geometry.archPlateSvgLeft}
                        className="fill-red-500/20 stroke-red-500 stroke-[1.2] stroke-dasharray-[3,3]"
                      />
                    )}
                    {showHeelCup && (
                      <path
                        d={geometry.heelCupSvgLeft}
                        className="fill-emerald-500/20 stroke-emerald-500 stroke-[1.2] stroke-dasharray-[3,3]"
                      />
                    )}
                    {showMetatarsal && (
                      <path
                        d={geometry.metatarsalSvgLeft}
                        className="fill-cyan-500/20 stroke-cyan-500 stroke-[1.2] stroke-dasharray-[3,3]"
                      />
                    )}
                    <text x={singleW / 2} y={vbH - 10} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      LEFT ({geometry.sizingLabel})
                    </text>
                  </g>

                  {/* Right Foot Insole */}
                  <g id="insole-right-side" transform={`translate(${singleW + pairGap}, 0)`}>
                    {showOutline && (
                      <path
                        d={geometry.svgPathRight}
                        className="fill-gray-100/95 dark:fill-gray-800/95 stroke-[#8B0000] stroke-[1.8] drop-shadow-md"
                      />
                    )}
                    {showArchPlate && (
                      <path
                        d={geometry.archPlateSvgRight}
                        className="fill-red-500/20 stroke-red-500 stroke-[1.2] stroke-dasharray-[3,3]"
                      />
                    )}
                    {showHeelCup && (
                      <path
                        d={geometry.heelCupSvgRight}
                        className="fill-emerald-500/20 stroke-emerald-500 stroke-[1.2] stroke-dasharray-[3,3]"
                      />
                    )}
                    {showMetatarsal && (
                      <path
                        d={geometry.metatarsalSvgRight}
                        className="fill-cyan-500/20 stroke-cyan-500 stroke-[1.2] stroke-dasharray-[3,3]"
                      />
                    )}
                    <text x={singleW / 2} y={vbH - 10} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      RIGHT ({geometry.sizingLabel})
                    </text>
                  </g>
                </g>
              )}
            </svg>
          </div>

          {/* Bottom Live Dimension Callout Strip */}
          <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-20 flex items-center justify-between p-2.5 rounded-2xl bg-gray-900/85 backdrop-blur-md border border-gray-800 text-white text-xs">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono text-[11px]">
              <span>
                <strong className="text-red-400">{geometry.sizingLabel}</strong> ({foot})
              </span>
              <span>
                Pjg: <strong className="text-blue-400">{geometry.length} mm</strong>
              </span>
              <span>
                Bola: <strong className="text-amber-400">{ballWidth} mm</strong>
              </span>
              <span>
                Tumit: <strong className="text-emerald-400">{heelWidth} mm</strong>
              </span>
              <span>
                Keliling: <strong className="text-cyan-400">{totalPerimeter} mm</strong>
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-semibold hidden lg:inline">
              Equator Anatomical CAD Engine v3.0
            </span>
          </div>
        </div>

        {/* Right Sidebar: Orthotic Components, Layers & Specs */}
        {isRightSidebarOpen && (
          <div
            className={`w-full md:w-80 lg:w-88 border-l border-gray-800 bg-gray-900/95 overflow-y-auto p-4 space-y-4 text-xs ${
              mobileCadView === "ORTHOTICS" || mobileCadView === "EXPORT" ? "block" : "hidden md:block"
            }`}
          >
            {/* Inspector Tab Switcher */}
            <div className="flex items-center rounded-xl bg-gray-800 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setInspectorTab("COMPONENTS")}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  inspectorTab === "COMPONENTS" ? "bg-[#8B0000] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {isId ? "Komponen" : "Orthotics"}
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab("LAYERS")}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  inspectorTab === "LAYERS" ? "bg-[#8B0000] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {isId ? "Layer CAD" : "Layers"}
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab("SPECS")}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  inspectorTab === "SPECS" ? "bg-[#8B0000] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {isId ? "Spek & Yield" : "Specs"}
              </button>
            </div>

            {/* TAB 1: ORTHOTIC COMPONENTS */}
            {inspectorTab === "COMPONENTS" && (
              <div className="space-y-4">
                {/* TPU Arch Support Plate */}
                <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-red-300">
                        {isId ? "Plat Arch TPU (Bridge)" : "TPU Arch Bridge"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTooltip(activeTooltip === "arch" ? null : "arch")}
                        className="text-red-400 hover:text-red-300 p-0.5"
                        title={isId ? "Info Anatomi" : "Anatomical Info"}
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-900/60 text-red-200 font-mono font-bold">
                      LAYER: RED
                    </span>
                  </div>

                  {activeTooltip === "arch" && (
                    <div className="p-2 rounded-xl bg-red-950/80 border border-red-900/60 text-[11px] text-red-200 leading-snug">
                      {isId
                        ? "Penopang lengkungan kaki medial untuk mendistribusikan beban plantar dan mencegah overpronation."
                        : "Medial arch bridge to distribute plantar loads and prevent overpronation."}
                    </div>
                  )}

                  {/* Arch Plate Length */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase text-gray-400">
                        {isId ? "Panjang Bridge TPU" : "TPU Bridge Length"}
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.05"
                          min={0.75}
                          max={1.35}
                          value={archPlateLength}
                          onChange={(e) => setArchPlateLength(Math.max(0.75, Math.min(1.35, parseFloat(e.target.value) || 1.0)))}
                          className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-700 bg-gray-900 font-mono font-bold text-xs text-right text-red-400 tabular-nums focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]"
                        />
                        <span className="text-[10px] text-gray-400 font-semibold">x</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0.75}
                      max={1.35}
                      step={0.05}
                      value={archPlateLength}
                      onChange={(e) => setArchPlateLength(parseFloat(e.target.value))}
                      className="w-full accent-red-500"
                    />
                  </div>

                  {/* Arch Plate Width */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase text-gray-400">
                        {isId ? "Lebar Flange Medial" : "Medial Flange Spread"}
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.05"
                          min={0.70}
                          max={1.30}
                          value={archPlateWidth}
                          onChange={(e) => setArchPlateWidth(Math.max(0.70, Math.min(1.30, parseFloat(e.target.value) || 1.0)))}
                          className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-700 bg-gray-900 font-mono font-bold text-xs text-right text-red-400 tabular-nums focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]"
                        />
                        <span className="text-[10px] text-gray-400 font-semibold">x</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0.70}
                      max={1.30}
                      step={0.05}
                      value={archPlateWidth}
                      onChange={(e) => setArchPlateWidth(parseFloat(e.target.value))}
                      className="w-full accent-red-500"
                    />
                  </div>
                </div>

                {/* Heel Cup Pad */}
                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300">
                      {isId ? "Mangkuk Tumit (Heel Cup)" : "Heel Cup Profile"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 font-mono font-bold">
                      LAYER: GREEN
                    </span>
                  </div>

                  {/* Heel Cup Radius Factor */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase text-gray-400">
                        {isId ? "Diameter Mangkuk Tumit" : "Heel Cup Radius"}
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.05"
                          min={0.70}
                          max={1.30}
                          value={heelCupRadius}
                          onChange={(e) => setHeelCupRadius(Math.max(0.70, Math.min(1.30, parseFloat(e.target.value) || 1.0)))}
                          className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-700 bg-gray-900 font-mono font-bold text-xs text-right text-emerald-400 tabular-nums focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]"
                        />
                        <span className="text-[10px] text-gray-400 font-semibold">x</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0.70}
                      max={1.30}
                      step={0.05}
                      value={heelCupRadius}
                      onChange={(e) => setHeelCupRadius(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>

                {/* Metatarsal Pad */}
                <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">
                      {isId ? "Bantalan Metatarsal (Dome)" : "Metatarsal Pad Dome"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-200 font-mono font-bold">
                      LAYER: CYAN
                    </span>
                  </div>

                  {/* Metatarsal Size Factor */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase text-gray-400">
                        {isId ? "Ukuran Kubah Dome" : "Dome Size Factor"}
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.05"
                          min={0.60}
                          max={1.40}
                          value={metatarsalSize}
                          onChange={(e) => setMetatarsalSize(Math.max(0.60, Math.min(1.40, parseFloat(e.target.value) || 1.0)))}
                          className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-700 bg-gray-900 font-mono font-bold text-xs text-right text-cyan-400 tabular-nums focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]"
                        />
                        <span className="text-[10px] text-gray-400 font-semibold">x</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0.60}
                      max={1.40}
                      step={0.05}
                      value={metatarsalSize}
                      onChange={(e) => setMetatarsalSize(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  {/* Metatarsal Y Pos */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase text-gray-400">
                        {isId ? "Posisi Longitudinal (Y)" : "Longitudinal Y Position"}
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          min={0.58}
                          max={0.72}
                          value={metatarsalYPos}
                          onChange={(e) => setMetatarsalYPos(Math.max(0.58, Math.min(0.72, parseFloat(e.target.value) || 0.65)))}
                          className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-700 bg-gray-900 font-mono font-bold text-xs text-right text-cyan-400 tabular-nums focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]"
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0.58}
                      max={0.72}
                      step={0.01}
                      value={metatarsalYPos}
                      onChange={(e) => setMetatarsalYPos(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LAYER VISIBILITY */}
            {inspectorTab === "LAYERS" && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">
                  {isId ? "Visibilitas Layer CAD" : "CAD Layer Visibility"}
                </span>

                <div className="p-3 rounded-2xl bg-gray-800/60 border border-gray-700/60 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300 font-bold">{isId ? "Garis Potong (Cut Outline)" : "Cut Outline"}</span>
                    <input
                      type="checkbox"
                      checked={showOutline}
                      onChange={(e) => setShowOutline(e.target.checked)}
                      className="rounded text-[#8B0000] focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-red-400 font-bold">{isId ? "Plat Arch TPU (Red)" : "TPU Arch Plate (Red)"}</span>
                    <input
                      type="checkbox"
                      checked={showArchPlate}
                      onChange={(e) => setShowArchPlate(e.target.checked)}
                      className="rounded text-red-600 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-emerald-400 font-bold">{isId ? "Mangkuk Tumit (Green)" : "Heel Cup (Green)"}</span>
                    <input
                      type="checkbox"
                      checked={showHeelCup}
                      onChange={(e) => setShowHeelCup(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-cyan-400 font-bold">{isId ? "Bantalan Metatarsal (Cyan)" : "Metatarsal Pad (Cyan)"}</span>
                    <input
                      type="checkbox"
                      checked={showMetatarsal}
                      onChange={(e) => setShowMetatarsal(e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-blue-400 font-bold">{isId ? "Dimensi & Ukuran (HUD)" : "Dimensions HUD"}</span>
                    <input
                      type="checkbox"
                      checked={showDimensions}
                      onChange={(e) => setShowDimensions(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 3: SPECS & YIELD */}
            {inspectorTab === "SPECS" && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-gray-800/60 border border-gray-700/60 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">
                    {isId ? "Spesifikasi Material" : "Material Specifications"}
                  </span>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Material:</span>
                      <span className="font-bold text-white">{materialType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tebal Depan:</span>
                      <span className="text-white">{forefootThickness} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tebal Tumit:</span>
                      <span className="text-white">{heelThickness} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Keliling Potong:</span>
                      <span className="text-cyan-400 font-bold">{totalPerimeter} mm</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-800/60 border border-gray-700/60 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">
                    {isId ? "Estimasi Yield per Lembar EVA" : "EVA Sheet Yield Estimate"}
                  </span>
                  <p className="text-xs text-gray-300">
                    Lembar Standar: <strong>1200 x 2400 mm</strong>
                  </p>
                  <p className="font-mono text-base font-black text-emerald-400">
                    ~{Math.floor((1200 * 2400) / ((geometry.bounds.width + 10) * (geometry.bounds.height + 10) * 2))}{" "}
                    <span className="text-xs font-normal text-gray-400">pasang / lembar</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Blueprint Library Drawer / Modal */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-gray-900 border border-gray-700 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-amber-950/80 text-amber-400 border border-amber-800">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    {isId ? "Arsip Blueprint Insole CAD" : "CAD Blueprint Library"}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {isId ? "Pilih model blueprint tersimpan untuk dimuat ke workstation" : "Select a saved model to load into the workspace"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Blueprints List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {savedBlueprints.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-gray-800 rounded-2xl text-gray-500">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <p className="text-xs font-bold">{isId ? "Belum ada blueprint tersimpan" : "No saved blueprints yet"}</p>
                  <p className="text-[11px] text-gray-600 mt-1">
                    {isId ? "Klik tombol 'Simpan' pada header untuk menyimpan model CAD." : "Click 'Save' in the top header to save your CAD models."}
                  </p>
                </div>
              ) : (
                savedBlueprints.map((bp) => (
                  <div
                    key={bp.id}
                    className="p-3.5 rounded-2xl bg-gray-800/80 border border-gray-700 hover:border-gray-600 transition flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs truncate">{bp.name}</span>
                        <span className="px-2 py-0.5 rounded bg-gray-700 text-gray-300 font-mono text-[10px]">
                          {bp.sizingSystem} {bp.rawSizeValue || bp.shoeSize}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 font-mono">
                        {bp.materialType} • Arch: {bp.archProfile}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLoadSavedBlueprint(bp)}
                      className="px-3 py-1.5 rounded-xl bg-[#8B0000] hover:bg-[#A00000] text-white font-bold text-xs shrink-0 active:scale-95 transition"
                    >
                      {isId ? "Muat Model" : "Load Model"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CNC Die Pre-Flight Verification & Export Modal */}
      {isCncPreFlightOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-gray-900 border border-gray-700 shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  <Scissors className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    {isId ? "Verifikasi Pisau Pond & CNC Cutter" : "CNC Die-Cut Pre-Flight Verification"}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {isId ? "Validasi toolpath polyline dan lapisan DXF sebelum pemotongan" : "Toolpath polyline & DXF layer audit"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCncPreFlightOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Audit Checklist */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-gray-800/80 border border-gray-700 grid grid-cols-2 gap-2 font-mono">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block">{isId ? "Ukuran Bounding Box" : "Bounding Box"}</span>
                  <span className="font-bold text-white tabular-nums">{totalW.toFixed(1)} x {totalH.toFixed(1)} mm</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block">{isId ? "Panjang Lintasan Potong" : "Cut Perimeter"}</span>
                  <span className="font-bold text-cyan-400 tabular-nums">{totalPerimeter} mm</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2.5 text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{isId ? "✓ Polyline 100% Manifold Tertutup (Tanpa self-intersection)" : "✓ 100% Manifold Closed Loop Verified"}</span>
              </div>

              <div className="p-3 rounded-2xl bg-gray-800/60 border border-gray-700/60 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">{isId ? "Audit Lapisan Layer DXF (Corel / CNC)" : "DXF Layer Color Audit"}</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-gray-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-white border border-gray-400" />
                    <span>CUT_OUTLINE (Color 7)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-red-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span>ARCH_SUPPORT (Color 1)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>HEEL_CUP (Color 3)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    <span>METATARSAL (Color 4)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={handleExportSvg}
                disabled={exporting !== null}
                className="px-4 py-2 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-200 transition"
              >
                {exporting === "SVG" ? "Exporting..." : isId ? "Unduh Vector SVG" : "Download SVG"}
              </button>
              <button
                type="button"
                onClick={handleExportDxf}
                disabled={exporting !== null}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95 transition"
              >
                <Download className="h-4 w-4" />
                <span>{exporting === "DXF" ? "Exporting..." : isId ? "Unduh AutoCAD R12 DXF" : "Download R12 DXF"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generative Model Modal */}
      <CadAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyGeneratedModel={handleApplyAiGeneration}
        language={language}
      />
    </div>
  );
}
