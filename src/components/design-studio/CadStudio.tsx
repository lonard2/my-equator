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
  SIZING_BOUNDS,
  migrateSizingValue,
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
  Sparkles,
  FolderOpen,
  Wrench,
  PanelRightClose,
  PanelRightOpen,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  X,
  HelpCircle,
  Keyboard,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { CadAiModal } from "./CadAiModal";

interface SavedBlueprint {
  id: string;
  name: string;
  articleCode?: string;
  customLengthMm?: number;
  sizingSystem?: SizingSystem;
  rawSizeValue?: number;
  shoeSize?: number;
  foot?: FootType;
  archProfile?: ArchProfile;
  archFactor?: number;
  toeShape?: ToeShape;
  ballWidthMm?: number;
  heelWidthMm?: number;
  waistWidthMm?: number;
  thicknessForefootMm?: number;
  thicknessHeelMm?: number;
  materialType?: string;
  archPlateLengthFactor?: number;
  archPlateWidthFactor?: number;
  archPlateLateralWing?: boolean;
  heelCupDepth?: HeelCupDepthProfile;
  heelCupRadiusFactor?: number;
  metatarsalPadSizeFactor?: number;
  metatarsalPadYPosition?: number;
}

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
  const [savedBlueprints, setSavedBlueprints] = useState<SavedBlueprint[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryError, setLibraryError] = useState(false);
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<"COMPONENTS" | "LAYERS" | "SPECS">("COMPONENTS");
  const [isCncPreFlightOpen, setIsCncPreFlightOpen] = useState(false);
  const libraryOpenerRef = useRef<HTMLElement | null>(null);
  const cncOpenerRef = useRef<HTMLElement | null>(null);
  const libraryCloseRef = useRef<HTMLButtonElement | null>(null);
  const cncCloseRef = useRef<HTMLButtonElement | null>(null);
  const cncLastBtnRef = useRef<HTMLButtonElement | null>(null);

  // Shared modal focus contract: move focus in on open, restore on close
  useEffect(() => {
    if (isLibraryOpen) libraryCloseRef.current?.focus();
    if (!isLibraryOpen && libraryOpenerRef.current) {
      libraryOpenerRef.current.focus();
      libraryOpenerRef.current = null;
    }
  }, [isLibraryOpen]);

  useEffect(() => {
    if (isCncPreFlightOpen) cncCloseRef.current?.focus();
    if (!isCncPreFlightOpen && cncOpenerRef.current) {
      cncOpenerRef.current.focus();
      cncOpenerRef.current = null;
    }
  }, [isCncPreFlightOpen]);

  const trapModalTab = (e: React.KeyboardEvent, firstRef: React.RefObject<HTMLElement | null>, lastRef: React.RefObject<HTMLElement | null>) => {
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
  const [exporting, setExporting] = useState<"DXF" | "SVG" | null>(null);
  const [isSavingBlueprint, setIsSavingBlueprint] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"success" | "error">("success");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [cursorMm, setCursorMm] = useState<{ x: number; y: number } | null>(null);
  const [baselineRef, setBaselineRef] = useState<string>("");
  // Once the operator types a caliper value, auto-recompute on size change stops.
  // Preset / blueprint load / AI apply reset this to auto (they legitimately set widths).
  const [manualWidths, setManualWidths] = useState(false);
  const [pendingOverwriteAction, setPendingOverwriteAction] = useState<(() => void) | null>(null);
  const cancelOverwriteRef = useRef<HTMLButtonElement | null>(null);
  const confirmOverwriteRef = useRef<HTMLButtonElement | null>(null);
  const shortcutsCloseRef = useRef<HTMLButtonElement | null>(null);
  const shortcutsGotItRef = useRef<HTMLButtonElement | null>(null);
  const shortcutsOpenerRef = useRef<HTMLButtonElement | null>(null);
  const activePointersRef = useRef<Map<number, { clientX: number; clientY: number }>>(new Map());
  const initialPinchDistRef = useRef<number | null>(null);
  const initialPinchZoomRef = useRef<number>(1);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isShortcutsOpen) shortcutsCloseRef.current?.focus();
    if (!isShortcutsOpen && shortcutsOpenerRef.current) {
      shortcutsOpenerRef.current.focus();
      shortcutsOpenerRef.current = null;
    }
  }, [isShortcutsOpen]);

  useEffect(() => {
    if (pendingOverwriteAction) cancelOverwriteRef.current?.focus();
  }, [pendingOverwriteAction]);

  const showToast = (msg: string, tone: "success" | "error" = "success") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastTone(tone);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);


  // Recalculate derived dimensions when sizing changes — unless the operator
  // has hand-entered caliper widths; measured data must survive size nudges.
  useEffect(() => {
    if (manualWidths) return;
    const conversion = convertSizing(sizingSystem, sizingSystem === "CUSTOM_MM" ? customLengthMm : rawSizeValue);
    const targetLength = sizingSystem === "CUSTOM_MM" ? customLengthMm : conversion.insoleLengthMm;
    const defaults = calculateDefaultWidths(targetLength);
    setBallWidth(defaults.ballWidth);
    setHeelWidth(defaults.heelWidth);
    setWaistWidth(defaults.waistWidth);
  }, [sizingSystem, rawSizeValue, customLengthMm, manualWidths]);

  // Fetch Blueprints
  const fetchBlueprints = async () => {
    try {
      const res = await fetch("/api/cad/blueprints");
      const json = await res.json();
      if (json.success) {
        setSavedBlueprints(json.data || []);
        setLibraryError(false);
      } else {
        setLibraryError(true);
      }
    } catch (err) {
      console.error("Failed to load blueprints:", err);
      setLibraryError(true);
    } finally {
      setIsLibraryLoading(false);
    }
  };

  useEffect(() => {
    fetchBlueprints();
    markClean();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "Escape") {
        if (pendingOverwriteAction) {
          e.preventDefault();
          setPendingOverwriteAction(null);
        } else if (isShortcutsOpen) {
          e.preventDefault();
          setIsShortcutsOpen(false);
        } else if (isCncPreFlightOpen) {
          e.preventDefault();
          setIsCncPreFlightOpen(false);
        } else if (isLibraryOpen) {
          e.preventDefault();
          setIsLibraryOpen(false);
        } else if (isAiModalOpen) {
          e.preventDefault();
          setIsAiModalOpen(false);
        } else if (activeTooltip) {
          e.preventDefault();
          setActiveTooltip(null);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
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
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 25;
        setPanOffset((p) => ({ ...p, x: p.x + step }));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 25;
        setPanOffset((p) => ({ ...p, x: p.x - step }));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 25;
        setPanOffset((p) => ({ ...p, y: p.y + step }));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 25;
        setPanOffset((p) => ({ ...p, y: p.y - step }));
      } else if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        setShowGrid((v) => !v);
      } else if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsShortcutsOpen((v) => !v);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [blueprintName, sizingSystem, rawSizeValue, customLengthMm, foot, archProfile, archFactor, toeShape, ballWidth, heelWidth, waistWidth, forefootThickness, heelThickness, materialType, archPlateLength, archPlateWidth, archPlateLateralWing, heelCupDepth, heelCupRadius, metatarsalSize, metatarsalYPos, pendingOverwriteAction, isCncPreFlightOpen, isLibraryOpen, isAiModalOpen, isShortcutsOpen, activeTooltip]);

  // Compute Active Sizing Conversion
  const conversion = convertSizing(sizingSystem, sizingSystem === "CUSTOM_MM" ? customLengthMm : rawSizeValue);
  const effectiveLength = sizingSystem === "CUSTOM_MM" ? customLengthMm : conversion.insoleLengthMm;

  // Build Insole Geometry
  const geometryParams: InsoleParameters = {
    shoeSize: conversion.eu,
    sizingSystem,
    rawSizeValue: sizingSystem === "CUSTOM_MM" ? customLengthMm : rawSizeValue,
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

  // Dirty tracking: any param drift from the last saved/loaded/applied baseline
  const paramsKey = JSON.stringify(geometryParams) + blueprintName;
  const isDirty = baselineRef !== "" && paramsKey !== baselineRef;

  // Any overwrite action (preset / blueprint load / AI apply) goes through the
  // truth gate when the workspace has unsaved changes.
  const confirmOverwrite = (applyFn: () => void) => {
    if (isDirty) {
      setPendingOverwriteAction(() => applyFn);
    } else {
      applyFn();
    }
  };

  const markClean = () => {
    setBaselineRef(JSON.stringify(geometryParams) + blueprintName);
    try {
      sessionStorage.removeItem("myequator_cad_draft");
    } catch {
      // ignore
    }
  };

  // Exit gate: browser-level guard (refresh/close) while the workspace is dirty
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Session draft: switching tabs unmounts this component — dirty params survive in
  // sessionStorage and are restored (and re-based) on return, with an honest notice.
  useEffect(() => {
    if (!isDirty) return;
    const draft = {
      blueprintName,
      sizingSystem,
      rawSizeValue,
      customLengthMm,
      foot,
      archProfile,
      archFactor,
      toeShape,
      ballWidth,
      heelWidth,
      waistWidth,
      forefootThickness,
      heelThickness,
      materialType,
      archPlateLength,
      archPlateWidth,
      archPlateLateralWing,
      heelCupDepth,
      heelCupRadius,
      metatarsalSize,
      metatarsalYPos,
      manualWidths,
    };
    try {
      sessionStorage.setItem("myequator_cad_draft", JSON.stringify(draft));
    } catch {
      // storage unavailable: exit gate (beforeunload) still covers refresh/close
    }
  }, [isDirty, blueprintName, sizingSystem, rawSizeValue, customLengthMm, foot, archProfile, archFactor, toeShape, ballWidth, heelWidth, waistWidth, forefootThickness, heelThickness, materialType, archPlateLength, archPlateWidth, archPlateLateralWing, heelCupDepth, heelCupRadius, metatarsalSize, metatarsalYPos, manualWidths]);

  useEffect(() => {
    let restored = false;
    try {
      const raw = sessionStorage.getItem("myequator_cad_draft");
      if (raw) {
        const d = JSON.parse(raw);
        if (d && typeof d === "object" && d.blueprintName) {
          if (typeof d.blueprintName === "string") setBlueprintName(d.blueprintName);
          if (d.sizingSystem) setSizingSystem(d.sizingSystem);
          if (typeof d.rawSizeValue === "number") setRawSizeValue(d.rawSizeValue);
          if (typeof d.customLengthMm === "number") setCustomLengthMm(d.customLengthMm);
          if (d.foot) setFoot(d.foot);
          if (d.archProfile) setArchProfile(d.archProfile);
          if (typeof d.archFactor === "number") setArchFactor(d.archFactor);
          if (d.toeShape) setToeShape(d.toeShape);
          if (typeof d.ballWidth === "number") setBallWidth(d.ballWidth);
          if (typeof d.heelWidth === "number") setHeelWidth(d.heelWidth);
          if (typeof d.waistWidth === "number") setWaistWidth(d.waistWidth);
          if (typeof d.forefootThickness === "number") setForefootThickness(d.forefootThickness);
          if (typeof d.heelThickness === "number") setHeelThickness(d.heelThickness);
          if (typeof d.materialType === "string") setMaterialType(d.materialType);
          if (typeof d.archPlateLength === "number") setArchPlateLength(d.archPlateLength);
          if (typeof d.archPlateWidth === "number") setArchPlateWidth(d.archPlateWidth);
          if (typeof d.archPlateLateralWing === "boolean") setArchPlateLateralWing(d.archPlateLateralWing);
          if (d.heelCupDepth) setHeelCupDepth(d.heelCupDepth);
          if (typeof d.heelCupRadius === "number") setHeelCupRadius(d.heelCupRadius);
          if (typeof d.metatarsalSize === "number") setMetatarsalSize(d.metatarsalSize);
          if (typeof d.metatarsalYPos === "number") setMetatarsalYPos(d.metatarsalYPos);
          if (typeof d.manualWidths === "boolean") setManualWidths(d.manualWidths);
          restored = true;
          setBaselineRef(""); // force isDirty=false on the next markClean pass
          sessionStorage.removeItem("myequator_cad_draft");
        }
      }
    } catch {
      // corrupted draft: start fresh
    }
    if (restored) {
      showToast(
        isId
          ? "Draf CAD yang belum disimpan dipulihkan dari sesi terakhir."
          : "Unsaved CAD draft restored from your last session."
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Real closed-loop manifold check from the generated outline points
  const isClosedLoop = (pts: { x: number; y: number }[] | undefined) => {
    if (!pts || pts.length < 3) return false;
    const first = pts[0];
    const last = pts[pts.length - 1];
    if (!Number.isFinite(first?.x) || !Number.isFinite(first?.y) || !Number.isFinite(last?.x) || !Number.isFinite(last?.y)) return false;
    return Math.hypot(first.x - last.x, first.y - last.y) < 0.5;
  };
  const manifoldRight = isClosedLoop(geometry.outlinePointsRight);
  const manifoldLeft = isClosedLoop(geometry.outlinePointsLeft);
  const manifoldVerified = manifoldRight && (foot === "RIGHT" ? true : manifoldLeft);

  // Apply Preset
  const handleApplyPreset = (preset: typeof INSOLE_PRESETS[0]) => {
    confirmOverwrite(() => {
    setArchProfile(preset.archProfile);
    setArchFactor(preset.archOffsetFactor);
    setToeShape(preset.toeShape);
    setForefootThickness(preset.thicknessForefootMm);
    setHeelThickness(preset.thicknessHeelMm);
    setMaterialType(preset.materialType);
    setBlueprintName(preset.name);
    setManualWidths(false);
    if (preset.archPlateLengthFactor) setArchPlateLength(preset.archPlateLengthFactor);
    if (preset.archPlateWidthFactor) setArchPlateWidth(preset.archPlateWidthFactor);
    if (preset.archPlateLateralWing !== undefined) setArchPlateLateralWing(preset.archPlateLateralWing);
    if (preset.heelCupDepthProfile) setHeelCupDepth(preset.heelCupDepthProfile);
    if (preset.heelCupRadiusFactor) setHeelCupRadius(preset.heelCupRadiusFactor);
    if (preset.metatarsalPadSizeFactor) setMetatarsalSize(preset.metatarsalPadSizeFactor);
    if (preset.metatarsalPadYPosition) setMetatarsalYPos(preset.metatarsalPadYPosition);
    showToast(isId ? `Preset "${preset.name}" diterapkan` : `Preset "${preset.name}" applied`);
    markClean();
    });
  };

  // Load Saved Blueprint
  const handleLoadSavedBlueprint = (bp: SavedBlueprint) => {
    confirmOverwrite(() => {
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
    setManualWidths(false);
    if (bp.archPlateLengthFactor) setArchPlateLength(bp.archPlateLengthFactor);
    if (bp.archPlateWidthFactor) setArchPlateWidth(bp.archPlateWidthFactor);
    if (bp.archPlateLateralWing !== undefined) setArchPlateLateralWing(bp.archPlateLateralWing);
    if (bp.heelCupDepth) setHeelCupDepth(bp.heelCupDepth);
    if (bp.heelCupRadiusFactor) setHeelCupRadius(bp.heelCupRadiusFactor);
    if (bp.metatarsalPadSizeFactor) setMetatarsalSize(bp.metatarsalPadSizeFactor);
    if (bp.metatarsalPadYPosition) setMetatarsalYPos(bp.metatarsalPadYPosition);
    setIsLibraryOpen(false);
    showToast(isId ? `Blueprint "${bp.name}" berhasil dimuat` : `Blueprint "${bp.name}" loaded`);
    markClean();
    });
  };

  // Apply Generative AI Insole Parameters
  // Payload boundary with the AI modal: fields are optional and loosely typed at the edge.
  const handleApplyAiGeneration = (aiData: any) => {
    confirmOverwrite(() => {
    if (aiData.sizingSystem) setSizingSystem(aiData.sizingSystem);
    if (aiData.rawSizeValue) setRawSizeValue(aiData.rawSizeValue);
    if (aiData.customLengthMm) setCustomLengthMm(aiData.customLengthMm);
    if (aiData.archProfile) setArchProfile(aiData.archProfile);
    if (aiData.archOffsetFactor !== undefined) setArchFactor(aiData.archOffsetFactor);
    else if (aiData.archFactor !== undefined) setArchFactor(aiData.archFactor);
    if (aiData.toeShape) setToeShape(aiData.toeShape);
    if (aiData.ballWidthMm) setBallWidth(aiData.ballWidthMm);
    if (aiData.heelWidthMm) setHeelWidth(aiData.heelWidthMm);
    if (aiData.waistWidthMm) setWaistWidth(aiData.waistWidthMm);
    if (aiData.thicknessForefootMm) setForefootThickness(aiData.thicknessForefootMm);
    if (aiData.thicknessHeelMm) setHeelThickness(aiData.thicknessHeelMm);
    if (aiData.materialType) setMaterialType(aiData.materialType);
    if (aiData.name) setBlueprintName(aiData.name);
    setManualWidths(false);
    if (aiData.archPlateLengthFactor) setArchPlateLength(aiData.archPlateLengthFactor);
    if (aiData.archPlateWidthFactor) setArchPlateWidth(aiData.archPlateWidthFactor);
    if (aiData.archPlateLateralWing !== undefined) setArchPlateLateralWing(aiData.archPlateLateralWing);
    if (aiData.heelCupDepthProfile) setHeelCupDepth(aiData.heelCupDepthProfile);
    else if (aiData.heelCupDepth) setHeelCupDepth(aiData.heelCupDepth);
    if (aiData.heelCupRadiusFactor) setHeelCupRadius(aiData.heelCupRadiusFactor);
    if (aiData.metatarsalPadSizeFactor) setMetatarsalSize(aiData.metatarsalPadSizeFactor);
    if (aiData.metatarsalPadYPosition) setMetatarsalYPos(aiData.metatarsalPadYPosition);
    setMobileCadView("CANVAS");
    showToast(isId ? "Desain AI berhasil diintegrasikan ke canvas CAD" : "AI Insole design loaded into CAD canvas");
    markClean();
    });
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
          showOutline,
          showArchPlate,
          showHeelCup,
          showMetatarsal,
        }),
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Equator_Insole_${geometry.sizingLabel.replace(/\s+/g, "_")}_${foot}_R12.dxf`;
      a.click();
      window.URL.revokeObjectURL(url);
      setExportError(null);
      showToast(isId ? "File AutoCAD R12 DXF berhasil diunduh" : "AutoCAD R12 DXF file downloaded");
    } catch (err) {
      console.error("DXF export failed:", err);
      const msg = isId ? "Gagal mengekspor file DXF." : "Failed to export DXF file.";
      setExportError(msg);
      showToast(msg, "error");
    } finally {
      setExporting(null);
    }
  };

  // Export SVG
  const handleExportSvg = async () => {
    try {
      setExporting("SVG");
      setExportError(null);
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
          showOutline,
          showArchPlate,
          showHeelCup,
          showMetatarsal,
        }),
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Equator_Insole_${geometry.sizingLabel.replace(/\s+/g, "_")}_${foot}.svg`;
      a.click();
      window.URL.revokeObjectURL(url);
      setExportError(null);
      showToast(isId ? "File Vector SVG berhasil diunduh" : "Vector SVG file downloaded");
    } catch (err) {
      console.error("SVG export failed:", err);
      const msg = isId ? "Gagal mengekspor file SVG." : "Failed to export SVG file.";
      setExportError(msg);
      showToast(msg, "error");
    } finally {
      setExporting(null);
    }
  };

  // Save Blueprint to Database
  const handleSaveBlueprint = async () => {
    if (isSavingBlueprint) return;
    setIsSavingBlueprint(true);
    setSaveError(null);
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
        setSaveError(null);
        showToast(isId ? "Blueprint CAD berhasil disimpan ke database!" : "CAD Blueprint saved to database!");
        markClean();
        fetchBlueprints();
      } else {
        const msg = json.error || (isId ? "Gagal menyimpan blueprint." : "Failed to save blueprint.");
        setSaveError(msg);
        showToast(json.error || (isId ? "Gagal menyimpan blueprint." : "Failed to save blueprint."), "error");
      }
    } catch (err) {
      console.error("Failed to save blueprint:", err);
      const msg = isId ? "Terjadi kesalahan saat menyimpan blueprint." : "Error saving blueprint.";
      setSaveError(msg);
      showToast(isId ? "Terjadi kesalahan saat menyimpan blueprint." : "Error saving blueprint.", "error");
    } finally {
      setIsSavingBlueprint(false);
    }
  };

  // Wheel zoom toward cursor on canvas viewport
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const nextZoom = Math.max(0.5, Math.min(2.5, Math.round(zoomScale * zoomFactor * 100) / 100));
    if (nextZoom === zoomScale) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;

    const scaleRatio = nextZoom / zoomScale;
    const nextPanX = mouseX - (mouseX - panOffset.x) * scaleRatio;
    const nextPanY = mouseY - (mouseY - panOffset.y) * scaleRatio;

    setZoomScale(nextZoom);
    setPanOffset({ x: nextPanX, y: nextPanY });
  };

  // Unified Pointer Handlers for Mouse & Touch Panning + Pinch-to-Zoom
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Don't start panning when the target is inside the overlay toolbar —
    // setPointerCapture would redirect events and kill the button clicks.
    const target = e.target as HTMLElement;
    if (target.closest("button, [role='button'], input, select, textarea")) return;

    activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
      initialPinchDistRef.current = dist;
      initialPinchZoomRef.current = zoomScale;
      setIsPanning(false);
    } else if (activePointersRef.current.size === 1) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
    try {
      (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
    }

    if (activePointersRef.current.size === 2 && initialPinchDistRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
      const ratio = dist / initialPinchDistRef.current;
      const nextZoom = Math.max(0.5, Math.min(2.5, Math.round(initialPinchZoomRef.current * ratio * 100) / 100));
      setZoomScale(nextZoom);
    } else if (isPanning && activePointersRef.current.size === 1) {
      setPanOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      initialPinchDistRef.current = null;
    }
    if (activePointersRef.current.size === 0) {
      setIsPanning(false);
    }
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
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-gray-950 text-gray-100">
      {/* Toast Notification (Accessible Live Region) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={
          toastMessage
            ? "fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-gray-900 text-white border border-gray-700 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3"
            : "sr-only"
        }
      >
        {toastMessage && (
          <>
            {toastTone === "error" ? (
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage}</span>
          </>
        )}
      </div>

      {/* Top Header Bar */}
      <div className="p-3 sm:p-4 border-b border-gray-800 bg-gray-900/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand/20 text-brand dark:text-red-400 border border-brand/30 shrink-0">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white leading-tight flex items-center gap-2">
                <span>{isId ? "Insole CAD & Generative Design Studio" : "Insole CAD & Design Studio"}</span>
                {isDirty && (
                  <span
                    data-testid="cad-unsaved-dot"
                    title={isId ? "Ada perubahan belum disimpan" : "Unsaved changes"}
                    aria-label={isId ? "Ada perubahan belum disimpan" : "Unsaved changes"}
                    className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                  />
                )}
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
            onClick={(e) => {
              libraryOpenerRef.current = e.currentTarget;
              setIsLibraryOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-bold active:scale-95 transition"
            title={isId ? "Buka Arsip Blueprint Tersimpan" : "Open Saved Blueprint Archive"}
          >
            <FolderOpen className="h-4 w-4 text-amber-400" />
            <span>{isId ? "Arsip CAD" : "Library"}</span>
            {savedBlueprints.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-gray-700 text-gray-200 text-[10px] font-mono">
                {savedBlueprints.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-brand hover:bg-brand-strong text-white text-xs font-bold shadow-xs active:scale-95 transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>{isId ? "Model Generatif AI" : "AI Generative Model"}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              cncOpenerRef.current = e.currentTarget;
              setIsCncPreFlightOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:border-brand hover:text-brand text-xs font-bold active:scale-95 transition"
          >
            <Scissors className="h-4 w-4" />
            <span>{isId ? "Verifikasi & Ekspor CNC" : "CNC Pre-Flight & Export"}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveBlueprint}
            disabled={isSavingBlueprint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-bold active:scale-95 transition disabled:opacity-50"
            title="Ctrl+S / Cmd+S"
          >
            {isSavingBlueprint ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden sm:inline">{isSavingBlueprint ? (isId ? "Menyimpan..." : "Saving...") : isId ? "Simpan" : "Save"}</span>
          </button>
        </div>
      </div>

      {/* Persistent Inline Save Failure Card (mirroring Library/AI pattern) */}
      {saveError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mx-3 mt-2 sm:mx-4 sm:mt-3 p-3 rounded-xl bg-red-950/70 border border-red-800 text-xs text-red-200 flex items-center justify-between gap-3 shrink-0 animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{saveError}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSaveBlueprint}
              className="px-3 py-1.5 rounded-lg bg-red-900 hover:bg-red-800 text-white font-bold text-xs transition"
            >
              {isId ? "Coba Lagi" : "Retry"}
            </button>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              className="p-1 rounded-lg hover:bg-red-900/50 text-red-300 transition"
              aria-label={isId ? "Tutup peringatan" : "Dismiss alert"}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Mode Switcher Bar (md:hidden) */}
      <div className="md:hidden p-2 border-b border-gray-800 bg-gray-900 flex items-center justify-between text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileCadView("CANVAS")}
          className={`flex-1 py-2 rounded-xl text-center transition ${
            mobileCadView === "CANVAS" ? "bg-brand text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          {isId ? "1. Canvas" : "1. Canvas"}
        </button>
        <button
          type="button"
          onClick={() => setMobileCadView("PARAMETERS")}
          className={`flex-1 py-2 rounded-xl text-center transition ${
            mobileCadView === "PARAMETERS" ? "bg-brand text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          {isId ? "2. Ukuran" : "2. Sizing"}
        </button>
        <button
          type="button"
          onClick={() => setMobileCadView("ORTHOTICS")}
          className={`flex-1 py-2 rounded-xl text-center transition ${
            mobileCadView === "ORTHOTICS" ? "bg-brand text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          {isId ? "3. Ortotik" : "3. Orthotics"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMobileCadView("EXPORT");
            setInspectorTab("SPECS");
          }}
          className={`flex-1 py-2 rounded-xl text-center transition ${
            mobileCadView === "EXPORT" ? "bg-brand text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          {isId ? "4. Ekspor" : "4. Export"}
        </button>
      </div>

      {/* Main CAD Studio Body Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Sidebar: Sizing, Presets, and Caliper Parameters */}
        <div
          className={`w-full md:w-80 lg:w-88 border-r border-gray-800 bg-gray-900/95 overflow-y-auto min-h-0 shrink-0 p-4 space-y-4 text-xs ${
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
              className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-1.5 text-white font-bold text-xs focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
              placeholder="e.g. Ergonomic Running Insole"
            />
          </div>

          {/* Sizing Standard Selector */}
          <div className="p-3.5 rounded-xl bg-gray-800/60 border border-gray-700/60 space-y-2.5">
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
                  onClick={() => {
                    const currentVal = sizingSystem === "CUSTOM_MM" ? customLengthMm : rawSizeValue;
                    const nextVal = migrateSizingValue(sizingSystem, sys, currentVal);
                    if (sys === "CUSTOM_MM") {
                      setCustomLengthMm(nextVal);
                    } else {
                      setRawSizeValue(nextVal);
                    }
                    setSizingSystem(sys);
                  }}
                  className={`py-1.5 rounded-lg text-[10px] font-bold border transition ${
                    sizingSystem === sys
                      ? "bg-brand text-white border-brand"
                      : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
                  }`}
                >
                  {sys.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* Size Slider or Custom Input */}
            {/* Size Slider or Custom Input */}
            {sizingSystem === "CUSTOM_MM" ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase text-gray-400">
                    {isId ? "Panjang Kustom" : "Custom Length"}
                  </label>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {SIZING_BOUNDS.CUSTOM_MM.min}–{SIZING_BOUNDS.CUSTOM_MM.max} mm
                  </span>
                </div>
                <input
                  type="number"
                  step={SIZING_BOUNDS.CUSTOM_MM.step}
                  min={SIZING_BOUNDS.CUSTOM_MM.min}
                  max={SIZING_BOUNDS.CUSTOM_MM.max}
                  value={customLengthMm}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setCustomLengthMm(isNaN(v) ? (e.target.value as any) : v);
                  }}
                  onBlur={(e) => {
                    const v = parseFloat(e.target.value);
                    const clamped = isNaN(v)
                      ? 260
                      : Math.max(SIZING_BOUNDS.CUSTOM_MM.min, Math.min(SIZING_BOUNDS.CUSTOM_MM.max, v));
                    setCustomLengthMm(clamped);
                  }}
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-1.5 font-mono font-bold text-white text-xs focus:border-brand focus:outline-none"
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
                  min={SIZING_BOUNDS[sizingSystem]?.min ?? 4}
                  max={SIZING_BOUNDS[sizingSystem]?.max ?? 48}
                  step={SIZING_BOUNDS[sizingSystem]?.step ?? 1}
                  value={rawSizeValue}
                  onChange={(e) => setRawSizeValue(parseFloat(e.target.value))}
                  className="w-full accent-brand"
                />
              </div>
            )}
          </div>

          {/* Foot Laterality (Left / Right / Pair Switcher) */}
          <div className="p-3.5 rounded-xl bg-gray-800/60 border border-gray-700/60 space-y-2">
            <span className="text-[10px] font-bold uppercase text-gray-400 block">
              {isId ? "Orientasi Kaki (Simetri)" : "Foot Symmetry & Laterality"}
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setFoot("LEFT")}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  foot === "LEFT"
                    ? "bg-brand text-white border-brand shadow-xs"
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
                    ? "bg-brand text-white border-brand shadow-xs"
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
                    ? "bg-brand text-white border-brand shadow-xs"
                    : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
                }`}
              >
                {isId ? "Sepasang (Pair)" : "Pair (L+R)"}
              </button>
            </div>
          </div>

          {/* Caliper Direct-Entry & Width Adjusters */}
          <div className="p-3.5 rounded-xl bg-gray-800/60 border border-gray-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-gray-400">
                {isId ? "Pengukuran Caliper Presisi (mm)" : "Precision Caliper Dimensions (mm)"}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setManualWidths(false);
                    const conversion = convertSizing(sizingSystem, sizingSystem === "CUSTOM_MM" ? customLengthMm : rawSizeValue);
                    const targetLength = sizingSystem === "CUSTOM_MM" ? customLengthMm : conversion.insoleLengthMm;
                    const defaults = calculateDefaultWidths(targetLength);
                    setBallWidth(defaults.ballWidth);
                    setHeelWidth(defaults.heelWidth);
                    setWaistWidth(defaults.waistWidth);
                  }}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition ${
                    manualWidths
                      ? "bg-amber-900/60 text-amber-300 border border-amber-600/70 hover:bg-amber-800"
                      : "bg-gray-800/80 text-gray-400 border border-gray-700/60 hover:text-gray-300"
                  }`}
                  title={
                    manualWidths
                      ? isId ? "Manual — auto-recompute mati (klik untuk aktifkan ulang)" : "Manual — auto-recompute off (click to re-enable)"
                      : isId ? "Lebar mengikuti ukuran otomatis" : "Widths follow size auto-recompute"
                  }
                >
                  {manualWidths
                    ? (isId ? "Manual — auto-recompute mati" : "Manual — auto-recompute off")
                    : (isId ? "Auto ✓" : "Auto ✓")}
                </button>
                <Wrench className="h-3.5 w-3.5 text-gray-400" />
              </div>
            </div>

            {/* Forefoot Ball Width */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-gray-400">
                    {isId ? "Lebar Bola Kaki (Ball)" : "Forefoot Ball Width"}
                  </label>
                  <span className="text-[10px] text-gray-500 font-mono">70–130 mm</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min={70}
                    max={130}
                    value={ballWidth}
                    aria-label={isId ? "Lebar Bola Kaki (mm)" : "Forefoot Ball Width (mm)"}
                    onChange={(e) => {
                      setManualWidths(true);
                      const v = parseFloat(e.target.value);
                      setBallWidth(isNaN(v) ? (e.target.value as any) : v);
                    }}
                    onBlur={(e) => {
                      const v = parseFloat(e.target.value);
                      const clamped = isNaN(v) ? 100 : Math.max(70, Math.min(130, Math.round(v * 10) / 10));
                      setBallWidth(clamped);
                    }}
                    className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-700 bg-gray-900 font-mono font-bold text-xs text-right text-amber-400 tabular-nums focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                  <span className="text-[10px] text-gray-400 font-semibold">mm</span>
                </div>
              </div>
              <input
                type="range"
                min={70}
                max={130}
                step={0.5}
                value={typeof ballWidth === "number" ? ballWidth : 100}
                aria-label={isId ? "Slider Lebar Bola Kaki" : "Forefoot Ball Width Slider"}
                onChange={(e) => {
                  setManualWidths(true);
                  setBallWidth(parseFloat(e.target.value));
                }}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Rearfoot Heel Width */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-gray-400">
                    {isId ? "Lebar Mangkuk Tumit (Heel)" : "Rearfoot Heel Width"}
                  </label>
                  <span className="text-[10px] text-gray-500 font-mono">45–95 mm</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min={45}
                    max={95}
                    value={heelWidth}
                    aria-label={isId ? "Lebar Mangkuk Tumit (mm)" : "Rearfoot Heel Width (mm)"}
                    onChange={(e) => {
                      setManualWidths(true);
                      const v = parseFloat(e.target.value);
                      setHeelWidth(isNaN(v) ? (e.target.value as any) : v);
                    }}
                    onBlur={(e) => {
                      const v = parseFloat(e.target.value);
                      const clamped = isNaN(v) ? 65 : Math.max(45, Math.min(95, Math.round(v * 10) / 10));
                      setHeelWidth(clamped);
                    }}
                    className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-700 bg-gray-900 font-mono font-bold text-xs text-right text-emerald-400 tabular-nums focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                  <span className="text-[10px] text-gray-400 font-semibold">mm</span>
                </div>
              </div>
              <input
                type="range"
                min={45}
                max={95}
                step={0.5}
                value={typeof heelWidth === "number" ? heelWidth : 65}
                aria-label={isId ? "Slider Lebar Mangkuk Tumit" : "Rearfoot Heel Width Slider"}
                onChange={(e) => {
                  setManualWidths(true);
                  setHeelWidth(parseFloat(e.target.value));
                }}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Arch Flange Factor */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-gray-400">
                    {isId ? "Tinggi Lekukan Arch (Flange)" : "Arch Flange Height"}
                  </label>
                  <span className="text-[10px] text-gray-500 font-mono">0.75–1.45x</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.05"
                    min={0.75}
                    max={1.45}
                    value={archFactor}
                    aria-label={isId ? "Faktor Tinggi Lekukan Arch" : "Arch Flange Height Factor"}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setArchFactor(isNaN(v) ? (e.target.value as any) : v);
                    }}
                    onBlur={(e) => {
                      const v = parseFloat(e.target.value);
                      const clamped = isNaN(v) ? 1.0 : Math.max(0.75, Math.min(1.45, Math.round(v * 100) / 100));
                      setArchFactor(clamped);
                    }}
                    className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-700 bg-gray-900 font-mono font-bold text-xs text-right text-red-400 tabular-nums focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                  <span className="text-[10px] text-gray-400 font-semibold">x</span>
                </div>
              </div>
              <input
                type="range"
                min={0.75}
                max={1.45}
                step={0.05}
                value={typeof archFactor === "number" ? archFactor : 1.0}
                aria-label={isId ? "Slider Faktor Tinggi Lekukan Arch" : "Arch Flange Height Factor Slider"}
                onChange={(e) => setArchFactor(parseFloat(e.target.value))}
                className="w-full accent-brand"
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
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-gray-200 group-hover:text-white">{preset.name}</p>
                    <p className="text-[10px] text-gray-400">{preset.description}</p>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      {preset.materialType} • {preset.thicknessForefootMm}/{preset.thicknessHeelMm} mm
                    </p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 font-mono shrink-0">
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
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            setIsPanning(false);
            activePointersRef.current.clear();
            initialPinchDistRef.current = null;
          }}
          style={{ touchAction: "none" }}
        >
          {/* Floating Viewport Overlay Toolbar */}
          <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-20 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-gray-900/85 backdrop-blur-md border border-gray-700 shadow-xl text-white pointer-events-auto">
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(2.5, z + 0.15))}
                className="p-1.5 rounded-xl hover:bg-gray-800 active:scale-90 transition-transform"
                title="Zoom In (+)"
                aria-label={isId ? "Perbesar tampilan" : "Zoom in"}
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(0.5, z - 0.15))}
                className="p-1.5 rounded-xl hover:bg-gray-800 active:scale-90 transition-transform"
                title="Zoom Out (-)"
                aria-label={isId ? "Perkecil tampilan" : "Zoom out"}
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
                aria-label={isId ? "Reset tampilan" : "Reset view"}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  shortcutsOpenerRef.current = e.currentTarget;
                  setIsShortcutsOpen(!isShortcutsOpen);
                }}
                className={`p-1.5 rounded-xl hover:bg-gray-800 active:scale-90 transition-transform ${
                  isShortcutsOpen ? "bg-gray-800 text-red-400" : "text-gray-300 hover:text-white"
                }`}
                title={isId ? "Pintasan Keyboard (?)" : "Keyboard Shortcuts (?)"}
                aria-label={isId ? "Buka panduan pintasan keyboard" : "Open keyboard shortcuts guide"}
              >
                <Keyboard className="h-4 w-4" />
              </button>
              <div className="h-4 w-px bg-gray-700 mx-1" />
              <span className="text-[11px] font-mono font-bold px-1.5 text-gray-300">
                <span role="status" aria-live="polite" aria-atomic="true">{Math.round(zoomScale * 100)}%</span>
              </span>
            </div>

            {/* Desktop Right Sidebar Collapse / Expand Button */}
            <div className="hidden md:block pointer-events-auto">
              <button
                type="button"
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                className="p-2 rounded-xl bg-gray-900/85 backdrop-blur-md border border-gray-700 hover:bg-gray-800 text-white active:scale-95 transition shadow-xl flex items-center gap-1.5 text-xs font-semibold"
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
              role="img"
              aria-label={isId ? `Pratinjau vektor CAD insole ${geometry.sizingLabel} ${foot}` : `CAD insole vector preview ${geometry.sizingLabel} ${foot}`}
              viewBox={`0 0 ${vbW} ${vbH}`}
              className="overflow-visible"
              style={{
                width: `${vbW * (foot === "PAIR" ? 1.15 : 1.45)}px`,
                height: `${vbH * (foot === "PAIR" ? 1.15 : 1.45)}px`,
                overflow: "visible",
              }}
              onPointerMove={(e) => {
                const svg = e.currentTarget;
                const pt = svg.createSVGPoint();
                pt.x = e.clientX;
                pt.y = e.clientY;
                const ctm = svg.getScreenCTM();
                if (ctm) {
                  const svgPt = pt.matrixTransform(ctm.inverse());
                  setCursorMm({
                    x: Math.round(svgPt.x * 10) / 10,
                    y: Math.round(svgPt.y * 10) / 10,
                  });
                }
              }}
              onPointerLeave={() => setCursorMm(null)}
            >
              <defs>
                <pattern id="cad-grid-10mm" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.25" className="text-gray-700/60" />
                </pattern>
                <pattern id="cad-grid-50mm" width="50" height="50" patternUnits="userSpaceOnUse">
                  <rect width="50" height="50" fill="url(#cad-grid-10mm)" />
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.65" className="text-gray-600/80" />
                </pattern>
              </defs>

              {/* True Millimeter CAD Engineering Grid (seamless canvas, no bounding box cutoff) */}
              {showGrid && (
                <rect
                  x={-5000}
                  y={-5000}
                  width={10000 + vbW}
                  height={10000 + vbH}
                  fill="url(#cad-grid-50mm)"
                  className="pointer-events-none opacity-25"
                />
              )}
              {/* SINGLE FOOT VIEW */}
              {foot !== "PAIR" ? (
                <g id="single-insole-viewport">
                  {/* Outer Cut Outline & Substrate Body (Red CNC Toolpath) */}
                  {showOutline && (
                    <g key="single-layer-outline" id="single-layer-outline">
                      <path
                        d={foot === "LEFT" ? geometry.svgPathLeft : geometry.svgPathRight}
                        className="fill-gray-100/95 dark:fill-gray-800/95 stroke-brand stroke-[1.8] pointer-events-none"
                      />
                    </g>
                  )}

                  {/* Arch Support Plate (Red) */}
                  {showArchPlate && (
                    <g key="single-layer-arch-plate" id="single-layer-arch-plate">
                      <path
                        d={foot === "LEFT" ? geometry.archPlateSvgLeft : geometry.archPlateSvgRight}
                        fill="rgba(239, 68, 68, 0.28)"
                        stroke="#ef4444"
                        strokeWidth={1.5}
                        strokeDasharray="4,3"
                        className="pointer-events-none"
                      />
                    </g>
                  )}

                  {/* Heel Cup Pad (Green) */}
                  {showHeelCup && (
                    <g key="single-layer-heel-cup" id="single-layer-heel-cup">
                      <path
                        d={foot === "LEFT" ? geometry.heelCupSvgLeft : geometry.heelCupSvgRight}
                        fill="rgba(16, 185, 129, 0.28)"
                        stroke="#10b981"
                        strokeWidth={1.5}
                        strokeDasharray="4,3"
                        className="pointer-events-none"
                      />
                    </g>
                  )}

                  {/* Metatarsal Cushion Dome (Cyan) */}
                  {showMetatarsal && (
                    <g key="single-layer-metatarsal" id="single-layer-metatarsal">
                      <path
                        d={foot === "LEFT" ? geometry.metatarsalSvgLeft : geometry.metatarsalSvgRight}
                        fill="rgba(6, 182, 212, 0.28)"
                        stroke="#06b6d4"
                        strokeWidth={1.5}
                        strokeDasharray="4,3"
                        className="pointer-events-none"
                      />
                    </g>
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
                      <g key="left-layer-outline" id="left-layer-outline">
                        <path
                          d={geometry.svgPathLeft}
                          className="fill-gray-100/95 dark:fill-gray-800/95 stroke-brand stroke-[1.8] pointer-events-none"
                        />
                      </g>
                    )}
                    {showArchPlate && (
                      <g key="left-layer-arch-plate" id="left-layer-arch-plate">
                        <path
                          d={geometry.archPlateSvgLeft}
                          fill="rgba(239, 68, 68, 0.28)"
                          stroke="#ef4444"
                          strokeWidth={1.5}
                          strokeDasharray="4,3"
                          className="pointer-events-none"
                        />
                      </g>
                    )}
                    {showHeelCup && (
                      <g key="left-layer-heel-cup" id="left-layer-heel-cup">
                        <path
                          d={geometry.heelCupSvgLeft}
                          fill="rgba(16, 185, 129, 0.28)"
                          stroke="#10b981"
                          strokeWidth={1.5}
                          strokeDasharray="4,3"
                          className="pointer-events-none"
                        />
                      </g>
                    )}
                    {showMetatarsal && (
                      <g key="left-layer-metatarsal" id="left-layer-metatarsal">
                        <path
                          d={geometry.metatarsalSvgLeft}
                          fill="rgba(6, 182, 212, 0.28)"
                          stroke="#06b6d4"
                          strokeWidth={1.5}
                          strokeDasharray="4,3"
                          className="pointer-events-none"
                        />
                      </g>
                    )}
                    <text x={singleW / 2} y={vbH - 10} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      LEFT ({geometry.sizingLabel})
                    </text>
                  </g>

                  {/* Right Foot Insole */}
                  <g id="insole-right-side" transform={`translate(${singleW + pairGap}, 0)`}>
                    {showOutline && (
                      <g key="right-layer-outline" id="right-layer-outline">
                        <path
                          d={geometry.svgPathRight}
                          className="fill-gray-100/95 dark:fill-gray-800/95 stroke-brand stroke-[1.8] pointer-events-none"
                        />
                      </g>
                    )}
                    {showArchPlate && (
                      <g key="right-layer-arch-plate" id="right-layer-arch-plate">
                        <path
                          d={geometry.archPlateSvgRight}
                          fill="rgba(239, 68, 68, 0.28)"
                          stroke="#ef4444"
                          strokeWidth={1.5}
                          strokeDasharray="4,3"
                          className="pointer-events-none"
                        />
                      </g>
                    )}
                    {showHeelCup && (
                      <g key="right-layer-heel-cup" id="right-layer-heel-cup">
                        <path
                          d={geometry.heelCupSvgRight}
                          fill="rgba(16, 185, 129, 0.28)"
                          stroke="#10b981"
                          strokeWidth={1.5}
                          strokeDasharray="4,3"
                          className="pointer-events-none"
                        />
                      </g>
                    )}
                    {showMetatarsal && (
                      <g key="right-layer-metatarsal" id="right-layer-metatarsal">
                        <path
                          d={geometry.metatarsalSvgRight}
                          fill="rgba(6, 182, 212, 0.28)"
                          stroke="#06b6d4"
                          strokeWidth={1.5}
                          strokeDasharray="4,3"
                          className="pointer-events-none"
                        />
                      </g>
                    )}
                    <text x={singleW / 2} y={vbH - 10} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      RIGHT ({geometry.sizingLabel})
                    </text>
                  </g>

                  {/* Dimension Reference Lines & Labels for Pair View */}
                  {showDimensions && (
                    <g fontFamily="monospace" fontSize="7" fill="#3b82f6" fontWeight="bold">
                      {/* Vertical Length Dimension Line */}
                      <line
                        x1={vbW - 12}
                        y1={15}
                        x2={vbW - 12}
                        y2={vbH - 15}
                        stroke="#3b82f6"
                        strokeWidth="0.8"
                        strokeDasharray="2,2"
                      />
                      <text
                        x={vbW - 9}
                        y={vbH / 2}
                        transform={`rotate(90, ${vbW - 9}, ${vbH / 2})`}
                      >
                        L: {geometry.length} mm
                      </text>

                      {/* Forefoot Width Dimension Line - Left Foot */}
                      <line
                        x1={singleW / 2 - ballWidth / 2}
                        y1={vbH * 0.28}
                        x2={singleW / 2 + ballWidth / 2}
                        y2={vbH * 0.28}
                        stroke="#eab308"
                        strokeWidth="0.8"
                        strokeDasharray="2,2"
                      />
                      <text
                        x={singleW / 2}
                        y={vbH * 0.26}
                        fill="#eab308"
                        textAnchor="middle"
                      >
                        W(Ball): {ballWidth} mm
                      </text>

                      {/* Forefoot Width Dimension Line - Right Foot */}
                      <line
                        x1={singleW + pairGap + singleW / 2 - ballWidth / 2}
                        y1={vbH * 0.28}
                        x2={singleW + pairGap + singleW / 2 + ballWidth / 2}
                        y2={vbH * 0.28}
                        stroke="#eab308"
                        strokeWidth="0.8"
                        strokeDasharray="2,2"
                      />
                      <text
                        x={singleW + pairGap + singleW / 2}
                        y={vbH * 0.26}
                        fill="#eab308"
                        textAnchor="middle"
                      >
                        W(Ball): {ballWidth} mm
                      </text>
                    </g>
                  )}
                </g>
              )}
            </svg>
          </div>

          {/* Bottom Live Dimension Callout Strip */}
          {showDimensions && (
            <div
              role="status"
              aria-live="polite"
            aria-label={isId ? "Dimensi insole langsung" : "Live insole dimensions"}
            className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-20 flex flex-col gap-1.5 p-2.5 rounded-xl bg-gray-900/90 backdrop-blur-md border border-gray-800 text-white text-xs shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-red-400">{geometry.sizingLabel} ({foot})</span>
                  <button
                    type="button"
                    onClick={() => setActiveTooltip(activeTooltip === "caliper" ? null : "caliper")}
                    className="text-gray-400 hover:text-white p-0.5 rounded transition"
                    title={isId ? "Info Pengukuran Kaliper" : "Caliper Measurement Info"}
                    aria-label={isId ? "Info pengukuran kaliper" : "Caliper measurement info"}
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span>
                  {isId ? "Pjg" : "Len"}: <strong className="text-blue-400">{geometry.length} mm</strong>
                </span>
                <span>
                  {isId ? "Bola" : "Ball"}: <strong className="text-amber-400">{ballWidth} mm</strong>
                </span>
                <span>
                  {isId ? "Tumit" : "Heel"}: <strong className="text-emerald-400">{heelWidth} mm</strong>
                </span>
                <span>
                  {isId ? "Keliling" : "Perimeter"}: <strong className="text-cyan-400">{totalPerimeter} mm</strong>
                </span>
              </div>

              {/* Live Cursor Coordinate Readout */}
              {cursorMm && (
                <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-gray-400 bg-gray-950/80 px-2 py-0.5 rounded-md border border-gray-800 shrink-0">
                  <span>X: <strong className="text-gray-200">{cursorMm.x} mm</strong></span>
                  <span>Y: <strong className="text-gray-200">{cursorMm.y} mm</strong></span>
                </div>
              )}
            </div>

            {activeTooltip === "caliper" && (
              <div className="p-2 rounded-lg bg-gray-950/90 border border-gray-700 text-[11px] text-gray-300 leading-snug flex items-center justify-between gap-2 animate-in fade-in duration-150">
                <span>
                  {isId
                    ? "Pengukuran kaliper parametrik presisi CAD (Panjang total, Lebar bola metatarsal, Lebar tumit, dan Keliling perimeter) dalam milimeter sejati (skala 1:1)."
                    : "True millimeter parametric caliper measurements (Total length, Ball width, Heel width, and Perimeter) at 1:1 scale for exact footwear mold matching."}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTooltip(null)}
                  className="text-gray-400 hover:text-white shrink-0 p-0.5"
                  aria-label={isId ? "Tutup info" : "Close info"}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
        </div>

        {/* Right Sidebar: Orthotic Components, Layers & Specs */}
        {isRightSidebarOpen && (
          <div
            className={`w-full md:w-80 lg:w-88 border-l border-gray-800 bg-gray-900/95 overflow-y-auto min-h-0 shrink-0 p-4 space-y-4 text-xs ${
              mobileCadView === "ORTHOTICS" || mobileCadView === "EXPORT" ? "block" : "hidden md:block"
            }`}
          >
            {/* Inspector Tab Switcher */}
            <div className="flex items-center rounded-xl bg-gray-800 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setInspectorTab("COMPONENTS")}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  inspectorTab === "COMPONENTS" ? "bg-brand text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {isId ? "Komponen" : "Orthotics"}
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab("LAYERS")}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  inspectorTab === "LAYERS" ? "bg-brand text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {isId ? "Layer CAD" : "Layers"}
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab("SPECS")}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  inspectorTab === "SPECS" ? "bg-brand text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {isId ? "Spek & Yield" : "Specs"}
              </button>
            </div>

            {/* TAB 1: ORTHOTIC COMPONENTS */}
            {inspectorTab === "COMPONENTS" && (
              <div className="space-y-4">
                {/* TPU Arch Support Plate */}
                <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-900/40 space-y-3">
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
                    <button
                      type="button"
                      onClick={() => setShowArchPlate((prev) => !prev)}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 transition ${
                        showArchPlate ? "bg-red-900/60 text-red-200 hover:bg-red-800/60" : "bg-gray-800 text-gray-500 line-through hover:bg-gray-700"
                      }`}
                      title={showArchPlate ? (isId ? "Sembunyikan layer Red" : "Hide Red layer") : (isId ? "Tampilkan layer Red" : "Show Red layer")}
                      aria-label={showArchPlate ? "Hide Red layer" : "Show Red layer"}
                    >
                      {showArchPlate ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      <span>LAYER: RED</span>
                    </button>
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
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-bold uppercase text-gray-400">
                          {isId ? "Panjang Bridge TPU" : "TPU Bridge Length"}
                        </label>
                        <span className="text-[10px] text-gray-500 font-mono">0.75–1.35x</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.05"
                          min={0.75}
                          max={1.35}
                          value={archPlateLength}
                          aria-label={isId ? "Panjang Bridge TPU" : "TPU Bridge Length"}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setArchPlateLength(isNaN(v) ? (e.target.value as any) : v);
                          }}
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value);
                            const clamped = isNaN(v) ? 1.0 : Math.max(0.75, Math.min(1.35, Math.round(v * 100) / 100));
                            setArchPlateLength(clamped);
                          }}
                          className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-700 bg-gray-900 font-mono font-bold text-xs text-right text-red-400 tabular-nums focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        />
                        <span className="text-[10px] text-gray-400 font-semibold">x</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0.75}
                      max={1.35}
                      step={0.05}
                      value={typeof archPlateLength === "number" ? archPlateLength : 1.0}
                      aria-label={isId ? "Slider Panjang Bridge TPU" : "TPU Bridge Length Slider"}
                      onChange={(e) => setArchPlateLength(parseFloat(e.target.value))}
                      className="w-full accent-red-500"
                    />
                  </div>

                  {/* Arch Plate Width */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-bold uppercase text-gray-400">
                          {isId ? "Lebar Flange Medial" : "Medial Flange Spread"}
                        </label>
                        <span className="text-[10px] text-gray-500 font-mono">0.70–1.30x</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.05"
                          min={0.70}
                          max={1.30}
                          value={archPlateWidth}
                          aria-label={isId ? "Lebar Flange Medial" : "Medial Flange Spread"}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setArchPlateWidth(isNaN(v) ? (e.target.value as any) : v);
                          }}
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value);
                            const clamped = isNaN(v) ? 1.0 : Math.max(0.70, Math.min(1.30, Math.round(v * 100) / 100));
                            setArchPlateWidth(clamped);
                          }}
                          className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-700 bg-gray-900 font-mono font-bold text-xs text-right text-red-400 tabular-nums focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        />
                        <span className="text-[10px] text-gray-400 font-semibold">x</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0.70}
                      max={1.30}
                      step={0.05}
                      value={typeof archPlateWidth === "number" ? archPlateWidth : 1.0}
                      aria-label={isId ? "Slider Lebar Flange Medial" : "Medial Flange Spread Slider"}
                      onChange={(e) => setArchPlateWidth(parseFloat(e.target.value))}
                      className="w-full accent-red-500"
                    />
                  </div>
                </div>

                {/* Heel Cup Pad */}
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-emerald-300">
                        {isId ? "Mangkuk Tumit (Heel Cup)" : "Heel Cup Profile"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTooltip(activeTooltip === "heel" ? null : "heel")}
                        className="text-emerald-400 hover:text-emerald-300 p-0.5"
                        title={isId ? "Info Anatomi" : "Anatomical Info"}
                        aria-label={isId ? "Info anatomi mangkuk tumit" : "Heel cup anatomical info"}
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHeelCup((prev) => !prev)}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 transition ${
                        showHeelCup ? "bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800/60" : "bg-gray-800 text-gray-500 line-through hover:bg-gray-700"
                      }`}
                      title={showHeelCup ? (isId ? "Sembunyikan layer Green" : "Hide Green layer") : (isId ? "Tampilkan layer Green" : "Show Green layer")}
                      aria-label={showHeelCup ? "Hide Green layer" : "Show Green layer"}
                    >
                      {showHeelCup ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      <span>LAYER: GREEN</span>
                    </button>
                  </div>

                  {activeTooltip === "heel" && (
                    <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-900/60 text-[11px] text-emerald-200 leading-snug">
                      {isId
                        ? "Mangkuk tumit (heel cup) menstabilkan bantalan lemak kalkaneus (calcaneal fat pad) untuk meredam tumbukan hentakan saat fase heel-strike."
                        : "Heel cup cradles the calcaneal fat pad to absorb impact shock during heel strike and prevent rearfoot eversion."}
                    </div>
                  )}

                  {/* Heel Cup Radius Factor */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-bold uppercase text-gray-400">
                          {isId ? "Diameter Mangkuk Tumit" : "Heel Cup Radius"}
                        </label>
                        <span className="text-[10px] text-gray-500 font-mono">0.70–1.30x</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.05"
                          min={0.70}
                          max={1.30}
                          value={heelCupRadius}
                          aria-label={isId ? "Diameter Mangkuk Tumit" : "Heel Cup Radius"}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setHeelCupRadius(isNaN(v) ? (e.target.value as any) : v);
                          }}
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value);
                            const clamped = isNaN(v) ? 1.0 : Math.max(0.70, Math.min(1.30, Math.round(v * 100) / 100));
                            setHeelCupRadius(clamped);
                          }}
                          className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-700 bg-gray-900 font-mono font-bold text-xs text-right text-emerald-400 tabular-nums focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        />
                        <span className="text-[10px] text-gray-400 font-semibold">x</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0.70}
                      max={1.30}
                      step={0.05}
                      value={typeof heelCupRadius === "number" ? heelCupRadius : 1.0}
                      aria-label={isId ? "Slider Diameter Mangkuk Tumit" : "Heel Cup Radius Slider"}
                      onChange={(e) => setHeelCupRadius(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>

                {/* Metatarsal Pad */}
                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-cyan-300">
                        {isId ? "Bantalan Metatarsal (Dome)" : "Metatarsal Pad Dome"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTooltip(activeTooltip === "metatarsal" ? null : "metatarsal")}
                        className="text-cyan-400 hover:text-cyan-300 p-0.5"
                        title={isId ? "Info Anatomi" : "Anatomical Info"}
                        aria-label={isId ? "Info anatomi bantalan metatarsal" : "Metatarsal pad anatomical info"}
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMetatarsal((prev) => !prev)}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 transition ${
                        showMetatarsal ? "bg-cyan-900/60 text-cyan-200 hover:bg-cyan-800/60" : "bg-gray-800 text-gray-500 line-through hover:bg-gray-700"
                      }`}
                      title={showMetatarsal ? (isId ? "Sembunyikan layer Cyan" : "Hide Cyan layer") : (isId ? "Tampilkan layer Cyan" : "Show Cyan layer")}
                      aria-label={showMetatarsal ? "Hide Cyan layer" : "Show Cyan layer"}
                    >
                      {showMetatarsal ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      <span>LAYER: CYAN</span>
                    </button>
                  </div>

                  {activeTooltip === "metatarsal" && (
                    <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-900/60 text-[11px] text-cyan-200 leading-snug">
                      {isId
                        ? "Kubah metatarsal mengangkat arkus transversal kaki depan guna mengurangi tekanan berlebih pada kaput metatarsal 2-4 dan meredakan metatarsalgia."
                        : "Metatarsal dome elevates transverse arch to distribute forefoot plantar pressure and relieve metatarsalgia."}
                    </div>
                  )}

                  {/* Metatarsal Size Factor */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-bold uppercase text-gray-400">
                          {isId ? "Ukuran Kubah Dome" : "Dome Size Factor"}
                        </label>
                        <span className="text-[10px] text-gray-500 font-mono">0.60–1.40x</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.05"
                          min={0.60}
                          max={1.40}
                          value={metatarsalSize}
                          aria-label={isId ? "Ukuran Kubah Dome" : "Dome Size Factor"}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setMetatarsalSize(isNaN(v) ? (e.target.value as any) : v);
                          }}
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value);
                            const clamped = isNaN(v) ? 1.0 : Math.max(0.60, Math.min(1.40, Math.round(v * 100) / 100));
                            setMetatarsalSize(clamped);
                          }}
                          className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-700 bg-gray-900 font-mono font-bold text-xs text-right text-cyan-400 tabular-nums focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        />
                        <span className="text-[10px] text-gray-400 font-semibold">x</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0.60}
                      max={1.40}
                      step={0.05}
                      value={typeof metatarsalSize === "number" ? metatarsalSize : 1.0}
                      aria-label={isId ? "Slider Ukuran Kubah Dome" : "Dome Size Factor Slider"}
                      onChange={(e) => setMetatarsalSize(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  {/* Metatarsal Y Pos */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-bold uppercase text-gray-400">
                          {isId ? "Posisi Longitudinal (Y)" : "Longitudinal Y Position"}
                        </label>
                        <span className="text-[10px] text-gray-500 font-mono">0.58–0.72</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          min={0.58}
                          max={0.72}
                          value={metatarsalYPos}
                          aria-label={isId ? "Posisi Longitudinal (Y)" : "Longitudinal Y Position"}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setMetatarsalYPos(isNaN(v) ? (e.target.value as any) : v);
                          }}
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value);
                            const clamped = isNaN(v) ? 0.65 : Math.max(0.58, Math.min(0.72, Math.round(v * 100) / 100));
                            setMetatarsalYPos(clamped);
                          }}
                          className="w-16 px-1.5 py-0.5 rounded-lg border border-gray-700 bg-gray-900 font-mono font-bold text-xs text-right text-cyan-400 tabular-nums focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0.58}
                      max={0.72}
                      step={0.01}
                      value={typeof metatarsalYPos === "number" ? metatarsalYPos : 0.65}
                      aria-label={isId ? "Slider Posisi Longitudinal (Y)" : "Longitudinal Y Position Slider"}
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

                <div className="p-2.5 rounded-xl bg-gray-800/60 border border-gray-700/60 space-y-1">
                  {/* Garis Potong (Cut Outline) */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showOutline}
                    onClick={() => setShowOutline((prev) => !prev)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-gray-700/40 cursor-pointer transition min-h-[44px] text-left"
                    aria-label={showOutline ? (isId ? "Sembunyikan Garis Potong" : "Hide Cut Outline") : (isId ? "Tampilkan Garis Potong" : "Show Cut Outline")}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full transition ${showOutline ? "bg-red-500 ring-2 ring-red-500/30" : "bg-gray-600"}`} />
                      <span className={`text-xs font-bold transition ${showOutline ? "text-gray-200" : "text-gray-500 line-through opacity-60"}`}>
                        {isId ? "Garis Potong (Cut Outline)" : "Cut Outline"}
                      </span>
                    </div>
                    <span className={`p-1.5 rounded-lg transition min-w-[36px] min-h-[36px] flex items-center justify-center ${
                      showOutline ? "text-red-400 bg-red-950/60 hover:bg-red-900/60" : "text-gray-500 bg-gray-900 hover:bg-gray-800"
                    }`}>
                      {showOutline ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </span>
                  </button>

                  {/* Plat Arch TPU (Red) */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showArchPlate}
                    onClick={() => setShowArchPlate((prev) => !prev)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-gray-700/40 cursor-pointer transition min-h-[44px] text-left"
                    aria-label={showArchPlate ? (isId ? "Sembunyikan Plat Arch TPU" : "Hide TPU Arch Plate") : (isId ? "Tampilkan Plat Arch TPU" : "Show TPU Arch Plate")}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full transition ${showArchPlate ? "bg-red-500 ring-2 ring-red-500/30" : "bg-gray-600"}`} />
                      <span className={`text-xs font-bold transition ${showArchPlate ? "text-red-300" : "text-gray-500 line-through opacity-60"}`}>
                        {isId ? "Plat Arch TPU (Red)" : "TPU Arch Plate (Red)"}
                      </span>
                    </div>
                    <span className={`p-1.5 rounded-lg transition min-w-[36px] min-h-[36px] flex items-center justify-center ${
                      showArchPlate ? "text-red-400 bg-red-950/60 hover:bg-red-900/60" : "text-gray-500 bg-gray-900 hover:bg-gray-800"
                    }`}>
                      {showArchPlate ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </span>
                  </button>

                  {/* Mangkuk Tumit (Green) */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showHeelCup}
                    onClick={() => setShowHeelCup((prev) => !prev)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-gray-700/40 cursor-pointer transition min-h-[44px] text-left"
                    aria-label={showHeelCup ? (isId ? "Sembunyikan Mangkuk Tumit" : "Hide Heel Cup") : (isId ? "Tampilkan Mangkuk Tumit" : "Show Heel Cup")}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full transition ${showHeelCup ? "bg-emerald-500 ring-2 ring-emerald-500/30" : "bg-gray-600"}`} />
                      <span className={`text-xs font-bold transition ${showHeelCup ? "text-emerald-300" : "text-gray-500 line-through opacity-60"}`}>
                        {isId ? "Mangkuk Tumit (Green)" : "Heel Cup (Green)"}
                      </span>
                    </div>
                    <span className={`p-1.5 rounded-lg transition min-w-[36px] min-h-[36px] flex items-center justify-center ${
                      showHeelCup ? "text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900/60" : "text-gray-500 bg-gray-900 hover:bg-gray-800"
                    }`}>
                      {showHeelCup ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </span>
                  </button>

                  {/* Bantalan Metatarsal (Cyan) */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showMetatarsal}
                    onClick={() => setShowMetatarsal((prev) => !prev)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-gray-700/40 cursor-pointer transition min-h-[44px] text-left"
                    aria-label={showMetatarsal ? (isId ? "Sembunyikan Bantalan Metatarsal" : "Hide Metatarsal Pad") : (isId ? "Tampilkan Bantalan Metatarsal" : "Show Metatarsal Pad")}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full transition ${showMetatarsal ? "bg-cyan-500 ring-2 ring-cyan-500/30" : "bg-gray-600"}`} />
                      <span className={`text-xs font-bold transition ${showMetatarsal ? "text-cyan-300" : "text-gray-500 line-through opacity-60"}`}>
                        {isId ? "Bantalan Metatarsal (Cyan)" : "Metatarsal Pad (Cyan)"}
                      </span>
                    </div>
                    <span className={`p-1.5 rounded-lg transition min-w-[36px] min-h-[36px] flex items-center justify-center ${
                      showMetatarsal ? "text-cyan-400 bg-cyan-950/60 hover:bg-cyan-900/60" : "text-gray-500 bg-gray-900 hover:bg-gray-800"
                    }`}>
                      {showMetatarsal ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </span>
                  </button>

                  {/* Dimensi & Ukuran (HUD) */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showDimensions}
                    onClick={() => setShowDimensions((prev) => !prev)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-gray-700/40 cursor-pointer transition min-h-[44px] text-left"
                    aria-label={showDimensions ? (isId ? "Sembunyikan Dimensi" : "Hide Dimensions") : (isId ? "Tampilkan Dimensi" : "Show Dimensions")}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full transition ${showDimensions ? "bg-blue-500 ring-2 ring-blue-500/30" : "bg-gray-600"}`} />
                      <span className={`text-xs font-bold transition ${showDimensions ? "text-blue-300" : "text-gray-500 line-through opacity-60"}`}>
                        {isId ? "Dimensi & Ukuran (HUD)" : "Dimensions HUD"}
                      </span>
                    </div>
                    <span className={`p-1.5 rounded-lg transition min-w-[36px] min-h-[36px] flex items-center justify-center ${
                      showDimensions ? "text-blue-400 bg-blue-950/60 hover:bg-blue-900/60" : "text-gray-500 bg-gray-900 hover:bg-gray-800"
                    }`}>
                      {showDimensions ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </span>
                  </button>

                  {/* Garis Kisi / Grid (mm) */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showGrid}
                    onClick={() => setShowGrid((prev) => !prev)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-gray-700/40 cursor-pointer transition min-h-[44px] text-left"
                    aria-label={showGrid ? (isId ? "Sembunyikan Kisi Grid" : "Hide Engineering Grid") : (isId ? "Tampilkan Kisi Grid" : "Show Engineering Grid")}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full transition ${showGrid ? "bg-gray-400 ring-2 ring-gray-400/30" : "bg-gray-600"}`} />
                      <span className={`text-xs font-bold transition ${showGrid ? "text-gray-300" : "text-gray-500 line-through opacity-60"}`}>
                        {isId ? "Garis Kisi / Grid (mm)" : "Engineering Grid (mm)"}
                      </span>
                    </div>
                    <span className={`p-1.5 rounded-lg transition min-w-[36px] min-h-[36px] flex items-center justify-center ${
                      showGrid ? "text-gray-300 bg-gray-700 hover:bg-gray-600" : "text-gray-500 bg-gray-900 hover:bg-gray-800"
                    }`}>
                      {showGrid ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: SPECS & YIELD */}
            {inspectorTab === "SPECS" && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-gray-800/60 border border-gray-700/60 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">
                    {isId ? "Spesifikasi Material" : "Material Specifications"}
                  </span>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-400">{isId ? "Material" : "Material"}:</span>
                      <span className="font-bold text-white">{materialType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{isId ? "Tebal Depan" : "Forefoot Thickness"}:</span>
                      <span className="text-white">{forefootThickness} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{isId ? "Tebal Tumit" : "Heel Thickness"}:</span>
                      <span className="text-white">{heelThickness} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{isId ? "Keliling Potong" : "Cut Perimeter"}:</span>
                      <span className="text-cyan-400 font-bold">{totalPerimeter} mm</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-800/60 border border-gray-700/60 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">
                    {isId ? "Estimasi Yield per Lembar EVA" : "EVA Sheet Yield Estimate"}
                  </span>
                  <p className="text-xs text-gray-300">
                    {isId ? "Lembar Standar" : "Standard Sheet"}: <strong>1200 x 2400 mm</strong>
                  </p>
                  <p className="font-mono text-base font-black text-emerald-400">
                    ~{Math.floor((1200 * 2400) / ((geometry.bounds.width + 10) * (geometry.bounds.height + 10) * (foot === "PAIR" ? 2 : 1)))}{" "}
                    <span className="text-xs font-normal text-gray-400">{foot === "PAIR" ? (isId ? "pasang / lembar" : "pairs / sheet") : (isId ? "pcs / lembar" : "pcs / sheet")}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    {isId
                      ? "* Estimasi teoritis bounding-box. Hasil riil dapat berbeda 10–25% akibat toleransi nesting & kurvatur."
                      : "* Theoretical bounding-box estimate. Actual yield varies 10–25% based on nesting orientation & curvature."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Blueprint Library Drawer / Modal */}
      {isLibraryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
          onKeyDown={(e) => trapModalTab(e, libraryCloseRef, libraryCloseRef)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cad-library-title"
            className="w-full max-w-xl rounded-xl bg-gray-900 border border-gray-700 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="cad-library-title" className="font-extrabold text-base text-white">
                    {isId ? "Arsip Blueprint Insole CAD" : "CAD Blueprint Library"}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {isId ? "Pilih model blueprint tersimpan untuk dimuat ke workstation" : "Select a saved model to load into the workspace"}
                  </p>
                </div>
              </div>
              <button
                ref={libraryCloseRef}
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
                aria-label={isId ? "Tutup arsip blueprint" : "Close blueprint library"}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Blueprints List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {isLibraryLoading ? (
                <div className="p-8 text-center space-y-2" aria-busy="true">
                  <div className="h-8 w-8 mx-auto rounded-full border-2 border-gray-700 border-t-amber-400 animate-spin" />
                  <p className="text-xs text-gray-500">{isId ? "Memuat arsip blueprint..." : "Loading blueprint archive..."}</p>
                </div>
              ) : libraryError ? (
                <div
                  role="alert"
                  className="p-8 text-center border border-red-900/60 bg-red-950/30 rounded-xl text-red-300 space-y-3"
                >
                  <AlertTriangle className="h-8 w-8 mx-auto text-red-400" />
                  <p className="text-xs font-bold">
                    {isId ? "Gagal memuat arsip blueprint dari server." : "Failed to load the blueprint archive."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLibraryError(false);
                      fetchBlueprints();
                    }}
                    className="px-3.5 py-2 min-h-[44px] rounded-xl border border-gray-700 text-xs font-bold text-gray-200 hover:bg-gray-800 transition"
                  >
                    {isId ? "Coba Lagi" : "Retry"}
                  </button>
                </div>
              ) : savedBlueprints.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-gray-800 rounded-xl text-gray-500">
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
                    className="p-3.5 rounded-xl bg-gray-800/80 border border-gray-700 hover:border-gray-600 transition flex items-center justify-between gap-3"
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
                      aria-label={isId ? `Muat blueprint ${bp.name}` : `Load blueprint ${bp.name}`}
                      className="px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-strong text-white font-bold text-xs shrink-0 active:scale-95 transition"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
          onKeyDown={(e) => trapModalTab(e, cncCloseRef, cncLastBtnRef)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cnc-preflight-title"
            className="w-full max-w-lg rounded-xl bg-gray-900 border border-gray-700 shadow-2xl p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  <Scissors className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="cnc-preflight-title" className="font-extrabold text-base text-white">
                    {isId ? "Verifikasi Pisau Pond & CNC Cutter" : "CNC Die-Cut Pre-Flight Verification"}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {isId ? "Validasi toolpath polyline dan lapisan DXF sebelum pemotongan" : "Toolpath polyline & DXF layer audit"}
                  </p>
                </div>
              </div>
              <button
                ref={cncCloseRef}
                type="button"
                onClick={() => setIsCncPreFlightOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
                aria-label={isId ? "Tutup verifikasi CNC" : "Close CNC pre-flight"}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Audit Checklist */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-gray-800/80 border border-gray-700 grid grid-cols-2 gap-2 font-mono">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block">{isId ? "Ukuran Bounding Box" : "Bounding Box"}</span>
                  <span className="font-bold text-white tabular-nums">{totalW.toFixed(1)} x {totalH.toFixed(1)} mm</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block">{isId ? "Panjang Lintasan Potong" : "Cut Perimeter"}</span>
                  <span className="font-bold text-cyan-400 tabular-nums">{totalPerimeter} mm</span>
                </div>
              </div>

              {manifoldVerified ? (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2.5 text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>
                    {isId
                      ? `Polyline tertutup terverifikasi (Right ${manifoldRight ? "OK" : "OPEN"}${foot !== "RIGHT" ? `, Left ${manifoldLeft ? "OK" : "OPEN"}` : ""})`
                      : `Closed-loop polyline verified (Right ${manifoldRight ? "OK" : "OPEN"}${foot !== "RIGHT" ? `, Left ${manifoldLeft ? "OK" : "OPEN"}` : ""})`}
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 flex items-center gap-2.5 text-red-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                  <span className="font-bold">
                    {isId
                      ? "Open loop terdeteksi pada polyline — JANGAN ekspor ke CNC sebelum geometri diperbaiki."
                      : "Open loop detected in the polyline — do NOT export to CNC until geometry is fixed."}
                  </span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/60 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">{isId ? "Audit Lapisan Layer DXF (Corel / CNC)" : "DXF Layer Color Audit"}</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className={`flex items-center gap-1.5 ${showOutline ? "text-gray-200" : "text-gray-500 line-through opacity-50"}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${showOutline ? "bg-white border border-gray-400" : "bg-gray-600 border border-gray-700"}`} />
                    <span>CUT_OUTLINE {showOutline ? "" : `(${isId ? "Nonaktif" : "Excluded"})`}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${showArchPlate ? "text-red-300" : "text-gray-500 line-through opacity-50"}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${showArchPlate ? "bg-red-500" : "bg-gray-600"}`} />
                    <span>ARCH_SUPPORT {showArchPlate ? "" : `(${isId ? "Nonaktif" : "Excluded"})`}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${showHeelCup ? "text-emerald-300" : "text-gray-500 line-through opacity-50"}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${showHeelCup ? "bg-emerald-500" : "bg-gray-600"}`} />
                    <span>HEEL_CUP {showHeelCup ? "" : `(${isId ? "Nonaktif" : "Excluded"})`}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${showMetatarsal ? "text-cyan-300" : "text-gray-500 line-through opacity-50"}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${showMetatarsal ? "bg-cyan-500" : "bg-gray-600"}`} />
                    <span>METATARSAL {showMetatarsal ? "" : `(${isId ? "Nonaktif" : "Excluded"})`}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Persistent Inline Export Error Card (mirroring Library/AI pattern) */}
            {exportError && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-xs text-red-200 flex items-center justify-between gap-3 animate-in fade-in"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{exportError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setExportError(null)}
                  className="p-1 rounded-lg hover:bg-red-900/50 text-red-300 transition"
                  aria-label={isId ? "Tutup peringatan" : "Dismiss alert"}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={handleExportSvg}
                disabled={exporting !== null || !manifoldVerified}
                className="px-4 py-2 min-h-[44px] rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-200 transition active:scale-95"
              >
                {exporting === "SVG" ? "Exporting..." : isId ? "Unduh Vector SVG" : "Download SVG"}
              </button>
              <button
                ref={cncLastBtnRef}
                type="button"
                onClick={handleExportDxf}
                disabled={exporting !== null || !manifoldVerified}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-200 active:scale-95 transition"
              >
                <Download className="h-4 w-4" />
                <span>{exporting === "DXF" ? "Exporting..." : isId ? "Unduh AutoCAD R12 DXF" : "Download R12 DXF"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved-Work Overwrite Confirmation (truth gate for preset / library / AI) */}
      {pendingOverwriteAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cad-overwrite-title"
            onKeyDown={(e) => trapModalTab(e, cancelOverwriteRef, confirmOverwriteRef)}
            className="w-full max-w-sm rounded-xl bg-gray-900 border border-amber-700/60 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2.5 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 id="cad-overwrite-title" className="font-extrabold text-sm text-white">
                {isId ? "Timpa Perubahan Belum Disimpan?" : "Overwrite Unsaved Changes?"}
              </h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {isId
                ? "Lembar kerja memiliki parameter yang belum disimpan (titik amber di header). Melanjutkan akan menimpa seluruh parameter dengan desain baru."
                : "The workspace has unsaved parameters (amber dot in the header). Continuing will overwrite all parameters with the new design."}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                ref={cancelOverwriteRef}
                type="button"
                autoFocus
                onClick={() => setPendingOverwriteAction(null)}
                className="px-3.5 py-2 min-h-[44px] rounded-xl border border-gray-700 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition"
              >
                {isId ? "Lanjut Mengedit" : "Keep editing"}
              </button>
              <button
                ref={confirmOverwriteRef}
                type="button"
                onClick={() => {
                  const action = pendingOverwriteAction;
                  setPendingOverwriteAction(null);
                  action?.();
                }}
                className="px-4 py-2 min-h-[44px] rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-xs active:scale-95 transition"
              >
                {isId ? "Ya, Timpa" : "Yes, Overwrite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Legend Dialog */}
      {isShortcutsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsShortcutsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cad-shortcuts-title"
            onKeyDown={(e) => trapModalTab(e, shortcutsCloseRef, shortcutsGotItRef)}
            className="w-full max-w-md rounded-xl bg-gray-900 border border-gray-700 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-400">
                <Keyboard className="h-5 w-5" />
                <h3 id="cad-shortcuts-title" className="font-extrabold text-sm text-white">
                  {isId ? "Pintasan Keyboard CAD" : "CAD Keyboard Shortcuts"}
                </h3>
              </div>
              <button
                ref={shortcutsCloseRef}
                type="button"
                onClick={() => setIsShortcutsOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
                aria-label={isId ? "Tutup panduan pintasan" : "Close shortcuts guide"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/60 border border-gray-700/60">
                <span className="text-gray-300">{isId ? "Simpan Blueprint" : "Save Blueprint"}</span>
                <kbd className="px-2 py-1 rounded bg-gray-950 text-red-300 font-mono font-bold text-[11px] border border-gray-800">
                  Ctrl + S / Cmd + S
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/60 border border-gray-700/60">
                <span className="text-gray-300">{isId ? "Perbesar Tampilan" : "Zoom In"}</span>
                <kbd className="px-2 py-1 rounded bg-gray-950 text-red-300 font-mono font-bold text-[11px] border border-gray-800">
                  + atau =
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/60 border border-gray-700/60">
                <span className="text-gray-300">{isId ? "Perkecil Tampilan" : "Zoom Out"}</span>
                <kbd className="px-2 py-1 rounded bg-gray-950 text-red-300 font-mono font-bold text-[11px] border border-gray-800">
                  - atau _
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/60 border border-gray-700/60">
                <span className="text-gray-300">{isId ? "Reset Zoom & Posisi" : "Reset View"}</span>
                <kbd className="px-2 py-1 rounded bg-gray-950 text-red-300 font-mono font-bold text-[11px] border border-gray-800">
                  0
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/60 border border-gray-700/60">
                <span className="text-gray-300">{isId ? "Geser Kanvas CAD" : "Pan Viewport"}</span>
                <kbd className="px-2 py-1 rounded bg-gray-950 text-red-300 font-mono font-bold text-[11px] border border-gray-800">
                  ← ↑ → ↓
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/60 border border-gray-700/60">
                <span className="text-gray-300">{isId ? "Geser Halus Kanvas (5mm)" : "Fine Pan Viewport (5mm)"}</span>
                <kbd className="px-2 py-1 rounded bg-gray-950 text-red-300 font-mono font-bold text-[11px] border border-gray-800">
                  Shift + ← ↑ → ↓
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/60 border border-gray-700/60">
                <span className="text-gray-300">{isId ? "Zoom Kursor / Cubit Layar" : "Wheel Zoom / Pinch-to-Zoom"}</span>
                <kbd className="px-2 py-1 rounded bg-gray-950 text-red-300 font-mono font-bold text-[11px] border border-gray-800">
                  {isId ? "Roda Mouse / 2 Jari" : "Mouse Wheel / 2-Finger"}
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/60 border border-gray-700/60">
                <span className="text-gray-300">{isId ? "Tampilkan / Sembunyikan Grid" : "Toggle Engineering Grid"}</span>
                <kbd className="px-2 py-1 rounded bg-gray-950 text-red-300 font-mono font-bold text-[11px] border border-gray-800">
                  G
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/60 border border-gray-700/60">
                <span className="text-gray-300">{isId ? "Buka Panduan Pintasan" : "Toggle Shortcuts"}</span>
                <kbd className="px-2 py-1 rounded bg-gray-950 text-red-300 font-mono font-bold text-[11px] border border-gray-800">
                  ?
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/60 border border-gray-700/60">
                <span className="text-gray-300">{isId ? "Tutup Dialog / Batal" : "Close Dialog / Cancel"}</span>
                <kbd className="px-2 py-1 rounded bg-gray-950 text-red-300 font-mono font-bold text-[11px] border border-gray-800">
                  Esc
                </kbd>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                ref={shortcutsGotItRef}
                type="button"
                autoFocus
                onClick={() => setIsShortcutsOpen(false)}
                className="px-4 py-2 min-h-[44px] rounded-xl bg-brand hover:bg-brand-strong text-white text-xs font-bold shadow-xs active:scale-95 transition"
              >
                {isId ? "Mengerti" : "Got it"}
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
