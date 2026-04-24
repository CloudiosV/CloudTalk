import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CloudTalk | Connect & Chat Instantly",
  description: "Platform komunikasi real-time yang cepat, aman, dan mudah digunakan. Hubungkan pertemanan dan obrolan grupmu dalam satu genggaman.",
  keywords: ["chat", "messenger", "cloudtalk", "real-time chat", "aplikasi chat", "turbin", "komunikasi"],
  authors: [{ name: "CloudTalk Team" }],
  openGraph: {
    title: "CloudTalk | Connect & Chat Instantly",
    description: "Yuk mulai ngobrol santai dan bikin grup seru di CloudTalk sekarang!",
    url: "https://cloudtalk.app.turbin.id",
    siteName: "CloudTalk",
    images: [
      {
        url: "https://cloudtalk.app.turbin.id/images/authIcon.png", 
        width: 800,
        height: 600,
        alt: "CloudTalk Cover",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
