import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { SignJWT } from "jose"; // Gunakan jose agar sinkron dengan middleware

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email dan password wajib diisi" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ message: "Email tidak terdaftar" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Password yang kamu masukkan salah" }, { status: 401 });
    }


    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ id: user._id.toString() , email: user.email.toString() })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(secret);

    const response = NextResponse.json({
      message: "Login Berhasil!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar || ""
      }
    }, { status: 200 });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;

  } catch (error: any) {
    console.error("Login Error:", error.message);
    return NextResponse.json({ message: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}