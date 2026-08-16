# CAD Domain Agent Guidelines (`src/lib/cad/`)

## 1. Domain Responsibility
This directory contains mathematical algorithms, parametric geometry builders, SVG renderers, and DXF exporter pipelines for the Equator Insole CAD Studio.

## 2. Insole Mathematical Formulas & Sizing Standards
- **Primary Length Calculation (EU Footwear Standard):**
  $$L = \text{Size} \times 6.67 - 6.7 \quad (\text{in mm})$$
  - EU 36: $36 \times 6.67 - 6.7 = 233.42\text{ mm}$
  - EU 40: $40 \times 6.67 - 6.7 = 260.10\text{ mm}$
  - EU 45: $45 \times 6.67 - 6.7 = 293.45\text{ mm}$
- **Width Proportion Scaling:**
  - Forefoot / Ball Width ($W_{\text{ball}}$): $\approx 0.36 \times L$
  - Heel Width ($W_{\text{heel}}$): $\approx 0.26 \times L$
  - Waist / Arch Width ($W_{\text{arch}}$): $\approx 0.22 \times L$
- **Arch Support Profiles:**
  - Flat / Low Arch: Medial contour offset $0.05 \times L$
  - Neutral / Medium Arch: Medial contour offset $0.09 \times L$
  - High Arch: Medial contour offset $0.13 \times L$

## 3. Coordinate System & Projection Rules
- **Physical Unit:** Millimeters (mm).
- **Canvas / SVG Projection:** Origin $(0, 0)$ is at the top-left of the bounding box, centered along the vertical midline ($X_{\text{center}} = W_{\text{ball}} / 2 + \text{margin}$).
- **Continuous Closed Path:** An insole profile MUST always form a closed, non-self-intersecting 2D contour starting at the toe apex $(X_{\text{toe}}, Y_{\text{toe}})$, curving along the lateral edge to the heel center $(X_{\text{heel}}, Y_{\text{heel}})$, and continuing along the medial arch back to the toe.

## 4. DXF File Generation Rules (AutoCAD R12 / CorelDRAW Compatibility)
- Use standard DXF R12 format with minimal header overhead for maximum compatibility with CorelDRAW 2020+, Laser/Die cutters, and AutoCAD.
- Use `POLYLINE` / `VERTEX` / `SEQEND` or `LWPOLYLINE` entities.
- Ensure all coordinates are written with at least 3 decimal places in millimeter scale.
- Layers:
  - `OUTLINE`: Color 7 (White/Black), primary insole perimeter cut line.
  - `ARCH_SUPPORT`: Color 1 (Red), inner arch contour marking.
  - `HEEL_CUP`: Color 3 (Green), heel pad alignment guide.
  - `DIMENSIONS`: Color 5 (Blue), length and width reference lines.

## 5. Coding & Integrity Rules
- Do NOT use floating approximations without explicit constants.
- All exported functions must accept pure parameter objects (`InsoleParameters`) and return immutable curve point arrays or valid string streams (`toSvgPath()`, `toDxfString()`).
