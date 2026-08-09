const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Authenticate socket connections using the same JWT access token as the REST API
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication token missing'));
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Personal room — notificationService emits here for real-time push
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => {
      // no-op: room membership cleans up automatically
    });
  });

  return io;
}

module.exports = initSocket;
