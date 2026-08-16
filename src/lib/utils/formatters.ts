// Indonesian Localization & Manufacturing Helpers

/**
 * Format number as Indonesian Rupiah (IDR)
 * e.g., 1250000 -> "Rp 1.250.000"
 */
export function formatIDR(amount: number): string {
  if (isNaN(amount)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\u00A0/, " ");
}

/**
 * Convert number to Indonesian words (Terbilang)
 * e.g. 1250000 -> "Satu Juta Dua Ratus Lima Puluh Ribu Rupiah"
 */
export function terbilang(n: number): string {
  if (isNaN(n) || n === 0) return "Nol Rupiah";
  if (n < 0) return "Minus " + terbilang(Math.abs(n));

  const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];

  function bilang(x: number): string {
    let temp = "";
    if (x < 12) {
      temp = " " + satuan[Math.floor(x)];
    } else if (x < 20) {
      temp = bilang(x - 10) + " Belas";
    } else if (x < 100) {
      temp = bilang(Math.floor(x / 10)) + " Puluh" + bilang(x % 10);
    } else if (x < 200) {
      temp = " Seratus" + bilang(x - 100);
    } else if (x < 1000) {
      temp = bilang(Math.floor(x / 100)) + " Ratus" + bilang(x % 100);
    } else if (x < 2000) {
      temp = " Seribu" + bilang(x - 1000);
    } else if (x < 1000000) {
      temp = bilang(Math.floor(x / 1000)) + " Ribu" + bilang(x % 100);
    } else if (x < 1000000000) {
      temp = bilang(Math.floor(x / 1000000)) + " Juta" + bilang(x % 1000000);
    } else if (x < 1000000000000) {
      temp = bilang(Math.floor(x / 1000000000)) + " Milyar" + bilang(x % 1000000000);
    }
    return temp;
  }

  return (bilang(n).trim() + " Rupiah").replace(/\s+/g, " ");
}

/**
 * Format ISO date string into Indonesian standard date format
 * e.g., "2026-08-16" -> "16 Agustus 2026"
 */
export function formatIndonesianDate(isoDate: string): string {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Format short date (DD/MM/YYYY)
 */
export function formatShortDate(isoDate: string): string {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
