'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Search, UserPlus, Check, X, Users, User as UserIcon, UserMinus } from 'lucide-react';

export default function FriendPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [myFriends, setMyFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (res.ok && data.user) {
          setCurrentUser(data.user);
          fetchFriendsAndRequests(data.user._id || data.user.id);
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

  const handleUnfriend = async (friendId: string) => {
    if (!confirm("Are you sure you want to unfriend this user?")) return;

    try {
      const res = await fetch('/api/friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: "unfriend", 
          userId: currentUser.id, 
          friendId 
        })
      });

      if (res.ok) {
        // Refresh data setelah berhasil
        fetchFriendsAndRequests(currentUser.id);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to unfriend");
      }
    } catch (error) {
      console.error("Unfriend error:", error);
    }
  };

  const fetchFriendsAndRequests = async (userId: string) => {
    try {
      const res = await fetch(`/api/friend?userId=${userId}`, {credentials: 'include'});
      const data = await res.json();
      if (res.ok) {
        setMyFriends(data.friends);
        setPendingRequests(data.pendingRequests);
      }
    } catch (error) {
      console.error("Failed to fetch friends data");
    }
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
          currentUserId: currentUser.id
        })
      });
      const data = await res.json();
      if (res.ok) setSearchResults(data.results);
    } catch (error) {
      console.error("Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async (receiverId: string) => {
    try {
      const res = await fetch('/api/friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "send_request",
          senderId: currentUser.id,
          receiverId: receiverId
        })
      });
      const data = await res.json();
      alert(data.message);
    } catch (error) {
      alert("Failed to send request");
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      const res = await fetch('/api/friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "accept_request", requestId })
      });
      if (res.ok) {
        fetchFriendsAndRequests(currentUser.id);
      }
    } catch (error) {
      console.error("Failed to accept");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const res = await fetch('/api/friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "reject_request", requestId })
      });
      if (res.ok) {
        fetchFriendsAndRequests(currentUser.id);
      }
    } catch (error) {
      console.error("Failed to reject");
    }
  };

  if (!currentUser) return <div className="p-8 text-center">Please login first...</div>;

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar activeTab="friends" />

      <main className="flex-1 flex flex-col p-8 overflow-y-auto w-full max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-gray-800 mb-8">Friends & Requests</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <section className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Search className="text-[#5D5FEF]" size={24} />
                Find New Friends
              </h2>
              
              <div className="flex gap-2 mb-6 text-gray-600">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type username or email..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button 
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="px-6 py-3 bg-[#5D5FEF] text-white font-bold rounded-xl hover:bg-indigo-600 transition active:scale-95"
                >
                  {isLoading ? '...' : 'Search'}
                </button>
              </div>

              <div className="space-y-3">
                {searchResults.map((user) => {
                  const isAlreadyFriend = myFriends.some(f => f._id === user._id);
                  
                  return (
                    <div key={user._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-100 text-[#5D5FEF] rounded-full flex items-center justify-center font-bold uppercase">
                          {user.username.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{user.username}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      
                      {!isAlreadyFriend ? (
                        <button 
                          onClick={() => handleAddFriend(user._id)}
                          className="p-2 bg-indigo-50 text-[#5D5FEF] rounded-lg hover:bg-[#5D5FEF] hover:text-white transition" 
                          title="Add Friend"
                        >
                          <UserPlus size={20} />
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-green-500">Friend</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-6">
            
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <UserIcon className="text-rose-500" size={24} />
                Incoming Requests
                {pendingRequests.length > 0 && (
                  <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </h2>
              
              {pendingRequests.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No pending requests.</p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div key={req._id} className="flex items-center justify-between p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                      <div>
                        <p className="font-bold text-gray-800">{req.sender?.username}</p>
                        <p className="text-xs text-gray-500">Wants to be your friend</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleReject(req._id)}
                          className="p-2 bg-white text-gray-400 rounded-lg shadow-sm hover:text-rose-500 transition"
                        >
                          <X size={20} />
                        </button>
                        <button 
                          onClick={() => handleAccept(req._id)}
                          className="p-2 bg-[#5D5FEF] text-white rounded-lg shadow-sm hover:bg-indigo-600 transition"
                        >
                          <Check size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex-1">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="text-green-500" size={24} />
                My Friends
              </h2>
              
              {myFriends.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">You haven't added any friends yet.</p>
              ) : (
                <div className="space-y-3">
                  {myFriends.map((friend) => (
                    <div key={friend._id} className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 rounded-xl transition cursor-pointer">
                      <div className='flex flex-row justify-between items-center gap-3'>
                        <div className="h-10 w-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold uppercase">
                          {friend.username.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{friend.username}</p>
                          <p className="text-xs text-gray-500">{friend.email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleUnfriend(friend._id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Unfriend"
                      >
                        <UserMinus size={18} />
                      </button>
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