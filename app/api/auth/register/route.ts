import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const { username, email, password } = await req.json();

    // Validasi kelengkapan data
    if (!username || !email || !password) {
      return NextResponse.json({ message: "Semua field harus diisi" }, { status: 400 });
    }

    // Cek apakah email atau username sudah digunakan
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] 
    });

    if (existingUser) {
      const isEmailDup = existingUser.email === email.toLowerCase();
      return NextResponse.json({ 
        message: isEmailDup ? "Email sudah digunakan" : "Username sudah digunakan" 
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12); // Salt round 12 lebih aman

    // Simpan user baru
    await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    return NextResponse.json({ message: "Registrasi Berhasil!" }, { status: 201 });

  } catch (error: any) {
    console.error("Register Error:", error.message);
    return NextResponse.json({ message: "Gagal membuat akun, coba lagi nanti" }, { status: 500 });
  }
}