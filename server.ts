import 'dotenv/config';
import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import connectDB from './lib/mongodb';
import Message from './lib/models/Message';
import Conversation from './lib/models/Conversation';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0'; 
const port = parseInt(process.env.PORT || '3002', 10); 

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: {
      origin: "http://43.157.229.130:3002",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🟢 User terkoneksi: ${socket.id}`);

    // 1. User masuk ke "ruang obrolan" spesifik
    socket.on('join-room', (conversationId) => {
      socket.join(conversationId);
      console.log(`User masuk ke ruangan: ${conversationId}`);
    });

    // 2. Menerima pesan, menyimpan ke DB, lalu memantulkannya
    socket.on('kirim-pesan', async (data) => {
      try {
        await connectDB();

        // Simpan pesan ke tabel Messages
        const pesanBaru = await Message.create({
          conversationId: data.conversationId,
          sender: data.senderId,
          text: data.teks,
        });

        // Kasih tahu tabel Conversations bahwa ada pesan terbaru (buat sidebar nanti)
        await Conversation.findByIdAndUpdate(data.conversationId, {
          lastMessage: data.teks,
          updatedAt: new Date()
        });

        // Pantulkan pesan HANYA ke orang-orang yang ada di ruangan tersebut
        io.to(data.conversationId).emit('pesan-baru', {
          id: pesanBaru._id,
          teks: pesanBaru.text,
          senderId: pesanBaru.sender,
          waktu: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

      } catch (error) {
        console.error('Gagal menyimpan chat:', error);
      }
    });

    socket.on('send-friend-request', (data) => {
      io.emit('new-friend-request', data);
    });

    socket.on('accept-friend-request', (data) => {
      io.emit('friend-request-accepted', data);
    });

    socket.on('disconnect', () => {
      console.log(`🔴 User terputus: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});