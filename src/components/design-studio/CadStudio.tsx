"use client";

import React, { useState, useEffect } from "react";
import {
  buildInsoleGeometry,
  calculateInsoleLength,
  calculateDefaultWidths,
  convertSizing,
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

  // Viewport Zoom & Pan
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Modals & States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [savedBlueprints, setSavedBlueprints] = useState<any[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<"COMPONENTS" | "LAYERS" | "SPECS">("COMPONENTS");
  const [exporting, setExporting] = useState<"DXF" | "SVG" | null>(null);

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
      if (json.success) setSavedBlueprints(json.data);
    } catch (err) {
      console.error("Failed to load blueprints:", err);
    }
  };

  useEffect(() => {
    fetchBlueprints();
  }, []);

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
    } catch (err) {
      console.error("DXF export failed:", err);
      alert(isId ? "Gagal mengekspor file DXF." : "Failed to export DXF file.");
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
    } catch (err) {
      console.error("SVG export failed:", err);
      alert(isId ? "Gagal mengekspor file SVG." : "Failed to export SVG file.");
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
          shoeSize: geometry.size,
          baseLengthMm: effectiveLength,
          ballWidthMm: ballWidth,
          heelWidthMm: heelWidth,
          waistWidthMm: waistWidth,
          archProfile,
          archOffsetFactor: archFactor,
          thicknessForefootMm: forefootThickness,
          thicknessHeelMm: heelThickness,
          materialType,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert(isId ? "Blueprint berhasil disimpan ke katalog!" : "Blueprint saved successfully!");
        fetchBlueprints();
      }
    } catch (err) {
      console.error(err);
      alert(isId ? "Gagal menyimpan blueprint." : "Failed to save blueprint.");
    }
  };

  // Load Selected Blueprint
  const handleLoadBlueprint = (bp: any) => {
    setBlueprintName(bp.name);
    setSizingSystem("EU");
    setRawSizeValue(bp.shoeSize);
    setBallWidth(bp.ballWidthMm);
    setHeelWidth(bp.heelWidthMm);
    setWaistWidth(bp.waistWidthMm);
    setArchProfile(bp.archProfile);
    setArchFactor(bp.archOffsetFactor || 1.0);
    setForefootThickness(bp.thicknessForefootMm || 3.0);
    setHeelThickness(bp.thicknessHeelMm || 5.0);
    setMaterialType(bp.materialType || "High Density EVA");
    setIsLibraryOpen(false);
  };

  // Canvas Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const vbW = geometry.bounds.width;
  const vbH = geometry.bounds.height;

  const activeOutline = foot === "LEFT" ? geometry.svgPathLeft : geometry.svgPathRight;
  const activeArch = foot === "LEFT" ? geometry.archPlateSvgLeft : geometry.archPlateSvgRight;
  const activeHeel = foot === "LEFT" ? geometry.heelCupSvgLeft : geometry.heelCupSvgRight;
  const activeMeta = foot === "LEFT" ? geometry.metatarsalSvgLeft : geometry.metatarsalSvgRight;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Top Header & Desktop Action Controls */}
      <div className="p-3 sm:p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 rounded-2xl bg-red-50 dark:bg-red-950/60 text-[#8B0000] dark:text-red-400 shrink-0">
            <Compass className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-2">
              <span>{isId ? "Studio Insole CAD & Vector" : "Insole CAD & Vector Studio"}</span>
              <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-[10px] font-bold text-[#8B0000] dark:text-red-300">
                CorelDRAW & AutoCAD R12 DXF
              </span>
            </h2>
            <p className="text-[11px] text-gray-500">
              {isId
                ? "Generator kontur sol anatomis dengan kustomisasi layer ortotik independen"
                : "Anatomical parametric insole generator with customizable orthotic layers"}
            </p>
          </div>
        </div>

        {/* Desktop Quick Action Buttons (hidden on mobile, available in mobile tab) */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-700 to-[#8B0000] hover:from-red-800 hover:to-[#A00000] text-white text-xs font-bold shadow-md hover:shadow-red-900/30 active:scale-95 transition"
          >
            <Sparkles className="h-4 w-4 animate-pulse text-amber-300" />
            <span>{isId ? "Prompt AI Insole" : "AI Insole Generator"}</span>
          </button>

          <select
            onChange={(e) => {
              const p = INSOLE_PRESETS.find((pr) => pr.id === e.target.value);
              if (p) handleApplyPreset(p);
            }}
            className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:border-[#8B0000] focus:outline-none shadow-xs"
          >
            <option value="">{isId ? "Pilih Preset Pabrik..." : "Preset Catalog..."}</option>
            {INSOLE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.archProfile})
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsLibraryOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 active:scale-95 transition shadow-xs"
          >
            <FolderOpen className="h-4 w-4 text-[#8B0000]" />
            <span>{isId ? "Katalog" : "Library"}</span>
          </button>

          <button
            onClick={handleSaveBlueprint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 active:scale-95 transition shadow-xs"
            title="Simpan Blueprint"
          >
            <Save className="h-4 w-4" />
            <span>{isId ? "Simpan" : "Save"}</span>
          </button>

          <button
            onClick={handleExportDxf}
            disabled={exporting === "DXF"}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8B0000] hover:bg-[#A00000] text-xs font-bold text-white shadow-md active:scale-95 transition disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{exporting === "DXF" ? "Exporting..." : "DXF (R12)"}</span>
          </button>

          <button
            onClick={handleExportSvg}
            disabled={exporting === "SVG"}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 active:scale-95 transition shadow-xs"
          >
            <Share2 className="h-4 w-4" />
            <span>SVG</span>
          </button>
        </div>
      </div>

      {/* MOBILE ADAPTIVE VIEW MODE SELECTOR (md:hidden) */}
      <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-1.5 px-3 flex items-center justify-between gap-1 overflow-x-auto shrink-0 shadow-xs">
        <button
          onClick={() => setMobileCadView("CANVAS")}
          className={`flex-1 min-w-[75px] py-2 rounded-xl font-extrabold text-[11px] flex items-center justify-center gap-1 transition active:scale-95 ${
            mobileCadView === "CANVAS"
              ? "bg-[#8B0000] text-white shadow-xs"
              : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Canvas</span>
        </button>

        <button
          onClick={() => setMobileCadView("PARAMETERS")}
          className={`flex-1 min-w-[75px] py-2 rounded-xl font-extrabold text-[11px] flex items-center justify-center gap-1 transition active:scale-95 ${
            mobileCadView === "PARAMETERS"
              ? "bg-[#8B0000] text-white shadow-xs"
              : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Ukuran</span>
        </button>

        <button
          onClick={() => setMobileCadView("ORTHOTICS")}
          className={`flex-1 min-w-[75px] py-2 rounded-xl font-extrabold text-[11px] flex items-center justify-center gap-1 transition active:scale-95 ${
            mobileCadView === "ORTHOTICS"
              ? "bg-[#8B0000] text-white shadow-xs"
              : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>Ortotik</span>
        </button>

        <button
          onClick={() => setMobileCadView("EXPORT")}
          className={`flex-1 min-w-[75px] py-2 rounded-xl font-extrabold text-[11px] flex items-center justify-center gap-1 transition active:scale-95 ${
            mobileCadView === "EXPORT"
              ? "bg-[#8B0000] text-white shadow-xs"
              : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
          }`}
        >
          <FileCode className="h-3.5 w-3.5" />
          <span>AI & Ekspor</span>
        </button>
      </div>

      {/* Main Multi-Pane Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Toolbar: Base Sizing & Outline Parameters (Desktop or Mobile PARAMETERS view) */}
        <div
          className={`w-full md:w-80 lg:w-88 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4 overflow-y-auto shrink-0 text-xs ${
            mobileCadView === "PARAMETERS" ? "block flex-1 pb-24" : "hidden md:block"
          }`}
        >
          {/* Multi-System Size Switcher */}
          <div className="space-y-2">
            <label className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Globe2 className="h-3.5 w-3.5 text-[#8B0000]" />
                <span>{isId ? "Standar Ukuran Sepatu" : "Sizing System"}</span>
              </span>
              <span className="font-mono text-red-700 dark:text-red-400 font-extrabold text-xs">
                {geometry.sizingLabel}
              </span>
            </label>

            {/* Sizing Standard Tabs */}
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-gray-100 dark:bg-gray-800 p-1">
              {[
                { id: "EU", label: "EU" },
                { id: "US_MEN", label: "US Men" },
                { id: "US_WOMEN", label: "US Women" },
                { id: "UK", label: "UK" },
                { id: "MONDOPOINT_CM", label: "CM / Mondo" },
                { id: "CUSTOM_MM", label: "Custom mm" },
              ].map((sys) => (
                <button
                  key={sys.id}
                  onClick={() => setSizingSystem(sys.id as SizingSystem)}
                  className={`py-2 rounded-xl font-bold text-[11px] transition active:scale-95 ${
                    sizingSystem === sys.id
                      ? "bg-white dark:bg-gray-700 text-[#8B0000] dark:text-red-300 shadow-xs"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                  }`}
                >
                  {sys.label}
                </button>
              ))}
            </div>

            {/* Size Stepper & Continuous Slider */}
            {sizingSystem === "CUSTOM_MM" ? (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                  <span>Panjang Insole Custom:</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{customLengthMm} mm</span>
                </div>
                <input
                  type="range"
                  min={210}
                  max={330}
                  step={0.5}
                  value={customLengthMm}
                  onChange={(e) => setCustomLengthMm(parseFloat(e.target.value))}
                  className="w-full accent-[#8B0000]"
                />
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setRawSizeValue(Math.max(1, Math.round((rawSizeValue - 0.5) * 10) / 10))}
                    className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 font-bold px-4 text-base active:scale-95"
                  >
                    -
                  </button>
                  <div className="text-center flex-1">
                    <span className="text-lg font-black text-gray-900 dark:text-white font-mono">
                      {rawSizeValue}
                    </span>
                    <p className="text-[10px] text-gray-500 font-mono">
                      (Equiv: EU {conversion.eu} • UK {conversion.uk} • US {conversion.usMen})
                    </p>
                  </div>
                  <button
                    onClick={() => setRawSizeValue(Math.round((rawSizeValue + 0.5) * 10) / 10)}
                    className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 font-bold px-4 text-base active:scale-95"
                  >
                    +
                  </button>
                </div>
                <input
                  type="range"
                  min={sizingSystem === "MONDOPOINT_CM" ? 21 : sizingSystem.startsWith("US") || sizingSystem === "UK" ? 4 : 34}
                  max={sizingSystem === "MONDOPOINT_CM" ? 33 : sizingSystem.startsWith("US") || sizingSystem === "UK" ? 15 : 48}
                  step={0.5}
                  value={rawSizeValue}
                  onChange={(e) => setRawSizeValue(parseFloat(e.target.value))}
                  className="w-full accent-[#8B0000]"
                />
              </div>
            )}
          </div>

          {/* Foot Orientation Toggle */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px]">
              {isId ? "Orientasi Kaki (Foot Bed)" : "Foot Orientation"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFoot("RIGHT")}
                className={`py-2.5 rounded-xl font-bold text-xs transition active:scale-95 ${
                  foot === "RIGHT"
                    ? "bg-red-50 dark:bg-red-950/60 border-2 border-[#8B0000] text-[#8B0000] dark:text-red-300 shadow-xs"
                    : "border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                {isId ? "Kaki Kanan (Right)" : "Right Foot"}
              </button>
              <button
                onClick={() => setFoot("LEFT")}
                className={`py-2.5 rounded-xl font-bold text-xs transition active:scale-95 ${
                  foot === "LEFT"
                    ? "bg-red-50 dark:bg-red-950/60 border-2 border-[#8B0000] text-[#8B0000] dark:text-red-300 shadow-xs"
                    : "border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                {isId ? "Kaki Kiri (Left)" : "Left Foot"}
              </button>
            </div>
          </div>

          {/* Arch Support Contour & Toe Shape */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[10px]">
                {isId ? "Profil Arch" : "Arch Profile"}
              </label>
              <select
                value={archProfile}
                onChange={(e) => setArchProfile(e.target.value as ArchProfile)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold"
              >
                <option value="FLAT">Flat / Low</option>
                <option value="MEDIUM">Neutral</option>
                <option value="HIGH">High Arch</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[10px]">
                {isId ? "Bentuk Toe Box" : "Toe Shape"}
              </label>
              <select
                value={toeShape}
                onChange={(e) => setToeShape(e.target.value as ToeShape)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold"
              >
                <option value="ROUNDED">Round</option>
                <option value="ANATOMIC">Anatomic</option>
                <option value="SQUARE_ROUND">Square</option>
              </select>
            </div>
          </div>

          {/* Fine Tuning Sliders */}
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                <span>{isId ? "Lebar Bola Kaki (Forefoot):" : "Ball Width:"}</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{ballWidth} mm</span>
              </div>
              <input
                type="range"
                min={75}
                max={125}
                step={0.5}
                value={ballWidth}
                onChange={(e) => setBallWidth(parseFloat(e.target.value))}
                className="w-full accent-[#8B0000]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                <span>{isId ? "Lebar Tumit (Heel):" : "Heel Width:"}</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{heelWidth} mm</span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                step={0.5}
                value={heelWidth}
                onChange={(e) => setHeelWidth(parseFloat(e.target.value))}
                className="w-full accent-[#8B0000]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                <span>{isId ? "Faktor Kedalaman Arch:" : "Arch Depth Factor:"}</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{archFactor.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.5}
                step={0.05}
                value={archFactor}
                onChange={(e) => setArchFactor(parseFloat(e.target.value))}
                className="w-full accent-[#8B0000]"
              />
            </div>
          </div>
        </div>

        {/* Center Interactive SVG / CAD Viewport (Desktop or Mobile CANVAS view) */}
        <div
          className={`flex-1 relative bg-gray-900 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${
            mobileCadView === "CANVAS" ? "flex" : "hidden md:flex"
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
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
                onClick={() => setZoomScale(Math.min(2.5, zoomScale + 0.15))}
                className="p-1.5 rounded-xl hover:bg-gray-800 active:scale-95 transition"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoomScale(Math.max(0.5, zoomScale - 0.15))}
                className="p-1.5 rounded-xl hover:bg-gray-800 active:scale-95 transition"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setZoomScale(1.0);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-1.5 rounded-xl hover:bg-gray-800 active:scale-95 transition"
                title="Reset View"
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

          {/* Live Authentic Insole SVG Vector Container */}
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
                width: `${vbW * 1.45}px`,
                height: `${vbH * 1.45}px`,
              }}
            >
              {/* Outer Cut Outline (Anatomical Footwear Cut) */}
              {showOutline && (
                <path
                  d={activeOutline}
                  className="fill-gray-100/95 dark:fill-gray-800/95 stroke-[#8B0000] stroke-[1.8] drop-shadow-md"
                />
              )}

              {/* Arch Support Plate (Red) */}
              {showArchPlate && (
                <path
                  d={activeArch}
                  className="fill-red-500/20 stroke-red-500 stroke-[1.2] stroke-dasharray-[3,3]"
                />
              )}

              {/* Heel Cup Pad (Green) */}
              {showHeelCup && (
                <path
                  d={activeHeel}
                  className="fill-emerald-500/20 stroke-emerald-500 stroke-[1.2] stroke-dasharray-[3,3]"
                />
              )}

              {/* Metatarsal Cushion Dome (Cyan) */}
              {showMetatarsal && (
                <path
                  d={activeMeta}
                  className="fill-cyan-500/20 stroke-cyan-500 stroke-[1.2] stroke-dasharray-[3,3]"
                />
              )}

              {/* Dimension Reference Lines & Labels */}
              {showDimensions && (
                <g className="text-gray-400 font-mono text-[6px]">
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
                    fill="#3b82f6"
                    fontSize="7"
                    fontWeight="bold"
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
                    fontSize="7"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    W(Ball): {ballWidth} mm
                  </text>
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
            </div>
            <span className="text-[10px] text-gray-400 font-semibold hidden lg:inline">
              Equator Anatomical CAD Engine v3.0
            </span>
          </div>
        </div>

        {/* Right Inspector: Customizable Orthotic Components, Layers & Specs (Desktop or Mobile ORTHOTICS view) */}
        <div
          className={`shrink-0 ${
            mobileCadView === "ORTHOTICS"
              ? "block w-full flex-1 p-4 space-y-4 overflow-y-auto pb-24 bg-white dark:bg-gray-900 text-xs"
              : isRightSidebarOpen
              ? "hidden md:block w-full md:w-80 lg:w-88 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4 overflow-y-auto text-xs"
              : "hidden"
          }`}
        >
          {/* Inspector Mode Switcher */}
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-gray-100 dark:bg-gray-800 p-1 font-bold text-[10px]">
            <button
              onClick={() => setInspectorTab("COMPONENTS")}
              className={`py-2 rounded-xl transition ${
                inspectorTab === "COMPONENTS"
                  ? "bg-white dark:bg-gray-700 text-[#8B0000] dark:text-red-300 shadow-xs"
                  : "text-gray-500"
              }`}
            >
              Komponen
            </button>
            <button
              onClick={() => setInspectorTab("LAYERS")}
              className={`py-2 rounded-xl transition ${
                inspectorTab === "LAYERS"
                  ? "bg-white dark:bg-gray-700 text-[#8B0000] dark:text-red-300 shadow-xs"
                  : "text-gray-500"
              }`}
            >
              Layers
            </button>
            <button
              onClick={() => setInspectorTab("SPECS")}
              className={`py-2 rounded-xl transition ${
                inspectorTab === "SPECS"
                  ? "bg-white dark:bg-gray-700 text-[#8B0000] dark:text-red-300 shadow-xs"
                  : "text-gray-500"
              }`}
            >
              Spek & Yield
            </button>
          </div>

          {inspectorTab === "COMPONENTS" ? (
            /* Orthotic Component Customization Sliders */
            <div className="space-y-4">
              {/* 1. TPU Arch Plate Customizer */}
              <div className="p-3 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-red-950 dark:text-red-300 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-red-600" />
                    <span>Plat Arch TPU (Bridge)</span>
                  </span>
                  <span className="font-mono text-[10px] font-bold text-red-700 dark:text-red-400">
                    {archPlateLength.toFixed(2)}x
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                    <span>Jangkauan Panjang:</span>
                    <span className="font-bold">{Math.round(geometry.length * 0.45 * archPlateLength)} mm</span>
                  </div>
                  <input
                    type="range"
                    min={0.75}
                    max={1.35}
                    step={0.05}
                    value={archPlateLength}
                    onChange={(e) => setArchPlateLength(parseFloat(e.target.value))}
                    className="w-full accent-[#8B0000]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                    <span>Tinggi Flange Medial:</span>
                    <span className="font-bold">{archPlateWidth.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.70}
                    max={1.30}
                    step={0.05}
                    value={archPlateWidth}
                    onChange={(e) => setArchPlateWidth(parseFloat(e.target.value))}
                    className="w-full accent-[#8B0000]"
                  />
                </div>

                <label className="flex items-center gap-2 text-[11px] cursor-pointer font-semibold text-red-950 dark:text-red-200">
                  <input
                    type="checkbox"
                    checked={archPlateLateralWing}
                    onChange={(e) => setArchPlateLateralWing(e.target.checked)}
                    className="rounded text-[#8B0000] focus:ring-0"
                  />
                  <span>Sayap Stabilisator Torsi Lateral</span>
                </label>
              </div>

              {/* 2. Heel Cup Customizer */}
              <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-emerald-950 dark:text-emerald-300">
                    Mangkuk Tumit (Heel Cup)
                  </span>
                  <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    {heelCupDepth}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  {(["SHALLOW", "MEDIUM", "DEEP"] as HeelCupDepthProfile[]).map((dp) => (
                    <button
                      key={dp}
                      type="button"
                      onClick={() => setHeelCupDepth(dp)}
                      className={`py-1.5 rounded-lg font-bold transition ${
                        heelCupDepth === dp
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {dp}
                    </button>
                  ))}
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                    <span>Radius Distribusi Beban:</span>
                    <span className="font-bold">{heelCupRadius.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={1.4}
                    step={0.05}
                    value={heelCupRadius}
                    onChange={(e) => setHeelCupRadius(parseFloat(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>
              </div>

              {/* 3. Metatarsal Pad Customizer */}
              <div className="p-3 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-cyan-950 dark:text-cyan-300">
                    Bantalan Metatarsal (Cushion Dome)
                  </span>
                  <span className="font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-400">
                    {metatarsalSize.toFixed(2)}x
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                    <span>Ukuran Diameter Kubah:</span>
                    <span className="font-bold">{metatarsalSize.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.7}
                    max={1.4}
                    step={0.05}
                    value={metatarsalSize}
                    onChange={(e) => setMetatarsalSize(parseFloat(e.target.value))}
                    className="w-full accent-cyan-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                    <span>Posisi Longitudinal (Y):</span>
                    <span className="font-bold">{Math.round(metatarsalYPos * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.55}
                    max={0.75}
                    step={0.01}
                    value={metatarsalYPos}
                    onChange={(e) => setMetatarsalYPos(parseFloat(e.target.value))}
                    className="w-full accent-cyan-600"
                  />
                </div>
              </div>
            </div>
          ) : inspectorTab === "LAYERS" ? (
            /* Layer Visibility Controls */
            <div className="space-y-2">
              {[
                { label: "Kontur Luar Sol (EVA Cut)", state: showOutline, setter: setShowOutline, color: "bg-[#8B0000]" },
                { label: "Plat Arch Shank (TPU Bridge)", state: showArchPlate, setter: setShowArchPlate, color: "bg-red-500" },
                { label: "Mangkuk Tumit (Heel Cup)", state: showHeelCup, setter: setShowHeelCup, color: "bg-emerald-500" },
                { label: "Kubah Metatarsal Pad", state: showMetatarsal, setter: setShowMetatarsal, color: "bg-cyan-500" },
                { label: "Garis Ukur Dimensi CAD (mm)", state: showDimensions, setter: setShowDimensions, color: "bg-blue-500" },
                { label: "Grid Matriks Milimeter", state: showGrid, setter: setShowGrid, color: "bg-gray-400" },
              ].map((item, idx) => (
                <label
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">{item.label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.state}
                    onChange={(e) => item.setter(e.target.checked)}
                    className="rounded text-[#8B0000] focus:ring-0"
                  />
                </label>
              ))}
            </div>
          ) : (
            /* Manufacturing Specs & Yield Calculations */
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 space-y-2">
                <span className="font-bold text-[11px] text-gray-500 uppercase block">Kalkulasi Material Insole</span>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Tebal Forefoot</span>
                    <span className="font-bold">{forefootThickness} mm</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Tebal Heel Drop</span>
                    <span className="font-bold">{heelThickness} mm</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Luas Area Potong</span>
                    <span className="font-bold">~{Math.round(geometry.length * ballWidth * 0.007)} cm²</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Yield per Lembar EVA</span>
                    <span className="font-bold">~18-22 psg</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Tipe Material EVA / PU</label>
                <input
                  type="text"
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 font-semibold text-xs text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Dedicated AI & EXPORT Panel (Mobile EXPORT view only) */}
        {mobileCadView === "EXPORT" && (
          <div className="md:hidden w-full flex-1 p-4 space-y-4 overflow-y-auto pb-24 bg-white dark:bg-gray-900 text-xs">
            <div className="space-y-1">
              <h3 className="font-black text-sm text-gray-900 dark:text-white">
                Generative AI & Ekspor CAD
              </h3>
              <p className="text-xs text-gray-500">
                Gunakan asisten AI untuk memformulasikan sol atau unduh format CNC
              </p>
            </div>

            {/* AI Generator Trigger */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-700 to-[#8B0000] text-white text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
              <span>Prompt AI Generative Insole</span>
            </button>

            {/* Preset Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">Pilih Preset Model Pabrik</label>
              <select
                onChange={(e) => {
                  const p = INSOLE_PRESETS.find((pr) => pr.id === e.target.value);
                  if (p) {
                    handleApplyPreset(p);
                    setMobileCadView("CANVAS");
                  }
                }}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold"
              >
                <option value="">Pilih Preset Pabrik...</option>
                {INSOLE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.archProfile})
                  </option>
                ))}
              </select>
            </div>

            {/* Save Blueprint */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <label className="text-[10px] font-bold uppercase text-gray-400 block">Nama Blueprint Model</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={blueprintName}
                  onChange={(e) => setBlueprintName(e.target.value)}
                  className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs font-semibold"
                />
                <button
                  onClick={handleSaveBlueprint}
                  className="px-4 py-2 rounded-xl bg-[#8B0000] text-white font-bold text-xs shadow-xs active:scale-95"
                >
                  Simpan
                </button>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="text-[10px] font-bold uppercase text-gray-400 block">Unduh Berkas CAD & Vektor</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExportDxf}
                  disabled={exporting === "DXF"}
                  className="py-3 rounded-xl bg-[#8B0000] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  <span>{exporting === "DXF" ? "Exporting..." : "DXF (R12 / Corel)"}</span>
                </button>
                <button
                  onClick={handleExportSvg}
                  disabled={exporting === "SVG"}
                  className="py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Vektor SVG</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Insole Generative Modal */}
      <CadAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyGeneratedModel={handleApplyAiGeneration}
        language={language}
      />

      {/* Blueprint Library Catalog Modal */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#8B0000] text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Katalog Blueprint Insole Tersimpan</h3>
              <button onClick={() => setIsLibraryOpen(false)} className="p-1 rounded-lg hover:bg-white/10">✕</button>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto flex-1 text-xs">
              {savedBlueprints.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Belum ada blueprint tersimpan.</p>
              ) : (
                savedBlueprints.map((bp) => (
                  <div
                    key={bp.id}
                    onClick={() => handleLoadBlueprint(bp)}
                    className="p-3 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-[#8B0000] cursor-pointer flex items-center justify-between transition"
                  >
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">{bp.name}</h4>
                      <p className="text-[11px] text-gray-500">
                        Size EU {bp.shoeSize} • Panjang: {bp.baseLengthMm} mm • Arch: {bp.archProfile}
                      </p>
                    </div>
                    <button className="px-3 py-1 rounded-xl bg-red-50 text-[#8B0000] font-bold text-xs">
                      Muat
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
