import { resolve } from 'node:path';
import raw from '../../bitburner.json';

const projectRoot = resolve(__dirname, '..', '..');

export default {
  port: raw.port,
  controlSocketPath: path.resolve(projectRoot, raw.controlSocket),
  scriptsFolder: path.resolve(projectRoot, raw.scriptsFolder),
  allowedFiletypes: raw.allowedFiletypes,
  allowDeletingFiles: raw.allowDeletingFiles,
  pushAllOnConnection: raw.pushAllOnConnection,
  definitionFile: raw.definitionFile ? path.resolve(projectRoot, raw.definitionFile) : undefined,
  projectRoot,
};
