const { WebSocketServer } = require('ws');

const requestTimeoutMs = 30_000;

/**
 * The game is the WebSocket client; we are the server. Holds at most one game connection
 * and exposes `call` to send a JSON-RPC request and await the matching response.
 */
function createGameConnection({ port, onConnect }) {
  const server = new WebSocketServer({ port });
  const pending = new Map();
  let nextId = 1;
  let activeSocket;

  function rejectAllPending(reason) {
    for (const { reject, timer } of pending.values()) {
      clearTimeout(timer);
      reject(new Error(reason));
    }
    pending.clear();
  }

  function handleMessage(data) {
    let response;
    try {
      response = JSON.parse(data.toString());
    } catch {
      console.warn('Ignoring non-JSON message from game');
      return;
    }
    const request = pending.get(response.id);
    if (!request) {
      console.warn('Ignoring message with unknown id from game:', response.id);
      return;
    }
    pending.delete(response.id);
    clearTimeout(request.timer);
    if (response.error) request.reject(new Error(String(response.error)));
    else request.resolve(response.result);
  }

  server.on('connection', (socket) => {
    activeSocket?.close();
    activeSocket = socket;
    console.log('Game connected');

    socket.on('message', handleMessage);
    socket.on('close', () => {
      if (activeSocket !== socket) return;
      activeSocket = undefined;
      rejectAllPending('Game disconnected');
      console.log('Game disconnected');
    });
    onConnect();
  });

  function call(method, params) {
    if (!activeSocket) return Promise.reject(new Error('Game is not connected'));
    const socket = activeSocket;
    return new Promise((resolve, reject) => {
      const id = nextId++;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`${method} timed out`));
      }, requestTimeoutMs);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }));
    });
  }

  return {
    call,
    isConnected: () => activeSocket !== undefined,
    server,
    close: () => server.close(),
  };
}

module.exports = { createGameConnection };
