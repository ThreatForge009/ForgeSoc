let io = null;

const init = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    socket.on('disconnect', () => console.log(`🔌 Client disconnected: ${socket.id}`));
  });

  return io;
};

// Broadcast helpers. Safe no-ops if socket.io hasn't been initialized
// (e.g. when running the seed script standalone).
const emitNewAlert = (alert) => io && io.emit('alert:new', alert);
const emitNewEvent = (event) => io && io.emit('event:new', event);
const emitIpBlocked = (blockedIp) => io && io.emit('ip:blocked', blockedIp);
const emitIpUnblocked = (blockedIp) => io && io.emit('ip:unblocked', blockedIp);
const emitIncidentCreated = (incident) => io && io.emit('incident:new', incident);

module.exports = {
  init,
  emitNewAlert,
  emitNewEvent,
  emitIpBlocked,
  emitIpUnblocked,
  emitIncidentCreated,
};
