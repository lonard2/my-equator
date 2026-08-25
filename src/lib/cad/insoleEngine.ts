/**
 * Equator Insole CAD Engine
 * Parametric footwear insole geometry builder, multi-standard size converter,
 * customizable orthotic layer components, SVG generator, and AutoCAD R12 DXF stream writer.
 * All units in Millimeters (mm).
 */

export type SizingSystem = "EU" | "US_MEN" | "US_WOMEN" | "UK" | "MONDOPOINT_CM" | "CUSTOM_MM";
export type ArchProfile = "FLAT" | "MEDIUM" | "HIGH";
export type HeelCupDepthProfile = "SHALLOW" | "MEDIUM" | "DEEP";
export type FootType = "LEFT" | "RIGHT" | "PAIR";
export type ToeShape = "ROUNDED" | "ANATOMIC" | "SQUARE_ROUND";

export interface SizingConversion {
  system: SizingSystem;
  inputValue: number;
  eu: number;
  usMen: number;
  usWomen: number;
  uk: number;
  mondopointCm: number;
  insoleLengthMm: number;
}

export interface InsoleParameters {
  shoeSize?: number; // EU equivalent or custom
  sizingSystem?: SizingSystem;
  rawSizeValue?: number;
  baseLengthMm?: number;
  ballWidthMm?: number; // Forefoot width
  heelWidthMm?: number; // Rearfoot width
  waistWidthMm?: number; // Arch waist width
  archProfile?: ArchProfile;
  archOffsetFactor?: number; // 0.8 to 1.5
  toeShape?: ToeShape;
  thicknessForefootMm?: number;
  thicknessHeelMm?: number;
  materialType?: string;

  // Customizable Orthotic Component Layer Parameters:
  archPlateLengthFactor?: number; // 0.75 to 1.35 (Length of TPU bridge)
  archPlateWidthFactor?: number; // 0.70 to 1.30 (Medial flange height/spread)
  archPlateLateralWing?: boolean; // Anti-torsion outer wing
  heelCupDepthProfile?: HeelCupDepthProfile; // SHALLOW, MEDIUM, DEEP
  heelCupRadiusFactor?: number; // 0.70 to 1.30 (Heel cupping diameter)
  metatarsalPadSizeFactor?: number; // 0.60 to 1.40 (Dome size)
  metatarsalPadYPosition?: number; // 0.58 to 0.72 (Longitudinal position)
}

export interface Point2D {
  x: number;
  y: number;
}

export interface InsoleGeometry {
  size: number;
  sizingLabel: string;
  length: number;
  ballWidth: number;
  heelWidth: number;
  waistWidth: number;
  outlinePointsRight: Point2D[];
  outlinePointsLeft: Point2D[];
  archPlatePointsRight: Point2D[];
  archPlatePointsLeft: Point2D[];
  heelCupPointsRight: Point2D[];
  heelCupPointsLeft: Point2D[];
  metatarsalPadPointsRight: Point2D[];
  metatarsalPadPointsLeft: Point2D[];
  svgPathRight: string;
  svgPathLeft: string;
  archPlateSvgRight: string;
  archPlateSvgLeft: string;
  heelCupSvgRight: string;
  heelCupSvgLeft: string;
  metatarsalSvgRight: string;
  metatarsalSvgLeft: string;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
}

/**
 * Universal Sizing Converter between EU, US Men, US Women, UK, and Mondopoint
 */
