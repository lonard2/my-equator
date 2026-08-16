import { NextResponse } from "next/server";
import { sendOpenRouterChat, ChatMessage } from "@/lib/ai/openrouter";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = body.messages || [];
    const modelId: string = body.modelId || "google/gemini-3.5-flash-lite";

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Messages array is required" },
        { status: 400 }
      );
    }

    const response = await sendOpenRouterChat(messages, modelId);
    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    console.error("Error in AI chat endpoint:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process chat" },
      { status: 500 }
    );
  }
}
