'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { io, Socket } from 'socket.io-client';
import { Search, UserPlus, Check, X, Users, User as UserIcon, UserMinus } from 'lucide-react';

export default function FriendPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [myFriends, setMyFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // STATE UNTUK SENT REQUEST (Disimpan di LocalStorage biar tahan Refresh)
  const [sentRequestsList, setSentRequestsList] = useState<any[]>([]); 
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [unfriendModal, setUnfriendModal] = useState<{ id: string; name: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000); 
  };

  // 1. TARIK DATA SENT REQUESTS DARI MEMORI SAAT PERTAMA LOAD
  useEffect(() => {
    if (currentUser) {
      const userId = currentUser._id || currentUser.id;
      const savedSentReqs = localStorage.getItem(`sent_reqs_${userId}`);
      if (savedSentReqs) {
        try { setSentRequestsList(JSON.parse(savedSentReqs)); } 
        catch (e) { console.error("Gagal baca sent requests"); }
      }
    }
  }, [currentUser]);

  // 2. SIMPAN KE MEMORI SETIAP ADA PERUBAHAN
  useEffect(() => {
    if (currentUser) {
      const userId = currentUser._id || currentUser.id;
      localStorage.setItem(`sent_reqs_${userId}`, JSON.stringify(sentRequestsList));
    }
  }, [sentRequestsList, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const myId = currentUser._id || currentUser.id;

    const socket = io(window.location.origin, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('refresh-friend-data', (data) => {
      if (data.senderId === myId || data.receiverId === myId) {
        fetchFriendsAndRequests(myId);
      }
    });

    return () => { socket.disconnect(); };
  }, [currentUser]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: 'include' });
        const data = await res.json();
        if (res.ok && data.user) {
          setCurrentUser(data.user);
          fetchFriendsAndRequests(data.user._id || data.user.id);
        } else {
          window.location.href = "/auth";
        }
      } catch (error) {
        console.error("Gagal verifikasi auth");
      }
    };
    checkAuth();
  }, []);

  const fetchFriendsAndRequests = async (userId: string) => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/friend?userId=${userId}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setMyFriends(data.friends || []);
        setPendingRequests(data.pendingRequests || []);

        // AUTO-CLEANUP: Hapus dari Sent Requests kalau ternyata udah jadi teman
        setSentRequestsList(prev => {
          return prev.filter(req => !(data.friends || []).some((f: any) => f._id === req._id));
        });
      }
    } catch (error) { console.error("Failed to fetch friends data"); }
  };

  const emitUpdate = (otherId: string) => {
    const myId = currentUser._id || currentUser.id;
    socketRef.current?.emit('friend-data-updated', { senderId: myId, receiverId: otherId });
  };

  // KIRIM SELURUH OBJECT USER, BUKAN CUMA ID
  const handleAddFriend = async (userObj: any) => {
    try {
      const res = await fetch('/api/friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "send_request",
          senderId: currentUser._id || currentUser.id,
          receiverId: userObj._id
        }),
        credentials: 'include'
      });
      if (res.ok) {
        emitUpdate(userObj._id);
        setSentRequestsList(prev => [...prev, userObj]); // Masukkan ke state (dan otomatis ke LocalStorage)
        showToast("Permintaan pertemanan terkirim!");
      } else { showToast("Gagal mengirim permintaan. Mungkin sudah terkirim?", "error"); }
    } catch (error) { showToast("Terjadi kesalahan sistem", "error"); }
  };

  const handleAccept = async (requestId: string, senderId: string, senderName: string) => {
    try {
      const res = await fetch('/api/friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "accept_request", requestId }),
        credentials: 'include'
      });
      if (res.ok) {
        emitUpdate(senderId);
        fetchFriendsAndRequests(currentUser._id || currentUser.id);
        showToast(`Kamu sekarang berteman dengan ${senderName}!`);
      }
    } catch (error) { showToast("Gagal menerima pertemanan", "error"); }
  };

  const handleReject = async (requestId: string, senderId: string) => {
    try {
      const res = await fetch('/api/friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "reject_request", requestId }),
        credentials: 'include'
      });
      if (res.ok) {
        emitUpdate(senderId);
        fetchFriendsAndRequests(currentUser._id || currentUser.id);
        showToast("Permintaan pertemanan ditolak");
      }
    } catch (error) { showToast("Gagal menolak pertemanan", "error"); }
  };

  const confirmUnfriend = (friendId: string, friendName: string) => {
    setUnfriendModal({ id: friendId, name: friendName });
  };

  const executeUnfriend = async () => {
    if (!unfriendModal) return;
    try {
      const res = await fetch('/api/friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "unfriend", userId: currentUser._id || currentUser.id, friendId: unfriendModal.id }),
        credentials: 'include'
      });
      if (res.ok) {
        emitUpdate(unfriendModal.id);
        fetchFriendsAndRequests(currentUser._id || currentUser.id);
        showToast(`${unfriendModal.name} telah dihapus dari teman`);
      } else { showToast("Gagal menghapus teman", "error"); }
    } catch (error) { showToast("Terjadi kesalahan", "error"); } 
    finally { setUnfriendModal(null); }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentUser) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "search",
          query: searchQuery,
          currentUserId: currentUser._id || currentUser.id
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) setSearchResults(data.results);
    } catch (error) { showToast("Pencarian gagal", "error"); }
    finally { setIsLoading(false); }
  };

  if (!currentUser) return <div className="p-8 text-center">Authenticating...</div>;

  return (
    <div className="flex flex-col-reverse md:flex-row h-screen bg-gray-50 font-sans overflow-hidden relative">
      
      {toast && (
        <div className={`absolute top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300 ${toast.type === 'success' ? 'bg-[#5D5FEF] text-white' : 'bg-rose-500 text-white'}`}>
          {toast.type === 'success' ? <Check size={20} /> : <X size={20} />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      {unfriendModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center"><UserMinus size={32} /></div>
            </div>
            <h3 className="text-xl font-black text-center text-gray-800 mb-2">Hapus Teman?</h3>
            <p className="text-center text-gray-500 text-sm mb-6">Apakah kamu yakin ingin menghapus <strong className="text-gray-800">{unfriendModal.name}</strong> dari daftar temanmu?</p>
            <div className="flex gap-3">
              <button onClick={() => setUnfriendModal(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition">Batal</button>
              <button onClick={executeUnfriend} className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition">Yakin, Hapus</button>
            </div>
          </div>
        </div>
      )}

      <div className="shrink-0 z-50">
        <Sidebar activeTab="friends" />
      </div>

      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto w-full max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-black text-gray-800 mb-6 md:mb-8">Friends & Requests</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          
          {/* KOLOM KIRI: PENCARIAN */}
          <section className="flex flex-col gap-6">
            <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Search className="text-[#5D5FEF]" size={24} />Find New Friends</h2>
              
              <div className="flex flex-col sm:flex-row gap-2 mb-6">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Username or email..." className="flex-1 px-4 py-3 bg-gray-50 text-gray-600 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/50" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                <button onClick={handleSearch} disabled={isLoading} className="px-6 py-3 bg-[#5D5FEF] text-white font-bold rounded-xl transition active:scale-95 disabled:opacity-50">{isLoading ? '...' : 'Search'}</button>
              </div>

              <div className="space-y-3">
                {searchResults.map((user) => {
                  const isAlreadyFriend = myFriends.some(f => f._id === user._id);
                  const isPendingSent = sentRequestsList.some(r => r._id === user._id); 
                  
                  // CEK JIKA DIA YANG ADD KITA DULUAN
                  const isIncomingRequest = pendingRequests.some(req => req.sender?._id === user._id); 

                  return (
                    <div key={user._id} className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-10 w-10 bg-indigo-100 text-[#5D5FEF] rounded-full flex items-center justify-center font-bold uppercase shrink-0">{user.username.charAt(0)}</div>
                        <div className="overflow-hidden"><p className="font-bold text-gray-800 truncate">{user.username}</p><p className="text-xs text-gray-500 truncate">{user.email}</p></div>
                      </div>
                      
                      {/* LOGIKA TOMBOL CANGGIH */}
                      {isAlreadyFriend ? (
                        <span className="text-[10px] md:text-xs font-bold text-green-500 bg-green-50 px-3 py-1.5 rounded-full shrink-0">Friend</span>
                      ) : isPendingSent ? (
                        <button disabled className="px-3 md:px-4 py-1.5 bg-gray-200 text-gray-500 font-bold text-[10px] md:text-xs rounded-xl cursor-not-allowed shrink-0">Pending</button>
                      ) : isIncomingRequest ? (
                        <button disabled className="px-3 md:px-4 py-1.5 bg-rose-50 text-rose-500 font-bold text-[10px] md:text-xs rounded-xl cursor-not-allowed shrink-0">Requested You</button>
                      ) : (
                        <button onClick={() => handleAddFriend(user)} className="p-2 bg-indigo-50 text-[#5D5FEF] rounded-xl hover:bg-[#5D5FEF] hover:text-white transition shrink-0"><UserPlus size={20} /></button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* KOLOM KANAN: REQUESTS & FRIENDS */}
          <section className="flex flex-col gap-6">
            
            <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
                <UserIcon className="text-rose-500" size={24} />Friend Requests
                {pendingRequests.length > 0 && <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">{pendingRequests.length}</span>}
              </h2>
              
              {/* REQUEST MASUK */}
              <div className="mb-6">
                <h3 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Incoming</h3>
                {pendingRequests.length === 0 ? (
                  <p className="text-gray-400 text-sm py-2 italic">No incoming requests.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((req) => (
                      <div key={req._id} className="flex items-center justify-between p-3 bg-rose-50/50 rounded-2xl border border-rose-100">
                        <div className="overflow-hidden"><p className="font-bold text-gray-800 truncate">{req.sender?.username}</p><p className="text-[10px] text-gray-500 truncate">Wants to be your friend</p></div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => handleReject(req._id, req.sender?._id)} className="p-1.5 md:p-2 bg-white text-gray-400 rounded-lg shadow-sm hover:text-rose-500 transition"><X size={18} /></button>
                          <button onClick={() => handleAccept(req._id, req.sender?._id, req.sender?.username)} className="p-1.5 md:p-2 bg-[#5D5FEF] text-white rounded-lg shadow-sm hover:bg-indigo-600 transition"><Check size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* REQUEST KELUAR (YANG KITA ADD) */}
              <div>
                <h3 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sent Requests</h3>
                {sentRequestsList.length === 0 ? (
                  <p className="text-gray-400 text-sm py-2 italic">No sent requests.</p>
                ) : (
                  <div className="space-y-3">
                    {sentRequestsList.map((user) => (
                      <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="h-8 w-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center font-bold uppercase text-xs shrink-0">{user.username.charAt(0)}</div>
                          <p className="font-bold text-gray-800 text-sm truncate">{user.username}</p>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-200 px-2 py-1 rounded-lg shrink-0">Pending</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 flex-1">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Users className="text-green-500" size={24} />My Friends</h2>
              {myFriends.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4 italic">You haven't added any friends yet.</p>
              ) : (
                <div className="space-y-3">
                  {myFriends.map((friend) => (
                    <div key={friend._id} className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 rounded-xl transition-all">
                      <div className='flex flex-row items-center gap-3 overflow-hidden'>
                        <div className="h-10 w-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold uppercase shrink-0">{friend.username?.charAt(0)}</div>
                        <div className="overflow-hidden"><p className="font-bold text-gray-800 truncate">{friend.username}</p><p className="text-xs text-gray-500 truncate">{friend.email}</p></div>
                      </div>
                      <button onClick={() => confirmUnfriend(friend._id, friend.username)} className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition shrink-0"><UserMinus size={18} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}