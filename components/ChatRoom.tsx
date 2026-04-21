'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket;

const DUMMY_CONVERSATION_ID = '111111111111111111111111';
const DUMMY_SAYA_ID = '222222222222222222222222';

export default function ChatRoom() {
  const [pesanInput, setPesanInput] = useState('');
  const [daftarPesan, setDaftarPesan] = useState<any[]>([]);
  
  const [showSearch, setShowSearch] = useState(false);
  const [kataKunci, setKataKunci] = useState('');

  useEffect(() => {
    socket = io();
    socket.emit('join-room', DUMMY_CONVERSATION_ID);

    socket.on('pesan-baru', (pesan) => {
      setDaftarPesan((prev) => [...prev, pesan]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleKirimPesan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesanInput.trim()) return;

    socket.emit('kirim-pesan', {
      conversationId: DUMMY_CONVERSATION_ID,
      senderId: DUMMY_SAYA_ID,
      teks: pesanInput,
    });

    setPesanInput('');
  };

  const pesanYangDitampilkan = daftarPesan.filter((pesan) =>
    pesan.teks.toLowerCase().includes(kataKunci.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      
      <header className="flex flex-col bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">T</div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-800">Teman Chat</h2>
            </div>
          </div>

          <button 
            onClick={() => {
              setShowSearch(!showSearch);
              setKataKunci(''); // Bersihkan kata kunci saat fitur ditutup
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
            title="Cari Pesan"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
        </div>

        {showSearch && (
          <div className="px-4 pb-3 animate-fade-in-down text-gray-600">
            <input
              type="text"
              value={kataKunci}
              onChange={(e) => setKataKunci(e.target.value)}
              placeholder="Cari pesan di obrolan ini..."
              className="w-full px-4 py-2 bg-gray-100 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        )}
      </header>

      <main className="flex-1 p-4 overflow-y-auto bg-[#efeae2]">
        <div className="flex flex-col space-y-4">
          
          {pesanYangDitampilkan.length === 0 && kataKunci !== '' && (
            <div className="text-center text-gray-500 bg-white/50 py-2 rounded-lg">
              Pesan "{kataKunci}" tidak ditemukan.
            </div>
          )}

          {pesanYangDitampilkan.map((pesan, index) => {
            const isSaya = pesan.senderId === DUMMY_SAYA_ID;
            return (
              <div key={index} className={`flex ${isSaya ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-3 rounded-lg shadow ${isSaya ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                  <p className="text-base leading-relaxed">{pesan.teks}</p>
                  <span className={`text-xs block mt-1 text-right ${isSaya ? 'text-blue-200' : 'text-gray-400'}`}>{pesan.waktu}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="p-4 bg-white border-t border-gray-200 text-gray-600">
        <form onSubmit={handleKirimPesan} className="flex gap-2">
          <input
            type="text"
            value={pesanInput}
            onChange={(e) => setPesanInput(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <button type="submit" disabled={!pesanInput.trim()} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 disabled:bg-gray-400 transition-colors">
            Kirim
          </button>
        </form>
      </footer>
    </div>
  );
}