export function convertSizing(system: SizingSystem, val: number): SizingConversion {
  let eu = 41;

  switch (system) {
    case "EU":
      eu = val;
      break;
    case "US_MEN":
      eu = Math.round((val + 33) * 10) / 10;
      break;
    case "US_WOMEN":
      eu = Math.round((val + 31.5) * 10) / 10;
      break;
    case "UK":
      eu = Math.round((val + 33.5) * 10) / 10;
      break;
    case "MONDOPOINT_CM":
      eu = Math.round(((val * 10 + 6.6667) / 6.6667) * 10) / 10;
      break;
    case "CUSTOM_MM":
      eu = Math.round(((val + 6.6667) / 6.6667) * 10) / 10;
      break;
  }

  const lengthMm =
    system === "CUSTOM_MM"
      ? Math.round(val * 10) / 10
      : Math.round((eu * 6.6667 - 6.6667) * 10) / 10;

  const usMen = Math.round((eu - 33) * 10) / 10;
  const usWomen = Math.round((eu - 31.5) * 10) / 10;
  const uk = Math.round((eu - 33.5) * 10) / 10;
  const mondopointCm = Math.round(((lengthMm - 10) / 10) * 10) / 10;

  return {
    system,
    inputValue: val,
    eu: Math.round(eu * 10) / 10,
    usMen: Math.max(1, usMen),
    usWomen: Math.max(1, usWomen),
    uk: Math.max(1, uk),
    mondopointCm: Math.max(10, mondopointCm),
    insoleLengthMm: lengthMm,
  };
}

export function calculateInsoleLength(size: number): number {
  return Math.round((size * 6.6667 - 6.6667) * 10) / 10;
}

export function calculateDefaultWidths(length: number) {
  return {
    ballWidth: Math.round(length * 0.365 * 10) / 10,
    heelWidth: Math.round(length * 0.255 * 10) / 10,
    waistWidth: Math.round(length * 0.225 * 10) / 10,
  };
}

/**
 * Catmull-Rom Spline Interpolation for organic, ultra-smooth curve through landmark points
 */
function interpolateSpline(controlPoints: Point2D[], subdivisions: number = 6): Point2D[] {
  const pts = [...controlPoints];
  const n = pts.length;
  const result: Point2D[] = [];

  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];

    for (let j = 0; j < subdivisions; j++) {
      const t = j / subdivisions;
      const t2 = t * t;
      const t3 = t2 * t;

      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

      const y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

      result.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
    }
  }

  return result;
}

/**
 * Generate Authentic Anatomical Footwear Insole Perimeter (Right Foot)
 */
function generateAnatomicalInsoleContour(
  length: number,
  ballWidth: number,
  heelWidth: number,
  waistWidth: number,
  archProfile: ArchProfile = "MEDIUM",
  archFactor: number = 1.0,
  toeShape: ToeShape = "ROUNDED"
): Point2D[] {
  const halfBall = ballWidth / 2;
  const halfHeel = heelWidth / 2;
  const halfWaist = waistWidth / 2;

  const archMultiplier = archProfile === "FLAT" ? 0.75 : archProfile === "HIGH" ? 1.35 : 1.0;
  const effectiveArchDepth = archFactor * archMultiplier;

  const greatToeOffset =
    toeShape === "ANATOMIC" ? halfBall * 0.32 : toeShape === "SQUARE_ROUND" ? halfBall * 0.12 : halfBall * 0.22;
  const lateralToeDrop = toeShape === "SQUARE_ROUND" ? 0.94 : 0.88;

  const landmarks: Point2D[] = [
    { x: 0, y: 0 },
    { x: halfHeel * 0.82, y: length * 0.06 },
    { x: halfHeel * 0.96, y: length * 0.14 },
    { x: halfWaist * 0.45 / effectiveArchDepth, y: length * 0.36 },
    { x: halfBall * 0.58, y: length * 0.56 },
    { x: halfBall * 1.05, y: length * 0.71 },
    { x: halfBall * 0.88, y: length * 0.86 },
    { x: greatToeOffset, y: length * 1.0 },
    { x: -halfBall * 0.15, y: length * 0.98 },
    { x: -halfBall * 0.72, y: length * lateralToeDrop },
    { x: -halfBall * 0.98, y: length * 0.67 },
    { x: -halfWaist * 0.92, y: length * 0.42 },
    { x: -halfHeel * 0.96, y: length * 0.15 },
    { x: -halfHeel * 0.82, y: length * 0.06 },
  ];

  return interpolateSpline(landmarks, 5);
}

