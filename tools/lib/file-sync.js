import { readdirSync, readFileSync, writeFileSync, existsSync, watch, statSync } from 'node:fs';
import { sep, normalize, relative, join } from 'node:path';

const homeServer = 'home';
const debounceMs = 50;

/** Mirrors `scriptsFolder` into the game's home server through the given connection. */
function createFileSync({ connection, scriptsFolder, allowedFiletypes, allowDeletingFiles, pushAllOnConnection, definitionFile }) {
  // Changes made while the game is disconnected, flushed on the next connection
  const pendingPaths = new Set();
  const debounceTimers = new Map();

  const isAllowed = (relativePath) => allowedFiletypes.some((extension) => relativePath.endsWith(extension));
  const toRemoteName = (relativePath) => '/' + relativePath.split(sep).join('/');
  const toRelativePath = (remoteName) => normalize(remoteName.replace(/^\//, ''));

  function listLocalFiles() {
    return readdirSync(scriptsFolder, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => relative(scriptsFolder, join(entry.parentPath ?? entry.path, entry.name)))
      .filter(isAllowed);
  }

  async function pushFile(relativePath) {
    const content = readFileSync(join(scriptsFolder, relativePath), 'utf8');
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
      writeFileSync(definitionFile, await connection.call('getDefinitionFile'));
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
    const exists = existsSync(join(scriptsFolder, relativePath));
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
      watch(directory, (_eventType, filename) => {
        if (!filename) return;
        const fullPath = join(directory, filename);
        if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
          watchDirectory(fullPath);
          for (const file of listLocalFiles()) if (file.startsWith(relative(scriptsFolder, fullPath) + sep)) scheduleSync(file);
          return;
        }
        const relativePath = relative(scriptsFolder, fullPath);
        if (isAllowed(relativePath)) scheduleSync(relativePath);
      }),
    );
  }

  watchDirectory(scriptsFolder);
  for (const entry of readdirSync(scriptsFolder, { recursive: true, withFileTypes: true })) {
    if (entry.isDirectory()) watchDirectory(join(entry.parentPath ?? entry.path, entry.name));
  }

  return { syncOnConnect, close: () => watchers.forEach((watcher) => watcher.close()) };
}

export default { createFileSync };
