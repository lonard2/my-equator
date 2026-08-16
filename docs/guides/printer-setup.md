# Dot-Matrix Printer Setup Guide — Epson LX-300 / LX-310 / LQ-310

## 1. Hardware Connection
Connect your Epson LX-300, LX-300+II, LX-310, or LQ-310 printer to the host workstation:
- **USB Interface:** Direct USB-B to USB-A cable (LX-310 / LQ-310).
- **Parallel / Serial Interface:** IEEE-1284 Parallel or RS-232 Serial with USB-to-Parallel adapter (LX-300 series).

---

## 2. Printer Driver & Raw Spooling Setup

### Windows Configuration (Generic / Text Only Driver)
1. Open **Settings** -> **Bluetooth & devices** -> **Printers & scanners** -> **Add device**.
2. Select **The printer that I want isn't listed** -> **Add a local printer with manual settings**.
3. Choose the active port (e.g., `USB001` or `LPT1`).
4. In Manufacturer list, select **Generic**, and in Printers list, select **Generic / Text Only**.
5. Name the printer `DotMatrix_SuratJalan`.

### Printing Raw `.prn` Files via Windows Command Line
To test output without rasterization:
```cmd
copy /b sample_surat_jalan.prn \\localhost\DotMatrix_SuratJalan
```

### Linux / macOS CUPS Raw Queue Setup
```bash
lpadmin -p DotMatrix -E -v usb://EPSON/LX-310 -m raw
lp -d DotMatrix -o raw sample_surat_jalan.prn
```

---

## 3. Paper Tractor Calibration
1. Set the Paper Release Lever (top right) to the **Rear Tractor** position.
2. Load continuous 9.5" x 5.5" (half-page) or 9.5" x 11" (full-page) continuous form paper into the sprocket pins.
3. Lock the sprocket clamps ensuring slight horizontal tension to prevent paper jam.
4. Press **Load/Eject** to bring paper to the Top-Of-Form (TOF) position.
5. In `MyEquator` print settings, select **Half Page (33 lines)** for Surat Jalan slips.