/**
 * Generate Customizable TPU / Composite Arch Support Plate
 */
function generateCustomArchPlate(
  length: number,
  ballWidth: number,
  heelWidth: number,
  waistWidth: number,
  lengthFactor: number = 1.0,
  widthFactor: number = 1.0,
  hasLateralWing: boolean = false
): Point2D[] {
  const halfBall = ballWidth / 2;
  const halfHeel = heelWidth / 2;
  const halfWaist = waistWidth / 2;

  const startY = length * Math.max(0.10, 0.15 * (2 - lengthFactor));
  const endY = length * Math.min(0.68, 0.58 * lengthFactor);
  const midY = (startY + endY) / 2;

  const medialSpread = Math.min(halfWaist * 0.38, halfWaist * 0.30 * widthFactor);
  const lateralSpread = hasLateralWing ? -halfWaist * 0.35 : -halfWaist * 0.18;

  const landmarks: Point2D[] = [
    { x: halfHeel * 0.35 * widthFactor, y: startY },
    { x: medialSpread, y: midY },
    { x: halfBall * 0.40 * widthFactor, y: endY },
    { x: halfBall * 0.15, y: endY + length * 0.03 },
    { x: lateralSpread, y: midY },
    { x: -halfHeel * 0.12, y: startY + length * 0.04 },
    { x: 0, y: startY - length * 0.02 },
  ];

  return interpolateSpline(landmarks, 4);
}

/**
 * Generate Customizable Heel Cup Pad
 */
function generateCustomHeelCup(
  length: number,
  heelWidth: number,
  depthProfile: HeelCupDepthProfile = "MEDIUM",
  radiusFactor: number = 1.0
): Point2D[] {
  const halfHeel = heelWidth / 2;
  const depthMultiplier = depthProfile === "SHALLOW" ? 0.85 : depthProfile === "DEEP" ? 1.25 : 1.0;
  const r = Math.min(halfHeel * 0.82, halfHeel * 0.68 * radiusFactor);
  const topY = length * Math.min(0.24, 0.185 * depthMultiplier);

  const landmarks: Point2D[] = [
    { x: 0, y: length * 0.02 },
    { x: r, y: length * 0.08 },
    { x: r * 0.85, y: length * 0.15 },
    { x: 0, y: topY },
    { x: -r * 0.85, y: length * 0.15 },
    { x: -r, y: length * 0.08 },
  ];

  return interpolateSpline(landmarks, 4);
}

/**
 * Generate Customizable Metatarsal Dome Cushion
 */
function generateCustomMetatarsalPad(
  length: number,
  ballWidth: number,
  sizeFactor: number = 1.0,
  yPositionFactor: number = 0.65
): Point2D[] {
  const halfBall = ballWidth / 2;
  const centerX = halfBall * 0.12;
  const centerY = length * Math.max(0.58, Math.min(0.72, yPositionFactor));
  const rx = halfBall * 0.32 * Math.max(0.6, Math.min(1.4, sizeFactor));
  const ry = length * 0.055 * Math.max(0.6, Math.min(1.4, sizeFactor));

  const landmarks: Point2D[] = [];
  const steps = 16;

  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const x = centerX + rx * Math.cos(angle);
    const y = centerY + ry * Math.sin(angle) * (1 - 0.25 * Math.sin(angle));
    landmarks.push({ x, y });
  }

  return interpolateSpline(landmarks, 2);
}

/**
 * Converts Point array to smooth SVG path string
 */
function pointsToSvgPath(points: Point2D[], offsetX: number, offsetY: number, scale: number = 1.0): string {
  if (!points || points.length === 0) return "";
  const first = points[0];
  let d = `M ${(first.x + offsetX) * scale} ${(offsetY - first.y) * scale}`;

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    d += ` L ${(p.x + offsetX) * scale} ${(offsetY - p.y) * scale}`;
  }
  d += " Z";
  return d;
}

