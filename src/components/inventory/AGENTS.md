# Inventory Component Guidelines (`src/components/inventory/`)

## 1. Domain Responsibility
This directory contains UI components for raw materials tracking, stock safety threshold monitors, stock IN/OUT movement dialogs, and warehouse health gauges.

## 2. Material Categories & Units
- `EVA_SHEET`: Sheets / Lembar (e.g., EVA 2mm Black, EVA 4mm High Density).
- `LATEX`: Rolls / Meter (e.g., Natural Latex 3mm Cushioning).
- `PU_CHEMICAL`: Kilograms / Drum (e.g., Polyurethane Polyol & Isocyanate).
- `TPU_SHANK`: Pieces / Pcs (e.g., Arch Support Shank Plate 75mm).
- `FABRIC`: Meters / Roll (e.g., BK Mesh, Cambrelle, Velvet, Cotton Canvas).
- `CUTTING_DIE`: Sets / Unit (e.g., Pisau Insole Model EQ-Sport 36-45).

## 3. Stock Health Threshold Levels
- `CRITICAL`: Current Stock $\le 0.5 \times \text{Safety Threshold}$ (Red badge, urgent reorder flag).
- `WARNING`: $0.5 \times \text{Safety Threshold} < \text{Current Stock} \le \text{Safety Threshold}$ (Amber badge).
- `HEALTHY`: Current Stock $> \text{Safety Threshold}$ (Emerald/Green badge).

## 4. Stock Movement Types
- `IN_PURCHASE`: Incoming material from supplier PO.
- `IN_RETURN`: Returned undamaged materials from production line.
- `OUT_PRODUCTION`: Material dispatched for cutting / molding batch.
- `OUT_WASTAGE`: Scrap or damaged material write-off.
- `ADJUSTMENT`: Correction from physical stock opname.
