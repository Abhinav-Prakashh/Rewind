import { useState } from 'react';
import type { Repository } from '../lib/api';

interface ConnectRepoProps {
  onConnect: (path: string) => Promise<void>;
  onSelect: (repo: Repository) => void;
  repos: Repository[];
  error: string | null;
}

export function ConnectRepo({ onConnect, onSelect, repos, error }: ConnectRepoProps) {
  const [path, setPath] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  // Show form if no repos, or if user explicitly opens it
  const [forceShowForm, setForceShowForm] = useState(false);
  const showNewForm = repos.length === 0 || forceShowForm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!path.trim()) return;
    setIsConnecting(true);
    try {
      await onConnect(path.trim());
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <div className="w-full max-w-lg animate-fade-up">

        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-violet mb-5 shadow-lg shadow-accent-blue/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Developer Memory</h1>
          <p className="text-text-secondary text-base">Git remembers code. DMS remembers context.</p>
        </div>

        {/* Previously connected repos */}
        {repos.length > 0 && (
          <div className="glass-card p-6 mb-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-accent-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 3L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
              Recent Repositories
            </h2>
            <div className="space-y-2">
              {repos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => onSelect(repo)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-navy-900/60 border border-glass-border/50 hover:border-accent-violet/40 hover:bg-navy-900 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent-violet/10 border border-accent-violet/20 flex items-center justify-center shrink-0 group-hover:bg-accent-violet/20 transition-colors">
                    <svg className="w-4 h-4 text-accent-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{repo.name}</p>
                    <p className="text-xs text-text-muted truncate">{repo.path}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {repo.branch && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                        {repo.branch}
                      </span>
                    )}
                    <svg className="w-4 h-4 text-text-muted group-hover:text-accent-violet transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setForceShowForm((v) => !v)}
              className="mt-4 w-full flex items-center justify-center gap-2 text-xs text-text-muted hover:text-accent-violet transition-colors py-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {forceShowForm ? 'Hide' : 'Connect a new repository'}
            </button>
          </div>
        )}

        {/* Connect new form */}
        {showNewForm && (
          <div className="glass-card p-8">
            <h2 className="text-lg font-semibold text-text-primary mb-1">Connect Repository</h2>
            <p className="text-sm text-text-muted mb-6">Enter the full path to a local Git repository.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="repo-path" className="block text-sm font-medium text-text-secondary mb-2">
                  Repository Path
                </label>
                <input
                  id="repo-path"
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/Users/you/projects/my-app"
                  className="w-full px-4 py-3 rounded-xl bg-navy-900/80 border border-glass-border text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue/50 transition-all"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!path.trim() || isConnecting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-accent-blue to-accent-violet text-white font-semibold text-sm hover:shadow-lg hover:shadow-accent-blue/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {isConnecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  'Connect Repository'
                )}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-text-muted mt-6">
          Make sure the path points to a directory containing a <code className="text-text-secondary">.git</code> folder.
        </p>
      </div>
    </div>
  );
}
