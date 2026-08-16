import { NextResponse } from "next/server";
import { OrderService } from "@/services/orderService";
import { generateEscpBinary, generateEscpMonospaceText } from "@/lib/printer/escp";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "text"; // "text" or "binary"

    const order = await OrderService.getOrderById(id);
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (format === "binary") {
      const binary = generateEscpBinary(order);
      const filename = `${order.orderNumber.replace(/\//g, "-")}.prn`;
      return new Response(Buffer.from(binary), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const monospaceText = generateEscpMonospaceText(order);
    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        text: monospaceText,
      },
    });
  } catch (error) {
    console.error("Error generating ESC/P output:", error);
    return NextResponse.json({ success: false, error: "Failed to generate print stream" }, { status: 500 });
  }
}
