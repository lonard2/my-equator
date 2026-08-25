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
  title: "MyEquator — Footwear Insole Factory ERP & CAD Platform",
  description:
    "Internal manufacturing ERP, Delivery Order (Surat Jalan) dot-matrix print automation, Materials Inventory, and Insole CAD design platform for Equator Insole, Bandung, Indonesia.",
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
      <body className="antialiased font-sans bg-gray-50 text-gray-900 selection:bg-red-100 selection:text-red-900">
        {children}
      </body>
    </html>
  );
}
