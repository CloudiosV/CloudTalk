'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket;

interface ChatRoomProps {
  currentUser: any;
  friend: any;
}

export default function ChatRoom({ currentUser, friend }: ChatRoomProps) {
  const [pesanInput, setPesanInput] = useState('');
  const [daftarPesan, setDaftarPesan] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [showSearch, setShowSearch] = useState(false);
  const [kataKunci, setKataKunci] = useState('');

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: currentUser.id,
            receiverId: friend._id
          })
        });
        const data = await res.json();
        
        if (res.ok) {
          setConversationId(data.conversationId);
          const formattedMessages = data.messages.map((m: any) => ({
            id: m._id,
            teks: m.text,
            senderId: m.sender,
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
  }, [currentUser.id, friend._id]);

  useEffect(() => {
    if (!conversationId) return;

    socket = io();
    socket.emit('join-room', conversationId);

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
    if (!pesanInput.trim() || !conversationId) return;

    socket.emit('kirim-pesan', {
      conversationId: conversationId,
      senderId: currentUser.id,
      teks: pesanInput,
    });

    setPesanInput('');
  };

  const pesanYangDitampilkan = daftarPesan.filter((pesan) =>
    pesan.teks.toLowerCase().includes(kataKunci.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#efeae2] font-sans relative">
      
      <header className="flex flex-col bg-white border-b border-gray-200 shadow-sm z-10 absolute top-0 w-full">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold uppercase">
              {friend.username.charAt(0)}
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-bold text-gray-800">{friend.username}</h2>
            </div>
          </div>

          <button 
            onClick={() => {
              setShowSearch(!showSearch);
              setKataKunci(''); 
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
            title="Cari Pesan"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
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

      <main className={`flex-1 p-4 overflow-y-auto mb-[72px] ${showSearch ? 'mt-[124px]' : 'mt-[72px]'} transition-all duration-300`}>
        <div className="flex flex-col space-y-4">
          
          {daftarPesan.length === 0 && (
            <p className="text-center text-gray-500 bg-white/50 py-2 rounded-lg text-sm mx-auto w-max px-4">
              Belum ada pesan. Ucapkan halo!
            </p>
          )}

          {pesanYangDitampilkan.length === 0 && kataKunci !== '' && (
            <p className="text-center text-gray-500 bg-white/50 py-2 rounded-lg text-sm mx-auto w-max px-4">
              Pesan "{kataKunci}" tidak ditemukan.
            </p>
          )}

          {pesanYangDitampilkan.map((pesan, index) => {
            const isSaya = pesan.senderId === currentUser.id;
            return (
              <div key={index} className={`flex ${isSaya ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
                  isSaya ? 'bg-[#5D5FEF] text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                }`}>
                  <p className="text-[15px] leading-relaxed">{pesan.teks}</p>
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

      <footer className="p-4 bg-white border-t border-gray-200 text-gray-600 absolute bottom-0 w-full">
        <form onSubmit={handleKirimPesan} className="flex gap-2">
          <input
            type="text"
            value={pesanInput}
            onChange={(e) => setPesanInput(e.target.value)}
            placeholder={`Ketik pesan ke ${friend.username}...`}
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