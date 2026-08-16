/**
 * Equator Insole CAD Engine
 * Parametric footwear insole geometry builder, SVG generator, and AutoCAD R12 DXF stream writer.
 * All units in Millimeters (mm).
 */

export type ArchProfile = "FLAT" | "MEDIUM" | "HIGH";
export type FootType = "LEFT" | "RIGHT" | "PAIR";
export type ToeShape = "ROUNDED" | "ANATOMIC" | "SQUARE_ROUND";

export interface InsoleParameters {
  shoeSize: number; // EU Size, e.g. 40
  baseLengthMm?: number; // Override or auto-calculated
  ballWidthMm?: number; // Forefoot width
  heelWidthMm?: number; // Rearfoot width
  waistWidthMm?: number; // Arch waist width
  archProfile?: ArchProfile;
  archOffsetFactor?: number; // 0.8 to 1.5
  toeShape?: ToeShape;
  thicknessForefootMm?: number;
  thicknessHeelMm?: number;
  hasArchPlate?: boolean;
  hasHeelCup?: boolean;
  hasMetatarsalPad?: boolean;
  hasForefootPad?: boolean;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface InsoleGeometry {
  size: number;
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
 * Standard Paris Point Length Formula: L = Size * 6.6667 - 6.6667 (in mm)
 */
export function calculateInsoleLength(size: number): number {
  return Math.round((size * 6.6667 - 6.6667) * 10) / 10;
}

/**
 * Standard Insole Width Proportions
 */
export function calculateDefaultWidths(length: number) {
  return {
    ballWidth: Math.round(length * 0.36 * 10) / 10,
    heelWidth: Math.round(length * 0.26 * 10) / 10,
    waistWidth: Math.round(length * 0.22 * 10) / 10,
  };
}

/**
 * Generates smooth closed polygon points for Right insole
 */
function generateRightInsoleContour(
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

  // Arch curvature offset multiplier
  const archMultiplier =
    archProfile === "FLAT" ? 0.85 : archProfile === "HIGH" ? 1.25 : 1.0;
  const effectiveArchFactor = archFactor * archMultiplier;

  // Key landmark coordinates in local millimeter space (Heel origin at Y=0, Toe at Y=L)
  // Medial is +X, Lateral is -X (for Right Foot)
  const toeX = toeShape === "ANATOMIC" ? halfBall * 0.18 : 0;
  const toeY = length;

  const points: Point2D[] = [];
  const segments = 48; // Dense sampling for high-precision CNC / DXF rendering

  // 1. Lateral Side (Outer Edge): Toe Apex -> 5th Metatarsal -> Lateral Waist -> Lateral Heel -> Heel Center
  // 2. Medial Side (Inner Edge): Heel Center -> Medial Heel -> Medial Arch -> 1st Metatarsal -> Toe Apex

  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0 to 1 along length from Heel (0) to Toe (1)
    const y = t * length;
    let x = 0;

    if (t <= 0.2) {
      // Heel Region (Y: 0% to 20%)
      const localT = t / 0.2;
      const r = halfHeel * Math.sin((localT * Math.PI) / 2);
      x = -r; // Lateral heel
    } else if (t <= 0.6) {
      // Lateral Waist / Arch Region (Y: 20% to 60%)
      const localT = (t - 0.2) / 0.4;
      const startX = -halfHeel;
      const endX = -halfBall * 0.95;
      const midWaistX = -halfWaist * 1.05;
      // Quadratic blend
      x = (1 - localT) * (1 - localT) * startX + 2 * (1 - localT) * localT * midWaistX + localT * localT * endX;
    } else if (t <= 0.85) {
      // Forefoot / 5th Metatarsal Flare (Y: 60% to 85%)
      const localT = (t - 0.6) / 0.25;
      x = -halfBall * 0.95 + (toeShape === "ANATOMIC" ? 0.05 : 0) * halfBall * localT;
    } else {
      // Lateral Toe Wrap to Apex (Y: 85% to 100%)
      const localT = (t - 0.85) / 0.15;
      const startX = -halfBall * 0.95;
      x = startX * Math.cos((localT * Math.PI) / 2) + toeX * Math.sin((localT * Math.PI) / 2);
    }

    points.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
  }

  // Now return from Toe Apex back down along the Medial side (Inner edge with arch)
  for (let i = segments; i >= 0; i--) {
    const t = i / segments;
    const y = t * length;
    let x = 0;

    if (t >= 0.85) {
      // Medial Toe Tip (Great Toe)
      const localT = (t - 0.85) / 0.15;
      const apexX = toeX;
      const ballMedialX = halfBall * 1.02;
      x = apexX + (ballMedialX - apexX) * (1 - localT);
    } else if (t >= 0.65) {
      // 1st Metatarsal Joint Ball Flare (Y: 65% to 85%)
      const localT = (t - 0.65) / 0.2;
      const waistMedialX = halfWaist * 0.75 / effectiveArchFactor;
      const ballMedialX = halfBall * 1.02;
      x = waistMedialX + (ballMedialX - waistMedialX) * Math.sin((localT * Math.PI) / 2);
    } else if (t >= 0.2) {
      // Medial Longitudinal Arch Cavity (Y: 20% to 65%)
      const localT = (t - 0.2) / 0.45;
      const heelMedialX = halfHeel * 0.95;
      const archDeepestX = (halfWaist * 0.65) / effectiveArchFactor;
      // Arch curve parabola
      const curve = Math.sin(localT * Math.PI);
      x = heelMedialX * (1 - localT) + (halfBall * 0.8) * localT - (heelMedialX - archDeepestX) * curve;
    } else {
      // Medial Heel Curve (Y: 0% to 20%)
      const localT = t / 0.2;
      const r = halfHeel * Math.sin((localT * Math.PI) / 2);
      x = r;
    }

    points.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
  }

  return points;
}

/**
 * Generate TPU / EVA Arch Support Plate Contour
 */
function generateArchPlatePoints(length: number, ballWidth: number, heelWidth: number, waistWidth: number): Point2D[] {
  const startY = length * 0.18;
  const endY = length * 0.68;
  const points: Point2D[] = [];
  const steps = 24;

  // Medial inner edge of arch plate
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = startY + t * (endY - startY);
    const bulge = Math.sin(t * Math.PI) * (waistWidth * 0.35);
    const x = waistWidth * 0.2 + bulge;
    points.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
  }
  // Lateral inner line of arch plate
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const y = startY + t * (endY - startY);
    const x = -waistWidth * 0.15;
    points.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
  }
  return points;
}

