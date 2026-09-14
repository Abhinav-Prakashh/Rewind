/* eslint-disable no-control-regex -- Reject binary/control characters at the upload boundary. */
// Keep client/server copies identical; verified by the snapshot tests.
export const MAX_FILES = 1000;
export const MAX_FILE_BYTES = 256 * 1024;
export const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
export const MAX_WIRE_BYTES = 6 * 1024 * 1024;
export interface SnapshotFile { path: string; content: string; size: number; lastModified: number }
export interface RepositorySnapshot { name: string; files: SnapshotFile[] }
const excluded = new Set(['node_modules','dist','build','coverage','vendor','target','out','venv','env','__pycache__','bower_components','tmp','temp']);
const extensions = new Set('ts tsx js jsx mjs cjs py rb go rs java kt kts c h cpp hpp cs swift m mm php vue svelte html css scss sass less json yaml yml toml ini md mdx rst txt sql graphql gql sh bash zsh fish xml gradle properties dart ex exs erl clj cljs scala r lua pl proto prisma tf'.split(' '));
export function allowedPath(path: string, directory = false): boolean {
  if (!path || path.length > 500 || /[\\:\x00-\x1f\x7f]/.test(path)) return false;
  const parts = path.split('/');
  if (parts.length > 20 || parts.some(p => !p || p.startsWith('.') || excluded.has(p.toLowerCase()) || /(?:secret|credential|password|token|private[-_]?key|service[-_]?account|^id_rsa|^id_ed25519|^env(?:[.-]|$))/i.test(p))) return false;
  if (directory) return true;
  const name = parts[parts.length - 1].toLowerCase();
  if (/^(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lock|composer\.lock)$/.test(name) || /\.(min\.(js|css)|map|log|lock)$/.test(name)) return false;
  return extensions.has(name.split('.').pop()!) || ['dockerfile','makefile','license','readme','procfile'].includes(name);
}
export function safeText(content: string): boolean {
  return !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(content) && !/-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:AKIA|ASIA)[A-Z0-9]{16}|gh[pousr]_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9_-]{20,}|(?:api[_-]?key|secret|password|access[_-]?token)\s*[=:]\s*["'][^"'\s]{8,}["']/i.test(content);
}
