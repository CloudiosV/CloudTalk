import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function GET() {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    console.log("--- DEBUG ME ---");
    console.log("Token ditemukan:", token ? "YA" : "TIDAK");

    if (!token) return NextResponse.json({ message: "No token" }, { status: 401 });

    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      console.log("ERROR: JWT_SECRET tidak terbaca di .env!");
      return NextResponse.json({ message: "Server configuration error" }, { status: 500 });
    }

    const secret = new TextEncoder().encode(secretKey);
    
    const { payload } = await jwtVerify(token, secret);
    console.log("Payload ID:", payload.id);

    const user = await User.findById(payload.id).select("-password").lean();
    
    if (!user) {
      console.log("ERROR: User tidak ditemukan di Database!");
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    console.log("LOGIN SUKSES: ", user.username);
    return NextResponse.json({ user });

  } catch (error: any) {
    console.log("ERROR VERIFIKASI:", error.message);
    return NextResponse.json({ message: "Session invalid" }, { status: 401 });
  }
}