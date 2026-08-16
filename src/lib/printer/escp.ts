import { DeliveryOrder, DeliveryOrderItem, FootwearSize } from "@/types";
import { formatIDR, terbilang, formatShortDate } from "@/lib/utils/formatters";

const STANDARD_SIZES: FootwearSize[] = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

/**
 * Pads or truncates a string to fit exactly `width` characters.
 */
function padRight(str: string, width: number): string {
  if (str.length > width) return str.slice(0, width);
  return str + " ".repeat(width - str.length);
}

function padLeft(str: string, width: number): string {
  if (str.length > width) return str.slice(0, width);
  return " ".repeat(width - str.length) + str;
}

function padCenter(str: string, width: number): string {
  if (str.length > width) return str.slice(0, width);
  const left = Math.floor((width - str.length) / 2);
  const right = width - str.length - left;
  return " ".repeat(left) + str + " ".repeat(right);
}

/**
 * Generates an exact 80-column plain-text monospace representation of the Surat Jalan (Delivery Order).
 */
export function generateEscpMonospaceText(order: DeliveryOrder): string {
  const lines: string[] = [];
  const W = 80;

  // Header
  lines.push("=".repeat(W));
  lines.push(padCenter("EQUATOR INSOLE BANDUNG", W));
  lines.push(padCenter("SURAT JALAN / DELIVERY ORDER", W));
  lines.push(padCenter("Jl. Industri Insole No. 88, Bandung, Jawa Barat | Telp: (022) 540-8899", W));
  lines.push("-".repeat(W));

  // Metadata Row 1
  const metaLeft1 = `No. Surat Jalan : ${order.orderNumber}`;
  const metaRight1 = `Tanggal : ${formatShortDate(order.deliveryDate)}`;
  lines.push(metaLeft1 + " ".repeat(Math.max(2, W - metaLeft1.length - metaRight1.length)) + metaRight1);

  // Metadata Row 2
  const metaLeft2 = `Kepada / Yth    : ${order.recipientName}`;
  const metaRight2 = `PO / SPK: ${order.poNumber || "-"}`;
  lines.push(metaLeft2 + " ".repeat(Math.max(2, W - metaLeft2.length - metaRight2.length)) + metaRight2);

  // Metadata Row 3
  const metaLeft3 = `Alamat Tujuan   : ${order.destinationAddress}`;
  const metaRight3 = `No Kend : ${order.vehicleNumber || "-"}`;
  lines.push(metaLeft3 + " ".repeat(Math.max(2, W - metaLeft3.length - metaRight3.length)) + metaRight3);

  lines.push("-".repeat(W));

  // Size Matrix Table Header
  // Columns: No (3) | Artikel / Deskripsi (21) | 36|37|38|39|40|41|42|43|44|45 (10*4=40) | Total (8) | = 72 + borders = 80
  let tableHeader = "+---+---------------------+";
  STANDARD_SIZES.forEach((s) => (tableHeader += `${s}|`));
  tableHeader += "  Total +";
  lines.push(tableHeader);

  let colTitles = "|No |Artikel & Warna      |";
  STANDARD_SIZES.forEach((s) => (colTitles += `${padCenter(s.toString(), 3)}|`));
  colTitles += " Pasang |";
  lines.push(colTitles);
  lines.push("+---+---------------------+---+---+---+---+---+---+---+---+---+---+---------+");

  // Items Rows
  const items = order.items || [];
  let grandTotalPairs = 0;

  items.forEach((item, index) => {
    grandTotalPairs += item.totalPairs;
    const sizes = item.sizes || {};
    let itemRow = `|${padRight((index + 1).toString(), 3)}|${padRight(item.articleName, 21)}|`;
    STANDARD_SIZES.forEach((s) => {
      const q = sizes[s];
      const val = q && q > 0 ? q.toString() : "-";
      itemRow += `${padCenter(val, 3)}|`;
    });
    itemRow += `${padLeft(item.totalPairs.toString() + " psg", 9)}|`;
    lines.push(itemRow);
  });

  // If empty or short, pad with empty rows for continuous paper consistency
  if (items.length === 0) {
    let emptyRow = "| 1 |(Belum ada item)     |";
    STANDARD_SIZES.forEach(() => (emptyRow += " - |"));
    emptyRow += "   0 psg |";
    lines.push(emptyRow);
  }

  lines.push("+---+---------------------+---+---+---+---+---+---+---+---+---+---+---------+");

  // Summary Row
  const totalRow = `| TOTAL PASANG DIKIRIM                                            |${padLeft(
    grandTotalPairs.toString() + " psg",
    9
  )}|`;
  lines.push(totalRow);
  lines.push("=".repeat(W));

  // Terbilang / Total Amount & Notes
  if (order.totalAmount && order.totalAmount > 0) {
    lines.push(`Total Nilai : ${formatIDR(order.totalAmount)} (${terbilang(order.totalAmount)})`);
  }
  if (order.notes) {
    lines.push(`Catatan     : ${order.notes}`);
  }
  lines.push("");

  // Signatures Triad
  const sigW = 24;
  const sigGap = 4;
  const sigRow1 =
    padCenter("Penerima / Customer", sigW) +
    " ".repeat(sigGap) +
    padCenter("Pengirim / Sopir", sigW) +
    " ".repeat(sigGap) +
    padCenter("Hormat Kami / Gudang", sigW);
  lines.push(sigRow1);
  lines.push("");
  lines.push("");
  lines.push("");
  const sigRow2 =
    padCenter("(....................)", sigW) +
    " ".repeat(sigGap) +
    padCenter(`(${order.driverName || "...................."})`, sigW) +
    " ".repeat(sigGap) +
    padCenter("(  Equator Insole  )", sigW);
  lines.push(sigRow2);
  lines.push("=".repeat(W));

  return lines.join("\r\n");
}

/**
 * Builds raw binary ESC/P byte stream for direct spooling to Epson LX-300 / LX-310 / LQ-310.
 */
export function generateEscpBinary(order: DeliveryOrder): Uint8Array {
  const bytes: number[] = [];

  // ESC @ : Initialize Printer
  bytes.push(0x1b, 0x40);

  // ESC C 33 : Set Page Length to 33 lines (Half page standard 9.5" x 5.5")
  bytes.push(0x1b, 0x43, 0x21);

  // ESC M : Select 10 CPI Pitch (80 columns)
  bytes.push(0x1b, 0x4d);

  const textContent = generateEscpMonospaceText(order);
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(textContent);
  for (let i = 0; i < textBytes.length; i++) {
    bytes.push(textBytes[i]);
  }

  // Form Feed (Eject to next perforation)
  bytes.push(0x0c);

  return new Uint8Array(bytes);
}
