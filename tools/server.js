import { rmSync } from 'node:fs';
import { createServer } from 'node:http';
import config, { port as _port, controlSocketPath } from './lib/config';
import { createGameConnection } from './lib/game-connection';
import { createFileSync } from './lib/file-sync';

let fileSync;
const connection = createGameConnection({
  port: _port,
  onConnect: () => fileSync?.syncOnConnect(),
});
fileSync = createFileSync({ connection, ...config });

// A Unix socket (rather than a TCP port) keeps the control channel unreachable from browser pages.
const controlServer = createServer((request, response) => {
  const chunks = [];
  request.on('data', (chunk) => chunks.push(chunk));
  request.on('end', async () => {
    const reply = (status, body) => {
      response.writeHead(status, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(body));
    };
    try {
      const { method, params } = JSON.parse(Buffer.concat(chunks).toString() || '{}');
      if (typeof method !== 'string') return reply(400, { error: 'Missing "method"' });
      reply(200, { result: await connection.call(method, params) });
    } catch (error) {
      reply(500, { error: error.message });
    }
  });
});

controlServer.on('error', (error) => {
  console.error(`Control socket error: ${error.message}`);
  process.exit(1);
});

function shutdown() {
  console.log('Shutting down');
  fileSync.close();
  connection.close();
  controlServer.close();
  process.exit();
}

connection.server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${_port} is in use; is another server running?` : error.message);
  process.exit(1);
});

// Linux caps Unix socket paths at 107 bytes and silently truncates longer ones.
if (Buffer.byteLength(controlSocketPath) > 107) {
  console.error(`Control socket path is too long (${controlSocketPath}); set a shorter "controlSocket" in bitburner.json`);
  process.exit(1);
}

// A leftover socket from a crashed run would block listen; we own this path.
rmSync(controlSocketPath, { force: true });
controlServer.listen(controlSocketPath, () => {
  console.log(`Server ready: game on ws://localhost:${_port}, control on ${controlSocketPath}`);
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
