import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import prisma from './lib/prisma';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

io.on('connection', async (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('pixel_change', async (data) => {
    try {
      await prisma.pixel.upsert({
        where: { x_y: { x: data.x, y: data.y } },
        update: { color: data.color },
        create: { x: data.x, y: data.y, color: data.color },
      });
      socket.broadcast.emit('pixel_updated', data);
    } catch (error) {
      console.error('Failed to upsert pixel:', error);
    }
  });
  
  socket.on('pixel_remove', async (data) => {
    try {
      await prisma.pixel.deleteMany({
        where: { x: data.x, y: data.y },
      });
      socket.broadcast.emit('pixel_removed', data);
    } catch (error) {
      console.error('Failed to remove pixel:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  socket.on('request_pixels', async (data) => {
    const { xMin, yMin, xMax, yMax } = data;
    try {
      const pixels = await prisma.pixel.findMany({
        where: {
          x: { gte: xMin, lte: xMax },
          y: { gte: yMin, lte: yMax },
        },
      });
      socket.emit('pixels_loaded', pixels);
    } catch (error) {
      console.error('Failed to fetch pixels for viewport:', error);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
