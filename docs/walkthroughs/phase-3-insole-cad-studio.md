# Technical & Engineering Guide: Phase 3 — Insole CAD Engine, Orthotic Layers & Vector Studio

## 1. Module Overview & Industrial Role

The **Insole CAD & Generative Vector Design Studio** generates custom anatomical footwear insole cutting patterns and orthotic component blueprints. It replaces manual paper tracing with mathematical parametric curve generation, exporting directly to Scalable Vector Graphics (SVG) and AutoCAD R12 DXF formats compatible with **CorelDRAW 2020+**, AutoCAD, and CNC laser/die cutting machines.

---

## 2. Insole Mathematics & Geometric Formulations (`src/lib/cad/insoleEngine.ts`)

```
                          (Apex: Toe Box)
                               .-""-.
                             .'      '.
                           .'          '.
     Lateral Forefoot     /              \     Medial Forefoot
     Curve: R_lat       .'                '.   Curve: R_med
                       /                    \
                      |                      |
                      |   [Metatarsal Dome]  |  <--- W_ball (~0.36 * L)
                      |                      |
                       \                    /
                        \                  /   <--- Arch Inset Factor
                         |                |
                         |  [TPU Bridge]  |    <--- W_arch (~0.22 * L)
                         |                |
                          \              /
                           |            |      <--- W_heel (~0.26 * L)
                           | [Heel Cup] |
                            \          /
                             '.      .'
                               '-..-'
                            (Heel Center)
```

### 2.1 Standard Sizing Formula (European Paris Point Standard)
Length $L$ in physical millimeters is derived from the EU footwear size:
$$L = \text{Size} \times 6.67 - 6.7 \quad (\text{in mm})$$

**Multi-System Conversion Table:**
- $\text{EU } 36 = 233.4\text{ mm} \quad (\text{UK } 3.5 \mid \text{US Men } 4.5 \mid \text{US Women } 6.0 \mid \text{Mondo } 23.0\text{ cm})$
- $\text{EU } 40 = 260.1\text{ mm} \quad (\text{UK } 6.5 \mid \text{US Men } 7.5 \mid \text{US Women } 9.0 \mid \text{Mondo } 26.0\text{ cm})$
- $\text{EU } 45 = 293.5\text{ mm} \quad (\text{UK } 10.5 \mid \text{US Men } 11.5 \mid \text{US Women } 13.0 \mid \text{Mondo } 29.5\text{ cm})$

### 2.2 Width Proportions & Arch Offsets
- $\text{Forefoot (Ball) Width } W_{\text{ball}} = 0.36 \times L$
- $\text{Rearfoot (Heel) Width } W_{\text{heel}} = 0.26 \times L$
- $\text{Waist (Arch) Width } W_{\text{arch}} = 0.22 \times L$
- **Arch Profile Offset Factors:**
  - $\text{FLAT (Low)}: \text{Arch Offset} = 0.05 \times L$
  - $\text{MEDIUM (Neutral)}: \text{Arch Offset} = 0.09 \times L$
  - $\text{HIGH (High Arch)}: \text{Arch Offset} = 0.13 \times L$

---

## 3. Parametric Bézier SVG & DXF Architecture

### 3.1 Closed Smooth SVG Path Construction
The insole boundary is defined by cubic Bézier curve segments starting at the toe apex $(X_{\text{toe}}, Y_{\text{toe}})$, curving smoothly down the lateral side, around the heel arc, through the medial arch curve, and closing back at the toe:

```typescript
export function generateInsoleSvgPath(points: Point2D[], isLeftFoot: boolean, bounds: BoundingBox): string {
  // Mirror coordinates along horizontal center for left foot bed
  const transformed = isLeftFoot
    ? points.map((p) => ({ x: bounds.width - p.x, y: p.y }))
    : points;

  let d = `M ${transformed[0].x.toFixed(2)} ${transformed[0].y.toFixed(2)}`;
  for (let i = 1; i < transformed.length; i++) {
    const p = transformed[i];
    d += ` L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  d += " Z"; // Strict closed path
  return d;
}
```

### 3.2 AutoCAD R12 DXF Stream Generator (`src/app/api/cad/export-dxf/route.ts`)
DXF R12 is the universal industry exchange format for CNC cutting plotters and CorelDRAW:

```typescript
import Drawing from "dxf-writer";

