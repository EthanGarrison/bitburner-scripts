import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..', '..');
const raw = JSON.parse(readFileSync(resolve(projectRoot, 'bitburner.json'), 'utf8'));

const config = {
  port: raw.port,
  controlSocketPath: resolve(projectRoot, raw.controlSocket),
  scriptsFolder: resolve(projectRoot, raw.scriptsFolder),
  allowedFiletypes: raw.allowedFiletypes,
  allowDeletingFiles: raw.allowDeletingFiles,
  pushAllOnConnection: raw.pushAllOnConnection,
  definitionFile: raw.definitionFile ? resolve(projectRoot, raw.definitionFile) : undefined,
  projectRoot,
};

export const { port, controlSocketPath } = config;
export default config;
