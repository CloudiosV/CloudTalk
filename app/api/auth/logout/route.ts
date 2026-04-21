import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json(
      { message: "Logout berhasil" },
      { status: 200 }
    );

    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal melakukan logout" },
      { status: 500 }
    );
  }
}