/**
 * Generate Heel Cup Cushion Contour (Oval)
 */
function generateHeelCupPoints(length: number, heelWidth: number): Point2D[] {
  const centerY = length * 0.11;
  const rx = heelWidth * 0.35;
  const ry = length * 0.08;
  const points: Point2D[] = [];
  const steps = 32;

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const x = rx * Math.cos(angle);
    const y = centerY + ry * Math.sin(angle);
    points.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
  }
  return points;
}

/**
 * Generate Metatarsal Pad (Tear-drop cushion at forefoot)
 */
function generateMetatarsalPadPoints(length: number, ballWidth: number): Point2D[] {
  const centerY = length * 0.64;
  const rx = ballWidth * 0.16;
  const ry = length * 0.06;
  const points: Point2D[] = [];
  const steps = 24;

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const x = rx * Math.cos(angle) + ballWidth * 0.05; // Slightly medial
    const y = centerY + ry * Math.sin(angle);
    points.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
  }
  return points;
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

/**
 * Mirror points horizontally for Left Foot (x -> -x)
 */
function mirrorPoints(points: Point2D[]): Point2D[] {
  return points.map((p) => ({ x: -p.x, y: p.y }));
}

/**
 * Generate Complete Parametric Insole Geometry
 */
export function buildInsoleGeometry(params: InsoleParameters): InsoleGeometry {
  const size = params.shoeSize || 40;
  const length = params.baseLengthMm || calculateInsoleLength(size);
  const defaults = calculateDefaultWidths(length);

  const ballWidth = params.ballWidthMm || defaults.ballWidth;
  const heelWidth = params.heelWidthMm || defaults.heelWidth;
  const waistWidth = params.waistWidthMm || defaults.waistWidth;

  const outlineRight = generateRightInsoleContour(
    length,
    ballWidth,
    heelWidth,
    waistWidth,
    params.archProfile || "MEDIUM",
    params.archOffsetFactor || 1.0,
    params.toeShape || "ROUNDED"
  );
  const outlineLeft = mirrorPoints(outlineRight);

  const archPlateRight = generateArchPlatePoints(length, ballWidth, heelWidth, waistWidth);
  const archPlateLeft = mirrorPoints(archPlateRight);

  const heelCupRight = generateHeelCupPoints(length, heelWidth);
  const heelCupLeft = mirrorPoints(heelCupRight);

  const metatarsalRight = generateMetatarsalPadPoints(length, ballWidth);
  const metatarsalLeft = mirrorPoints(metatarsalRight);

  // Compute bounding box
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
  const offsetX = width / 2 + 10;
  const offsetY = height + 10;

  return {
    size,
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
      width: width + 20,
      height: height + 20,
    },
  };
}

