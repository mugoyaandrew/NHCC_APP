let ioInstance = null;

function initSocket(server) {
  const { Server } = require('socket.io');
  ioInstance = new Server(server, {
    cors: { origin: process.env.CLIENT_ORIGIN || '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
    connectionStateRecovery: { maxDisconnectionDuration: 120000 },
  });

  ioInstance.on('connection', (socket) => {
    const { userId, department, site } = socket.handshake.auth || {};
    if (userId) socket.join(`user:${userId}`);
    if (department) socket.join(`department:${department}`);
    if (site) socket.join(`site:${site}`);

    socket.on('project:join', (projectId, ack) => {
      socket.join(`project:${projectId}`);
      if (ack) ack({ ok: true });
    });

    socket.on('message:send', (payload, ack) => {
      ioInstance.emit('message:new', payload);
      if (ack) ack({ ok: true });
    });
  });

  return ioInstance;
}

function getIo() {
  return ioInstance;
}

function broadcastCrudEvent(resource, action, payload, user) {
  if (!ioInstance) return;
  const event = `entity:${action}`;
  ioInstance.emit(event, { table: resource, action, payload, actor: user?.id || null, timestamp: new Date().toISOString() });
}

function broadcastFileShared(document, user) {
  if (!ioInstance) return;
  ioInstance.emit('file:shared', { document, actor: user?.id || null, timestamp: new Date().toISOString() });
}

module.exports = { initSocket, getIo, broadcastCrudEvent, broadcastFileShared };
