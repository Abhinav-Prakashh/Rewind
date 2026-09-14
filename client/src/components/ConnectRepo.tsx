import { useState } from 'react';
import { repoApi } from '../lib/api';
import type { Repository } from '../lib/api';
import type { RepositorySnapshot } from '../lib/snapshotPolicy';
import { SnapshotPicker } from './SnapshotPicker';
interface ConnectRepoProps {
  onConnect: (input: string | RepositorySnapshot) => Promise<void>;
  onSelect: (repo: Repository) => void;
  repos: Repository[];
  error: string | null;
}
export function ConnectRepo({onConnect,onSelect,repos,error}: ConnectRepoProps) {
  const [path,setPath] = useState('');
  const [busy,setBusy] = useState(false);
  const [localError,setLocalError] = useState('');
  return <div className="min-h-screen bg-app-bg p-6 flex items-center justify-center"><main className="w-full max-w-xl space-y-6">
    <header><p className="font-mono text-xs uppercase text-muted">Rewind</p><h1 className="text-4xl text-ink mt-3">Pick Up Where You Left Off</h1></header>
    {repos.length > 0 && <section className="bg-surface p-5 rounded-3xl border border-border space-y-2"><h2 className="font-semibold">Recent workspaces</h2>{repos.map(repo => <button key={repo.id} onClick={() => onSelect(repo)} className="block w-full text-left p-3 rounded-xl border border-border"><strong>{repo.name}</strong><span className="block text-xs text-muted">{repo.source === 'snapshot' ? 'Browser snapshot' : 'Local repository'}{repo.snapshot_at ? ` · uploaded ${new Date(repo.snapshot_at).toLocaleString()}` : ''}</span></button>) }<p className="text-xs text-muted">To remove an uploaded snapshot and its stored history:</p><select aria-label="Repository to remove" defaultValue="" onChange={async e => { const id = e.target.value; if (!id) return; if (!window.confirm('Delete this repository and all its stored snapshots, sessions and memory?')) {e.target.value='';return;} try {await repoApi.disconnect(id);window.location.reload();}catch(err){setLocalError(err instanceof Error ? err.message : 'Delete failed');} }} className="w-full p-2 rounded-xl border border-border"><option value="" disabled>Remove a repository…</option>{repos.map(repo => <option key={repo.id} value={repo.id}>{repo.name}</option>)}</select></section>}
    <section className="bg-surface p-6 rounded-3xl border border-border space-y-4"><h2 className="font-semibold">Connect repository</h2><SnapshotPicker onUpload={onConnect} /></section>
    {import.meta.env.DEV && <details className="bg-surface p-5 rounded-3xl border border-border"><summary>Local development: watch a server-side repository</summary><form className="space-y-3 mt-3" onSubmit={async e => {e.preventDefault();setBusy(true);setLocalError('');try{await onConnect(path.trim());}catch(e){setLocalError(e instanceof Error ? e.message : 'Connection failed');}finally{setBusy(false);}}}><p className="text-xs text-muted">Requires Rewind’s backend to run on the same computer as this path.</p><input aria-label="Local repository path" className="w-full p-3 border rounded-xl" value={path} onChange={e => setPath(e.target.value)} placeholder="/Users/you/projects/my-app"/><button disabled={busy || !path.trim()} className="px-4 py-2 bg-ink text-white rounded-xl">Connect local watcher</button></form></details>}
    {(error || localError) && <p role="alert" className="text-red-700">{localError || error}</p>}
  </main></div>;
}
