import connectDB from "@/lib/mongodb";
import Conversation from "@/lib/models/Conversation";
import Message from "@/lib/models/Message";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { senderId, receiverId } = await req.json();

    if (!senderId || !receiverId) {
      return NextResponse.json({ message: "Data tidak lengkap" }, { status: 400 });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });

    return NextResponse.json({ 
      conversationId: conversation._id, 
      messages: messages 
    }, { status: 200 });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}