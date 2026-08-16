import { NextResponse } from "next/server";
import { OrderService } from "@/services/orderService";

export async function GET() {
  try {
    const orders = await OrderService.getAllOrders();
    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch delivery orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await OrderService.createOrder(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create delivery order" },
      { status: 500 }
    );
  }
}
