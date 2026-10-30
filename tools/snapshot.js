const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { rpc } = require('./rpc');

const outputDirectory = path.resolve(__dirname, '..', '.snapshot');

/** The game stores many sub-objects as JSON strings inside the save JSON; expand them so the file is readable. */
function expandNestedJson(value) {
  if (typeof value === 'string' && /^[[{]/.test(value)) {
    try {
      return expandNestedJson(JSON.parse(value));
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) return value.map(expandNestedJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, expandNestedJson(entry)]));
  }
  return value;
}

/** Binary saves are gzip bytes carried one byte per character; otherwise the save is base64 (optionally gzipped) JSON. */
function decodeSave({ save, binary }) {
  const bytes = Buffer.from(save, binary ? 'latin1' : 'base64');
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
  try {
    return expandNestedJson(JSON.parse((isGzip ? zlib.gunzipSync(bytes) : bytes).toString('utf8')));
  } catch (error) {
    console.warn(`Could not decode save (binary=${binary}): ${error.message}; keeping raw data only`);
    return undefined;
  }
}

function write(name, contents) {
  const file = path.join(outputDirectory, name);
  fs.writeFileSync(file, JSON.stringify(contents, null, 2));
  console.log(`wrote ${path.relative(process.cwd(), file)}`);
}

async function main() {
  fs.mkdirSync(outputDirectory, { recursive: true });
  write('servers.json', await rpc('getAllServers'));

  const saveFile = await rpc('getSaveFile');
  write('save.raw.json', saveFile);
  const decoded = decodeSave(saveFile);
  if (decoded) write('save.json', decoded);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
