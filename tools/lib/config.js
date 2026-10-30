const path = require('node:path');
const raw = require('../../bitburner.json');

const projectRoot = path.resolve(__dirname, '..', '..');

module.exports = {
  port: raw.port,
  controlSocketPath: path.resolve(projectRoot, raw.controlSocket),
  scriptsFolder: path.resolve(projectRoot, raw.scriptsFolder),
  allowedFiletypes: raw.allowedFiletypes,
  allowDeletingFiles: raw.allowDeletingFiles,
  pushAllOnConnection: raw.pushAllOnConnection,
  definitionFile: raw.definitionFile ? path.resolve(projectRoot, raw.definitionFile) : undefined,
  projectRoot,
};
