'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// Bikin socket di luar komponen biar gak ke-render ulang terus
let socket: Socket;

// ID BOHONGAN (Hanya untuk testing sebelum sidebar jadi)
// Format 24 karakter (standar MongoDB ObjectId)
const DUMMY_CONVERSATION_ID = '111111111111111111111111';
const DUMMY_SAYA_ID = '222222222222222222222222';

export default function ChatRoom() {
  const [pesanInput, setPesanInput] = useState('');
  const [daftarPesan, setDaftarPesan] = useState<any[]>([]);

  useEffect(() => {
    // Konek ke server Socket.io pas halaman dibuka
    socket = io();

    // Langsung masuk ke ruangan testing
    socket.emit('join-room', DUMMY_CONVERSATION_ID);

    // Dengerin kalau ada pesan balik dari server
    socket.on('pesan-baru', (pesan) => {
      setDaftarPesan((prev) => [...prev, pesan]);
    });

    // Bersihkan koneksi kalau halaman ditutup
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleKirimPesan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesanInput.trim()) return;

    // Tembak pesan ke server (TIDAK langsung dimunculin ke layar)
    socket.emit('kirim-pesan', {
      conversationId: DUMMY_CONVERSATION_ID,
      senderId: DUMMY_SAYA_ID,
      teks: pesanInput,
    });

    setPesanInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <header className="flex items-center p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">T</div>
        <div className="ml-4">
          <h2 className="text-xl font-semibold text-gray-800">Teman Chat (Testing)</h2>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto bg-[#efeae2]">
        <div className="flex flex-col space-y-4">
          {daftarPesan.map((pesan, index) => {
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

      <footer className="p-4 bg-white border-t border-gray-200">
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