import connectDB from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";
import Message from "@/lib/models/Message";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { action } = body;

    if (action === "create_group") {
      const { name, members, adminId } = body;
      
      if (!name || members.length < 2) {
        return NextResponse.json({ message: "Nama grup dan minimal 2 teman dibutuhkan" }, { status: 400 });
      }

      const allParticipants = [...members, adminId];
      
      const newGroup = await Conversation.create({
        isGroup: true,
        groupName: name,
        groupAdmin: adminId,
        participants: allParticipants,
        lastMessage: "Grup telah dibuat."
      });

      return NextResponse.json({ message: "Grup berhasil dibuat!", conversation: newGroup }, { status: 201 });
    }

    if (action === "get_chat") {
      const { conversationId, senderId, receiverId } = body;

      let conversation;

      if (conversationId) {
        conversation = await Conversation.findById(conversationId);
      } 
      else if (senderId && receiverId) {
        conversation = await Conversation.findOne({
          isGroup: false, 
          participants: { $all: [senderId, receiverId] }
        });

        if (!conversation) {
          conversation = await Conversation.create({
            isGroup: false,
            participants: [senderId, receiverId],
          });
        }
      }

      if (!conversation) return NextResponse.json({ message: "Percakapan tidak ditemukan" }, { status: 404 });

      const messages = await Message.find({ conversationId: conversation._id })
        .populate("sender", "username")
        .sort({ createdAt: 1 });

      return NextResponse.json({ 
        conversationId: conversation._id, 
        messages: messages,
        isGroup: conversation.isGroup,
        groupName: conversation.groupName
      }, { status: 200 });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    const conversations = await Conversation.find({
      participants: userId
    }).sort({ updatedAt: -1 });

    return NextResponse.json({ conversations }, { status: 200 });

  } catch (error) {
    console.error("Fetch Conversations Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}