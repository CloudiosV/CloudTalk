"use client";
import { useState, useEffect } from "react"; 
import { Cloud, MessageSquare, Users, LogOut, Settings } from "lucide-react";
import Link from 'next/link';
import { useRouter } from "next/navigation"; 

interface SidebarProps {
    activeTab: "chats" | "friends";
    onMobileItemClick?: () => void; // TAMBAHAN: untuk tutup sidebar di mobile
}

export default function Sidebar({ activeTab, onMobileItemClick }: SidebarProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [user, setUser] = useState<{username: string, email: string} | null>(null);
    const router = useRouter();

    useEffect(() => {
        const savedState = localStorage.getItem("sidebar-expanded");
        if (savedState !== null) {
            setIsExpanded(savedState === "true");
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        localStorage.setItem("sidebar-expanded", String(newState));
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/auth/me", {credentials: 'include'});
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                }
            } catch (error) {
                console.error("Gagal mengambil profil:", error);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        try {
            const res = await fetch("/api/auth/logout", { method: "POST" });
            if (res.ok) {
                window.location.href = "/auth"; 
            }
        } catch (error) {
            console.error("Gagal logout:", error);
        }
    };

    // Fungsi untuk handle klik menu (tutup sidebar di mobile)
    const handleMenuClick = () => {
        if (onMobileItemClick) {
            onMobileItemClick();
        }
    };

    return (
        <div className="flex h-screen relative z-50">
            <aside 
                className={`${
                    isExpanded ? "w-64" : "w-24"
                } bg-white border-r border-indigo-50 flex flex-col py-8 justify-between shrink-0 transition-all duration-300 ease-in-out relative h-full`}
            >
                <div className="flex flex-col w-full overflow-hidden">
                    <div className="px-4">
                        <div className="flex items-center justify-start gap-4 h-14">
                            <div 
                                onClick={toggleSidebar}
                                className="bg-[#5D5FEF] h-14 w-14 min-w-[56px] rounded-[1.5rem] shadow-lg shadow-indigo-100 transform transition-all duration-300 active:scale-95 hover:scale-105 cursor-pointer flex items-center justify-center shrink-0"
                            >
                                <Cloud className="text-white" size={24} fill="white" />
                            </div>

                            {isExpanded && (
                                <div className="flex items-center animate-in fade-in slide-in-from-left-2 duration-500">
                                    <span className="text-[#5D5FEF] font-black text-xl tracking-tighter whitespace-nowrap pl-2">
                                        CloudTalk
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                  
                    <div className="w-full flex items-center justify-center">
                        <div className="border h-0 w-[80%] mt-3 mb-3 shrink-0"/>
                    </div>

                    <nav className="flex flex-col gap-4 w-full px-4">
                        <Link 
                            href="/chat"
                            onClick={handleMenuClick}
                            className={`flex items-center justify-start gap-4 h-14 px-4 rounded-2xl transition-all duration-200 w-full group ${
                                activeTab === "chats" ? "bg-indigo-50 text-[#5D5FEF]" : "text-gray-300 hover:text-[#5D5FEF] hover:bg-indigo-50/50"
                            }`}
                        >
                            <MessageSquare size={24} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
                            {isExpanded && (
                                <span className="font-bold text-sm whitespace-nowrap animate-in fade-in duration-500">
                                    Messages
                                </span>
                            )}
                        </Link>

                        <Link 
                            href="/friend"
                            onClick={handleMenuClick}
                            className={`flex items-center justify-start gap-4 h-14 px-4 rounded-2xl transition-all duration-200 w-full group ${
                                activeTab === "friends" ? "bg-indigo-50 text-[#5D5FEF]" : "text-gray-300 hover:text-[#5D5FEF] hover:bg-indigo-50/50"
                            }`}
                        >
                            <Users size={24} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
                            {isExpanded && (
                                <span className="font-bold text-sm whitespace-nowrap animate-in fade-in duration-500">
                                    Friends
                                </span>
                            )}
                        </Link>
                    </nav>
                </div>

                <div className="px-4 w-full relative">
                    {showSettings && (
                        <div className="absolute bottom-20 left-4 w-64 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(93,95,239,0.15)] border border-indigo-50 overflow-hidden z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="p-5 bg-indigo-50/50 border-b border-indigo-100/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-[#5D5FEF] text-white flex items-center justify-center font-black text-lg uppercase">
                                        {user ? user.username[0] : "?"}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-black text-gray-900 truncate">
                                            {user ? user.username : "Memuat..."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-2">
                                <button 
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-rose-50 text-rose-500 hover:translate-x-1 active:scale-95"
                                >
                                    <LogOut size={18} />
                                    <span className="text-xs font-bold">Logout</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className={`flex items-center justify-start gap-4 h-14 px-4 rounded-2xl transition-all duration-200 w-full group ${
                            showSettings 
                            ? "bg-indigo-50 text-[#5D5FEF]" 
                            : "text-gray-300 hover:text-[#5D5FEF] hover:bg-indigo-50/50"
                        }`}
                    >
                        <Settings 
                            size={24} 
                            className={`shrink-0 transition-all duration-300 ${showSettings ? 'rotate-90' : 'group-hover:rotate-90'}`} 
                        />
                        {isExpanded && (
                            <span className="font-bold text-sm whitespace-nowrap animate-in fade-in duration-300">
                                Settings
                            </span>
                        )}
                    </button>
                </div>
            </aside>
        </div>
    );
}