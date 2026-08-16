import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/authService";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const user = await authenticateUser(username, password);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Kredensial tidak valid. Silakan periksa kembali." },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    console.error("Login failed:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
