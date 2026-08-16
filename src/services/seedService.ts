import { db } from "@/lib/db";
import { deliveryOrders, deliveryOrderItems, materials, insoleBlueprints, auditLogs } from "@/lib/db/schema";
import { OrderService } from "./orderService";

export async function seedDatabase() {
  console.log("Starting MyEquator database seeding...");

  // 1. Clear existing records safely
  await db.delete(deliveryOrderItems);
  await db.delete(deliveryOrders);
  await db.delete(materials);
  await db.delete(insoleBlueprints);
  await db.delete(auditLogs);

  // 2. Seed Raw Materials
  const initialMaterials = [
    {
      id: "mat-eva-2mm",
      sku: "RAW-EVA-2MM-BLK",
      name: "EVA Foam Sheet 2mm High Density (Black)",
      category: "EVA_SHEET" as const,
      unit: "Lembar",
      currentStock: 450,
      safetyThreshold: 100,
      unitCost: 45000,
      location: "Gudang A - Rak 01",
      notes: "Standard density 65 Shore C for sport insoles",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "mat-eva-4mm",
      sku: "RAW-EVA-4MM-WHT",
      name: "EVA Foam Sheet 4mm Ultra Soft (White)",
      category: "EVA_SHEET" as const,
      unit: "Lembar",
      currentStock: 80,
      safetyThreshold: 120, // Critical / Low stock demo
      unitCost: 65000,
      location: "Gudang A - Rak 02",
      notes: "Top layer for comfort and diabetic footbeds",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "mat-latex-3mm",
      sku: "RAW-LTX-3MM-NAT",
      name: "Natural Latex Cushioning Roll 3mm",
      category: "LATEX" as const,
      unit: "Roll",
      currentStock: 25,
      safetyThreshold: 15,
      unitCost: 1250000,
      location: "Gudang B - Pallet 04",
      notes: "High rebound natural latex foam from Sumatra",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "mat-tpu-shank",
      sku: "RAW-TPU-SHK-75M",
      name: "TPU Arch Support Torsion Shank 75mm",
      category: "TPU_SHANK" as const,
      unit: "Pcs",
      currentStock: 1200,
      safetyThreshold: 500,
      unitCost: 4500,
      location: "Gudang C - Box 12",
      notes: "Injected TPU rigidity shank for athletic running insoles",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "mat-fabric-bk",
      sku: "RAW-FAB-BK-RED",
      name: "BK Breathable Mesh Fabric (Equator Red)",
      category: "FABRIC" as const,
      unit: "Meter",
      currentStock: 850,
      safetyThreshold: 200,
      unitCost: 28000,
      location: "Gudang B - Rak Kain 03",
      notes: "Antibacterial moisture-wicking top cloth laminate",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  await db.insert(materials).values(initialMaterials);

  // 3. Seed Realistic Delivery Orders
  await OrderService.createOrder({
    orderNumber: "SJ/EQ/2026/08/0001",
    recipientName: "PT INDO SEPATU MAJU",
    destinationAddress: "Kawasan Industri Jatake Blok C No. 12, Tangerang",
    poNumber: "PO-ISM-2026-881",
    vehicleNumber: "D 8842 AB",
    driverName: "Asep Sunandar",
    deliveryDate: "2026-08-16",
    status: "DISPATCHED",
    notes: "Pengiriman batch 1 untuk PO Ekspor Q3. Mohon stempel rangkap 3.",
    items: [
      {
        articleCode: "EQ-SPORT-01",
        articleName: "Insole EVA Ortho Sport EQ-01",
        colorway: "Black / Equator Red",
        unitPrice: 18500,
        notes: "Laminasi BK Mesh Red",
        sizes: {
          38: 40,
          39: 80,
          40: 100,
          41: 100,
          42: 80,
          43: 50,
        },
      },
    ],
  });

  await OrderService.createOrder({
    orderNumber: "SJ/EQ/2026/08/0002",
    recipientName: "PT ADIS DIMENSION FOOTWEAR",
    destinationAddress: "Jl. Raya Serang Km 24, Balaraja, Tangerang, Banten",
    poNumber: "ADIS-DO-9941",
    vehicleNumber: "B 9102 UY",
    driverName: "Budi Haryanto",
    deliveryDate: "2026-08-15",
    status: "PRINTED",
    notes: "Telah dicetak ke Continuous Form 3-ply. Menunggu jadwal armada gudang.",
    items: [
      {
        articleCode: "EQ-RUN-02",
        articleName: "Insole Dynamic Runner HD",
        colorway: "Royal Blue / Lime",
        unitPrice: 22000,
        notes: "Molded Arch EVA 65C",
        sizes: {
          39: 50,
          40: 120,
          41: 150,
          42: 120,
          43: 60,
        },
      },
      {
        articleCode: "EQ-COMFORT-03",
        articleName: "Latex Cushion Lifestyle Bed",
        colorway: "Charcoal Grey",
        unitPrice: 26000,
        notes: "Latex 3mm + Velvet",
        sizes: {
          37: 30,
          38: 50,
          39: 70,
          40: 80,
          41: 70,
        },
      },
    ],
  });

  await OrderService.createOrder({
    orderNumber: "SJ/EQ/2026/08/0003",
    recipientName: "PT KMK GLOBAL SPORTS",
    destinationAddress: "Jl. Cikupa Mas Raya No. 10, Cikupa, Tangerang",
    poNumber: "KMK-SPK-4512",
    vehicleNumber: "D 8112 EF",
    driverName: "Dedi Kusnadi",
    deliveryDate: "2026-08-17",
    status: "CONFIRMED",
    notes: "Jadwal kirim besok pagi pukul 08:00 WIB",
    items: [
      {
        articleCode: "EQ-MEMORY-04",
        articleName: "PU Memory Foam Arch Support",
        colorway: "Triple Black",
        unitPrice: 24500,
        sizes: {
          39: 40,
          40: 100,
          41: 120,
          42: 100,
          43: 40,
        },
      },
    ],
  });

  await OrderService.createOrder({
    orderNumber: "SJ/EQ/2026/08/0004",
    recipientName: "CV BANDUNG SNEAKER LAB",
    destinationAddress: "Jl. Buah Batu No. 142, Bandung, Jawa Barat",
    poNumber: "BSL-LOC-110",
    vehicleNumber: "D 3341 GH",
    driverName: "Rian Firmansyah",
    deliveryDate: "2026-08-18",
    status: "DRAFT",
    notes: "Sample batch 200 pasang pesanan khusus",
    items: [
      {
        articleCode: "EQ-CORK-05",
        articleName: "Eco Cork Composite Insole",
        colorway: "Natural Brown",
        unitPrice: 32000,
        sizes: {
          38: 20,
          39: 40,
          40: 50,
          41: 50,
          42: 40,
        },
      },
    ],
  });

  console.log("Database seeded successfully with materials and realistic Delivery Orders.");
}
