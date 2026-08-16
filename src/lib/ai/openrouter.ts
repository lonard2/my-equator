import { InventoryService } from "@/services/inventoryService";
import { OrderService } from "@/services/orderService";
import { ChatMessage, AIModelOption, SUPPORTED_MODELS } from "./types";

export { SUPPORTED_MODELS, type ChatMessage, type AIModelOption };

export const KHATULISTIWA_SYSTEM_PROMPT = `
You are Khatulistiwa AI (Asisten Pabrik Equator Insole Bandung), an intelligent manufacturing operations assistant for Equator Insole in Bandung, West Java, Indonesia.

Company Context:
- Company: Equator Insole
- Location: Bandung, Jawa Barat, Indonesia
- Industry: Insole and footbed manufacturing (EVA Foam, Natural Latex, PU Orthotics, TPU Torsion Shanks, BK Mesh Fabrics).
- Currency: Indonesian Rupiah (IDR, format e.g. Rp 1.250.000).
- Standard Shoe Sizes: EU 36 to EU 45.

Your Capabilities & Tool Access:
1. "check_inventory_stock": Look up real-time raw material balances (EVA sheets, latex rolls, PU chemicals, TPU shanks, fabrics).
2. "draft_delivery_order": Parse natural language requests into structured Delivery Orders (Surat Jalan) with footwear size matrix breakdown.
3. "calculate_material_bom": Calculate Bill of Materials (BOM) requirement based on insole pair counts.
4. "get_business_summary": Retrieve summary of active delivery orders, scheduled pairs volume, and warehouse inventory valuation.

Tone & Style:
- Professional, concise, courteous, and knowledgeable in footwear manufacturing.
- Support both Bahasa Indonesia (primary factory communication) and English fluently.
- When drafting a delivery order, always clearly summarize the recipient, destination, PO number, and size breakdown matrix in a structured markdown format.
`;

