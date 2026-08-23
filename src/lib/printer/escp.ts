import { DeliveryOrder, DeliveryOrderItem, FootwearSize } from "@/types";
import { formatIDR, terbilang, formatShortDate } from "@/lib/utils/formatters";

const STANDARD_SIZES: FootwearSize[] = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

/**
 * Truncates or pads a string to fit exactly `width` monospace characters.
 */
function fit(str: string, width: number, align: "left" | "right" | "center" = "left"): string {
  const cleanStr = (str || "").replace(/[\r\n\t]/g, " ");
  if (cleanStr.length > width) {
    return cleanStr.slice(0, width);
  }
  const diff = width - cleanStr.length;
  if (align === "right") {
    return " ".repeat(diff) + cleanStr;
  }
  if (align === "center") {
    const left = Math.floor(diff / 2);
    const right = diff - left;
    return " ".repeat(left) + cleanStr + " ".repeat(right);
  }
  return cleanStr + " ".repeat(diff);
}

/**
 * Generates an exact 80-column monospace plain-text representation of the Surat Jalan.
 * Total width is guaranteed to be 80 characters on every line.
 */
export function generateEscpMonospaceText(order: DeliveryOrder): string {
  const lines: string[] = [];
  const W = 80;

  // Header
  lines.push("=".repeat(W));
  lines.push(fit("EQUATOR INSOLE BANDUNG", W, "center"));
  lines.push(fit("SURAT JALAN / DELIVERY ORDER", W, "center"));
  lines.push(fit("Jl. Industri Insole No. 88, Bandung, Jawa Barat | Telp: (022) 540-8899", W, "center"));
  lines.push("-".repeat(W));

  // Helper for guaranteed 80-column 2-column header lines
  const formatTwoCols = (leftText: string, rightText: string): string => {
    const rightCol = rightText.trim();
    const maxLeftWidth = W - rightCol.length - 2;
    const leftCol = fit(leftText, Math.max(10, maxLeftWidth), "left");
    const gap = Math.max(1, W - leftCol.length - rightCol.length);
    const combined = leftCol + " ".repeat(gap) + rightCol;
    return fit(combined, W, "left");
  };

  // Metadata Row 1
  lines.push(formatTwoCols(`No. Surat Jalan : ${order.orderNumber}`, `Tanggal : ${formatShortDate(order.deliveryDate)}`));

  // Metadata Row 2
  lines.push(formatTwoCols(`Kepada / Yth    : ${order.recipientName}`, `PO / SPK: ${order.poNumber || "-"}`));

  // Metadata Row 3
  lines.push(formatTwoCols(`Alamat Tujuan   : ${order.destinationAddress}`, `No Kend : ${order.vehicleNumber || "-"}`));

  // Divider
  // Exact 80-character grid breakdown:
  // |No |Artikel & Spesifikasi | 36| 37| 38| 39| 40| 41| 42| 43| 44| 45| Total Psg |
  // 1+3 + 1+22                 + 10*(3+1)                              + 11+1 = 80
  const dividerLine = "+---+----------------------+---+---+---+---+---+---+---+---+---+---+-----------+";
  lines.push(dividerLine);

  // Column Header Row (Single, no duplicates)
  let headerRow = "|No |Artikel & Spesifikasi |";
  STANDARD_SIZES.forEach((s) => {
    headerRow += `${fit(s.toString(), 3, "center")}|`;
  });
  headerRow += " Total Psg |";
  lines.push(headerRow);
  lines.push(dividerLine);

  // Items Rows
  const items = order.items || [];
  let grandTotalPairs = 0;

  items.forEach((item, index) => {
    grandTotalPairs += item.totalPairs;
    const sizes = item.sizes || {};
    let itemRow = `|${fit((index + 1).toString(), 3, "center")}|${fit(item.articleName, 22, "left")}|`;
    STANDARD_SIZES.forEach((s) => {
      const q = sizes[s];
      const val = q && q > 0 ? q.toString() : "-";
      itemRow += `${fit(val, 3, "center")}|`;
    });
    itemRow += `${fit(item.totalPairs.toString() + " psg", 11, "right")}|`;
    lines.push(itemRow);
  });

  if (items.length === 0) {
    let emptyRow = `| 1 |${fit("(Belum ada item)", 22, "left")}|`;
    STANDARD_SIZES.forEach(() => {
      emptyRow += " - |";
    });
    emptyRow += "      0 psg|";
    lines.push(emptyRow);
  }

  lines.push(dividerLine);

  // Summary Row (Exact 80 columns)
  const totalLabel = fit(" TOTAL PASANG DIKIRIM", 66, "left");
  const totalVal = fit(grandTotalPairs.toString() + " psg", 11, "right");
  lines.push(`|${totalLabel}|${totalVal}|`);
  lines.push("=".repeat(W));

  // Terbilang / Total Amount & Notes (Guaranteed 80 columns)
  if (order.totalAmount && order.totalAmount > 0) {
    lines.push(fit(`Total Nilai : ${formatIDR(order.totalAmount)} (${terbilang(order.totalAmount)})`, W, "left"));
  }
  if (order.notes) {
    lines.push(fit(`Catatan     : ${order.notes}`, W, "left"));
  }
  lines.push("");

  // Signatures Triad (Exact 80 width: 24 + 4 + 24 + 4 + 24 = 80)
  const sigW = 24;
  const sigGap = 4;
  const sigRow1 =
    fit("Penerima / Customer", sigW, "center") +
    " ".repeat(sigGap) +
    fit("Pengirim / Sopir", sigW, "center") +
    " ".repeat(sigGap) +
    fit("Hormat Kami / Gudang", sigW, "center");
  lines.push(sigRow1);
  lines.push("");
  lines.push("");
  lines.push("");
  const sigRow2 =
    fit("(....................)", sigW, "center") +
    " ".repeat(sigGap) +
    fit(`(${order.driverName || "...................."})`, sigW, "center") +
    " ".repeat(sigGap) +
    fit("(  Equator Insole  )", sigW, "center");
  lines.push(sigRow2);
  lines.push("=".repeat(W));

  return lines.join("\r\n");
}

/**
 * Builds raw binary ESC/P byte stream for direct spooling to Epson LX-300 / LX-310 / LQ-310.
 */
export function generateEscpBinary(input: DeliveryOrder | string): Uint8Array {
  const bytes: number[] = [];

  // ESC @ : Initialize Printer
  bytes.push(0x1b, 0x40);

  // ESC C 33 : Set Page Length to 33 lines (Half page standard 9.5" x 5.5")
  bytes.push(0x1b, 0x43, 0x21);

  // ESC M : Select 10 CPI Pitch (80 columns)
  bytes.push(0x1b, 0x4d);

  const textContent = typeof input === "string" ? input : generateEscpMonospaceText(input);
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(textContent);
  for (let i = 0; i < textBytes.length; i++) {
    bytes.push(textBytes[i]);
  }

  // Form Feed (Eject to next perforation)
  bytes.push(0x0c);

  return new Uint8Array(bytes);
}

export const generateEscpBinaryStream = generateEscpBinary;


