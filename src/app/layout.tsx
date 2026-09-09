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
        {children}
      </body>
    </html>
  );
}
