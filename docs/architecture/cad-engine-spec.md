# Insole CAD Engine Technical Specification

## 1. Overview
The Insole CAD Engine provides parametric curve generation, interactive 2D Bézier vector manipulation, and standard DXF R12 export capabilities for shoe insole manufacturing.

---

## 2. Insole Mathematical Foundations

### 2.1 European Footwear Size Length Formula
The total internal length of the insole ($L$) in millimeters is derived from the standard Paris point system ($\frac{2}{3}\text{ cm} \approx 6.67\text{ mm}$ per size):

$$L(\text{size}) = \text{size} \times 6.6667 - 6.6667 \quad (\text{in mm})$$

#### Sizing Reference Table
| EU Shoe Size | Insole Length ($L$ in mm) | Ball Width ($W_{\text{ball}}$ in mm) | Heel Width ($W_{\text{heel}}$ in mm) |
| :---: | :---: | :---: | :---: |
| **36** | 233.3 mm | 84.0 mm | 60.7 mm |
| **37** | 240.0 mm | 86.4 mm | 62.4 mm |
| **38** | 246.7 mm | 88.8 mm | 64.1 mm |
| **39** | 253.3 mm | 91.2 mm | 65.9 mm |
| **40** | 260.0 mm | 93.6 mm | 67.6 mm |
| **41** | 266.7 mm | 96.0 mm | 69.3 mm |
| **42** | 273.3 mm | 98.4 mm | 71.1 mm |
| **43** | 280.0 mm | 100.8 mm | 72.8 mm |
| **44** | 286.7 mm | 103.2 mm | 74.5 mm |
| **45** | 293.3 mm | 105.6 mm | 76.3 mm |

---

## 3. Parametric Bézier Spline Construction

The insole perimeter is modeled as an 8-segment cubic Bézier closed loop:
1. **Toe Apex & Medial Tip:** $(0, L)$ -> $(0.22 \cdot W_{\text{ball}}, 0.94 \cdot L)$
2. **First Metatarsal (Ball of Foot):** $(0.50 \cdot W_{\text{ball}}, 0.72 \cdot L)$
3. **Medial Longitudinal Arch:** $(0.20 \cdot W_{\text{ball}}, 0.42 \cdot L)$ with arch depth factor $\alpha \in [0.8, 1.4]$
4. **Medial Heel:** $(0.38 \cdot W_{\text{heel}}, 0.12 \cdot L)$
5. **Heel Center (Posterior Apex):** $(0, 0)$
6. **Lateral Heel:** $(-0.38 \cdot W_{\text{heel}}, 0.12 \cdot L)$
7. **Lateral Waist (Outer Edge):** $(-0.44 \cdot W_{\text{ball}}, 0.45 \cdot L)$
8. **Fifth Metatarsal & Lateral Toe:** $(-0.50 \cdot W_{\text{ball}}, 0.68 \cdot L)$ -> Toe Apex $(0, L)$

```
                     Toe Apex (0, L)
                     /             \
       First MPJ  .-'               '-.  Fifth MPJ
      (Medial)   /                     \ (Lateral)
                |                       |
   Medial Arch  \                       / Lateral Waist
   Contour       \                     /
                  '-.               .-'
                     \             /
                      '--.     .--'
                         \     /
                        Heel (0, 0)
```

---

## 4. DXF R12 Export Specification
- **Header:** Minimal AutoCAD R12 ASCII header (`$ACADVER: AC1009`).
- **Units:** Millimeters ($INSUNITS = 4$).
- **Entity Type:** `POLYLINE` with vertex list flagged as closed (Flag 70 = 1).
- **Layer Mapping:**
  - `0`: General boundary.
  - `CUT_OUTLINE`: Primary knife/laser cutting contour.
  - `ENGRAVE_GUIDE`: Arch placement and logo branding.
  - `DIMENSIONS`: Measurement indicators and size stamps.
