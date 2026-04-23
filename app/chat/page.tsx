'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatRoom from '@/components/ChatRoom';
import { MessageSquare, Plus, X, Users as UsersIcon } from 'lucide-react';

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]); 
  const [myGroups, setMyGroups] = useState<any[]>([]); 
  
  // PENTING: Namanya sekarang activeChat, bukan selectedFriend
  const [activeChat, setActiveChat] = useState<any>(null); 
  
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.ok && data.user) {
          setCurrentUser(data.user);
          fetchFriendsAndGroups(data.user._id || data.user.id);
        } else {
          window.location.href = "/auth";
        }
      } catch (error) { console.error("Gagal verifikasi auth"); }
    };
    checkAuth();
  }, []);

  const fetchFriendsAndGroups = async (userId: string) => {
    try {
      const resFriend = await fetch(`/api/friend?userId=${userId}`, {credentials: 'include'});
      if (resFriend.ok) {
        const dataFriend = await resFriend.json();
        setFriends(dataFriend.friends);
      }
      
      const resGroup = await fetch(`/api/chat?userId=${userId}`, {credentials: 'include'});
      if (resGroup.ok) {
        const dataGroup = await resGroup.json();
        setMyGroups(dataGroup.groups);
      }
      
    } catch (error) { 
      console.error("Gagal load data teman dan grup"); 
    }
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
      const data = await res.json();
      if (res.ok) {
        alert("Grup berhasil dibuat!");
        setShowGroupModal(false);
        setNewGroupName('');
        setSelectedFriendsForGroup([]);
        setMyGroups(prev => [data.conversation, ...prev]);
      }
    } catch (error) { console.error("Gagal bikin grup"); }
    finally { setIsCreatingGroup(false); }
  };

  if (!currentUser) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar activeTab="chats" />

      {/* SIDEBAR SELALU MUNCUL (Seperti kodingan awalmu) */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm">
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
              {myGroups.map((group) => (
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
                  <div className="overflow-hidden">
                    <p className={`font-bold truncate ${activeChat?._id === group._id ? 'text-[#5D5FEF]' : 'text-gray-800'}`}>
                      {group.groupName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{group.lastMessage || 'Mulai obrolan...'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List Teman Private */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Teman Private</h3>
            {friends.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-4">Belum ada teman.</p>
            ) : (
              friends.map((friend) => (
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
                  <div className="overflow-hidden">
                    <p className={`font-bold truncate ${activeChat?._id === friend._id ? 'text-[#5D5FEF]' : 'text-gray-800'}`}>
                      {friend.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{friend.lastMessage}</p>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </aside>

      {/* AREA CHAT */}
      <main className="flex-1 flex flex-col bg-[#efeae2]">
        {activeChat ? (
          // PENTING: Harus dikirim sebagai activeChat
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