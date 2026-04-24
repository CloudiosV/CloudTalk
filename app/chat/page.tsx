'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatRoom from '@/components/ChatRoom';
import { MessageSquare, Plus, X, Users as UsersIcon, Check, Search, Menu } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]); 
  const [myGroups, setMyGroups] = useState<any[]>([]); 
  const [activeChat, setActiveChat] = useState<any>(null); 
  
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const activeChatRef = useRef(activeChat); 
  const socketRef = useRef<Socket | null>(null);

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [searchChatQuery, setSearchChatQuery] = useState('');

  // STATE UNTUK MOBILE SIDEBAR
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000); 
  };

  useEffect(() => {
    if (currentUser) {
      const userId = currentUser._id || currentUser.id;
      const savedNotifs = localStorage.getItem(`notifs_${userId}`);
      if (savedNotifs) {
        try { setUnreadCounts(JSON.parse(savedNotifs)); } 
        catch (e) { console.error("Gagal membaca notifikasi lama"); }
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const userId = currentUser._id || currentUser.id;
      localStorage.setItem(`notifs_${userId}`, JSON.stringify(unreadCounts));
    }
  }, [unreadCounts, currentUser]);

  useEffect(() => {
    activeChatRef.current = activeChat;
    if (activeChat) {
      setUnreadCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[activeChat._id]; 
        return newCounts;
      });
    }
  }, [activeChat]);

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

          socket.on('refresh-friend-data', (payload) => {
            if (payload.senderId === userId || payload.receiverId === userId) {
              fetchFriendsAndGroups(userId);
            }
          });

          socket.on('refresh-chat-list', () => {
            fetchFriendsAndGroups(userId);
          });

          socket.on('update-sidebar', (payload) => {
            const currentActiveId = activeChatRef.current?._id;
            const friendId = payload.participants?.find((id: string) => id !== userId) || payload.senderId;
            const targetId = payload.isGroup ? payload.conversationId : friendId;

            if (payload.senderId !== userId && currentActiveId !== targetId) {
              setUnreadCounts(prev => ({
                ...prev,
                [targetId]: (prev[targetId] || 0) + 1
              }));
            }

            if (payload.isGroup) {
              setMyGroups(prevGroups => {
                const groupIndex = prevGroups.findIndex(g => g._id === payload.conversationId);
                if (groupIndex === -1) return prevGroups;
                
                const updatedGroup = { ...prevGroups[groupIndex], lastMessage: payload.lastMessage, updatedAt: new Date().toISOString() };
                const newArray = [...prevGroups];
                newArray.splice(groupIndex, 1);
                return [updatedGroup, ...newArray]; 
              });
            } else {
              setFriends(prevFriends => {
                const friendIndex = prevFriends.findIndex(f => f._id === friendId);
                if (friendIndex === -1) return prevFriends;
                
                const updatedFriend = { ...prevFriends[friendIndex], lastMessage: payload.lastMessage, updatedAt: new Date().toISOString() };
                const newArray = [...prevFriends];
                newArray.splice(friendIndex, 1);
                return [updatedFriend, ...newArray]; 
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

  const fetchFriendsAndGroups = async (userId: string) => {
    try {
      const resFriend = await fetch(`/api/friend?userId=${userId}`, {credentials: 'include'});
      let friendsData = resFriend.ok ? (await resFriend.json()).friends : [];

      const resChat = await fetch(`/api/chat?userId=${userId}`, {credentials: 'include'});
      const chatsData = resChat.ok ? (await resChat.json()).conversations : [];

      const groups = chatsData.filter((c: any) => c.isGroup);
      const privateChats = chatsData.filter((c: any) => !c.isGroup);

      const enrichedFriends = friendsData.map((friend: any) => {
        const chat = privateChats.find((c: any) => c.participants.includes(friend._id) && c.participants.includes(userId));
        return {
          ...friend,
          lastMessage: chat ? chat.lastMessage : '',
          updatedAt: chat ? chat.updatedAt : '1970-01-01T00:00:00.000Z'
        };
      });

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
      const adminId = currentUser._id || currentUser.id;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "create_group",
          name: newGroupName,
          members: selectedFriendsForGroup,
          adminId: adminId
        })
      });
      if (res.ok) {
        showToast("Grup berhasil dibuat!"); 
        setShowGroupModal(false);
        setNewGroupName('');
        
        socketRef.current?.emit('new-group-created', [...selectedFriendsForGroup, adminId]);

        setSelectedFriendsForGroup([]);
        fetchFriendsAndGroups(adminId);
      }
    } catch (error) { showToast("Gagal membuat grup", "error"); }
    finally { setIsCreatingGroup(false); }
  };

  if (!currentUser) return <div className="p-8 text-center">Loading...</div>;

  const filteredGroups = myGroups.filter(group => 
    group.groupName.toLowerCase().includes(searchChatQuery.toLowerCase())
  );
  
  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchChatQuery.toLowerCase())
  );

  // Toggle sidebar untuk mobile
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden relative">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300 ${
          toast.type === 'success' ? 'bg-[#5D5FEF] text-white' : 'bg-rose-500 text-white'
        }`}>
          {toast.type === 'success' ? <Check size={20} /> : <X size={20} />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      {/* SIDEBAR - Desktop selalu tampil, Mobile sebagai overlay */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:z-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar activeTab="chats" onMobileItemClick={() => setIsSidebarOpen(false)} />
      </div>

      {/* OVERLAY untuk mobile saat sidebar terbuka */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        
        {/* MOBILE HEADER dengan hamburger menu */}
        <div className="md:hidden flex items-center gap-3 p-4 bg-white border-b border-gray-100 shadow-sm z-20">
          <button 
            onClick={toggleSidebar}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 active:scale-95"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-[#5D5FEF] font-black text-xl tracking-tighter">CloudTalk</h1>
        </div>

        {/* DAFTAR CHAT & CHAT ROOM */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LIST CHAT - Mobile bisa hidden/show */}
          <div className={`
            w-full md:w-80 bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm transition-all duration-300
            ${activeChat ? 'hidden md:flex' : 'flex'}
          `}>
            <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl md:text-2xl font-black text-gray-800">Messages</h2>
              <button 
                onClick={() => setShowGroupModal(true)}
                className="p-2 bg-indigo-50 text-[#5D5FEF] rounded-full hover:bg-[#5D5FEF] hover:text-white transition-all duration-200 hover:scale-110 active:scale-95"
                title="Buat Grup Baru"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="px-4 md:px-6 pt-4 shrink-0">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200 group-focus-within:text-[#5D5FEF]" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari obrolan..." 
                  value={searchChatQuery}
                  onChange={(e) => setSearchChatQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/50 focus:border-transparent transition-all duration-200 text-sm text-gray-700"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4">
              {filteredGroups.length > 0 && (
                <div>
                  <h3 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Grup Saya</h3>
                  {filteredGroups.map((group) => {
                    const unread = unreadCounts[group._id] || 0;
                    return (
                      <div 
                        key={group._id} 
                        onClick={() => setActiveChat({ type: 'group', ...group })}
                        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                          activeChat?._id === group._id ? 'bg-indigo-50 border border-indigo-100' : ''
                        }`}
                      >
                        <div className="h-10 w-10 md:h-12 md:w-12 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center font-bold shrink-0">
                          <UsersIcon size={20} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className={`font-bold text-sm md:text-base truncate ${activeChat?._id === group._id ? 'text-[#5D5FEF]' : 'text-gray-800'}`}>
                            {group.groupName}
                          </p>
                          <p className={`text-[10px] md:text-xs truncate ${unread > 0 ? 'text-gray-800 font-bold' : 'text-gray-500'}`}>
                            {group.lastMessage || 'Mulai obrolan...'}
                          </p>
                        </div>
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

              <div>
                <h3 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Teman Private</h3>
                {filteredFriends.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center mt-4">Tidak ada teman ditemukan.</p>
                ) : (
                  filteredFriends.map((friend) => {
                    const unread = unreadCounts[friend._id] || 0;
                    return (
                      <div 
                        key={friend._id} 
                        onClick={() => setActiveChat({ type: 'private', ...friend })}
                        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                          activeChat?._id === friend._id ? 'bg-indigo-50 border border-indigo-100' : ''
                        }`}
                      >
                        <div className="h-10 w-10 md:h-12 md:w-12 bg-indigo-100 text-[#5D5FEF] rounded-full flex items-center justify-center font-bold uppercase shrink-0">
                          {friend.username?.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className={`font-bold text-sm md:text-base truncate ${activeChat?._id === friend._id ? 'text-[#5D5FEF]' : 'text-gray-800'}`}>
                            {friend.username}
                          </p>
                          <p className={`text-[10px] md:text-xs truncate ${unread > 0 ? 'text-gray-800 font-bold' : 'text-gray-500'}`}>
                            {friend.lastMessage || 'Mulai obrolan...'}
                          </p>
                        </div>
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
          </div>

          {/* CHAT ROOM */}
          <div className={`flex-1 flex-col bg-[#efeae2] ${activeChat ? 'flex' : 'hidden md:flex'}`}>
            {activeChat ? (
              <ChatRoom 
                currentUser={currentUser} 
                activeChat={activeChat} 
                onBack={() => setActiveChat(null)} 
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <MessageSquare size={40} className="text-gray-500" />
                </div>
                <p className="font-medium text-sm md:text-base">Pilih teman atau grup untuk mulai mengobrol</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL BUAT GRUP */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-600">Buat Grup Baru</h2>
              <button onClick={() => setShowGroupModal(false)} className="text-gray-400 hover:text-rose-500 transition-all duration-200">
                <X size={24}/>
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Nama Grup..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/50 transition-all duration-200" 
            />

            <p className="text-sm font-bold text-gray-500 mb-2">Pilih Anggota:</p>
            <div className="max-h-48 overflow-y-auto space-y-2 mb-6 border border-gray-100 rounded-xl p-2 bg-gray-50">
              {friends.map(f => (
                <label key={f._id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-all duration-200">
                  <input 
                    type="checkbox" 
                    checked={selectedFriendsForGroup.includes(f._id)}
                    onChange={() => toggleFriendSelection(f._id)}
                    className="w-5 h-5 rounded text-[#5D5FEF] focus:ring-[#5D5FEF] focus:ring-2"
                  />
                  <span className="font-medium text-gray-600 text-sm">{f.username}</span> 
                </label>
              ))}
            </div>

            <button 
              onClick={handleCreateGroup}
              disabled={isCreatingGroup || !newGroupName || selectedFriendsForGroup.length === 0}
              className="w-full py-3 bg-[#5D5FEF] text-white font-bold rounded-xl transition-all duration-200 hover:bg-indigo-600 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {isCreatingGroup ? 'Membuat...' : 'Buat Grup'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}