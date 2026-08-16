# Walkthrough: Phase 0 — Project Planning, Architecture & Design Standards

## 1. Objective
Establish the complete architectural foundation, domain boundary rules, hardware printer specifications, CAD mathematical models, and engineering guidelines for **MyEquator** before initiating code development.

---

## 2. What Was Built in Phase 0

```
Phase 0 Deliverables
├── Root Guidelines & Milestones
│   ├── AGENTS.md (Comprehensive engineering guidelines)
│   └── CHECKLIST.md (6-phase milestone roadmap)
├── Sub-Directory Domain Agent Rule Files
│   ├── src/lib/cad/AGENTS.md (Insole math & DXF rules)
│   ├── src/lib/printer/AGENTS.md (ESC/P 80-col codes & .prn specs)
│   ├── src/lib/ai/AGENTS.md (OpenRouter model routing & tool schemas)
│   ├── src/lib/db/AGENTS.md (Drizzle ORM + SQLite schema rules)
│   ├── src/components/delivery-orders/AGENTS.md (DO lifecycle & size matrix)
│   └── src/components/inventory/AGENTS.md (Material SKUs & safety thresholds)
├── Architecture Documentation
│   ├── docs/architecture/system-overview.md (Topology & data flow)
│   ├── docs/architecture/cad-engine-spec.md (Bézier formulas & sizing tables)
│   └── docs/architecture/escp-printer-spec.md (80-col dot-matrix protocol)
├── Operations & Setup Guides
│   ├── docs/guides/deployment.md (Local factory & cloud setup)
│   └── docs/guides/printer-setup.md (Epson LX-300/310 calibration)
└── Retrospective Review
    └── docs/lesson_learned.md (Architectural trade-offs & design decisions)
```

---

## 3. Key Concepts & Mathematical Decisions

### 3.1 Insole Sizing Formula
To avoid arbitrary guesswork during insole vector generation, we adopted the European footwear standard Paris point formula:
$$L = \text{Size} \times 6.67 - 6.7 \quad (\text{in mm})$$
This maps every shoe size directly to physical millimeter coordinates, ensuring cutting dies generated via DXF export match the factory's physical aluminum and steel molds.

### 3.2 Dual-Output Printing Architecture
Rather than forcing operators to choose between modern browser printing and legacy hardware, MyEquator supports:
1. **Direct ESC/P stream (.prn):** Sends byte-for-byte ASCII/ESC commands directly to the dot-matrix print head, eliminating slow graphical rasterization.
2. **High-fidelity CSS print view:** Allows standard office laser/inkjet printing with interactive on-screen editing.

### 3.3 Zero-Config Offline Resilience
Factory floors in industrial areas often face intermittent internet connectivity. By combining SQLite with Drizzle ORM and a 1-click JSON snapshot backup/restore utility, the factory maintains 100% operational uptime without requiring external cloud databases for daily shipping.

---

## 4. Next Steps
With Phase 0 complete and verified, the next phase is **Phase 1: Core Foundation, Layout Shell & Delivery Orders MVP**.
