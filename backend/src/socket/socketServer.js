const jwt = require('jsonwebtoken');
const { User } = require('../models');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

function initSocketServer(io) {
  io.on('connection', async (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    let userId = socket.handshake.query?.userId;
    let role = socket.handshake.query?.role;
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (token) {
      try {
        const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;
        const decoded = jwt.verify(tokenString, JWT_SECRET);
        const email = decoded.sub;
        const user = await User.findOne({ where: { email } });
        if (user) {
          userId = user.id;
          role = user.role;
        }
      } catch (err) {
        console.error('Socket JWT verification failed:', err.message);
      }
    }

    if (userId) {
      const userRoom = `user_${userId}`;
      socket.join(userRoom);
      console.log(`Socket ${socket.id} joined user room: ${userRoom}`);
    }

    if (role) {
      // support 'admin', 'officer', 'citizen' (ignoring ROLE_ prefix)
      const roleRoom = role.toLowerCase().replace('role_', '');
      socket.join(roleRoom);
      console.log(`Socket ${socket.id} joined role room: ${roleRoom}`);
    }

    // Redundant room join subscription
    socket.on('join_rooms', (data) => {
      if (data.userId) {
        socket.join(`user_${data.userId}`);
        console.log(`Socket ${socket.id} manually joined user room: user_${data.userId}`);
      }
      if (data.role) {
        const roleRoom = data.role.toLowerCase().replace('role_', '');
        socket.join(roleRoom);
        console.log(`Socket ${socket.id} manually joined role room: ${roleRoom}`);
      }
    });

    // Secure chat room operations
    socket.on('join_chat', (data) => {
      if (data.complaintId) {
        socket.join(`chat_${data.complaintId}`);
        console.log(`Socket ${socket.id} joined chat room: chat_${data.complaintId}`);
      }
    });

    socket.on('leave_chat', (data) => {
      if (data.complaintId) {
        socket.leave(`chat_${data.complaintId}`);
        console.log(`Socket ${socket.id} left chat room: chat_${data.complaintId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = initSocketServer;
