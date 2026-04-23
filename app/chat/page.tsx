'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatRoom from '@/components/ChatRoom';
import { MessageSquare, Plus, X, Users as UsersIcon } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]); 
  const [myGroups, setMyGroups] = useState<any[]>([]); 
  const [activeChat, setActiveChat] = useState<any>(null); 
  
  // State untuk Notifikasi
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const activeChatRef = useRef(activeChat); 
  const socketRef = useRef<Socket | null>(null);

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // 1. Tarik notifikasi dari LocalStorage saat user berhasil load
  useEffect(() => {
    if (currentUser) {
      const userId = currentUser._id || currentUser.id;
      const savedNotifs = localStorage.getItem(`notifs_${userId}`);
      if (savedNotifs) {
        try {
          setUnreadCounts(JSON.parse(savedNotifs));
        } catch (e) {
          console.error("Gagal membaca notifikasi lama");
        }
      }
    }
  }, [currentUser]);

  // 2. Simpan (Backup) notifikasi ke LocalStorage setiap kali angkanya berubah
  useEffect(() => {
    if (currentUser) {
      const userId = currentUser._id || currentUser.id;
      localStorage.setItem(`notifs_${userId}`, JSON.stringify(unreadCounts));
    }
  }, [unreadCounts, currentUser]);

  // 3. Update referensi chat & Hapus angka merah saat chat dibuka
  useEffect(() => {
    activeChatRef.current = activeChat;
    if (activeChat) {
      setUnreadCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[activeChat._id]; // Hapus angka merah karena sudah dibaca
        return newCounts;
      });
    }
  }, [activeChat]);

  // 4. Inisialisasi Auth & Socket Global
  useEffect(() => {
    const initApp = async () => {
      try {
        const res = await fetch("/api/auth/me", {credentials: 'include'});
        const data = await res.json();
        if (res.ok && data.user) {
          setCurrentUser(data.user);
          const userId = data.user._id || data.user.id;
          fetchFriendsAndGroups(userId);

          const socket = io(window.location.origin, {
            withCredentials: true,
            transports: ['websocket', 'polling']
          });
          socketRef.current = socket;

          socket.on('connect', () => {
            socket.emit('register-user', userId);
          });

          // === LOGIKA WHATSAPP: NOTIF & GESER KE ATAS ===
          socket.on('update-sidebar', (payload) => {
            console.log("🔔 Sinyal notif masuk:", payload);
            const currentActiveId = activeChatRef.current?._id;
            
            // Cari tahu ID lawan bicara (Penting untuk membedakan private dan grup)
            const friendId = payload.participants?.find((id: string) => id !== userId) || payload.senderId;
            const targetId = payload.isGroup ? payload.conversationId : friendId;

            // A. TAMBAH ANGKA MERAH JIKA BUKAN KITA YANG NGIRIM & CHAT SEDANG DITUTUP
            if (payload.senderId !== userId && currentActiveId !== targetId) {
              setUnreadCounts(prev => ({
                ...prev,
                [targetId]: (prev[targetId] || 0) + 1
              }));
            }

            // B. GESER CHAT KE PALING ATAS SECARA INSTAN
            if (payload.isGroup) {
              setMyGroups(prevGroups => {
                const groupIndex = prevGroups.findIndex(g => g._id === payload.conversationId);
                if (groupIndex === -1) return prevGroups;
                
                const updatedGroup = { ...prevGroups[groupIndex], lastMessage: payload.lastMessage, updatedAt: new Date().toISOString() };
                const newArray = [...prevGroups];
                newArray.splice(groupIndex, 1);
                return [updatedGroup, ...newArray]; // Taruh Index 0
              });
            } else {
              setFriends(prevFriends => {
                const friendIndex = prevFriends.findIndex(f => f._id === friendId);
                if (friendIndex === -1) return prevFriends;
                
                const updatedFriend = { ...prevFriends[friendIndex], lastMessage: payload.lastMessage, updatedAt: new Date().toISOString() };
                const newArray = [...prevFriends];
                newArray.splice(friendIndex, 1);
                return [updatedFriend, ...newArray]; // Taruh Index 0
              });
            }
          });

        } else {
          window.location.href = "/auth";
        }
      } catch (error) { console.error("Gagal auth"); }
    };
    initApp();

    return () => { socketRef.current?.disconnect(); };
  }, []);

  // === FUNGSI FETCH YANG TAHAN REFRESH ===
  const fetchFriendsAndGroups = async (userId: string) => {
    try {
      // Ambil daftar teman dasar
      const resFriend = await fetch(`/api/friend?userId=${userId}`, {credentials: 'include'});
      let friendsData = resFriend.ok ? (await resFriend.json()).friends : [];

      // Ambil riwayat chat lengkap (termasuk pesan terakhir)
      const resChat = await fetch(`/api/chat?userId=${userId}`, {credentials: 'include'});
      const chatsData = resChat.ok ? (await resChat.json()).conversations : [];

      // Pisahkan mana yang grup mana yang private
      const groups = chatsData.filter((c: any) => c.isGroup);
      const privateChats = chatsData.filter((c: any) => !c.isGroup);

      // Tempelkan lastMessage dari riwayat chat ke daftar teman
      const enrichedFriends = friendsData.map((friend: any) => {
        const chat = privateChats.find((c: any) => c.participants.includes(friend._id) && c.participants.includes(userId));
        return {
          ...friend,
          lastMessage: chat ? chat.lastMessage : '',
          updatedAt: chat ? chat.updatedAt : '1970-01-01T00:00:00.000Z'
        };
      });

      // Urutkan dari yang paling baru di-chat
      const sortedFriends = enrichedFriends.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      const sortedGroups = groups.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      setFriends(sortedFriends);
      setMyGroups(sortedGroups);
    } catch (error) { console.error("Gagal load data"); }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendsForGroup(prev => 
      prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
    );
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedFriendsForGroup.length < 1) return;
    setIsCreatingGroup(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "create_group",
          name: newGroupName,
          members: selectedFriendsForGroup,
          adminId: currentUser._id || currentUser.id
        })
      });
      if (res.ok) {
        alert("Grup berhasil dibuat!");
        setShowGroupModal(false);
        setNewGroupName('');
        setSelectedFriendsForGroup([]);
        fetchFriendsAndGroups(currentUser._id || currentUser.id);
      }
    } catch (error) { console.error("Gagal bikin grup"); }
    finally { setIsCreatingGroup(false); }
  };

  if (!currentUser) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar activeTab="chats" />

      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm shrink-0">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-2xl font-black text-gray-800">Messages</h2>
          <button 
            onClick={() => setShowGroupModal(true)}
            className="p-2 bg-indigo-50 text-[#5D5FEF] rounded-full hover:bg-[#5D5FEF] hover:text-white transition"
            title="Buat Grup Baru"
          >
            <Plus size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* List Grup */}
          {myGroups.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Grup Saya</h3>
              {myGroups.map((group) => {
                const unread = unreadCounts[group._id] || 0;
                return (
                  <div 
                    key={group._id} 
                    onClick={() => setActiveChat({ type: 'group', ...group })}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                      activeChat?._id === group._id ? 'bg-indigo-50 border border-indigo-100 shadow-sm' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="h-12 w-12 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center font-bold shrink-0">
                      <UsersIcon size={20} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className={`font-bold truncate ${activeChat?._id === group._id ? 'text-[#5D5FEF]' : 'text-gray-800'}`}>
                        {group.groupName}
                      </p>
                      <p className={`text-xs truncate ${unread > 0 ? 'text-gray-800 font-bold' : 'text-gray-500'}`}>
                        {group.lastMessage || 'Mulai obrolan...'}
                      </p>
                    </div>
                    {/* BADGE NOTIFIKASI */}
                    {unread > 0 && (
                      <div className="bg-rose-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shrink-0">
                        {unread}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* List Teman Private */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Teman Private</h3>
            {friends.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-4">Belum ada teman.</p>
            ) : (
              friends.map((friend) => {
                const unread = unreadCounts[friend._id] || 0;
                return (
                  <div 
                    key={friend._id} 
                    onClick={() => setActiveChat({ type: 'private', ...friend })}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                      activeChat?._id === friend._id ? 'bg-indigo-50 border border-indigo-100 shadow-sm' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="h-12 w-12 bg-indigo-100 text-[#5D5FEF] rounded-full flex items-center justify-center font-bold uppercase shrink-0">
                      {friend.username?.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className={`font-bold truncate ${activeChat?._id === friend._id ? 'text-[#5D5FEF]' : 'text-gray-800'}`}>
                        {friend.username}
                      </p>
                      <p className={`text-xs truncate ${unread > 0 ? 'text-gray-800 font-bold' : 'text-gray-500'}`}>
                        {friend.lastMessage}
                      </p>
                    </div>
                    {/* BADGE NOTIFIKASI */}
                    {unread > 0 && (
                      <div className="bg-[#5D5FEF] text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shrink-0">
                        {unread}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-[#efeae2]">
        {activeChat ? (
          <ChatRoom currentUser={currentUser} activeChat={activeChat} /> 
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <MessageSquare size={40} className="text-gray-300" />
            </div>
            <p className="font-medium">Pilih teman atau grup untuk mulai mengobrol</p>
          </div>
        )}
      </main>

      {/* MODAL BIKIN GRUP */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Buat Grup Baru</h2>
              <button onClick={() => setShowGroupModal(false)} className="text-gray-400 hover:text-rose-500"><X size={24}/></button>
            </div>
            
            <input
              type="text"
              placeholder="Nama Grup..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-[#5D5FEF]"
            />

            <p className="text-sm font-bold text-gray-500 mb-2">Pilih Anggota:</p>
            <div className="max-h-48 overflow-y-auto space-y-2 mb-6 border border-gray-100 rounded-xl p-2 bg-gray-50">
              {friends.map(f => (
                <label key={f._id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedFriendsForGroup.includes(f._id)}
                    onChange={() => toggleFriendSelection(f._id)}
                    className="w-5 h-5 rounded text-[#5D5FEF]"
                  />
                  <span className="font-medium">{f.username}</span>
                </label>
              ))}
            </div>

            <button 
              onClick={handleCreateGroup}
              disabled={isCreatingGroup || !newGroupName || selectedFriendsForGroup.length === 0}
              className="w-full py-3 bg-[#5D5FEF] text-white font-bold rounded-xl hover:bg-indigo-600 disabled:opacity-50"
            >
              {isCreatingGroup ? 'Membuat...' : 'Buat Grup'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}