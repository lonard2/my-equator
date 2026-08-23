import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateEscpMonospaceText,
  generateEscpBinaryStream,
} from "@/lib/printer/escp";
import { formatIDR, terbilang } from "@/lib/utils/formatters";
import { DeliveryOrder } from "@/types";

describe("ESC/P 80-Column Dot-Matrix Formatter & Binary Stream Engine", () => {
  const sampleOrder: DeliveryOrder = {
    id: "do-test-01",
    orderNumber: "SJ/EQ/2026/08/0099",
    recipientName: "PT BINTANG JAYA MAKMUR",
    destinationAddress: "Kawasan Industri Cimahi Blok C-10, Bandung",
    poNumber: "PO-BJM-2026-08",
    vehicleNumber: "D 8821 EQ",
    driverName: "Asep Sunandar",
    status: "CONFIRMED",
    deliveryDate: "2026-08-23",
    notes: "Pengiriman barang pagi, handle with care.",
    totalQuantity: 450,
    totalAmount: 9900000,
    items: [
      {
        id: "item-1",
        deliveryOrderId: "do-test-01",
        articleCode: "EQ-ORT-01",
        articleName: "Insole Ortho High Density",
        colorway: "Black/Red",
        sizeBreakdown: {
          "38": 50,
          "39": 100,
          "40": 150,
          "41": 100,
          "42": 50,
        },
        totalPairs: 450,
        unitPrice: 22000,
        totalPrice: 9900000,
        notes: "EVA 65C Hardness",
        createdAt: "2026-08-23T10:00:00.000Z",
      },
    ],
    createdAt: "2026-08-23T10:00:00.000Z",
    updatedAt: "2026-08-23T10:00:00.000Z",
  };

  it("formats Indonesian Rupiah currency cleanly with dot separators", () => {
    assert.strictEqual(formatIDR(0), "Rp 0");
    assert.strictEqual(formatIDR(25000), "Rp 25.000");
    assert.strictEqual(formatIDR(1250000), "Rp 1.250.000");
    assert.strictEqual(formatIDR(9900000), "Rp 9.900.000");
  });

  it("converts numbers into formal Indonesian Terbilang words", () => {
    assert.strictEqual(terbilang(0), "Nol Rupiah");
    assert.strictEqual(terbilang(12), "Dua Belas Rupiah");
    assert.strictEqual(terbilang(450), "Empat Ratus Lima Puluh Rupiah");
    assert.strictEqual(terbilang(1000), "Seribu Rupiah");
    assert.strictEqual(terbilang(2500), "Dua Ribu Lima Ratus Rupiah");
  });

  it("enforces strict 80-column line width on EVERY line of the ESC/P text preview", () => {
    const preview = generateEscpMonospaceText(sampleOrder);
    const lines = preview.split(/\r?\n/).filter((l) => l.trim().length > 0);

    assert.ok(lines.length >= 12, "Print sheet must have complete header, items, and signature sections");

    lines.forEach((line, idx) => {
      assert.strictEqual(
        line.length,
        80,
        `Line ${idx + 1} does not match 80 columns: [${line}] (Length: ${line.length})`
      );
    });
  });

  it("generates valid binary ESC/P stream with hardware control escape codes", () => {
    const preview = generateEscpMonospaceText(sampleOrder);
    const binary = generateEscpBinaryStream(preview);

    assert.ok(binary instanceof Uint8Array, "Output must be a Uint8Array");
    // Check ESC @ (0x1B, 0x40) printer initialization at byte 0 & 1
    assert.strictEqual(binary[0], 0x1b);
    assert.strictEqual(binary[1], 0x40);

    // Check Form Feed / Eject page (0x0C) at the final byte
    assert.strictEqual(binary[binary.length - 1], 0x0c);
  });
});
