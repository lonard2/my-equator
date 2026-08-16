# System Architecture Overview — MyEquator

## 1. Executive Summary
`MyEquator` is an internal factory ERP and design platform specifically built for **Equator Insole** in Bandung, Indonesia. The platform digitizes factory operations, automates Delivery Orders (Surat Jalan), manages raw materials inventory, generates parametric Insole CAD blueprints with CNC DXF exports, provides raw ESC/P dot-matrix printing, and integrates an AI assistant (Khatulistiwa AI).

---

## 2. High-Level System Architecture

```
+-----------------------------------------------------------------------------------------+
|                                    Client Tier (Next.js)                                |
|                                                                                         |
|  +-------------------+  +-------------------+  +-------------------+  +--------------+  |
|  |   Desktop View    |  |    Tablet View    |  |    Mobile View    |  |  Device Sim  |  |
|  | Master-Detail, CAD|  | Touch Matrix, Pad |  | Warehouse, OCR Cam|  | Switcher Bar |  |
|  +---------+---------+  +---------+---------+  +---------+---------+  +-------+------+  |
+------------|----------------------|----------------------|--------------------|---------+
             |                      |                      |                    |
+------------v----------------------v----------------------v--------------------v---------+
|                               Application Services Layer                                |
|                                                                                         |
|  +-------------------+  +-------------------+  +-------------------+  +--------------+  |
|  | Delivery Order Svc|  |  Inventory Svc    |  | CAD Vector Engine |  | ESC/P Printer|  |
|  | - Status Lifecycle|  | - Safety Alerts   |  | - Parametric Math |  | - 80-Col Grid|  |
|  | - Size Matrix Math|  | - Movement Logs   |  | - DXF/SVG Exporter|  | - Binary PRN |  |
|  +---------+---------+  +---------+---------+  +---------+---------+  +-------+------+  |
|            |                      |                      |                    |         |
|  +---------v----------------------v----------------------v--------------------v------+  |
|  |                 RBAC Authorization & Audit Trail Service                          |  |
|  +------------------------------------+-----------------------------------------------+  |
+---------------------------------------|-------------------------------------------------+
                                        |
+---------------------------------------v-------------------------------------------------+
|                             Data & Gateway Integrations                                 |
|                                                                                         |
|  +------------------------------------+  +--------------------------------------------+  |
|  |   SQLite Database (Drizzle ORM)    |  |    OpenRouter Multi-Model AI Gateway       |  |
|  |   - Local zero-config data engine  |  |    - Gemini 3.5 Flash Lite (Default chat)  |  |
|  |   - 1-Click JSON Snapshot Backup   |  |    - Gemini 3.7 Flash (Vision OCR)         |  |
|  |   - Full relational integrity      |  |    - DeepSeek v4 / Qwen 3.7 / GPT 5.6 Luna |  |
|  +------------------------------------+  +--------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Data Flow Pipelines

### 3.1 Delivery Order Creation & Dot-Matrix Print Pipeline
1. **Order Input:** User inputs delivery details via standard form, Keyboard Quick Digitizer, or Khatulistiwa AI natural language chat.
2. **Size Matrix Summation:** Quantities for EU sizes 36–45 are reactively summed and validated.
3. **Database Commitment:** Saved to SQLite with sequential numbering `SJ/EQ/YYYY/MM/XXXX`.
4. **Dual-Mode Output:**
   - **Monospace ESC/P Formatter:** Generates 80-column binary `.prn` stream for Epson LX-300 / LX-310 continuous form printers.
   - **Interactive Print Sheet:** Live browser print preview with in-place text tweaking for standard office printers.

### 3.2 Insole CAD & CNC Vector Pipeline
1. **Parameter Input:** User inputs shoe size (EU 35–46), arch type (Flat, Medium, High), and custom forefoot/heel width offsets.
2. **Curve Mathematics:** Generates parametric Bézier control points using footwear length formula $L = \text{Size} \times 6.67 - 6.7\text{ mm}$.
3. **Interactive Canvas:** Native SVG/Canvas editor allows fine-tuning control points with millimeter readout.
4. **CAD Export:** DXF Writer translates geometry into standard AutoCAD R12 DXF format for direct import into CorelDRAW 2020+ and CNC laser/knife cutting systems.

### 3.3 Khatulistiwa AI Conversational Pipeline
1. **User Prompt:** Operator provides natural language command (e.g., *"Buat surat jalan untuk PT Indo Sepatu Maju 500 pasang model EQ-Sport size 39-43"*).
2. **Model Routing:** OpenRouter dispatches prompt with JSON Schema tool definitions to the optimal model.
3. **Structured Execution:** Returns structured draft data ready for 1-click staging into the Delivery Order form.
