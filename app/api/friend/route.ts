import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import FriendRequest from "@/lib/models/FriendRequest";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    const user = await User.findById(userId).populate("friends", "username email avatar");
    
    const requests = await FriendRequest.find({ receiver: userId, status: "pending" })
      .populate("sender", "username email avatar");

    return NextResponse.json({
      friends: user?.friends || [],
      pendingRequests: requests || []
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { action } = body;

    if (action === "search") {
      const { query, currentUserId } = body;
      
      const users = await User.find({
        _id: { $ne: currentUserId },
        $or: [
          { username: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } }
        ]
      }).select("username email avatar");
      
      return NextResponse.json({ results: users }, { status: 200 });
    }

    if (action === "send_request") {
      const { senderId, receiverId } = body;
      
      const existingReq = await FriendRequest.findOne({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId }
        ],
        status: "pending"
      });
      
      if (existingReq) {
        return NextResponse.json({ message: "Friend request already sent" }, { status: 400 });
      }

      await FriendRequest.create({ sender: senderId, receiver: receiverId, status: "pending" });
      return NextResponse.json({ message: "Friend request sent successfully!" }, { status: 201 });
    }

    if (action === "accept_request") {
      const { requestId } = body;
      const request = await FriendRequest.findById(requestId);
      
      if (!request) return NextResponse.json({ message: "Request not found" }, { status: 404 });

      request.status = "accepted";
      await request.save();

      await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.receiver } });
      await User.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });

      return NextResponse.json({ message: "Friend request accepted!" }, { status: 200 });
    }

    if (action === "reject_request") {
      const { requestId } = body;
      await FriendRequest.findByIdAndUpdate(requestId, { status: "rejected" });
      return NextResponse.json({ message: "Friend request rejected" }, { status: 200 });
    }

    return NextResponse.json({ message: "Invalid action type" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}