'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Search } from 'lucide-react';

interface ChatRoomProps {
  currentUser: any;
  activeChat: any; // Menerima data grup ATAU data teman
}

export default function ChatRoom({ currentUser, activeChat }: ChatRoomProps) {
  const [pesanInput, setPesanInput] = useState('');
  const [daftarPesan, setDaftarPesan] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const [showSearch, setShowSearch] = useState(false);
  const [kataKunci, setKataKunci] = useState('');

  // PERBAIKAN: Gunakan tanda tanya (?) supaya tidak error kalau data belum siap
  const isGroup = activeChat?.type === 'group';
  const chatTitle = isGroup ? activeChat?.groupName : activeChat?.username;
  const chatAvatar = chatTitle ? chatTitle.charAt(0).toUpperCase() : '?';

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!currentUser?.id && !currentUser?._id) return;
      if (!activeChat || !activeChat._id) return; // Pastikan data obrolan ada

      try {
        const bodyPayload: any = { action: "get_chat" };
        
        if (isGroup) {
          bodyPayload.conversationId = activeChat._id;
        } else {
          bodyPayload.senderId = currentUser.id || currentUser._id;
          bodyPayload.receiverId = activeChat._id;
        }

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });
        const data = await res.json();
        
        if (res.ok) {
          setConversationId(data.conversationId);
          const formattedMessages = data.messages.map((m: any) => ({
            id: m._id,
            teks: m.text,
            senderId: m.sender?._id || m.sender,
            senderName: m.sender?.username || 'Anggota', 
            waktu: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setDaftarPesan(formattedMessages);
        }
      } catch (error) {
        console.error("Gagal mengambil riwayat chat");
      }
    };

    setDaftarPesan([]);
    setShowSearch(false);
    setKataKunci('');
    fetchChatHistory();
  }, [currentUser, activeChat, isGroup]);

  useEffect(() => {
    if (!conversationId) return;

    const socket = io(window.location.origin, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;
    
    socket.on('connect', () => {
      socket.emit('join-room', conversationId);
    });

    socket.on('pesan-baru', (pesan) => {
      setDaftarPesan((prev) => [...prev, pesan]);
    });

    return () => {
      socket.disconnect();
    };
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current && kataKunci === '') {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [daftarPesan, kataKunci]);

  const handleKirimPesan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesanInput.trim() || !conversationId || !socketRef.current) return;

    socketRef.current.emit('kirim-pesan', {
      conversationId: conversationId,
      senderId: currentUser.id || currentUser._id,
      teks: pesanInput,
    });

    setPesanInput('');
  };

  const pesanYangDitampilkan = daftarPesan.filter((pesan) =>
    pesan.teks.toLowerCase().includes(kataKunci.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#efeae2] font-sans relative w-full">
      
      <header className="flex flex-col bg-white border-b border-gray-200 shadow-sm z-10 w-full absolute top-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold uppercase ${isGroup ? 'bg-rose-400' : 'bg-indigo-500'}`}>
              {chatAvatar}
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-gray-800 leading-tight">{chatTitle}</h2>
              {isGroup && <span className="text-[10px] text-gray-500 font-medium">Grup Obrolan</span>}
            </div>
          </div>

          <button 
            onClick={() => { setShowSearch(!showSearch); setKataKunci(''); }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
          >
            <Search size={20} />
          </button>
        </div>

        {showSearch && (
          <div className="px-4 pb-3">
            <input
              type="text"
              value={kataKunci}
              onChange={(e) => setKataKunci(e.target.value)}
              placeholder="Cari pesan di obrolan ini..."
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/50 text-sm"
            />
          </div>
        )}
      </header>

      <main className={`flex-1 p-4 overflow-y-auto mb-[72px] ${showSearch ? 'mt-[124px]' : 'mt-[72px]'} transition-all duration-300 w-full`}>
        <div className="flex flex-col space-y-4">
          
          {daftarPesan.length === 0 && (
            <p className="text-center text-gray-500 bg-white/50 py-2 rounded-lg text-sm mx-auto w-max px-4 shadow-sm border border-white">
              Belum ada pesan. Ucapkan halo!
            </p>
          )}

          {pesanYangDitampilkan.map((pesan, index) => {
            const senderIdStr = pesan.senderId?.toString();
            const currentUserIdStr = (currentUser?.id || currentUser?._id)?.toString();
            const isSaya = senderIdStr === currentUserIdStr;

            return (
              <div key={index} className={`flex flex-col ${isSaya ? 'items-end' : 'items-start'} w-full`}>
                
                {/* TAMPILKAN NAMA PENGIRIM DI GRUP */}
                {isGroup && !isSaya && (
                  <span className="text-[11px] font-bold text-gray-500 ml-2 mb-1">
                    {pesan.senderName}
                  </span>
                )}

                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
                  isSaya ? 'bg-[#5D5FEF] text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                }`}>
                  <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{pesan.teks}</p>
                  <span className={`text-[10px] block mt-1 text-right ${isSaya ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {pesan.waktu}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </main>

      <footer className="p-3 bg-white border-t border-gray-200 text-gray-600 absolute bottom-0 w-full z-10">
        <form onSubmit={handleKirimPesan} className="flex gap-2">
          <input
            type="text"
            value={pesanInput}
            onChange={(e) => setPesanInput(e.target.value)}
            placeholder={`Ketik pesan...`}
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/50 text-sm"
          />
          <button 
            type="submit" 
            disabled={!pesanInput.trim()} 
            className="px-6 py-3 bg-[#5D5FEF] text-white font-bold rounded-2xl hover:bg-indigo-600 disabled:opacity-50 transition active:scale-95"
          >
            Kirim
          </button>
        </form>
      </footer>
    </div>
  );
}