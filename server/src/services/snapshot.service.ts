import { createHash } from 'node:crypto';
import { allowedPath, safeText, MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES, MAX_WIRE_BYTES, RepositorySnapshot } from './snapshotPolicy.js';
export function validateSnapshot(value: unknown): RepositorySnapshot {
  const fail = (): never => { throw new Error('Invalid snapshot: use safe relative paths, UTF-8 code/text, at most 1,000 files, 256 KiB per file and 4 MiB total.'); };
  if (!value || typeof value !== 'object') return fail();
  const v = value as RepositorySnapshot;
  if (typeof v.name !== 'string' || !v.name.trim() || v.name.length > 255 || /[\/\\\x00-\x1f]/.test(v.name) || !Array.isArray(v.files) || !v.files.length || v.files.length > MAX_FILES) return fail();
  if (Buffer.byteLength(JSON.stringify(value)) > MAX_WIRE_BYTES) return fail();
  let total = 0;
  const paths = new Set<string>();
  const files = v.files.map(f => {
    if (!f || typeof f.path !== 'string' || !allowedPath(f.path) || paths.has(f.path.toLowerCase()) || typeof f.content !== 'string' || !safeText(f.content)) return fail();
    paths.add(f.path.toLowerCase());
    const size = Buffer.byteLength(f.content, 'utf8');
    total += size;
    if (size > MAX_FILE_BYTES || total > MAX_TOTAL_BYTES || size !== f.size || !Number.isSafeInteger(f.lastModified) || f.lastModified < 0 || f.lastModified > 8640000000000000) return fail();
    return { path: f.path, content: f.content, size, lastModified: f.lastModified };
  });
  return { name: v.name.trim(), files };
}
export function hashContent(content: string): string { return createHash('sha256').update(content).digest('hex'); }
