import { useRef, useState } from 'react';
import { readSnapshot } from '../lib/snapshot';
import type { PickerWindow } from '../lib/snapshot';
import type { RepositorySnapshot } from '../lib/snapshotPolicy';
export function SnapshotPicker({ onUpload, label = 'Upload & index snapshot' }: { onUpload: (snapshot: RepositorySnapshot) => Promise<unknown>; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selection, setSelection] = useState<Awaited<ReturnType<typeof readSnapshot>> | null>(null);
  async function read(source: Parameters<typeof readSnapshot>[0]) {
    setBusy(true); setError(''); setSelection(null);
    try { setSelection(await readSnapshot(source)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to read folder. Try selecting it again.'); }
    finally { setBusy(false); }
  }
  async function choose() {
    setError('');
    const picker = (window as PickerWindow).showDirectoryPicker;
    if (!picker) { input.current?.click(); return; }
    try {
      // Invoke directly from the click, before any network or asynchronous work.
      const directory = await picker.call(window, {mode:'read'});
      await read(directory);
    } catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) setError('Folder access was denied. Try the alternative folder picker below.'); }
  }
  return <div className="space-y-3">
    <p className="text-sm text-muted">Select your repository folder. Rewind reads eligible text/code files in your browser and uploads them to your account for storage and AI answers. Git history and live watching are unavailable for snapshots; upload again after editing.</p>
    <p className="text-xs text-muted">Hidden files/folders (including .git and .env), dependencies, build output, binaries, common secret files and detected credentials are excluded. Up to 1,000 files, 256 KiB each, 4 MiB total. Review the file list before uploading; automatic filtering cannot detect every secret.</p>
    <input ref={input} type="file" multiple {...{webkitdirectory: ''}} hidden onChange={e => { if (e.target.files?.length) void read(e.target.files); e.target.value = ''; }} />
    <button type="button" disabled={busy} onClick={() => void choose()} className="px-4 py-2 rounded-xl bg-ink text-white disabled:opacity-50">{busy ? 'Processing…' : 'Choose repository folder'}</button>
    <button type="button" disabled={busy} onClick={() => input.current?.click()} className="ml-3 text-xs underline">Alternative folder picker</button>
    {selection && <div className="space-y-2">
      <p className="text-sm">{selection.snapshot.name}: {selection.snapshot.files.length} files · {(selection.snapshot.files.reduce((n,f) => n + f.size,0)/1024).toFixed(0)} KiB · {selection.skipped} excluded entries</p>
      <details><summary className="cursor-pointer text-sm">Review files to upload</summary><ul className="max-h-48 overflow-auto text-xs font-mono">{selection.snapshot.files.map(f => <li key={f.path}>{f.path} ({f.size} bytes)</li>)}</ul></details>
      <button type="button" disabled={busy} className="px-4 py-2 rounded-xl bg-ink text-white disabled:opacity-50" onClick={async () => {
        setBusy(true); setError('');
        try { await onUpload(selection.snapshot); setSelection(null); }
        catch(e) { setError(e instanceof Error ? e.message : 'Upload failed. Retry your selection.'); }
        finally { setBusy(false); }
      }}>{busy ? 'Uploading…' : label}</button>
      <button type="button" disabled={busy} className="ml-3 text-xs underline" onClick={() => setSelection(null)}>Discard selection</button>
    </div>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
}
