import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const { email, password } = await req.json();

    // Validasi input
    if (!email || !password) {
      return NextResponse.json({ message: "Email dan password wajib diisi" }, { status: 400 });
    }

    // Cari user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "Email tidak terdaftar" }, { status: 404 });
    }

    // Bandingkan password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Password yang kamu masukkan salah" }, { status: 401 });
    }

    // Kembalikan data user sesuai kebutuhan frontend (localStorage.setItem)
    return NextResponse.json({
      message: "Login Berhasil!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar || "" // Berikan default jika avatar kosong
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Login Error:", error.message);
    return NextResponse.json({ message: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}