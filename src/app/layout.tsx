import type { Metadata } from "next";
import "@/styles/globals.css";

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
    <html lang="id" data-theme="light" data-density="normal" data-width="fluid">
      <body className="antialiased font-sans bg-gray-50 text-gray-900 selection:bg-red-100 selection:text-red-900">
        {children}
      </body>
    </html>
  );
}