export function buildInsoleDxf(geometry: InsoleGeometry): string {
  const d = new Drawing();
  d.setUnits("Millimeters");

  // Layer 1: Insole Outer Cut Boundary
  d.addLayer("OUTLINE", Drawing.ACI.WHITE, "CONTINUOUS");
  d.setActiveLayer("OUTLINE");
  d.drawPolyline(geometry.outlinePoints.map((p) => [p.x, -p.y]), true);

  // Layer 2: TPU Arch Support Shank Plate
  d.addLayer("ARCH_SUPPORT", Drawing.ACI.RED, "DASHED");
  d.setActiveLayer("ARCH_SUPPORT");
  d.drawPolyline(geometry.archPoints.map((p) => [p.x, -p.y]), true);

  // Layer 3: Heel Cup Alignment Guide
  d.addLayer("HEEL_CUP", Drawing.ACI.GREEN, "DASHED");
  d.setActiveLayer("HEEL_CUP");
  d.drawPolyline(geometry.heelPoints.map((p) => [p.x, -p.y]), true);

  // Layer 4: Metatarsal Cushion Dome Pad
  d.addLayer("METATARSAL", Drawing.ACI.CYAN, "DASHED");
  d.setActiveLayer("METATARSAL");
  d.drawPolyline(geometry.metatarsalPoints.map((p) => [p.x, -p.y]), true);

  return d.toDxfString();
}
```

---

## 4. Orthotic Component Layer Customization

Operators can manipulate 4 distinct insole layers independently:

1. **EVA/PU Cut Outline:** Full anatomical foot shape with Round, Anatomic, or Square toe shapes.
2. **TPU Arch Plate (Bridge):**
   - Length Factor ($0.75\times$ to $1.35\times$)
   - Medial Flange Height ($0.70\times$ to $1.30\times$)
   - Anti-Torsion Lateral Stabilizer Wing (Toggle)
3. **Mangkuk Tumit (Heel Cup):**
   - Depth Profile: `SHALLOW` (5mm), `MEDIUM` (10mm), `DEEP` (15mm)
   - Radius Factor ($0.80\times$ to $1.40\times$)
4. **Bantalan Metatarsal (Cushion Dome):**
   - Dome Diameter ($0.70\times$ to $1.40\times$)
   - Longitudinal Position ($55\%$ to $75\%$ of insole length)

---

## 5. Responsive Studio Architecture (Desktop vs Mobile)

- **Desktop View:** 3-Pane Master Layout (Left Parameters Rail, Center Interactive Canvas with Zoom/Pan, Right Collapsible Inspector).
- **Mobile View (`md:hidden`):** 4-View Mode Tab Switcher:
  - `👁️ Canvas`: Interactive viewport with touch zoom & pan.
  - `⚙️ Ukuran`: Scrollable sizing standard and fine-tuning sliders.
  - `🧩 Ortotik`: Layer sliders and visibility toggles.
  - `💾 AI & Ekspor`: Prompt AI insole generator, catalog presets, and DXF/SVG export buttons.

---

## 6. How to Build & Test Phase 3

1. **Verify Vector Exports:**
   - Test SVG generation: `POST /api/cad/export-svg`
   - Test DXF generation: `POST /api/cad/export-dxf`
2. **Import into CorelDRAW / AutoCAD:**
   Open the exported `.dxf` file in CorelDRAW or AutoCAD to verify true millimeter dimensioning.
3. **Run Production Build:**
   ```bash
   npm run build
   ```
