const http = require('node:http');
const { controlSocketPath } = require('./lib/config');

/** Sends a Remote API call to the game through the running `npm run watch` server. */
function rpc(method, params) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      { socketPath: controlSocketPath, path: '/rpc', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const { result, error } = JSON.parse(Buffer.concat(chunks).toString());
          if (error) reject(new Error(error));
          else resolve(result);
        });
      },
    );
    request.on('error', (error) =>
      reject(error.code === 'ENOENT' || error.code === 'ECONNREFUSED' ? new Error('Server is not running (npm run watch)') : error),
    );
    request.end(JSON.stringify({ method, params }));
  });
}

async function main() {
  const [method, paramsJson] = process.argv.slice(2);
  if (!method) {
    console.error('Usage: npm run rpc -- <method> [paramsJson]');
    process.exit(1);
  }
  try {
    const result = await rpc(method, paramsJson ? JSON.parse(paramsJson) : undefined);
    console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { rpc };