function mirrorPoints(points: Point2D[]): Point2D[] {
  return points.map((p) => ({ x: -p.x, y: p.y }));
}

/**
 * Build Full Parametric Insole Geometry with Customizable Orthotic Layers
 */
export function buildInsoleGeometry(params: InsoleParameters): InsoleGeometry {
  const sizing = convertSizing(
    params.sizingSystem || "EU",
    params.rawSizeValue || params.shoeSize || 41
  );

  const length = params.baseLengthMm || sizing.insoleLengthMm;
  const defaults = calculateDefaultWidths(length);

  const ballWidth = params.ballWidthMm || defaults.ballWidth;
  const heelWidth = params.heelWidthMm || defaults.heelWidth;
  const waistWidth = params.waistWidthMm || defaults.waistWidth;

  const outlineRight = generateAnatomicalInsoleContour(
    length,
    ballWidth,
    heelWidth,
    waistWidth,
    params.archProfile || "MEDIUM",
    params.archOffsetFactor || 1.0,
    params.toeShape || "ROUNDED"
  );
  const outlineLeft = mirrorPoints(outlineRight);

  const archPlateRight = generateCustomArchPlate(
    length,
    ballWidth,
    heelWidth,
    waistWidth,
    params.archPlateLengthFactor || 1.0,
    params.archPlateWidthFactor || 1.0,
    params.archPlateLateralWing || false
  );
  const archPlateLeft = mirrorPoints(archPlateRight);

  const heelCupRight = generateCustomHeelCup(
    length,
    heelWidth,
    params.heelCupDepthProfile || "MEDIUM",
    params.heelCupRadiusFactor || 1.0
  );
  const heelCupLeft = mirrorPoints(heelCupRight);

  const metatarsalRight = generateCustomMetatarsalPad(
    length,
    ballWidth,
    params.metatarsalPadSizeFactor || 1.0,
    params.metatarsalPadYPosition || 0.65
  );
  const metatarsalLeft = mirrorPoints(metatarsalRight);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  outlineRight.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const width = Math.round((maxX - minX) * 10) / 10;
  const height = Math.round((maxY - minY) * 10) / 10;
  const offsetX = Math.abs(minX) + 15;
  const offsetY = height + 15;

  let sizingLabel = `EU ${sizing.eu}`;
  if (params.sizingSystem === "US_MEN") sizingLabel = `US Men ${params.rawSizeValue}`;
  else if (params.sizingSystem === "US_WOMEN") sizingLabel = `US Women ${params.rawSizeValue}`;
  else if (params.sizingSystem === "UK") sizingLabel = `UK ${params.rawSizeValue}`;
  else if (params.sizingSystem === "MONDOPOINT_CM") sizingLabel = `${params.rawSizeValue} cm`;
  else if (params.sizingSystem === "CUSTOM_MM") sizingLabel = `${length} mm`;

  return {
    size: sizing.eu,
    sizingLabel,
    length,
    ballWidth,
    heelWidth,
    waistWidth,
    outlinePointsRight: outlineRight,
    outlinePointsLeft: outlineLeft,
    archPlatePointsRight: archPlateRight,
    archPlatePointsLeft: archPlateLeft,
    heelCupPointsRight: heelCupRight,
    heelCupPointsLeft: heelCupLeft,
    metatarsalPadPointsRight: metatarsalRight,
    metatarsalPadPointsLeft: metatarsalLeft,
    svgPathRight: pointsToSvgPath(outlineRight, offsetX, offsetY),
    svgPathLeft: pointsToSvgPath(outlineLeft, offsetX, offsetY),
    archPlateSvgRight: pointsToSvgPath(archPlateRight, offsetX, offsetY),
    archPlateSvgLeft: pointsToSvgPath(archPlateLeft, offsetX, offsetY),
    heelCupSvgRight: pointsToSvgPath(heelCupRight, offsetX, offsetY),
    heelCupSvgLeft: pointsToSvgPath(heelCupLeft, offsetX, offsetY),
    metatarsalSvgRight: pointsToSvgPath(metatarsalRight, offsetX, offsetY),
    metatarsalSvgLeft: pointsToSvgPath(metatarsalLeft, offsetX, offsetY),
    bounds: {
      minX,
      maxX,
      minY,
      maxY,
      width: width + 30,
      height: height + 30,
    },
  };
}

