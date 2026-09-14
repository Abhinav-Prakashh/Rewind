import { allowedPath, safeText, MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES, MAX_WIRE_BYTES } from './snapshotPolicy';
import type { RepositorySnapshot, SnapshotFile } from './snapshotPolicy';
interface Directory { kind: 'directory'; name: string; values(): AsyncIterable<Directory | {kind: 'file'; name: string; getFile(): Promise<File>}> }
export type PickerWindow = Window & { showDirectoryPicker?: (options: {mode: 'read'}) => Promise<Directory> };
export async function readSnapshot(source: Directory | FileList): Promise<{ snapshot: RepositorySnapshot; skipped: number }> {
  const files: SnapshotFile[] = [];
  let total = 0, skipped = 0, visited = 0;
  const name = 'name' in source ? source.name : source[0]?.webkitRelativePath.split('/')[0];
  if (!name) throw new Error('Select a repository folder containing text/code files.');
  async function add(path: string, getFile: () => Promise<File>) {
    if (++visited > 20000) throw new Error('Folder is too large to scan. Select a smaller repository.');
    if (!allowedPath(path)) { skipped++; return; }
    const file = await getFile();
    if (file.size > MAX_FILE_BYTES) { skipped++; return; }
    let content: string;
    try { content = new TextDecoder('utf-8', {fatal: true}).decode(await file.arrayBuffer()); }
    catch { skipped++; return; }
    if (!safeText(content)) { skipped++; return; }
    const size = new TextEncoder().encode(content).length;
    total += size;
    if (files.length >= MAX_FILES || total > MAX_TOTAL_BYTES) throw new Error('Snapshot exceeds 1,000 files or 4 MiB. Select a smaller folder. Nothing was uploaded.');
    files.push({ path, content, size, lastModified: file.lastModified });
  }
  async function walk(dir: Directory, prefix = ''): Promise<void> {
    for await (const entry of dir.values()) {
      const path = prefix + entry.name;
      if (entry.kind === 'directory') {
        if (++visited > 20000) throw new Error('Folder is too large to scan.');
        if (allowedPath(path, true)) await walk(entry, path + '/'); else skipped++;
      } else await add(path, () => entry.getFile());
    }
  }
  if ('kind' in source) await walk(source);
  else for (const file of Array.from(source)) await add(file.webkitRelativePath.split('/').slice(1).join('/'), async () => file);
  if (!files.length) throw new Error('No eligible UTF-8 text/code files found.');
  files.sort((a,b) => a.path.localeCompare(b.path));
  const snapshot = { name, files };
  if (new TextEncoder().encode(JSON.stringify(snapshot)).length > MAX_WIRE_BYTES) throw new Error('Encoded snapshot exceeds 6 MiB. Select a smaller folder.');
  return { snapshot, skipped };
}
