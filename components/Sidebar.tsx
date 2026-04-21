"use client";
import { useState } from "react";
import { Cloud, MessageSquare, Users, LogOut, Settings, User } from "lucide-react";
import Link from 'next/link';

interface SidebarProps {
    activeTab: "chats" | "friends";
}

// 2. Terima activeTab sebagai parameter
export default function Sidebar({ activeTab }: SidebarProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    return (
        <div className="flex h-screen relative z-50">
            <aside 
                className={`${
                    isExpanded ? "w-64" : "w-24"
                } bg-white border-r border-indigo-50 flex flex-col py-8 justify-between shrink-0 transition-all duration-300 ease-in-out relative`}
            >
                <div className="flex flex-col w-full overflow-hidden">
                    <div className="px-4">
                        <div className="flex items-center justify-start gap-4 h-14">
                            <div 
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="bg-[#5D5FEF] h-14 w-14 min-w-[56px] rounded-[1.5rem] shadow-lg shadow-indigo-100 transform transition active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
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
                        {/* Nav: Messages - Pengecekan activeTab di sini */}
                        <Link 
                            href="/messages"
                            className={`flex items-center justify-start gap-4 h-14 px-4 rounded-2xl transition-all duration-200 w-full ${
                                activeTab === "chats" ? "bg-indigo-50 text-[#5D5FEF]" : "text-gray-300 hover:text-[#5D5FEF]"
                            }`}
                        >
                            <MessageSquare size={24} className="shrink-0" />
                            {isExpanded && (
                                <span className="font-bold text-sm whitespace-nowrap animate-in fade-in duration-500">
                                    Messages
                                </span>
                            )}
                        </Link>

                        {/* Nav: Friends - Pengecekan activeTab di sini */}
                        <Link 
                            href="/friends" 
                            className={`flex items-center justify-start gap-4 h-14 px-4 rounded-2xl transition-all duration-200 w-full ${
                                activeTab === "friends" ? "bg-indigo-50 text-[#5D5FEF]" : "text-gray-300 hover:text-[#5D5FEF]"
                            }`}
                        >
                            <Users size={24} className="shrink-0" />
                            {isExpanded && (
                                <span className="font-bold text-sm whitespace-nowrap animate-in fade-in duration-500">
                                    Friends
                                </span>
                            )}
                        </Link>
                    </nav>
                </div>

                {/* User Section / Settings */}
                <div className="px-4 w-full relative">
                    {showSettings && (
                        <div className="absolute bottom-20 left-4 w-64 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(93,95,239,0.15)] border border-indigo-50 overflow-hidden z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="p-5 bg-indigo-50/50 border-b border-indigo-100/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-[#5D5FEF] text-white flex items-center justify-center font-black text-lg">
                                        N
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-black text-gray-900 truncate">Nabil</p>
                                        <p className="text-[10px] text-gray-400 font-bold tracking-wider">PREMIUM</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-2">
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 text-gray-600 transition-colors">
                                    <User size={18} />
                                    <span className="text-xs font-bold">Profile</span>
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-50 text-rose-500 transition-colors">
                                    <LogOut size={18} />
                                    <span className="text-xs font-bold">Logout</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className={`flex items-center justify-start gap-4 h-14 px-4 rounded-2xl transition-all duration-200 w-full ${
                            showSettings ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-400 hover:bg-indigo-50"
                        }`}
                    >
                        <div className="relative shrink-0 flex items-center justify-center">
                            <Settings 
                                size={24} 
                                className={`transition-transform duration-300 ${showSettings ? 'rotate-90 opacity-0' : ''}`} 
                            />
                            <div className={`absolute inset-0 flex items-center justify-center font-bold text-white transition-all duration-300 ${showSettings ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                                N
                            </div>
                        </div>
                        {isExpanded && (
                            <span className="font-bold text-sm whitespace-nowrap animate-in fade-in duration-500">
                                Settings
                            </span>
                        )}
                    </button>
                </div>
            </aside>
        </div>
    );
}