/**
 * Standard Presets Catalog with Component Layer Defaults
 */
export const INSOLE_PRESETS = [
  {
    id: "ortho-sport-performance",
    name: "Ortho Sport Performance",
    description: "Anatomical high arch with metatarsal dome and reinforced heel cup for running & basketball",
    archProfile: "HIGH" as ArchProfile,
    archOffsetFactor: 1.25,
    toeShape: "ANATOMIC" as ToeShape,
    thicknessForefootMm: 3.5,
    thicknessHeelMm: 6.0,
    materialType: "High Density EVA 65C + TPU Arch Shank",
    archPlateLengthFactor: 1.15,
    archPlateWidthFactor: 1.2,
    archPlateLateralWing: true,
    heelCupDepthProfile: "DEEP" as HeelCupDepthProfile,
    heelCupRadiusFactor: 1.1,
    metatarsalPadSizeFactor: 1.15,
    metatarsalPadYPosition: 0.66,
  },
  {
    id: "comfort-everyday-memory",
    name: "Comfort Everyday Memory",
    description: "Neutral support with natural latex memory foam for casual sneakers and daily walking",
    archProfile: "MEDIUM" as ArchProfile,
    archOffsetFactor: 1.0,
    toeShape: "ROUNDED" as ToeShape,
    thicknessForefootMm: 3.0,
    thicknessHeelMm: 4.5,
    materialType: "EVA Foam + Natural Latex Layer",
    archPlateLengthFactor: 0.95,
    archPlateWidthFactor: 0.95,
    archPlateLateralWing: false,
    heelCupDepthProfile: "MEDIUM" as HeelCupDepthProfile,
    heelCupRadiusFactor: 1.0,
    metatarsalPadSizeFactor: 0.9,
    metatarsalPadYPosition: 0.65,
  },
  {
    id: "flatfoot-correction-firm",
    name: "Flatfoot Correction Firm",
    description: "Rigid medial arch contour to support fallen arches and reduce overpronation",
    archProfile: "HIGH" as ArchProfile,
    archOffsetFactor: 1.4,
    toeShape: "ROUNDED" as ToeShape,
    thicknessForefootMm: 3.0,
    thicknessHeelMm: 6.5,
    materialType: "Rigid TPU Support Plate + EVA 70C",
    archPlateLengthFactor: 1.25,
    archPlateWidthFactor: 1.3,
    archPlateLateralWing: true,
    heelCupDepthProfile: "DEEP" as HeelCupDepthProfile,
    heelCupRadiusFactor: 1.15,
    metatarsalPadSizeFactor: 1.2,
    metatarsalPadYPosition: 0.66,
  },
  {
    id: "diabetic-gentle-cushion",
    name: "Diabetic Gentle Cushion",
    description: "Wide square-round toe box with continuous pressure-dispersing soft Plastazote",
    archProfile: "FLAT" as ArchProfile,
    archOffsetFactor: 0.85,
    toeShape: "SQUARE_ROUND" as ToeShape,
    thicknessForefootMm: 4.5,
    thicknessHeelMm: 5.5,
    materialType: "Plastazote + Soft PU Cushion",
    archPlateLengthFactor: 0.8,
    archPlateWidthFactor: 0.85,
    archPlateLateralWing: false,
    heelCupDepthProfile: "SHALLOW" as HeelCupDepthProfile,
    heelCupRadiusFactor: 0.9,
    metatarsalPadSizeFactor: 0.8,
    metatarsalPadYPosition: 0.64,
  },
  {
    id: "marathon-racing-ultralight",
    name: "Marathon Racing Ultralight",
    description: "Slim aerodynamic anatomic curve with maximized energy return and carbon support",
    archProfile: "MEDIUM" as ArchProfile,
    archOffsetFactor: 1.1,
    toeShape: "ANATOMIC" as ToeShape,
    thicknessForefootMm: 2.0,
    thicknessHeelMm: 3.8,
    materialType: "Supercritical PEBAX + Carbon Composite Shank",
    archPlateLengthFactor: 1.05,
    archPlateWidthFactor: 1.05,
    archPlateLateralWing: false,
    heelCupDepthProfile: "MEDIUM" as HeelCupDepthProfile,
    heelCupRadiusFactor: 0.95,
    metatarsalPadSizeFactor: 1.0,
    metatarsalPadYPosition: 0.65,
  },
];

