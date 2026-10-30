const fs = require('node:fs');
const path = require('node:path');

const homeServer = 'home';
const debounceMs = 50;

/** Mirrors `scriptsFolder` into the game's home server through the given connection. */
function createFileSync({ connection, scriptsFolder, allowedFiletypes, allowDeletingFiles, pushAllOnConnection, definitionFile }) {
  // Changes made while the game is disconnected, flushed on the next connection
  const pendingPaths = new Set();
  const debounceTimers = new Map();

  const isAllowed = (relativePath) => allowedFiletypes.some((extension) => relativePath.endsWith(extension));
  const toRemoteName = (relativePath) => '/' + relativePath.split(path.sep).join('/');
  const toRelativePath = (remoteName) => path.normalize(remoteName.replace(/^\//, ''));

  function listLocalFiles() {
    return fs
      .readdirSync(scriptsFolder, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => path.relative(scriptsFolder, path.join(entry.parentPath ?? entry.path, entry.name)))
      .filter(isAllowed);
  }

  async function pushFile(relativePath) {
    const content = fs.readFileSync(path.join(scriptsFolder, relativePath), 'utf8');
    await connection.call('pushFile', { server: homeServer, filename: toRemoteName(relativePath), content });
    console.log(`${toRemoteName(relativePath)} changed`);
  }

  async function deleteFile(relativePath) {
    await connection.call('deleteFile', { server: homeServer, filename: toRemoteName(relativePath) });
    console.log(`${toRemoteName(relativePath)} deleted`);
  }

  async function pushAll(relativePaths) {
    for (const relativePath of relativePaths) {
      try {
        await pushFile(relativePath);
        pendingPaths.delete(relativePath);
      } catch (error) {
        console.error(`Failed to push ${relativePath}: ${error.message}`);
      }
    }
  }

  async function updateDefinitionFile() {
    if (!definitionFile) return;
    try {
      fs.writeFileSync(definitionFile, await connection.call('getDefinitionFile'));
      console.log('Definition file updated');
    } catch (error) {
      console.error(`Failed to update definition file: ${error.message}`);
    }
  }

  async function syncOnConnect() {
    await updateDefinitionFile();
    const localFiles = listLocalFiles();
    if (pushAllOnConnection) return pushAll(localFiles);

    try {
      const remoteFiles = new Set((await connection.call('getFileNames', { server: homeServer })).map(toRelativePath));
      await pushAll(localFiles.filter((file) => pendingPaths.has(file) || !remoteFiles.has(file)));
    } catch (error) {
      console.error(`Failed to sync on connect: ${error.message}`);
    }
  }

  async function syncChange(relativePath) {
    const exists = fs.existsSync(path.join(scriptsFolder, relativePath));
    if (!exists && !allowDeletingFiles) return;
    if (!connection.isConnected()) {
      pendingPaths.add(relativePath);
      return;
    }
    try {
      await (exists ? pushFile(relativePath) : deleteFile(relativePath));
    } catch (error) {
      console.error(`Failed to sync ${relativePath}: ${error.message}`);
      if (exists) pendingPaths.add(relativePath);
    }
  }

  function scheduleSync(relativePath) {
    clearTimeout(debounceTimers.get(relativePath));
    debounceTimers.set(
      relativePath,
      setTimeout(() => {
        debounceTimers.delete(relativePath);
        syncChange(relativePath);
      }, debounceMs),
    );
  }

  // Recursive fs.watch is unreliable on Linux (silently emits nothing on some Node versions), so watch each directory.
  const watchers = new Map();

  function watchDirectory(directory) {
    if (watchers.has(directory)) return;
    watchers.set(
      directory,
      fs.watch(directory, (_eventType, filename) => {
        if (!filename) return;
        const fullPath = path.join(directory, filename);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
          watchDirectory(fullPath);
          for (const file of listLocalFiles()) if (file.startsWith(path.relative(scriptsFolder, fullPath) + path.sep)) scheduleSync(file);
          return;
        }
        const relativePath = path.relative(scriptsFolder, fullPath);
        if (isAllowed(relativePath)) scheduleSync(relativePath);
      }),
    );
  }

  watchDirectory(scriptsFolder);
  for (const entry of fs.readdirSync(scriptsFolder, { recursive: true, withFileTypes: true })) {
    if (entry.isDirectory()) watchDirectory(path.join(entry.parentPath ?? entry.path, entry.name));
  }

  return { syncOnConnect, close: () => watchers.forEach((watcher) => watcher.close()) };
}

module.exports = { createFileSync };