/**
 * Standard Presets Catalog
 */
export const INSOLE_PRESETS = [
  {
    id: "ortho-sport-performance",
    name: "Ortho Sport Performance",
    description: "High arch support with metatarsal and heel cushioning for athletic footwear",
    archProfile: "HIGH" as ArchProfile,
    archOffsetFactor: 1.25,
    toeShape: "ANATOMIC" as ToeShape,
    thicknessForefootMm: 3.5,
    thicknessHeelMm: 5.5,
    materialType: "High Density EVA + TPU Shank",
  },
  {
    id: "comfort-everyday-memory",
    name: "Comfort Everyday Memory",
    description: "Neutral arch with deep heel cup for casual and walking sneakers",
    archProfile: "MEDIUM" as ArchProfile,
    archOffsetFactor: 1.0,
    toeShape: "ROUNDED" as ToeShape,
    thicknessForefootMm: 3.0,
    thicknessHeelMm: 4.5,
    materialType: "EVA Foam + Natural Latex Foam",
  },
  {
    id: "flatfoot-correction-firm",
    name: "Flatfoot Correction Firm",
    description: "Rigid medial contour support with gentle arch lift",
    archProfile: "HIGH" as ArchProfile,
    archOffsetFactor: 1.35,
    toeShape: "ROUNDED" as ToeShape,
    thicknessForefootMm: 3.0,
    thicknessHeelMm: 6.0,
    materialType: "Rigid TPU Support Plate + EVA Foam",
  },
  {
    id: "diabetic-gentle-cushion",
    name: "Diabetic Gentle Cushion",
    description: "Extra wide forefoot with pressure-dispersing zero seam design",
    archProfile: "FLAT" as ArchProfile,
    archOffsetFactor: 0.9,
    toeShape: "SQUARE_ROUND" as ToeShape,
    thicknessForefootMm: 4.0,
    thicknessHeelMm: 5.0,
    materialType: "Plastazote + Soft PU Cushion",
  },
  {
    id: "marathon-racing-ultralight",
    name: "Marathon Racing Ultralight",
    description: "Slim anatomical contour with maximized energy return",
    archProfile: "MEDIUM" as ArchProfile,
    archOffsetFactor: 1.05,
    toeShape: "ANATOMIC" as ToeShape,
    thicknessForefootMm: 2.0,
    thicknessHeelMm: 3.5,
    materialType: "Supercritical Foam PEBAX + Carbon Shank",
  },
];

/**
 * Generate AutoCAD R12 DXF Stream (Compatible with CorelDRAW, AutoCAD, and CNC Cutters)
 */
