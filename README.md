# MyEquator

Internal factory and insole manufacturing ERP platform for **Equator Insole** (Bandung, Indonesia).

## Modules
1. **Delivery Orders (Surat Jalan):** Shoe size breakdown matrix (EU 36–45), reactive auto-sum, and dual-mode ESC/P dot-matrix printing (Epson LX-300/310).
2. **Archive Quick Digitizer:** Keyboard-first rapid batch data entry for physical delivery slips.
3. **Materials Inventory:** Raw materials tracking (EVA, Latex, PU, TPU), stock movements, and reactive safety threshold alerts.
4. **Insole CAD Studio:** Parametric curve generation ($L = \text{Size} \times 6.67 - 6.7\text{ mm}$), interactive vector canvas, and DXF R12 / SVG exports.
5. **Khatulistiwa AI Assistant:** Natural language order form drafting and real-time inventory queries via OpenRouter.
6. **Visual Analytics & UI Engine:** IDR revenue trends, footwear size bell curve, customer market share donut, and bilingual localization (`ID`/`EN`).
7. **Factory Security & Resiliency:** 4-role RBAC, persistent audit trails, and 1-click offline database snapshot backup/restore.

## Tech Stack
- **Framework:** Next.js (App Router), TypeScript, TailwindCSS
- **Database:** SQLite with Drizzle ORM
- **CAD & Vector:** Native SVG/Canvas + `dxf-writer` (AutoCAD R12 / CorelDRAW compatible)
- **Print Engine:** 80-Column ESC/P binary `.prn` stream generator + CSS printable sheet
- **AI Gateway:** OpenRouter multi-model client

## Documentation
- [`AGENTS.md`](AGENTS.md) — System guidelines & domain rules
- [`CHECKLIST.md`](CHECKLIST.md) — Master roadmap & milestone tracker
- [`docs/architecture/`](docs/architecture/) — System topology, CAD math, printer specs
- [`docs/walkthroughs/`](docs/walkthroughs/) — Step-by-step developer tutorials per phase
- [`docs/lesson_learned.md`](docs/lesson_learned.md) — Architectural trade-offs & design reviews