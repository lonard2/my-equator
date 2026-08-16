# ESC/P Dot-Matrix Printer Architecture Specification

## 1. Hardware Overview
Continuous form dot-matrix printers (specifically Epson LX-300, LX-300+II, LX-310, and LQ-310) are the industry standard across Indonesian manufacturing factories for issuing multi-ply Delivery Orders (Surat Jalan).

---

## 2. Continuous Paper Specifications

```
  +-------------------------------------------------------------+
  | (o)                                                     (o) |
  | (o)               EQUATOR INSOLE BANDUNG                (o) |
  | (o)             SURAT JALAN / DELIVERY ORDER            (o) |
  | (o)  No: SJ/EQ/2026/08/0042        Tanggal: 16/08/2026  (o) |
  | (o)  Kepada: PT INDO SEPATU MAJU   PO No: PO-9921       (o) |
  | (o)  +-----------------------------------------------+  (o) |
  | (o)  | Art | 36| 37| 38| 39| 40| 41| 42| 43| 44| 45|Tot|  (o) |
  | (o)  |-----+---+---+---+---+---+---+---+---+---+---+---|  (o) |
  | (o)  |EQ-01| - | - | 20| 50| 50| 50| 30| - | - | - |200|  (o) |
  | (o)  +-----------------------------------------------+  (o) |
  | (o)   Penerima           Pengirim         Bagian Gudang (o) |
  | (o)  (........)         (........)         (........)   (o) |
  +-------------------------------------------------------------+
   Tractor Holes                                    Tractor Holes
```

- **Width:** 9.5 inches (including tractor feed margins).
- **Printable Width:** 8.0 inches (80 characters at standard 10 CPI).
- **Height (Half-Page):** 5.5 inches (33 lines at 6 LPI standard vertical spacing).
- **Paper Copies:** 2-ply or 3-ply carbonless paper (White: Customer copy, Pink: Accounting, Yellow: Warehouse archive).

---

## 3. Binary ESC/P Stream Generator (`.prn`)

The generator translates structured Delivery Order objects into an array of bytes following Epson Standard Code for Printers:

### Sequence Construction
1. `\x1B\x40`: Hardware Reset / Initialize.
2. `\x1B\x43\x21`: Set page length to 33 lines (half-page 5.5" slip).
3. `\x1B\x4D`: Select 10 CPI Roman font.
4. Header lines (Bold toggle `\x1B\x45` ON / `\x1B\x46` OFF for Company Name).
5. 80-Column formatted ASCII table for size matrix and item breakdown.
6. Signature triad blocks.
7. `\x0C`: Form Feed to advance paper to the tear-off perforation.

### Output Handling
- Direct `.prn` binary file download for direct spooling via `copy /b file.prn LPT1:` or `lp -d dotmatrix file.prn`.
- Synchronous plain text rendering inside browser UI using CSS monospace styling and carbon-copy aesthetic styling.
