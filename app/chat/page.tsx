import Image from "next/image";
import ChatRoom from '../../components/ChatRoom';
import Sidebar from "@/components/Sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full font-sans bg-white">
      <Sidebar activeTab="chats" />
      <main className="flex-1 bg-white relative overflow-y-auto">
        <ChatRoom/>
      </main>
    </div>
  );
}