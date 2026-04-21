"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Cloud } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Jika gagal (mungkin cookie belum terbaca), coba sekali lagi setelah 500ms
          setTimeout(async () => {
            const retryRes = await fetch("/api/auth/me");
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              setUser(retryData.user);
            }
          }, 500);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="flex min-h-screen w-full font-sans bg-white">
      <Sidebar activeTab="chats" />
      <main className="flex-1 flex flex-col items-center justify-center bg-white">
        <div className="flex flex-col items-center text-center px-6">
          <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-8">
            <Cloud size={44} className="text-[#5D5FEF]" fill="#5D5FEF" />
          </div>
          <h2 className="text-[2rem] font-black text-gray-900 mb-3 tracking-tight">
            Selamat Datang, {loading ? "..." : (user?.username || "Tamu")}!
          </h2>
          <p className="text-gray-400 font-bold text-base max-w-[320px]">
            {loading ? "Menghubungkan ke server..." : "Pilih teman di daftar pesan untuk mulai berbagi cerita seru hari ini."}
          </p>
        </div>
      </main>
    </div>
  );
}