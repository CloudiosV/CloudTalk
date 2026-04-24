import 'dotenv/config';
import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import connectDB from './lib/mongodb';
import Message from './lib/models/Message';
import Conversation from './lib/models/Conversation';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; 
const port = parseInt(process.env.PORT || '3002', 10); 

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  
  const io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:3002", 
        "http://43.157.229.130:3002", 
        "http://cloudtalk.app.turbin.id",
        "https://cloudtalk.app.turbin.id"
      ],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    socket.on('register-user', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} terdaftar untuk notifikasi`);
    });

    socket.on('join-room', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('kirim-pesan', async (data) => {
      try {
        await connectDB();

        const pesanBaru = await Message.create({
          conversationId: data.conversationId,
          sender: data.senderId,
          text: data.teks,
        });

        const updatedConv = await Conversation.findByIdAndUpdate(
          data.conversationId,
          {
            lastMessage: data.teks,
            updatedAt: new Date()
          },
          { new: true }
        ).populate('participants', '_id');

        io.to(data.conversationId).emit('pesan-baru', {
          id: pesanBaru._id,
          teks: pesanBaru.text,
          senderId: pesanBaru.sender,
          senderName: data.senderName, 
          waktu: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        if (updatedConv && updatedConv.participants) {
          updatedConv.participants.forEach((participant: any) => {
            const pId = participant._id.toString();
            io.to(pId).emit('update-sidebar', {
              conversationId: data.conversationId,
              isGroup: updatedConv.isGroup,
              senderId: data.senderId,
              participants: updatedConv.participants.map((p: any) => p._id.toString()), 
              lastMessage: data.teks,
              waktu: new Date()
            });
          });
        }

      } catch (error) {
        console.error('Gagal menyimpan chat:', error);
      }
    });

    socket.on('friend-data-updated', (data) => io.emit('refresh-friend-data', data));

    // BARU: Sinyal real-time ketika grup dibuat
    socket.on('new-group-created', (participants) => {
      if (Array.isArray(participants)) {
        participants.forEach((pId) => {
          io.to(pId).emit('refresh-chat-list'); // Tembak langsung ke ID anggota
        });
      }
    });

    socket.on('disconnect', () => {});
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});