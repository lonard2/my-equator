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
} from "lucide-react";
import { CadAiModal } from "./CadAiModal";

interface CadStudioProps {
  language: "id" | "en";
}

export function CadStudio({ language }: CadStudioProps) {
  const isId = language === "id";

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

  // Load Saved Blueprints
  const fetchBlueprints = async () => {
    try {
      const res = await fetch("/api/cad/blueprints");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSavedBlueprints(json.data);
      }
    } catch (err) {
      console.error("Failed to load blueprints:", err);
    }
  };

  useEffect(() => {
    fetchBlueprints();
  }, []);

  // Compute Current Geometry
  const conversion = convertSizing(sizingSystem, rawSizeValue);
  const effectiveLength = sizingSystem === "CUSTOM_MM" ? customLengthMm : conversion.insoleLengthMm;

  const geometry: InsoleGeometry = buildInsoleGeometry({
    sizingSystem,
    rawSizeValue,
    baseLengthMm: effectiveLength,
    ballWidthMm: ballWidth,
    heelWidthMm: heelWidth,
    waistWidthMm: waistWidth,
    archProfile,
    archOffsetFactor: archFactor,
    toeShape,
    archPlateLengthFactor: archPlateLength,
    archPlateWidthFactor: archPlateWidth,
    archPlateLateralWing,
    heelCupDepthProfile: heelCupDepth,
    heelCupRadiusFactor: heelCupRadius,
    metatarsalPadSizeFactor: metatarsalSize,
    metatarsalPadYPosition: metatarsalYPos,
  });

  // Apply Preset
  const handleApplyPreset = (preset: typeof INSOLE_PRESETS[0]) => {
    setArchProfile(preset.archProfile);
    setArchFactor(preset.archOffsetFactor);
    setToeShape(preset.toeShape);
    setForefootThickness(preset.thicknessForefootMm);
    setHeelThickness(preset.thicknessHeelMm);
    setMaterialType(preset.materialType);
    if (preset.archPlateLengthFactor) setArchPlateLength(preset.archPlateLengthFactor);
    if (preset.archPlateWidthFactor) setArchPlateWidth(preset.archPlateWidthFactor);
    if (preset.archPlateLateralWing !== undefined) setArchPlateLateralWing(preset.archPlateLateralWing);
    if (preset.heelCupDepthProfile) setHeelCupDepth(preset.heelCupDepthProfile);
    if (preset.heelCupRadiusFactor) setHeelCupRadius(preset.heelCupRadiusFactor);
    if (preset.metatarsalPadSizeFactor) setMetatarsalSize(preset.metatarsalPadSizeFactor);
    if (preset.metatarsalPadYPosition) setMetatarsalYPos(preset.metatarsalPadYPosition);
    setBlueprintName(`${preset.name} ${geometry.sizingLabel}`);
  };

  // Apply Generative AI Model
  const handleApplyAiGenerated = (params: any) => {
    setBlueprintName(params.name || "Generative AI Insole");
    if (params.sizingSystem) setSizingSystem(params.sizingSystem);
    if (params.rawSizeValue) setRawSizeValue(params.rawSizeValue);
    if (params.archProfile) setArchProfile(params.archProfile);
    if (params.archOffsetFactor) setArchFactor(params.archOffsetFactor);
    if (params.toeShape) setToeShape(params.toeShape);
    if (params.thicknessForefootMm) setForefootThickness(params.thicknessForefootMm);
    if (params.thicknessHeelMm) setHeelThickness(params.thicknessHeelMm);
    if (params.materialType) setMaterialType(params.materialType);
    if (params.archPlateLengthFactor) setArchPlateLength(params.archPlateLengthFactor);
    if (params.archPlateWidthFactor) setArchPlateWidth(params.archPlateWidthFactor);
    if (params.archPlateLateralWing !== undefined) setArchPlateLateralWing(params.archPlateLateralWing);
    if (params.heelCupDepthProfile) setHeelCupDepth(params.heelCupDepthProfile);
    if (params.heelCupRadiusFactor) setHeelCupRadius(params.heelCupRadiusFactor);
    if (params.metatarsalPadSizeFactor) setMetatarsalSize(params.metatarsalPadSizeFactor);
    if (params.metatarsalPadYPosition) setMetatarsalYPos(params.metatarsalPadYPosition);
  };

  // Export DXF
  const handleExportDxf = async () => {
    setExporting("DXF");
    try {
      const res = await fetch("/api/cad/export-dxf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sizingSystem,
          rawSizeValue,
          baseLengthMm: effectiveLength,
          ballWidthMm: ballWidth,
          heelWidthMm: heelWidth,
          waistWidthMm: waistWidth,
          archProfile,
          archOffsetFactor: archFactor,
          toeShape,
          foot,
          archPlateLengthFactor: archPlateLength,
          archPlateWidthFactor: archPlateWidth,
          archPlateLateralWing,
          heelCupDepthProfile: heelCupDepth,
          heelCupRadiusFactor: heelCupRadius,
          metatarsalPadSizeFactor: metatarsalSize,
          metatarsalPadYPosition: metatarsalYPos,
        }),
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Equator_Insole_${geometry.sizingLabel.replace(/\s+/g, "_")}_${foot}.dxf`;
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
    setExporting("SVG");
    try {
      const res = await fetch("/api/cad/export-svg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sizingSystem,
          rawSizeValue,
          baseLengthMm: effectiveLength,
          ballWidthMm: ballWidth,
          heelWidthMm: heelWidth,
          waistWidthMm: waistWidth,
          archProfile,
          archOffsetFactor: archFactor,
          toeShape,
          foot,
          archPlateLengthFactor: archPlateLength,
          archPlateWidthFactor: archPlateWidth,
          archPlateLateralWing,
          heelCupDepthProfile: heelCupDepth,
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
      {/* Top Header & Action Controls */}
      <div className="p-3.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-red-50 dark:bg-red-950/60 text-[#8B0000] dark:text-red-400">
            <Compass className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-2">
              <span>{isId ? "Studio Insole CAD & Generative Vector" : "Insole CAD & Generative Vector Studio"}</span>
              <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-[10px] font-bold text-[#8B0000] dark:text-red-300">
                CorelDRAW & AutoCAD R12 DXF
              </span>
            </h2>
            <p className="text-xs text-gray-500">
              {isId
                ? "Generator kontur sol anatomis dengan kustomisasi layer ortotik independen"
                : "Anatomical parametric insole generator with customizable orthotic component layers"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Generative AI Designer Trigger */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-700 to-[#8B0000] hover:from-red-800 hover:to-[#A00000] text-white text-xs font-bold shadow-md hover:shadow-red-900/30 active:scale-95 transition"
          >
            <Sparkles className="h-4 w-4 animate-pulse text-amber-300" />
            <span>{isId ? "Prompt AI Insole" : "AI Insole Generator"}</span>
          </button>

          {/* Preset Selector */}
          <select
            onChange={(e) => {
              const p = INSOLE_PRESETS.find((pr) => pr.id === e.target.value);
              if (p) handleApplyPreset(p);
            }}
            className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:border-[#8B0000] focus:outline-none shadow-xs"
          >
            <option value="">{isId ? "Pilih Preset Pabrik..." : "Preset Catalog..."}</option>
            {INSOLE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.archProfile})
              </option>
            ))}
          </select>

          {/* Catalog Library */}
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 active:scale-95 transition shadow-xs"
          >
            <FolderOpen className="h-4 w-4 text-[#8B0000]" />
            <span className="hidden sm:inline">{isId ? "Katalog" : "Library"}</span>
          </button>

          {/* Save Blueprint */}
          <button
            onClick={handleSaveBlueprint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 active:scale-95 transition shadow-xs"
            title="Simpan Blueprint"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">{isId ? "Simpan" : "Save"}</span>
          </button>

          {/* Export DXF */}
          <button
            onClick={handleExportDxf}
            disabled={exporting === "DXF"}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#8B0000] hover:bg-[#A00000] text-xs font-bold text-white shadow-md active:scale-95 transition disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{exporting === "DXF" ? "Exporting..." : "DXF (R12)"}</span>
          </button>

          {/* Export SVG */}
          <button
            onClick={handleExportSvg}
            disabled={exporting === "SVG"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 active:scale-95 transition shadow-xs"
          >
            <Share2 className="h-4 w-4" />
            <span>SVG</span>
          </button>
        </div>
      </div>

      {/* Main Multi-Pane Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Toolbar: Base Sizing & Outline Parameters */}
        <div className="w-full md:w-80 lg:w-88 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4 overflow-y-auto shrink-0 text-xs">
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
                  className={`py-1.5 rounded-xl font-bold text-[11px] transition active:scale-95 ${
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
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setRawSizeValue(Math.max(1, Math.round((rawSizeValue - 0.5) * 10) / 10))}
                    className="p-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 font-bold px-3"
                  >
                    -
                  </button>
                  <div className="text-center flex-1">
                    <span className="text-base font-extrabold text-gray-900 dark:text-white font-mono">
                      {rawSizeValue}
                    </span>
                    <p className="text-[10px] text-gray-500 font-mono">
                      (Equiv: EU {conversion.eu} • UK {conversion.uk} • US {conversion.usMen})
                    </p>
                  </div>
                  <button
                    onClick={() => setRawSizeValue(Math.round((rawSizeValue + 0.5) * 10) / 10)}
                    className="p-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 font-bold px-3"
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
                className={`py-2 rounded-xl font-bold text-xs transition active:scale-95 ${
                  foot === "RIGHT"
                    ? "bg-red-50 dark:bg-red-950/60 border-2 border-[#8B0000] text-[#8B0000] dark:text-red-300 shadow-xs"
                    : "border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                {isId ? "Kaki Kanan (Right)" : "Right Foot"}
              </button>
              <button
                onClick={() => setFoot("LEFT")}
                className={`py-2 rounded-xl font-bold text-xs transition active:scale-95 ${
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
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs font-semibold"
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
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs font-semibold"
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

        {/* Center Interactive SVG / CAD Viewport */}
        <div
          className="flex-1 relative bg-gray-900 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
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
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
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

            {/* Right Sidebar Collapse / Expand Button */}
            <div className="pointer-events-auto">
              <button
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                className="p-2 rounded-2xl bg-gray-900/85 backdrop-blur-md border border-gray-700 hover:bg-gray-800 text-white active:scale-95 transition shadow-xl flex items-center gap-1.5 text-xs font-semibold"
                title={isRightSidebarOpen ? (isId ? "Tutup Panel Samping" : "Close Inspector") : (isId ? "Buka Panel Samping" : "Open Inspector")}
              >
                {isRightSidebarOpen ? (
                  <>
                    <PanelRightClose className="h-4 w-4 text-red-400" />
                    <span className="hidden sm:inline text-[11px]">{isId ? "Tutup Panel" : "Hide"}</span>
                  </>
                ) : (
                  <>
                    <PanelRightOpen className="h-4 w-4 text-red-400" />
                    <span className="hidden sm:inline text-[11px]">{isId ? "Komponen Ortotik & Layer" : "Layers & Components"}</span>
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
                width: `${vbW * 1.55}px`,
                height: `${vbH * 1.55}px`,
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
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between p-2.5 rounded-2xl bg-gray-900/85 backdrop-blur-md border border-gray-800 text-white text-xs">
            <div className="flex items-center gap-4 font-mono">
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
            <span className="text-[10px] text-gray-400 font-semibold hidden sm:inline">
              Equator Anatomical CAD Engine v3.0
            </span>
          </div>
        </div>

        {/* Right Inspector: Customizable Orthotic Components, Layers & Specs */}
        <div
          className={`transition-all duration-200 shrink-0 ${
            isRightSidebarOpen
              ? "w-full md:w-80 lg:w-88 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4 overflow-y-auto"
              : "w-0 p-0 border-none overflow-hidden"
          } text-xs`}
        >
          {/* Inspector Mode Switcher */}
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-gray-100 dark:bg-gray-800 p-1 font-bold text-[10px]">
            <button
              onClick={() => setInspectorTab("COMPONENTS")}
              className={`py-1.5 rounded-xl transition ${
                inspectorTab === "COMPONENTS"
                  ? "bg-white dark:bg-gray-700 text-[#8B0000] dark:text-red-300 shadow-xs"
                  : "text-gray-500"
              }`}
            >
              Komponen
            </button>
            <button
              onClick={() => setInspectorTab("LAYERS")}
              className={`py-1.5 rounded-xl transition ${
                inspectorTab === "LAYERS"
                  ? "bg-white dark:bg-gray-700 text-[#8B0000] dark:text-red-300 shadow-xs"
                  : "text-gray-500"
              }`}
            >
              Layers
            </button>
            <button
              onClick={() => setInspectorTab("SPECS")}
              className={`py-1.5 rounded-xl transition ${
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
                      className={`py-1 rounded-lg font-bold transition ${
                        heelCupDepth === dp
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {dp === "SHALLOW" ? "Dangkal" : dp === "MEDIUM" ? "Standar" : "Dalam (12mm)"}
                    </button>
                  ))}
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                    <span>Radius Cekungan Mangkok:</span>
                    <span className="font-bold">{heelCupRadius.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.70}
                    max={1.30}
                    step={0.05}
                    value={heelCupRadius}
                    onChange={(e) => setHeelCupRadius(parseFloat(e.target.value))}
                    className="w-full accent-emerald-700"
                  />
                </div>
              </div>

              {/* 3. Metatarsal Dome Customizer */}
              <div className="p-3 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-cyan-950 dark:text-cyan-300">
                    Kubah Metatarsal (Dome Pad)
                  </span>
                  <span className="font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-400">
                    {metatarsalSize.toFixed(2)}x
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                    <span>Ukuran Kubah:</span>
                    <span className="font-bold">{metatarsalSize.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.60}
                    max={1.40}
                    step={0.05}
                    value={metatarsalSize}
                    onChange={(e) => setMetatarsalSize(parseFloat(e.target.value))}
                    className="w-full accent-cyan-700"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                    <span>Posisi Longitudinal (Y):</span>
                    <span className="font-bold">{Math.round(metatarsalYPos * 100)}% L</span>
                  </div>
                  <input
                    type="range"
                    min={0.58}
                    max={0.72}
                    step={0.01}
                    value={metatarsalYPos}
                    onChange={(e) => setMetatarsalYPos(parseFloat(e.target.value))}
                    className="w-full accent-cyan-700"
                  />
                </div>
              </div>
            </div>
          ) : inspectorTab === "LAYERS" ? (
            /* Layer Visibility Stack */
            <div className="space-y-2">
              <label className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-[#8B0000]" />
                <span>{isId ? "Visibilitas Layer DXF" : "DXF Layers"}</span>
              </label>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOutline}
                    onChange={(e) => setShowOutline(e.target.checked)}
                    className="rounded text-[#8B0000] focus:ring-0"
                  />
                  <span className="w-3 h-3 rounded-full bg-red-600 shrink-0" />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">CUT_OUTLINE (Pisau Potong)</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showArchPlate}
                    onChange={(e) => setShowArchPlate(e.target.checked)}
                    className="rounded text-[#8B0000] focus:ring-0"
                  />
                  <span className="w-3 h-3 rounded-full bg-red-400 shrink-0" />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">ARCH_SUPPORT (Plat TPU)</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showHeelCup}
                    onChange={(e) => setShowHeelCup(e.target.checked)}
                    className="rounded text-[#8B0000] focus:ring-0"
                  />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">HEEL_CUP (Bantalan Tumit)</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMetatarsal}
                    onChange={(e) => setShowMetatarsal(e.target.checked)}
                    className="rounded text-[#8B0000] focus:ring-0"
                  />
                  <span className="w-3 h-3 rounded-full bg-cyan-500 shrink-0" />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">METATARSAL (Kubah Depan)</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDimensions}
                    onChange={(e) => setShowDimensions(e.target.checked)}
                    className="rounded text-[#8B0000] focus:ring-0"
                  />
                  <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">DIMENSIONS (Garis Ukur)</span>
                </label>
              </div>
            </div>
          ) : (
            /* Material & Thickness Specs */
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px]">
                  {isId ? "Spesifikasi Ketebalan Moulding" : "Thickness & Moulding"}
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500">Tebal Depan (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={forefootThickness}
                      onChange={(e) => setForefootThickness(parseFloat(e.target.value) || 3)}
                      className="w-full rounded-lg border px-2 py-1 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500">Tebal Tumit (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={heelThickness}
                      onChange={(e) => setHeelThickness(parseFloat(e.target.value) || 5)}
                      className="w-full rounded-lg border px-2 py-1 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-gray-500">Material Formula</label>
                  <input
                    type="text"
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className="w-full rounded-lg border px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* CNC Yield */}
              <div className="p-3.5 rounded-2xl bg-red-50/70 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 space-y-2">
                <h4 className="font-extrabold text-xs text-[#8B0000] dark:text-red-300 flex items-center gap-1.5">
                  <Info className="h-4 w-4" />
                  <span>{isId ? "Estimasi Yield Pemotongan EVA" : "EVA Cutting Yield"}</span>
                </h4>
                <div className="text-[11px] text-gray-700 dark:text-gray-300 space-y-1">
                  <p>
                    Lembar EVA Standar: <strong>1.2m x 2.4m</strong>
                  </p>
                  <p>
                    Hasil Potong: <strong>~14 pasang</strong> / lembar
                  </p>
                  <p>
                    Keliling Pisau: <strong>~{Math.round(geometry.length * 2.2)} mm</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generative AI Insole Modal */}
      <CadAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyGeneratedModel={handleApplyAiGenerated}
        language={language}
      />

      {/* Blueprint Library Drawer Modal */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-[#8B0000]" />
                <span>{isId ? "Katalog Blueprint Insole Tersimpan" : "Saved Insole Blueprints"}</span>
              </h3>
              <button
                onClick={() => setIsLibraryOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {savedBlueprints.map((bp) => (
                <div
                  key={bp.id}
                  className="p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 flex items-center justify-between hover:border-red-300 transition"
                >
                  <div>
                    <p className="font-bold text-xs text-gray-900 dark:text-white">{bp.name}</p>
                    <p className="text-[11px] text-gray-500 font-mono">
                      EU {bp.shoeSize} • L:{bp.baseLengthMm}mm • W:{bp.ballWidthMm}mm • {bp.archProfile} Arch
                    </p>
                  </div>
                  <button
                    onClick={() => handleLoadBlueprint(bp)}
                    className="px-3 py-1.5 rounded-xl bg-[#8B0000] text-white text-xs font-bold shadow-xs active:scale-95 transition"
                  >
                    {isId ? "Buka di CAD" : "Load"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
