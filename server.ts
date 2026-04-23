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
      // DINAMIS: Bisa localhost, bisa IP VPS, bisa domain baru kamu
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
    // 0. Fitur Notifikasi: User join ke room pribadinya sendiri berdasarkan User ID
    // Ini penting supaya kita bisa tembak notifikasi ke user spesifik meskipun dia gak di room chat
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

        // 1. Update Conversation di DB
        const updatedConv = await Conversation.findByIdAndUpdate(
          data.conversationId,
          {
            lastMessage: data.teks,
            updatedAt: new Date()
          },
          { new: true }
        ).populate('participants', '_id');

        // 2. Kirim pesan ke room (untuk yang lagi buka chat)
        io.to(data.conversationId).emit('pesan-baru', {
          id: pesanBaru._id,
          teks: pesanBaru.text,
          senderId: pesanBaru.sender,
          senderName: data.senderName, // Opsional
          waktu: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        // 3. FITUR NOTIFIKASI: Teriak ke semua peserta biar sidebar mereka update
        if (updatedConv && updatedConv.participants) {
          updatedConv.participants.forEach((participant: any) => {
            const pId = participant._id.toString();
            io.to(pId).emit('update-sidebar', {
              conversationId: data.conversationId,
              isGroup: updatedConv.isGroup,
              senderId: data.senderId,
              participants: updatedConv.participants.map((p: any) => p._id.toString()), // BARU: Kirim daftar peserta
              lastMessage: data.teks,
              waktu: new Date()
            });
          });
        }

      } catch (error) {
        console.error('Gagal menyimpan chat:', error);
      }
    });

    // Fitur Friend Request tetap sama
    socket.on('friend-data-updated', (data) => io.emit('refresh-friend-data', data));

    socket.on('disconnect', () => {});
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});