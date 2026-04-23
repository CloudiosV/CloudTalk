'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatRoom from '@/components/ChatRoom';
import { MessageSquare } from 'lucide-react';

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (res.ok && data.user) {
          setCurrentUser(data.user);
          fetchFriends(data.user._id || data.user.id);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          window.location.href = "/auth";
        }
      } catch (error) {
        console.error("Gagal verifikasi auth");
      }
    };

    checkAuth();
  }, []);

  const fetchFriends = async (userId: string) => {
    try {
      const res = await fetch(`/api/friend?userId=${userId}`, {credentials: 'include'});
      const data = await res.json();
      if (res.ok) setFriends(data.friends);
    } catch (error) {
      console.error("Gagal mengambil daftar teman");
    }
  };

  if (!currentUser) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar activeTab="chats" />

      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-black text-gray-800">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {friends.length === 0 ? (
            <p className="text-gray-400 text-sm text-center mt-10">Belum ada teman. Tambah teman dulu!</p>
          ) : (
            friends.map((friend) => (
              <div 
                key={friend._id} 
                onClick={() => setSelectedFriend(friend)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                  selectedFriend?._id === friend._id 
                  ? 'bg-indigo-50 border border-indigo-100 shadow-sm' 
                  : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="h-12 w-12 bg-indigo-100 text-[#5D5FEF] rounded-full flex items-center justify-center font-bold uppercase shrink-0">
                  {friend.username.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className={`font-bold truncate ${selectedFriend?._id === friend._id ? 'text-[#5D5FEF]' : 'text-gray-800'}`}>
                    {friend.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{friend.lastMessage}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-[#efeae2]">
        {selectedFriend ? (
          <ChatRoom currentUser={currentUser} friend={selectedFriend} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <MessageSquare size={40} className="text-gray-300" />
            </div>
            <p className="font-medium">Pilih teman untuk mulai mengobrol</p>
          </div>
        )}
      </main>
    </div>
  );
}