import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "MyEquator | Factory ERP & Insole CAD",
  description:
    "Internal factory ERP for Equator Insole, Bandung: delivery orders (Surat Jalan) with dot-matrix printing, material inventory, and parametric insole CAD.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      data-theme="light"
      data-density="normal"
      data-width="fluid"
      className={`${sansFont.variable} ${monoFont.variable}`}
    >
      <body className="antialiased font-sans bg-gray-50 text-gray-900">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 font-bold text-xs transition"
        >
          Lewati ke konten utama / Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