export function generateDxfContent(geometry: InsoleGeometry, foot: FootType = "RIGHT"): string {
  const points = foot === "LEFT" ? geometry.outlinePointsLeft : geometry.outlinePointsRight;
  const archPoints = foot === "LEFT" ? geometry.archPlatePointsLeft : geometry.archPlatePointsRight;
  const heelCupPoints = foot === "LEFT" ? geometry.heelCupPointsLeft : geometry.heelCupPointsRight;
  const metaPoints = foot === "LEFT" ? geometry.metatarsalPadPointsLeft : geometry.metatarsalPadPointsRight;

  let dxf = "";

  // 1. DXF Header
  dxf += "0\nSECTION\n2\nHEADER\n";
  dxf += "9\n$ACADVER\n1\nAC1009\n"; // AutoCAD R12 ASCII
  dxf += "9\n$INSUNITS\n70\n4\n"; // 4 = Millimeters
  dxf += "0\nENDSEC\n";

  // 2. Tables & Layers Definition
  dxf += "0\nSECTION\n2\nTABLES\n";
  dxf += "0\nTABLE\n2\nLAYER\n70\n5\n";

  // Layer: 0 (Default)
  dxf += "0\nLAYER\n2\n0\n70\n0\n62\n7\n6\nCONTINUOUS\n";
  // Layer: CUT_OUTLINE (White/Black knife cut)
  dxf += "0\nLAYER\n2\nCUT_OUTLINE\n70\n0\n62\n7\n6\nCONTINUOUS\n";
  // Layer: ARCH_SUPPORT (Red engraving / placement guide)
  dxf += "0\nLAYER\n2\nARCH_SUPPORT\n70\n0\n62\n1\n6\nCONTINUOUS\n";
  // Layer: HEEL_CUP (Green heel pad guide)
  dxf += "0\nLAYER\n2\nHEEL_CUP\n70\n0\n62\n3\n6\nCONTINUOUS\n";
  // Layer: METATARSAL (Cyan metatarsal dome guide)
  dxf += "0\nLAYER\n2\nMETATARSAL\n70\n0\n62\n4\n6\nCONTINUOUS\n";

  dxf += "0\nENDTAB\n0\nENDSEC\n";

  // 3. Entities Section
  dxf += "0\nSECTION\n2\nENTITIES\n";

  const appendPolyline = (pts: Point2D[], layerName: string) => {
    if (!pts || pts.length === 0) return;
    dxf += "0\nPOLYLINE\n";
    dxf += `8\n${layerName}\n`;
    dxf += "66\n1\n"; // Vertices follow flag
    dxf += "70\n1\n"; // Closed polyline flag

    pts.forEach((p) => {
      dxf += "0\nVERTEX\n";
      dxf += `8\n${layerName}\n`;
      dxf += `10\n${p.x.toFixed(3)}\n`;
      dxf += `20\n${p.y.toFixed(3)}\n`;
      dxf += "30\n0.000\n";
    });

    dxf += "0\nSEQEND\n";
  };

  // Write Outer Contour
  appendPolyline(points, "CUT_OUTLINE");

  // Write Inner Guidance Contours
  appendPolyline(archPoints, "ARCH_SUPPORT");
  appendPolyline(heelCupPoints, "HEEL_CUP");
  appendPolyline(metaPoints, "METATARSAL");

  // 4. End Entities & End of File
  dxf += "0\nENDSEC\n0\nEOF\n";

  return dxf;
}

/**
 * Generate Standalone SVG File Content
 */
export function generateSvgDocument(geometry: InsoleGeometry, foot: FootType = "RIGHT"): string {
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
    .arch-support { fill: #fee2e2; stroke: #ef4444; stroke-width: 1.0; stroke-dasharray: 2,2; opacity: 0.8; }
    .heel-cup { fill: #dcfce7; stroke: #16a34a; stroke-width: 1.0; stroke-dasharray: 2,2; opacity: 0.8; }
    .metatarsal { fill: #e0f2fe; stroke: #0284c7; stroke-width: 1.0; stroke-dasharray: 2,2; opacity: 0.8; }
    .text-label { font-family: monospace; font-size: 8px; fill: #64748b; font-weight: bold; }
  </style>
  <g id="insole-design">
    <path class="cut-outline" d="${path}" />
    <path class="arch-support" d="${arch}" />
    <path class="heel-cup" d="${heel}" />
    <path class="metatarsal" d="${meta}" />
    <text x="15" y="${h - 15}" class="text-label">EQUATOR INSOLE EU ${geometry.size} (${foot}) - L:${geometry.length}mm W:${geometry.ballWidth}mm</text>
  </g>
</svg>`;
}
