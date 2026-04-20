import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const { email, password } = await req.json();

    // 1. Validasi input kosong
    if (!email || !password) {
      return NextResponse.json({ message: "Email dan password harus diisi" }, { status: 400 });
    }

    // 2. Cari user berdasarkan email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "Email tidak terdaftar" }, { status: 404 });
    }

    // 3. Bandingkan password yang diinput dengan yang ada di DB (yang sudah di-hash)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Password salah!" }, { status: 401 });
    }

    // 4. Respon sukses (Tanpa session dulu sesuai request-mu)
    return NextResponse.json({
      message: "Login Berhasil!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Login Error:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}