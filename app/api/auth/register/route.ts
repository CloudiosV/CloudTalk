import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const { username, email, password, confirmPassword } = await req.json();

    if (!username || !email || !password || !confirmPassword) {
      return NextResponse.json({ message: "Semua field harus diisi" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ message: "Password dan konfirmasi tidak cocok" }, { status: 400 });
    }

    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] 
    });

    if (existingUser) {
      const isEmailDup = existingUser.email === email.toLowerCase();
      return NextResponse.json({ 
        message: isEmailDup ? "Email sudah digunakan" : "Username sudah digunakan" 
      }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

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