/**
 * Calculate total perimeter length of a closed point loop (in millimeters)
 */
export function calculatePerimeterLength(pts: Point2D[]): number {
  if (!pts || pts.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return Math.round(total * 10) / 10;
}

/**
 * Generate AutoCAD R12 DXF Stream (CorelDRAW, AutoCAD, and CNC Cutters compatible)
 */
export function generateDxfContent(geometry: InsoleGeometry, foot: FootType = "RIGHT"): string {
  if (foot === "PAIR") {
    return generatePairDxfContent(geometry);
  }

  const points = foot === "LEFT" ? geometry.outlinePointsLeft : geometry.outlinePointsRight;
  const archPoints = foot === "LEFT" ? geometry.archPlatePointsLeft : geometry.archPlatePointsRight;
  const heelCupPoints = foot === "LEFT" ? geometry.heelCupPointsLeft : geometry.heelCupPointsRight;
  const metaPoints = foot === "LEFT" ? geometry.metatarsalPadPointsLeft : geometry.metatarsalPadPointsRight;

  let dxf = "";

  dxf += "0\nSECTION\n2\nHEADER\n";
  dxf += "9\n$ACADVER\n1\nAC1009\n";
  dxf += "9\n$INSUNITS\n70\n4\n";
  dxf += "0\nENDSEC\n";

  dxf += "0\nSECTION\n2\nTABLES\n";
  dxf += "0\nTABLE\n2\nLAYER\n70\n5\n";
  dxf += "0\nLAYER\n2\n0\n70\n0\n62\n7\n6\nCONTINUOUS\n";
  dxf += "0\nLAYER\n2\nCUT_OUTLINE\n70\n0\n62\n7\n6\nCONTINUOUS\n";
  dxf += "0\nLAYER\n2\nARCH_SUPPORT\n70\n0\n62\n1\n6\nCONTINUOUS\n";
  dxf += "0\nLAYER\n2\nHEEL_CUP\n70\n0\n62\n3\n6\nCONTINUOUS\n";
  dxf += "0\nLAYER\n2\nMETATARSAL\n70\n0\n62\n4\n6\nCONTINUOUS\n";
  dxf += "0\nENDTAB\n0\nENDSEC\n";

  dxf += "0\nSECTION\n2\nENTITIES\n";

  const appendPolyline = (pts: Point2D[], layerName: string) => {
    if (!pts || pts.length === 0) return;
    dxf += "0\nPOLYLINE\n";
    dxf += `8\n${layerName}\n`;
    dxf += "66\n1\n";
    dxf += "70\n1\n";

    pts.forEach((p) => {
      dxf += "0\nVERTEX\n";
      dxf += `8\n${layerName}\n`;
      dxf += `10\n${p.x.toFixed(3)}\n`;
      dxf += `20\n${p.y.toFixed(3)}\n`;
      dxf += "30\n0.000\n";
    });

    dxf += "0\nSEQEND\n";
  };

  appendPolyline(points, "CUT_OUTLINE");
  appendPolyline(archPoints, "ARCH_SUPPORT");
  appendPolyline(heelCupPoints, "HEEL_CUP");
  appendPolyline(metaPoints, "METATARSAL");

  dxf += "0\nENDSEC\n0\nEOF\n";

  return dxf;
}

/**
 * Generate Paired Left + Right AutoCAD R12 DXF Stream
 */
export function generatePairDxfContent(geometry: InsoleGeometry, gapMm: number = 25): string {
  const offsetX = geometry.bounds.width + gapMm;

  let dxf = "";

  dxf += "0\nSECTION\n2\nHEADER\n";
  dxf += "9\n$ACADVER\n1\nAC1009\n";
  dxf += "9\n$INSUNITS\n70\n4\n";
  dxf += "0\nENDSEC\n";

  dxf += "0\nSECTION\n2\nTABLES\n";
  dxf += "0\nTABLE\n2\nLAYER\n70\n5\n";
  dxf += "0\nLAYER\n2\n0\n70\n0\n62\n7\n6\nCONTINUOUS\n";
  dxf += "0\nLAYER\n2\nCUT_OUTLINE\n70\n0\n62\n7\n6\nCONTINUOUS\n";
  dxf += "0\nLAYER\n2\nARCH_SUPPORT\n70\n0\n62\n1\n6\nCONTINUOUS\n";
  dxf += "0\nLAYER\n2\nHEEL_CUP\n70\n0\n62\n3\n6\nCONTINUOUS\n";
  dxf += "0\nLAYER\n2\nMETATARSAL\n70\n0\n62\n4\n6\nCONTINUOUS\n";
  dxf += "0\nENDTAB\n0\nENDSEC\n";

  dxf += "0\nSECTION\n2\nENTITIES\n";

  const appendPolyline = (pts: Point2D[], layerName: string, dx: number = 0) => {
    if (!pts || pts.length === 0) return;
    dxf += "0\nPOLYLINE\n";
    dxf += `8\n${layerName}\n`;
    dxf += "66\n1\n";
    dxf += "70\n1\n";

    pts.forEach((p) => {
      dxf += "0\nVERTEX\n";
      dxf += `8\n${layerName}\n`;
      dxf += `10\n${(p.x + dx).toFixed(3)}\n`;
      dxf += `20\n${p.y.toFixed(3)}\n`;
      dxf += "30\n0.000\n";
    });

    dxf += "0\nSEQEND\n";
  };

  // Left Insole (at X=0)
  appendPolyline(geometry.outlinePointsLeft, "CUT_OUTLINE", 0);
  appendPolyline(geometry.archPlatePointsLeft, "ARCH_SUPPORT", 0);
  appendPolyline(geometry.heelCupPointsLeft, "HEEL_CUP", 0);
  appendPolyline(geometry.metatarsalPadPointsLeft, "METATARSAL", 0);

  // Right Insole (at X=offsetX)
  appendPolyline(geometry.outlinePointsRight, "CUT_OUTLINE", offsetX);
  appendPolyline(geometry.archPlatePointsRight, "ARCH_SUPPORT", offsetX);
  appendPolyline(geometry.heelCupPointsRight, "HEEL_CUP", offsetX);
  appendPolyline(geometry.metatarsalPadPointsRight, "METATARSAL", offsetX);

  dxf += "0\nENDSEC\n0\nEOF\n";

  return dxf;
}

/**
 * Generate Standalone SVG File Content
 */
export function generateSvgDocument(geometry: InsoleGeometry, foot: FootType = "RIGHT"): string {
  if (foot === "PAIR") {
    return generatePairSvgDocument(geometry);
  }

  const path = foot === "LEFT" ? geometry.svgPathLeft : geometry.svgPathRight;
  const arch = foot === "LEFT" ? geometry.archPlateSvgLeft : geometry.archPlateSvgRight;
  const heel = foot === "LEFT" ? geometry.heelCupSvgLeft : geometry.heelCupSvgRight;
  const meta = foot === "LEFT" ? geometry.metatarsalSvgLeft : geometry.metatarsalSvgRight;

  const w = geometry.bounds.width;
  const h = geometry.bounds.height;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm">
  <style>
    .cut-outline { fill: #f8fafc; stroke: #8B0000; stroke-width: 1.5; }
    .arch-support { fill: #fee2e2; stroke: #ef4444; stroke-width: 1.0; stroke-dasharray: 2,2; opacity: 0.85; }
    .heel-cup { fill: #dcfce7; stroke: #16a34a; stroke-width: 1.0; stroke-dasharray: 2,2; opacity: 0.85; }
    .metatarsal { fill: #e0f2fe; stroke: #0284c7; stroke-width: 1.0; stroke-dasharray: 2,2; opacity: 0.85; }
    .text-label { font-family: monospace; font-size: 8px; fill: #64748b; font-weight: bold; }
  </style>
  <g id="insole-design">
    <path class="cut-outline" d="${path}" />
    <path class="arch-support" d="${arch}" />
    <path class="heel-cup" d="${heel}" />
    <path class="metatarsal" d="${meta}" />
    <text x="15" y="${h - 15}" class="text-label">EQUATOR INSOLE ${geometry.sizingLabel} (${foot}) - L:${geometry.length}mm W:${geometry.ballWidth}mm</text>
  </g>
</svg>`;
}

/**
 * Generate Combined Paired SVG File Content
 */
export function generatePairSvgDocument(geometry: InsoleGeometry, gapMm: number = 25): string {
  const singleW = geometry.bounds.width;
  const totalW = singleW * 2 + gapMm;
  const h = geometry.bounds.height;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${h}" width="${totalW}mm" height="${h}mm">
  <style>
    .cut-outline { fill: #f8fafc; stroke: #8B0000; stroke-width: 1.5; }
    .arch-support { fill: #fee2e2; stroke: #ef4444; stroke-width: 1.0; stroke-dasharray: 2,2; opacity: 0.85; }
    .heel-cup { fill: #dcfce7; stroke: #16a34a; stroke-width: 1.0; stroke-dasharray: 2,2; opacity: 0.85; }
    .metatarsal { fill: #e0f2fe; stroke: #0284c7; stroke-width: 1.0; stroke-dasharray: 2,2; opacity: 0.85; }
    .text-label { font-family: monospace; font-size: 8px; fill: #64748b; font-weight: bold; }
  </style>
  <g id="insole-pair-left" transform="translate(0, 0)">
    <path class="cut-outline" d="${geometry.svgPathLeft}" />
    <path class="arch-support" d="${geometry.archPlateSvgLeft}" />
    <path class="heel-cup" d="${geometry.heelCupSvgLeft}" />
    <path class="metatarsal" d="${geometry.metatarsalSvgLeft}" />
    <text x="15" y="${h - 15}" class="text-label">EQUATOR INSOLE ${geometry.sizingLabel} (LEFT)</text>
  </g>
  <g id="insole-pair-right" transform="translate(${singleW + gapMm}, 0)">
    <path class="cut-outline" d="${geometry.svgPathRight}" />
    <path class="arch-support" d="${geometry.archPlateSvgRight}" />
    <path class="heel-cup" d="${geometry.heelCupSvgRight}" />
    <path class="metatarsal" d="${geometry.metatarsalSvgRight}" />
    <text x="15" y="${h - 15}" class="text-label">EQUATOR INSOLE ${geometry.sizingLabel} (RIGHT) - L:${geometry.length}mm</text>
  </g>
</svg>`;
}

export const generateDxfR12Stream = generateDxfContent;

