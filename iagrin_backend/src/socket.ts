import { Server } from 'socket.io';
import http from 'http';

export function setupSocket(server: http.Server) {
  const io = new Server(server, {
    cors: {
      origin: '*', // For development
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });

    // In a real app we'd authenticate the socket connection
  });

  return io;
}