export const AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "check_inventory_stock",
      description: "Lookup real-time factory raw material inventory, stock levels, safety thresholds, and unit costs.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["ALL", "EVA_SHEET", "LATEX", "PU_CHEMICAL", "TPU_SHANK", "FABRIC", "CUTTING_DIE"],
            description: "Category of raw material to filter",
          },
          low_stock_only: {
            type: "boolean",
            description: "If true, returns only materials that are below safety threshold or critical",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_delivery_order",
      description: "Create a draft Delivery Order (Surat Jalan) with customer information and size matrix breakdown.",
      parameters: {
        type: "object",
        required: ["recipient_name", "destination_address", "items"],
        properties: {
          recipient_name: { type: "string", description: "Name of customer company" },
          destination_address: { type: "string", description: "Full factory destination address" },
          po_number: { type: "string", description: "Purchase Order or SPK reference number" },
          delivery_date: { type: "string", description: "Delivery date in YYYY-MM-DD format" },
          driver_name: { type: "string", description: "Driver name if assigned" },
          vehicle_number: { type: "string", description: "Vehicle license plate" },
          notes: { type: "string", description: "Special shipping instructions" },
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["article_name", "sizes"],
              properties: {
                article_code: { type: "string" },
                article_name: { type: "string" },
                colorway: { type: "string" },
                unit_price: { type: "number" },
                sizes: {
                  type: "object",
                  description: "Object mapping shoe sizes (e.g. '38', '39', '40', '41', '42') to pair quantities",
                },
                notes: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_material_bom",
      description: "Calculate Bill of Materials (BOM) consumption for a batch of insoles.",
      parameters: {
        type: "object",
        required: ["total_pairs", "insole_model"],
        properties: {
          total_pairs: { type: "number", description: "Total pairs to produce" },
          insole_model: { type: "string", description: "Model name, e.g. Ortho Sport, Comfort Latex, Dynamic Runner" },
          eva_thickness_mm: { type: "number", description: "Thickness of EVA in mm, default 2 or 4" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_business_summary",
      description: "Fetch monthly factory business overview, active orders count, total scheduled pairs, and warehouse valuation.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

/**
 * Execute local database tools requested by LLM
 */
export async function executeTool(toolName: string, args: any): Promise<any> {
  switch (toolName) {
    case "check_inventory_stock": {
      const allMaterials = await InventoryService.getAllMaterials();
      let filtered = allMaterials;
      if (args.category && args.category !== "ALL") {
        filtered = filtered.filter((m) => m.category === args.category);
      }
      if (args.low_stock_only) {
        filtered = filtered.filter((m) => m.healthStatus === "CRITICAL" || m.healthStatus === "WARNING");
      }
      return {
        count: filtered.length,
        materials: filtered.map((m) => ({
          sku: m.sku,
          name: m.name,
          category: m.category,
          currentStock: `${m.currentStock} ${m.unit}`,
          safetyThreshold: `${m.safetyThreshold} ${m.unit}`,
          healthStatus: m.healthStatus,
          unitCost: m.unitCost,
          location: m.location,
        })),
      };
    }

    case "get_business_summary": {
      const [orders, inventorySummary] = await Promise.all([
        OrderService.getAllOrders(),
        InventoryService.getInventorySummary(),
      ]);

      const totalScheduledPairs = orders.reduce((s, o) => s + o.totalQuantity, 0);
      return {
        activeOrdersCount: orders.length,
        totalScheduledPairs,
        totalWarehouseValuationIDR: inventorySummary.totalValuationIDR,
        lowStockSkusCount: inventorySummary.lowStockCount + inventorySummary.criticalStockCount,
      };
    }

    case "calculate_material_bom": {
      const pairs = args.total_pairs || 100;
      const pairsPerEvaSheet = 12;
      const evaSheetsRequired = Math.ceil(pairs / pairsPerEvaSheet);
      const fabricMetersRequired = Math.ceil(pairs * 0.08);
      const tpuShanksRequired = pairs * 2;

      return {
        total_pairs: pairs,
        insole_model: args.insole_model || "Standard Insole",
        estimated_bom: [
          {
            material: `EVA Foam Sheet ${args.eva_thickness_mm || 3}mm`,
            quantityRequired: `${evaSheetsRequired} Lembar`,
            basis: `Asumsi yield ~${pairsPerEvaSheet} pasang per lembar EVA 1.2m x 2.4m`,
          },
          {
            material: "BK Mesh Laminate Fabric",
            quantityRequired: `${fabricMetersRequired} Meter`,
            basis: "Asumsi 0.08 meter per pasang insole",
          },
          {
            material: "TPU Arch Shank Plate",
            quantityRequired: `${tpuShanksRequired} Pcs`,
            basis: "2 pcs (kiri + kanan) per pasang",
          },
        ],
      };
    }

    case "draft_delivery_order": {
      return {
        status: "DRAFT_STAGED",
        draftData: args,
        message: "Draft Surat Jalan berhasil di-generate dan siap diterapkan ke form.",
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

/**
 * Intelligent deterministic fallback generator if OPENROUTER_API_KEY is not configured or network fails
 */
export async function generateFallbackResponse(userPrompt: string): Promise<{
  content: string;
  stagedDraft?: any;
}> {
  const lower = userPrompt.toLowerCase();

  if (lower.includes("stok") || lower.includes("bahan") || lower.includes("inventory") || lower.includes("material")) {
    const data = await executeTool("check_inventory_stock", { low_stock_only: false });
    const summary = await InventoryService.getInventorySummary();
    let text = `📦 **Laporan Status Inventaris Bahan Baku Terkini:**\n\n`;
    text += `- Total SKU: **${data.count} bahan**\n`;
    text += `- Total Nilai Aset: **Rp ${summary.totalValuationIDR.toLocaleString("id-ID")}**\n`;
    text += `- Peringatan Stok Rendah: **${summary.lowStockCount + summary.criticalStockCount} SKU**\n\n`;
    text += `**Rincian Saldo Bahan:**\n`;
    data.materials.forEach((m: any) => {
      const statusEmoji = m.healthStatus === "CRITICAL" ? "🔴 KRITIS" : m.healthStatus === "WARNING" ? "🟡 MENIPIS" : "🟢 AMAN";
      text += `- **[${m.sku}]** ${m.name}: **${m.currentStock}** (Safety: ${m.safetyThreshold}) — *${statusEmoji}*\n`;
    });
    return { content: text };
  }

  if (lower.includes("surat jalan") || lower.includes("do") || lower.includes("buatkan") || lower.includes("kirim") || lower.includes("order")) {
    const recipient = lower.includes("kmk")
      ? "PT KMK GLOBAL SPORTS"
      : lower.includes("adis")
      ? "PT ADIS DIMENSION FOOTWEAR"
      : "PT INDO SEPATU MAJU";

    const draftData = {
      recipient_name: recipient,
      destination_address: "Kawasan Industri Manis, Jl. Manis Raya No. 8, Tangerang, Banten",
      po_number: `PO-EQ-${Date.now().toString().slice(-4)}`,
      delivery_date: new Date().toISOString().split("T")[0],
      driver_name: "Asep Sunandar",
      vehicle_number: "D 8842 AB",
      notes: "Pengiriman batch insole pesanan khusus. Mohon stempel rangkap 3.",
      items: [
        {
          article_code: "EQ-SPORT-01",
          article_name: "Insole EVA Ortho Sport EQ-01",
          colorway: "Black / Equator Red",
          unit_price: 18500,
          sizes: { "38": 40, "39": 60, "40": 80, "41": 80, "42": 40 },
          notes: "Laminasi BK Mesh Red",
        },
      ],
    };

    let text = `📄 **Draft Surat Jalan Siap Ditinjau:**\n\n`;
    text += `- **Penerima:** ${draftData.recipient_name}\n`;
    text += `- **Alamat:** ${draftData.destination_address}\n`;
    text += `- **No. PO / SPK:** ${draftData.po_number}\n`;
    text += `- **Tanggal Kirim:** ${draftData.delivery_date}\n`;
    text += `- **Total Pasang:** **300 pasang** (Size 38: 40, 39: 60, 40: 80, 41: 80, 42: 40)\n\n`;
    text += `Klik tombol **"Terapkan ke Form DO"** di bawah untuk langsung membuka form dengan data ini.`;

    return { content: text, stagedDraft: draftData };
  }

  if (lower.includes("bom") || lower.includes("kalkulasi") || lower.includes("kebutuhan") || lower.includes("hitung")) {
    const bom = await executeTool("calculate_material_bom", { total_pairs: 500, insole_model: "Ortho Sport" });
    let text = `📊 **Estimasi Bill of Materials (BOM) untuk ${bom.total_pairs} Pasang Insole (${bom.insole_model}):**\n\n`;
    bom.estimated_bom.forEach((b: any) => {
      text += `- **${b.material}**: **${b.quantityRequired}** (*${b.basis}*)\n`;
    });
    return { content: text };
  }

  // General factory assistant welcome
  const summary = await executeTool("get_business_summary", {});
  let text = `Halo! Saya **Khatulistiwa AI**, asisten operasional Equator Insole Bandung.\n\n`;
  text += `📊 **Status Pabrik Hari Ini:**\n`;
  text += `- Surat Jalan Aktif: **${summary.activeOrdersCount} DO**\n`;
  text += `- Total Pasang Terjadwal: **${summary.totalScheduledPairs.toLocaleString("id-ID")} pasang**\n`;
  text += `- Nilai Aset Stok Bahan: **Rp ${summary.totalWarehouseValuationIDR.toLocaleString("id-ID")}**\n\n`;
  text += `Anda dapat meminta saya untuk:\n`;
  text += `1. *"Cek stok bahan baku EVA dan kain mesh"* (Query real-time)\n`;
  text += `2. *"Buatkan surat jalan untuk PT KMK 300 pasang insole sport"* (Auto-Drafting)\n`;
  text += `3. *"Hitung kebutuhan bahan untuk 1.000 pasang insole"* (Kalkulasi BOM)\n`;
  return { content: text };
}

/**
 * Sends a conversational query through OpenRouter or deterministic fallback
 */
export async function sendOpenRouterChat(messages: ChatMessage[], modelId: string = "google/gemini-3.5-flash-lite") {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || apiKey === "mock_key" || apiKey.length < 10) {
    const lastUserMsg = messages.filter((m) => m.role === "user").pop()?.content || "";
    return generateFallbackResponse(lastUserMsg);
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://myequator.factory",
        "X-Title": "MyEquator Factory ERP",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "system", content: KHATULISTIWA_SYSTEM_PROMPT }, ...messages],
        tools: AI_TOOLS,
        tool_choice: "auto",
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.warn("OpenRouter returned error status, falling back to local engine.");
      const lastUserMsg = messages.filter((m) => m.role === "user").pop()?.content || "";
      return generateFallbackResponse(lastUserMsg);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    if (message?.tool_calls && message.tool_calls.length > 0) {
      let finalContent = message.content || "";
      let stagedDraft: any = null;

      for (const toolCall of message.tool_calls) {
        const fnName = toolCall.function.name;
        let fnArgs: any = {};
        try {
          fnArgs = JSON.parse(toolCall.function.arguments);
        } catch (e) {}

        const toolResult = await executeTool(fnName, fnArgs);
        if (fnName === "draft_delivery_order") {
          stagedDraft = toolResult.draftData;
        }

        if (!finalContent) {
          if (fnName === "check_inventory_stock") {
            finalContent = `Berikut rincian stok bahan baku yang Anda cari: Ditemukan ${toolResult.count} SKU bahan.`;
          } else if (fnName === "draft_delivery_order") {
            finalContent = `Draft Surat Jalan untuk **${fnArgs.recipient_name}** telah saya susun. Silakan periksa rinciannya dan klik tombol terapkan di bawah.`;
          } else if (fnName === "calculate_material_bom") {
            finalContent = `Hasil kalkulasi kebutuhan bahan (BOM) untuk ${fnArgs.total_pairs} pasang insole telah dihitung.`;
          }
        }
      }

      return { content: finalContent, stagedDraft };
    }

    return { content: message?.content || "Tidak ada respons dari model." };
  } catch (error) {
    console.error("OpenRouter request error:", error);
    const lastUserMsg = messages.filter((m) => m.role === "user").pop()?.content || "";
    return generateFallbackResponse(lastUserMsg);
  }
}
