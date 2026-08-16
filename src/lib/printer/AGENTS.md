# Dot-Matrix & ESC/P Printer Agent Guidelines (`src/lib/printer/`)

## 1. Domain Responsibility
This directory handles 80-column continuous form formatting, live monospace terminal previews, and raw binary ESC/P stream construction for Epson dot-matrix printers (LX-300, LX-300+II, LX-310, LQ-310).

## 2. Printer Hardware Specifications
- **Paper Type:** Continuous tractor-feed multi-ply carbonized paper (2-ply / 3-ply).
- **Standard Sheet Sizes:**
  - Full Page: 9.5" x 11.0" (66 lines at 6 LPI).
  - Half Page (Slip / Surat Jalan standard): 9.5" x 5.5" (33 lines at 6 LPI).
- **Character Density:**
  - Normal Pitch: 10 CPI (Characters Per Inch) -> 80 characters per line.
  - Condensed Pitch: 17.1 CPI -> 137 characters per line.

## 3. Essential ESC/P Control Codes

| Control Code | Hex Stream | Description |
| :--- | :--- | :--- |
| `ESC @` | `\x1B\x40` | Initialize Printer / Reset hardware state |
| `SI` | `\x0F` | Enable Condensed Mode (137 columns) |
| `DC2` | `\x12` | Cancel Condensed Mode (80 columns) |
| `ESC E` | `\x1B\x45` | Enable Bold / Emphasized printing |
| `ESC F` | `\x1B\x46` | Cancel Bold / Emphasized printing |
| `ESC - 1` | `\x1B\x2D\x01` | Enable Underline |
| `ESC - 0` | `\x1B\x2D\x00` | Cancel Underline |
| `ESC C n` | `\x1B\x43\x21` | Set Page Length in lines (`\x21` = 33 lines for half-page) |
| `FF` | `\x0C` | Form Feed (advance to top of next page) |
| `CR LF` | `\x0D\x0A` | Carriage Return + Line Feed |

## 4. 80-Column Grid Layout Protocol
- All text rows must strictly adhere to 80 monospace characters (or 137 in condensed mode).
- Pad strings with ASCII space (`\x20`) rather than variable-width tabs.
- Box drawing characters: Use standard ASCII symbols (`+`, `-`, `|`, `=`) for maximum compatibility across legacy BIOS and modern print spools.
- Table headers, size matrix numbers, and signatures must be strictly aligned using integer character column indices.

## 5. Output Artifacts
1. **Live Visual Preview:** Plain text monospace string formatted for `<pre>` tag rendering with simulated carbon-paper aesthetic.
2. **Binary PRN Stream:** `Uint8Array` / `Blob` with MIME type `application/octet-stream` ready for direct download or Web Serial / USB raw stream transmission.
