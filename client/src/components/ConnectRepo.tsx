import { useRef, useState } from 'react';
import type { Repository } from '../lib/api';
import { localWatcherEnabled, repoApi } from '../lib/api';
import { readSnapshot } from '../lib/snapshot';
import type { PickerWindow } from '../lib/snapshot';
import type { RepositorySnapshot } from '../lib/snapshotPolicy';

interface ConnectRepoProps {
  onConnect: (input: string | RepositorySnapshot) => Promise<void>;
  onSelect: (repo: Repository) => void;
  repos: Repository[];
  error: string | null;
}

export function ConnectRepo({ onConnect, onSelect, repos, error }: ConnectRepoProps) {
  const [path, setPath] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [forceShowForm, setForceShowForm] = useState(false);
  const showNewForm = repos.length === 0 || forceShowForm;

  const folderInput = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<Awaited<ReturnType<typeof readSnapshot>> | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const displayError = operationError || error;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isConnecting || isBrowsing || (!selection && (!localWatcherEnabled || !path.trim()))) return;
    setIsConnecting(true);
    setOperationError(null);
    try {
      await onConnect(selection ? selection.snapshot : path.trim());
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Unable to connect repository. Please retry.');
    } finally {
      setIsConnecting(false);
    }
  };

  const readFolder = async (source: Parameters<typeof readSnapshot>[0]) => {
    setIsBrowsing(true);
    setOperationError(null);
    setSelection(null);
    setPath('');
    setForceShowForm(true);
    try {
      const result = await readSnapshot(source);
      setSelection(result);
      setPath(result.snapshot.name);
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Unable to read this folder. Please select it again.');
    } finally {
      setIsBrowsing(false);
    }
  };

  const handleBrowseComputer = async () => {
    if (isConnecting || isBrowsing) return;
    setOperationError(null);
    if (!localWatcherEnabled) {
      const picker = (window as PickerWindow).showDirectoryPicker;
      if (!picker) {
        folderInput.current?.click();
        return;
      }
      // Keep the picker directly in the click handler to preserve user activation.
      setIsBrowsing(true);
      try {
        const directory = await picker.call(window, { mode: 'read' });
        await readFolder(directory);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setForceShowForm(true);
          setOperationError('Folder access was denied. Allow read access and try Browse Folder again.');
        }
      } finally {
        setIsBrowsing(false);
      }
      return;
    }

    // Preserve the original native picker + path-based watcher on a local backend.
    setIsBrowsing(true);
    try {
      const result = await repoApi.browse();
      if (result.path && !result.cancelled) {
        setSelection(null);
        setPath(result.path);
        setForceShowForm(true);
      }
    } catch (err) {
      setForceShowForm(true);
      setOperationError(err instanceof Error ? err.message : 'Unable to browse. Enter a local repository path instead.');
    } finally {
      setIsBrowsing(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-app-bg p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-xl animate-fade-up">
        <input
          ref={folderInput}
          type="file"
          multiple
          {...{ webkitdirectory: '' }}
          hidden
          onChange={(event) => {
            const files = event.target.files;
            if (files?.length) void readFolder(files);
            event.target.value = '';
          }}
        />

        {/* Brand & Editorial Title */}
        <div className="mb-8 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
            <div className="w-11 h-11 rounded-[14px] bg-ink text-white flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
              Rewind
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-ink leading-tight mb-2">
            Pick Up Where<br />You Left Off
          </h1>
          <p className="text-sm text-muted">
            Git remembers your code. Rewind remembers your developer mental model.
          </p>
        </div>

        {/* Previously connected repos */}
        {repos.length > 0 && (
          <div className="mb-6 bg-surface rounded-[24px] p-5 border border-border shadow-xs">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
                Recent Workspaces
              </span>
              <span className="text-xs text-muted-light font-mono">
                {repos.length} registered
              </span>
            </div>

            <div className="space-y-2">
              {repos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => onSelect(repo)}
                  className="w-full text-left flex items-center justify-between p-3.5 rounded-[16px] bg-surface-raised border border-border hover:border-ink/25 hover:-translate-y-0.5 transition-all group cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-[10px] bg-surface flex items-center justify-center shrink-0 border border-border group-hover:bg-accent group-hover:text-accent-ink transition-colors">
                      <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.45.015.9.034 1.35.056m0 0a17.93 17.93 0 0 1 13.8 0m-13.8 0V18a2.25 2.25 0 0 0 2.25 2.25h9.3A2.25 2.25 0 0 0 18.9 18V9.832m-13.8-.056A18.064 18.064 0 0 1 12 9c2.4 0 4.71.36 6.9.832M6.75 6.75a2.25 2.25 0 0 1 2.25-2.25h6a2.25 2.25 0 0 1 2.25 2.25v2.25H6.75V6.75Z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{repo.name}</p>
                      <p className="text-xs text-muted truncate font-mono">{repo.source === 'snapshot' ? `${repo.name} · Browser snapshot` : repo.path}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {repo.branch && (
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-surface text-ink-soft border border-border">
                        {repo.branch}
                      </span>
                    )}
                    <span className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-muted group-hover:bg-ink group-hover:text-white transition-all">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-border/70 flex items-center justify-between gap-2">
              <button
                onClick={handleBrowseComputer}
                disabled={isBrowsing || isConnecting}
                className="flex items-center gap-1.5 text-xs text-ink font-medium hover:text-ink-soft bg-surface-raised border border-border px-3.5 py-2 rounded-[14px] transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                </svg>
                <span>{isBrowsing ? 'Opening Picker...' : 'Browse on Computer'}</span>
              </button>

              <button
                onClick={() => setForceShowForm((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors py-2 font-medium cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>{localWatcherEnabled ? (forceShowForm ? 'Hide manual path' : 'Manual path') : (forceShowForm ? 'Hide form' : 'Connect repository')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Connect new form */}
        {showNewForm && (
          <div className="bg-surface-raised rounded-[24px] p-6 border border-border shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wider font-mono">
                Connect Repository
              </h2>
              <button
                onClick={handleBrowseComputer}
                disabled={isBrowsing || isConnecting}
                type="button"
                className="flex items-center gap-1.5 text-xs font-medium text-ink bg-surface border border-border hover:bg-surface-raised px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-xs"
              >
                <svg className="w-3.5 h-3.5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                </svg>
                <span>{isBrowsing ? 'Browsing...' : 'Browse Folder'}</span>
              </button>
            </div>

            <p className="text-xs text-muted mb-4">
              {localWatcherEnabled
                ? 'Select a repository folder using the browser or paste the absolute path below.'
                : selection
                  ? `${selection.snapshot.files.length} code files ready · ${selection.skipped} entries excluded. Connect & Index uploads this snapshot to your account.`
                  : 'Browse Folder to select your repository. Connect & Index uploads filtered code files to your account.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  id="repo-path"
                  type="text"
                  value={path}
                  readOnly={!localWatcherEnabled}
                  onChange={(e) => { setSelection(null); setPath(e.target.value); }}
                  aria-label="Repository folder"
                  title={selection ? selection.snapshot.files.map(file => file.path).join('\n') : undefined}
                  placeholder={localWatcherEnabled ? '/Users/you/projects/my-app' : 'Select a repository folder'}
                  className="w-full px-4 py-3 pr-28 rounded-[16px] bg-surface border border-border text-ink placeholder-muted-light text-sm font-mono focus:outline-none focus:border-ink/40 focus:ring-3 focus:ring-accent/40 transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleBrowseComputer}
                  disabled={isBrowsing || isConnecting}
                  className="absolute right-2 top-2 bottom-2 px-3 rounded-[12px] bg-surface-raised border border-border text-xs font-mono text-ink hover:bg-surface transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.45.015.9.034 1.35.056m0 0a17.93 17.93 0 0 1 13.8 0m-13.8 0V18a2.25 2.25 0 0 0 2.25 2.25h9.3A2.25 2.25 0 0 0 18.9 18V9.832m-13.8-.056A18.064 18.064 0 0 1 12 9c2.4 0 4.71.36 6.9.832M6.75 6.75a2.25 2.25 0 0 1 2.25-2.25h6a2.25 2.25 0 0 1 2.25 2.25v2.25H6.75V6.75Z" />
                  </svg>
                  <span>Browse</span>
                </button>
              </div>

              {displayError && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[14px] bg-danger/15 text-ink text-xs border border-danger/30">
                  <svg className="w-4 h-4 text-danger shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  <span role="alert">{displayError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isConnecting || isBrowsing || (!selection && (!localWatcherEnabled || !path.trim()))}
                className="w-full py-3.5 px-5 rounded-[18px] bg-ink text-white font-medium text-sm hover:bg-ink-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]"
              >
                {isConnecting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-accent" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Connecting Repository...</span>
                  </>
                ) : (
                  <>
                    <span>Connect & Index Workspace</span>
                    <span className="text-accent">→</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
